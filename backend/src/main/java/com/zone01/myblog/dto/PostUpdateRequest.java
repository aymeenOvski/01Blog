package com.zone01.myblog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostUpdateRequest(
    @NotBlank(message = "Post content cannot be empty")
    @Size(max = 2000, message = "Post content exceeds maximum length")
    String content
) {}
    