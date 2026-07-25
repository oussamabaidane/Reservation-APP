package com.roomreservation.reservation;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.http.HttpStatus;
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
    private final ReservationService service;

    public ReservationController(ReservationService service) {
        this.service = service;
    }

    @PostMapping
    ResponseEntity<ReservationEntity> create(@Valid @RequestBody ReservationEntity reservation) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(reservation));
    }

    @GetMapping
    List<ReservationEntity> findAll(@RequestParam(required = false) Long roomId,
                                    @RequestParam(required = false) Long employeeId,
                                    @RequestParam(required = false) LocalDate date,
                                    @RequestParam(required = false) ReservationStatus status) {
        if (roomId == null && employeeId == null && date == null && status == null) {
            return service.findAll();
        }
        return service.search(roomId, employeeId, date, status);
    }

    @GetMapping("/{id}")
    ResponseEntity<ReservationEntity> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/employee/{employeeId}")
    List<ReservationEntity> findByEmployee(@PathVariable Long employeeId) {
        return service.search(null, employeeId, null, null);
    }

    @GetMapping("/room/{roomId}")
    List<ReservationEntity> findByRoom(@PathVariable Long roomId) {
        return service.search(roomId, null, null, null);
    }

    @GetMapping("/check-availability")
    AvailabilityResponse checkAvailability(@RequestParam Long roomId,
                                           @RequestParam LocalDate date,
                                           @RequestParam LocalTime start,
                                           @RequestParam LocalTime end) {
        boolean available = service.isAvailable(roomId, date, start, end);
        String message = available ? "Room is available" : "Room already has a reservation in this time range";
        return new AvailabilityResponse(available, message);
    }

    @PutMapping("/{id}/cancel")
    ResponseEntity<ReservationEntity> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(service.cancel(id));
    }

    record AvailabilityResponse(boolean available, String message) {
    }
}
