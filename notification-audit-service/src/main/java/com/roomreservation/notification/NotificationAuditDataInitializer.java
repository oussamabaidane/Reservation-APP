package com.roomreservation.notification;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NotificationAuditDataInitializer {
    @Bean
    CommandLineRunner seedNotificationAudit(NotificationRepository notificationRepository,
                                            AuditLogRepository auditLogRepository) {
        return args -> {
            if (notificationRepository.count() == 0) {
                NotificationEntity notification = new NotificationEntity();
                notification.setDestinataireId(1L);
                notification.setMessage("Systeme de reservation pret");
                notificationRepository.save(notification);
            }

            if (auditLogRepository.count() == 0) {
                AuditLog log = new AuditLog();
                log.setUtilisateurId(1L);
                log.setAction("SYSTEM_READY");
                log.setAdresseIp("notification-audit-service");
                auditLogRepository.save(log);
            }
        };
    }
}
