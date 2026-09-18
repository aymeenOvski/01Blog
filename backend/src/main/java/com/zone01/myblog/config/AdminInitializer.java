package com.zone01.myblog.config;

import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {

    @Value("${app.admin.username:admin_1}")
    private String adminUsername;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Bean
    CommandLineRunner initializeAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            if (userRepository.existsByUsername(adminUsername) || userRepository.existsByEmail(adminEmail)) {
                return;
            }

 
            if (adminPassword == null || adminPassword.isBlank()) {
                System.out.println(">>> Skip admin creation: ADMIN_PASSWORD environment variable is not set.");
                return;
            }

            // Create admin only when env variables are present and user doesn't exist
            Users admin = new Users();
            admin.setUsername(adminUsername);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole("ROLE_ADMIN");

            userRepository.save(admin);
            System.out.println(">>> Default admin account created: " + adminUsername);
        };
    }
}