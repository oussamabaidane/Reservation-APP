package com.roomreservation.reservation;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReservationService {
    private final ReservationRepository repository;
    private final StringRedisTemplate redisTemplate;

    public ReservationService(ReservationRepository repository, StringRedisTemplate redisTemplate) {
        this.repository = repository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public ReservationEntity create(ReservationEntity reservation) {
        String lockKey = "reservation-lock:room:" + reservation.getRoomId() + ":date:" + reservation.getDateReservation();
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", Duration.ofSeconds(30));
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
        return repository.findOverlappingReservations(
                reservation.getRoomId(),
                reservation.getDateReservation(),
                reservation.getHeureDebut(),
                reservation.getHeureFin()
        ).isEmpty();
    }

    public List<ReservationEntity> findAll() {
        return repository.findAll();
    }

    public static boolean horairesSeChevauchent(LocalDateTime nouveauDebut,
                                                LocalDateTime nouvelleFin,
                                                LocalDateTime debutExistant,
                                                LocalDateTime finExistante) {
        return nouveauDebut.isBefore(finExistante) && nouvelleFin.isAfter(debutExistant);
    }
}
