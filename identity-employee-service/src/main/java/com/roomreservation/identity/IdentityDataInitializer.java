package com.roomreservation.identity;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class IdentityDataInitializer {
    @Bean
    CommandLineRunner seedEmployees(EmployeeRepository repository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }

            repository.save(employee(
                    "E-001",
                    "Systeme",
                    "Admin",
                    "admin@reservation.app",
                    passwordEncoder.encode("admin123"),
                    "Direction",
                    Role.ADMINISTRATEUR
            ));
            repository.save(employee(
                    "E-101",
                    "Benali",
                    "Sara",
                    "employee@reservation.app",
                    passwordEncoder.encode("employee123"),
                    "Produit",
                    Role.EMPLOYE
            ));
            repository.save(employee(
                    "E-102",
                    "Alaoui",
                    "Yassine",
                    "yassine@reservation.app",
                    passwordEncoder.encode("employee123"),
                    "RH",
                    Role.EMPLOYE
            ));
        };
    }

    private Employee employee(String numeroEmploye,
                              String nom,
                              String prenom,
                              String email,
                              String passwordHash,
                              String departement,
                              Role role) {
        Employee employee = new Employee();
        employee.setNumeroEmploye(numeroEmploye);
        employee.setNom(nom);
        employee.setPrenom(prenom);
        employee.setEmail(email);
        employee.setPasswordHash(passwordHash);
        employee.setDepartement(departement);
        employee.setRole(role);
        employee.setActif(true);
        return employee;
    }
}
