package com.roomreservation.identity;

import java.util.List;
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
    private final EmployeeRepository repository;

    public EmployeeController(EmployeeRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    Employee create(@RequestBody Employee employee) {
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
            employee.setDepartement(update.getDepartement());
            employee.setRole(update.getRole());
            employee.setActif(update.isActif());
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
}
