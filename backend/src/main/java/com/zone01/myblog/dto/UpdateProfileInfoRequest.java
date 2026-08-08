package com.zone01.myblog.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileInfoRequest(
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
    String username,

    @Size(max = 250, message = "Bio cannot exceed 250 characters")
    String bio,

    @Size(max = 500, message = "Avatar URL is too long")
    String avatarUrl
) {}
