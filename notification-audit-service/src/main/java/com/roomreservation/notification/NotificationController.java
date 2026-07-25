package com.roomreservation.notification;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationRepository repository;

    public NotificationController(NotificationRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    NotificationEntity create(@RequestBody NotificationEntity notification) {
        return repository.save(notification);
    }

    @GetMapping("/user/{userId}")
    List<NotificationEntity> findByUser(@PathVariable Long userId) {
        return repository.findByDestinataireId(userId);
    }

    @PutMapping("/{id}/read")
    ResponseEntity<NotificationEntity> markAsRead(@PathVariable Long id) {
        return repository.findById(id).map(notification -> {
            notification.setLue(true);
            return ResponseEntity.ok(repository.save(notification));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
