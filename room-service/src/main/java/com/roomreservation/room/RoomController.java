package com.roomreservation.room;

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
@RequestMapping("/rooms")
public class RoomController {
    private final RoomRepository repository;

    public RoomController(RoomRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    RoomEntity create(@RequestBody RoomEntity room) {
        return repository.save(room);
    }

    @GetMapping
    List<RoomEntity> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    ResponseEntity<RoomEntity> findById(@PathVariable Long id) {
        return repository.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    List<RoomEntity> search(@RequestParam(required = false) Integer minCapacity,
                            @RequestParam(required = false) RoomType type,
                            @RequestParam(required = false) String location) {
        return repository.findAll().stream()
                .filter(RoomEntity::isActive)
                .filter(room -> minCapacity == null || room.getCapaciteMaximale() >= minCapacity)
                .filter(room -> type == null || room.getType() == type)
                .filter(room -> location == null || room.getLocalisation() != null
                        && room.getLocalisation().toLowerCase().contains(location.toLowerCase()))
                .toList();
    }

    @PutMapping("/{id}")
    ResponseEntity<RoomEntity> update(@PathVariable Long id, @RequestBody RoomEntity update) {
        return repository.findById(id).map(room -> {
            room.setNumero(update.getNumero());
            room.setNom(update.getNom());
            room.setCapaciteMaximale(update.getCapaciteMaximale());
            room.setType(update.getType());
            room.setLocalisation(update.getLocalisation());
            room.setActive(update.isActive());
            return ResponseEntity.ok(repository.save(room));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/disable")
    ResponseEntity<RoomEntity> disable(@PathVariable Long id) {
        return repository.findById(id).map(room -> {
            room.setActive(false);
            return ResponseEntity.ok(repository.save(room));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
