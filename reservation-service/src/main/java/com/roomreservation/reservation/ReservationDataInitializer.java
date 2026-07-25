package com.roomreservation.reservation;

import java.time.LocalDate;
import java.time.LocalTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ReservationDataInitializer {
    @Bean
    CommandLineRunner seedReservations(ReservationRepository repository) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }

            ReservationEntity reservation = new ReservationEntity();
            reservation.setEmployeeId(2L);
            reservation.setRoomId(1L);
            reservation.setDateReservation(LocalDate.now().plusDays(1));
            reservation.setHeureDebut(LocalTime.of(9, 0));
            reservation.setHeureFin(LocalTime.of(10, 0));
            reservation.setDureeMinutes(60);
            reservation.setMotif("Point equipe");
            reservation.setStatut(ReservationStatus.CONFIRMEE);
            repository.save(reservation);
        };
    }
}
