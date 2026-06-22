package com.zone01.myblog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthCheckController {

    @GetMapping("/api/health")
    public String checkHealth() {
        return "01Blog Backend is running smoothly";
    }
}