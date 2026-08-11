package com.zone01.myblog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileSecurityRequest(
    @NotBlank(message = "Current password is required")
    String oldPassword,

    @Size(min = 6, message = "New password must be at least 6 characters")
    String newPassword,

    String email
) {}
