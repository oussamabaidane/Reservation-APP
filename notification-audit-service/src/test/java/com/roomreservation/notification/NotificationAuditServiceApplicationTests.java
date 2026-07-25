package com.roomreservation.notification;

import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;

class NotificationAuditServiceApplicationTests {
    @Test
    void notificationsAreUnreadByDefault() {
        NotificationEntity notification = new NotificationEntity();
        assertFalse(notification.isLue());
    }
}
