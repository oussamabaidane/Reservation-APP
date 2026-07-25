package com.roomreservation.gateway;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.Test;

class ApiGatewayApplicationTests {
    @Test
    void applicationClassExists() {
        assertDoesNotThrow(() -> Class.forName("com.roomreservation.gateway.ApiGatewayApplication"));
    }
}
