package com.roomreservation.reservation;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReservationService {
    private static final Duration LOCK_TTL = Duration.ofSeconds(30);
    private static final int MIN_DURATION_MINUTES = 15;
    private static final int MAX_DURATION_MINUTES = 8 * 60;

    private final ReservationRepository repository;
    private final StringRedisTemplate redisTemplate;

    public ReservationService(ReservationRepository repository, StringRedisTemplate redisTemplate) {
        this.repository = repository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public ReservationEntity create(ReservationEntity reservation) {
        validateReservation(reservation);
        prepareReservation(reservation);

        String lockKey = buildLockKey(reservation.getRoomId(), reservation.getDateReservation());
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", LOCK_TTL);
        if (!Boolean.TRUE.equals(locked)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Reservation is already being processed for this room and date");
        }

        try {
            if (!isAvailable(reservation)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Reservation time conflicts with an existing reservation");
            }
            return repository.save(reservation);
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    public boolean isAvailable(ReservationEntity reservation) {
        validateReservation(reservation);
        return isAvailable(
                reservation.getRoomId(),
                reservation.getDateReservation(),
                reservation.getHeureDebut(),
                reservation.getHeureFin()
        );
    }

    public boolean isAvailable(Long roomId, LocalDate date, LocalTime start, LocalTime end) {
        validateLookup(roomId, date, start, end);
        return repository.findOverlappingReservations(
                roomId,
                date,
                start,
                end
        ).isEmpty();
    }

    public List<ReservationEntity> findAll() {
        return repository.findAll();
    }

    public List<ReservationEntity> search(Long roomId,
                                          Long employeeId,
                                          LocalDate date,
                                          ReservationStatus status) {
        return repository.findAll().stream()
                .filter(reservation -> roomId == null || roomId.equals(reservation.getRoomId()))
                .filter(reservation -> employeeId == null || employeeId.equals(reservation.getEmployeeId()))
                .filter(reservation -> date == null || date.equals(reservation.getDateReservation()))
                .filter(reservation -> status == null || status.equals(reservation.getStatut()))
                .toList();
    }

    public ReservationEntity findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
    }

    @Transactional
    public ReservationEntity cancel(Long id) {
        ReservationEntity reservation = findById(id);
        if (reservation.getStatut() == ReservationStatus.TERMINEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Finished reservations cannot be cancelled");
        }
        reservation.setStatut(ReservationStatus.ANNULEE);
        return repository.save(reservation);
    }

    public static boolean horairesSeChevauchent(LocalDateTime nouveauDebut,
                                                LocalDateTime nouvelleFin,
                                                LocalDateTime debutExistant,
                                                LocalDateTime finExistante) {
        return nouveauDebut.isBefore(finExistante) && nouvelleFin.isAfter(debutExistant);
    }

    private void validateReservation(ReservationEntity reservation) {
        if (reservation == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reservation body is required");
        }
        validateLookup(
                reservation.getRoomId(),
                reservation.getDateReservation(),
                reservation.getHeureDebut(),
                reservation.getHeureFin()
        );
        if (reservation.getEmployeeId() == null || reservation.getEmployeeId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee id must be positive");
        }
    }

    private void validateLookup(Long roomId, LocalDate date, LocalTime start, LocalTime end) {
        if (roomId == null || roomId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room id must be positive");
        }
        if (date == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reservation date is required");
        }
        if (start == null || end == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start and end time are required");
        }
        if (!start.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time must be before end time");
        }

        long minutes = Duration.between(start, end).toMinutes();
        if (minutes < MIN_DURATION_MINUTES || minutes > MAX_DURATION_MINUTES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Reservation duration must be between 15 minutes and 8 hours"
            );
        }
    }

    private void prepareReservation(ReservationEntity reservation) {
        int minutes = (int) Duration.between(reservation.getHeureDebut(), reservation.getHeureFin()).toMinutes();
        reservation.setDureeMinutes(minutes);
        if (reservation.getStatut() == null) {
            reservation.setStatut(ReservationStatus.CONFIRMEE);
        }
        if (reservation.getMotif() != null) {
            reservation.setMotif(reservation.getMotif().trim());
        }
    }

    private String buildLockKey(Long roomId, LocalDate date) {
        return "reservation-lock:room:" + roomId + ":date:" + date;
    }
}
