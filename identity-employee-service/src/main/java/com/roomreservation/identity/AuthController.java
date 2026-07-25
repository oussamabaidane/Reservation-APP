package com.roomreservation.identity;

import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final EmployeeRepository repository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(EmployeeRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    Employee register(@RequestBody RegisterRequest request) {
        Employee employee = new Employee();
        employee.setNumeroEmploye(request.numeroEmploye());
        employee.setNom(request.nom());
        employee.setPrenom(request.prenom());
        employee.setEmail(request.email());
        employee.setDepartement(request.departement());
        employee.setRole(request.role() == null ? Role.EMPLOYE : request.role());
        employee.setPasswordHash(passwordEncoder.encode(request.password()));
        return repository.save(employee);
    }

    @PostMapping("/login")
    LoginResponse login(@RequestBody LoginRequest request) {
        Employee employee = repository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), employee.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return new LoginResponse(
                "demo-jwt-" + employee.getId() + "-" + Instant.now().getEpochSecond(),
                "refresh-" + UUID.randomUUID(),
                employee.getRole().name()
        );
    }

    @PostMapping("/refresh")
    LoginResponse refresh(@RequestBody RefreshRequest request) {
        if (request.refreshToken() == null || request.refreshToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token is required");
        }
        return new LoginResponse("demo-jwt-refreshed-" + Instant.now().getEpochSecond(), request.refreshToken(), "EMPLOYE");
    }

    record RegisterRequest(String numeroEmploye, String nom, String prenom, String email, String password, String departement, Role role) {
    }

    record LoginRequest(String email, String password) {
    }

    record RefreshRequest(String refreshToken) {
    }

    record LoginResponse(String accessToken, String refreshToken, String role) {
    }
}
