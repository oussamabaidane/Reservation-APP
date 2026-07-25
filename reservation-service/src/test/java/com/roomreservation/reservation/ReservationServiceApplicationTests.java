package com.roomreservation.reservation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ReservationServiceApplicationTests {
    @Mock
    private ReservationRepository repository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private ReservationService service;

    @BeforeEach
    void setUp() {
        service = new ReservationService(repository, redisTemplate);
    }

    @Test
    void detectsOverlappingSchedules() {
        LocalDateTime existingStart = LocalDateTime.of(2026, 7, 25, 10, 0);
        LocalDateTime existingEnd = LocalDateTime.of(2026, 7, 25, 12, 0);

        assertTrue(ReservationService.horairesSeChevauchent(
                LocalDateTime.of(2026, 7, 25, 11, 0),
                LocalDateTime.of(2026, 7, 25, 13, 0),
                existingStart,
                existingEnd
        ));
        assertFalse(ReservationService.horairesSeChevauchent(
                LocalDateTime.of(2026, 7, 25, 12, 0),
                LocalDateTime.of(2026, 7, 25, 14, 0),
                existingStart,
                existingEnd
        ));
    }

    @Test
    void createsReservationWhenSlotIsAvailable() {
        ReservationEntity reservation = reservation();
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), eq("locked"), eq(Duration.ofSeconds(30)))).thenReturn(true);
        when(repository.findOverlappingReservations(
                eq(1L),
                eq(LocalDate.of(2026, 7, 25)),
                eq(LocalTime.of(10, 0)),
                eq(LocalTime.of(11, 30))
        )).thenReturn(List.of());
        when(repository.save(any(ReservationEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReservationEntity saved = service.create(reservation);

        assertEquals(90, saved.getDureeMinutes());
        assertEquals(ReservationStatus.CONFIRMEE, saved.getStatut());
        assertEquals("Sprint planning", saved.getMotif());
        verify(redisTemplate).delete("reservation-lock:room:1:date:2026-07-25");
    }

    @Test
    void rejectsOverlappingReservation() {
        ReservationEntity reservation = reservation();
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), eq("locked"), eq(Duration.ofSeconds(30)))).thenReturn(true);
        when(repository.findOverlappingReservations(
                eq(1L),
                eq(LocalDate.of(2026, 7, 25)),
                eq(LocalTime.of(10, 0)),
                eq(LocalTime.of(11, 30))
        )).thenReturn(List.of(new ReservationEntity()));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> service.create(reservation));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(repository, never()).save(any(ReservationEntity.class));
        verify(redisTemplate).delete("reservation-lock:room:1:date:2026-07-25");
    }

    @Test
    void rejectsInvalidTimeWindowBeforeLocking() {
        ReservationEntity reservation = reservation();
        reservation.setHeureFin(LocalTime.of(9, 0));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> service.create(reservation));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(redisTemplate, never()).opsForValue();
        verify(repository, never()).save(any(ReservationEntity.class));
    }

    private ReservationEntity reservation() {
        ReservationEntity reservation = new ReservationEntity();
        reservation.setEmployeeId(10L);
        reservation.setRoomId(1L);
        reservation.setDateReservation(LocalDate.of(2026, 7, 25));
        reservation.setHeureDebut(LocalTime.of(10, 0));
        reservation.setHeureFin(LocalTime.of(11, 30));
        reservation.setMotif("  Sprint planning  ");
        return reservation;
    }
}
