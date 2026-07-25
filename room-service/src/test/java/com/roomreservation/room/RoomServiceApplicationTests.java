package com.roomreservation.room;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class RoomServiceApplicationTests {
    @Test
    void roomsAreActiveByDefault() {
        RoomEntity room = new RoomEntity();
        assertTrue(room.isActive());
    }
}
