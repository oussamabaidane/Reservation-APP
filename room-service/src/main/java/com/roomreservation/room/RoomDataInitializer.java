package com.roomreservation.room;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RoomDataInitializer {
    @Bean
    CommandLineRunner seedRooms(RoomRepository repository) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }

            repository.save(room("S-101", "Atlas", 8, RoomType.CONFERENCE, "Etage 1"));
            repository.save(room("S-204", "Rif", 14, RoomType.FORMATION, "Etage 2"));
            repository.save(room("S-310", "Souss", 6, RoomType.BUREAU, "Etage 3"));
            repository.save(room("S-412", "Draa", 20, RoomType.CONFERENCE, "Etage 4"));
        };
    }

    private RoomEntity room(String numero, String nom, int capacite, RoomType type, String localisation) {
        RoomEntity room = new RoomEntity();
        room.setNumero(numero);
        room.setNom(nom);
        room.setCapaciteMaximale(capacite);
        room.setType(type);
        room.setLocalisation(localisation);
        room.setActive(true);
        return room;
    }
}
