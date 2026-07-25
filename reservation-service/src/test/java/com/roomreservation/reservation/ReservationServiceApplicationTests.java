package com.roomreservation.reservation;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class ReservationServiceApplicationTests {
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
}
