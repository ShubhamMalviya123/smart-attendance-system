package com.attendance.config;

import com.attendance.entity.Teacher;
import com.attendance.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Runs once on every application startup.
 * Creates a default ADMIN account ONLY if one doesn't already exist,
 * so there's no chicken-and-egg problem (you need an admin to create
 * teachers, but you need an account to log in as admin in the first place).
 *
 * Default login after first run:
 *   email:    admin@college.edu
 *   password: admin123
 *
 * CHANGE THIS PASSWORD after first login in a real deployment.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TeacherRepository teacherRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String defaultAdminEmail = "admin@college.edu";

        if (!teacherRepository.existsByEmail(defaultAdminEmail)) {
            Teacher admin = Teacher.builder()
                    .name("Admin User")
                    .email(defaultAdminEmail)
                    .password(passwordEncoder.encode("admin123"))
                    .role("ADMIN")
                    .build();
            teacherRepository.save(admin);
            System.out.println("=================================================");
            System.out.println("Default admin created:");
            System.out.println("  email:    " + defaultAdminEmail);
            System.out.println("  password: admin123");
            System.out.println("  -> Please change this password after first login");
            System.out.println("=================================================");
        }
    }
}
