package com.roomreservation.reservation;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reservations")
public class ReservationController {
    private final ReservationRepository repository;
    private final ReservationService service;

    public ReservationController(ReservationRepository repository, ReservationService service) {
        this.repository = repository;
        this.service = service;
    }

    @PostMapping
    ReservationEntity create(@RequestBody ReservationEntity reservation) {
        return service.create(reservation);
    }

    @GetMapping
    List<ReservationEntity> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    ResponseEntity<ReservationEntity> findById(@PathVariable Long id) {
        return repository.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    List<ReservationEntity> findByEmployee(@PathVariable Long employeeId) {
        return repository.findByEmployeeId(employeeId);
    }

    @GetMapping("/room/{roomId}")
    List<ReservationEntity> findByRoom(@PathVariable Long roomId) {
        return repository.findByRoomId(roomId);
    }

    @GetMapping("/check-availability")
    AvailabilityResponse checkAvailability(@RequestParam Long roomId,
                                           @RequestParam LocalDate date,
                                           @RequestParam LocalTime start,
                                           @RequestParam LocalTime end) {
        ReservationEntity reservation = new ReservationEntity();
        reservation.setRoomId(roomId);
        reservation.setDateReservation(date);
        reservation.setHeureDebut(start);
        reservation.setHeureFin(end);
        return new AvailabilityResponse(service.isAvailable(reservation));
    }

    @PutMapping("/{id}/cancel")
    ResponseEntity<ReservationEntity> cancel(@PathVariable Long id) {
        return repository.findById(id).map(reservation -> {
            reservation.setStatut(ReservationStatus.ANNULEE);
            return ResponseEntity.ok(repository.save(reservation));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    record AvailabilityResponse(boolean available) {
    }
}
