package com.roomreservation.identity;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class IdentityEmployeeServiceApplicationTests {
    @Test
    void defaultRoleIsEmployee() {
        Employee employee = new Employee();
        assertEquals(Role.EMPLOYE, employee.getRole());
    }
}
