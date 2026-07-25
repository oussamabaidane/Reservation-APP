package com.roomreservation.identity;

import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/employees")
public class EmployeeController {
    private static final String DEFAULT_PASSWORD = "employee123";

    private final EmployeeRepository repository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeController(EmployeeRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping
    Employee create(@RequestBody Employee employee) {
        preparePassword(employee);
        return repository.save(employee);
    }

    @GetMapping
    List<Employee> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    ResponseEntity<Employee> findById(@PathVariable Long id) {
        return repository.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    ResponseEntity<Employee> update(@PathVariable Long id, @RequestBody Employee update) {
        return repository.findById(id).map(employee -> {
            employee.setNom(update.getNom());
            employee.setPrenom(update.getPrenom());
            employee.setEmail(update.getEmail());
            employee.setNumeroEmploye(update.getNumeroEmploye());
            employee.setDepartement(update.getDepartement());
            employee.setRole(update.getRole());
            employee.setActif(update.isActif());
            if (update.getPasswordHash() != null && !update.getPasswordHash().isBlank()) {
                employee.setPasswordHash(encodeIfNeeded(update.getPasswordHash()));
            }
            return ResponseEntity.ok(repository.save(employee));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/disable")
    ResponseEntity<Employee> disable(@PathVariable Long id) {
        return repository.findById(id).map(employee -> {
            employee.setActif(false);
            return ResponseEntity.ok(repository.save(employee));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void preparePassword(Employee employee) {
        String password = employee.getPasswordHash();
        if (password == null || password.isBlank()) {
            password = DEFAULT_PASSWORD;
        }
        employee.setPasswordHash(encodeIfNeeded(password));
    }

    private String encodeIfNeeded(String password) {
        if (password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$")) {
            return password;
        }
        return passwordEncoder.encode(password);
    }
}
