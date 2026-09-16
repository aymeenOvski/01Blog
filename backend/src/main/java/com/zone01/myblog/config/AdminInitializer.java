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

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.email:admin@01blog.local}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Bean
    CommandLineRunner initializeAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {

            if (userRepository.existsByUsername(adminUsername)) {
                return;
            }

            if (userRepository.existsByEmail(adminEmail)) {
                return;
            }

            Users admin = new Users(
                    adminUsername,
                    adminEmail,
                    passwordEncoder.encode(adminPassword),
                    "ROLE_ADMIN"
            );

            userRepository.save(admin);

            System.out.println("Default admin account created: " + adminUsername);
        };
    }
}