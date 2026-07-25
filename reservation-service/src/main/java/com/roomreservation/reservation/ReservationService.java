package com.roomreservation.reservation;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReservationService {
    private static final Duration LOCK_TTL = Duration.ofSeconds(30);
    private static final int MIN_DURATION_MINUTES = 15;
    private static final int MAX_DURATION_MINUTES = 8 * 60;

    private final ReservationRepository repository;
    private final StringRedisTemplate redisTemplate;
    private final RestClient notificationClient;
    private final String notificationAuditUrl;

    public ReservationService(ReservationRepository repository, StringRedisTemplate redisTemplate) {
        this(repository, redisTemplate, (RestClient) null, "");
    }

    @Autowired
    public ReservationService(ReservationRepository repository,
                              StringRedisTemplate redisTemplate,
                              @Value("${app.notification-audit-url:http://localhost:8084}") String notificationAuditUrl) {
        this(repository, redisTemplate, RestClient.create(), notificationAuditUrl);
    }

    private ReservationService(ReservationRepository repository,
                               StringRedisTemplate redisTemplate,
                               RestClient notificationClient,
                               String notificationAuditUrl) {
        this.repository = repository;
        this.redisTemplate = redisTemplate;
        this.notificationClient = notificationClient;
        this.notificationAuditUrl = notificationAuditUrl;
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
            ReservationEntity saved = repository.save(reservation);
            recordReservationCreated(saved);
            return saved;
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
        ReservationEntity saved = repository.save(reservation);
        recordReservationCancelled(saved);
        return saved;
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

    private void recordReservationCreated(ReservationEntity reservation) {
        sendNotification(
                reservation.getEmployeeId(),
                "Reservation confirmed for room " + reservation.getRoomId()
                        + " on " + reservation.getDateReservation()
                        + " from " + reservation.getHeureDebut()
                        + " to " + reservation.getHeureFin()
        );
        writeAudit(
                reservation.getEmployeeId(),
                "CREATE_RESERVATION room=" + reservation.getRoomId()
                        + " date=" + reservation.getDateReservation()
                        + " start=" + reservation.getHeureDebut()
                        + " end=" + reservation.getHeureFin()
        );
    }

    private void recordReservationCancelled(ReservationEntity reservation) {
        sendNotification(
                reservation.getEmployeeId(),
                "Reservation cancelled for room " + reservation.getRoomId()
                        + " on " + reservation.getDateReservation()
        );
        writeAudit(reservation.getEmployeeId(), "CANCEL_RESERVATION id=" + reservation.getId());
    }

    private void sendNotification(Long employeeId, String message) {
        post("/notifications", new NotificationRequest(employeeId, message));
    }

    private void writeAudit(Long userId, String action) {
        post("/audit/logs", new AuditRequest(userId, action, "reservation-service"));
    }

    private void post(String path, Object body) {
        if (notificationClient == null || notificationAuditUrl == null || notificationAuditUrl.isBlank()) {
            return;
        }

        try {
            notificationClient.post()
                    .uri(notificationAuditUrl + path)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ignored) {
            // Reservations must not fail when the notification/audit service is unavailable.
        }
    }

    record NotificationRequest(Long destinataireId, String message) {
    }

    record AuditRequest(Long utilisateurId, String action, String adresseIp) {
    }
}
