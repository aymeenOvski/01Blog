package com.zone01.myblog.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileSecurityRequest(
    @NotBlank String oldPassword,
    String newPassword,
    String email
) {}
