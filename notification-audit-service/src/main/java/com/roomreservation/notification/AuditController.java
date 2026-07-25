package com.roomreservation.notification;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/audit/logs")
public class AuditController {
    private final AuditLogRepository repository;

    public AuditController(AuditLogRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    AuditLog create(@RequestBody AuditLog log) {
        return repository.save(log);
    }

    @GetMapping
    List<AuditLog> findAll() {
        return repository.findAll();
    }
}
