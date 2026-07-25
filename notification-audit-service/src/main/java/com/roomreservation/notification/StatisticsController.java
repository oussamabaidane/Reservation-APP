package com.roomreservation.notification;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StatisticsController {
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;

    public StatisticsController(NotificationRepository notificationRepository, AuditLogRepository auditLogRepository) {
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/statistics")
    Map<String, Long> statistics() {
        return Map.of(
                "notifications", notificationRepository.count(),
                "unreadNotifications", notificationRepository.countByLueFalse(),
                "auditLogs", auditLogRepository.count()
        );
    }
}
