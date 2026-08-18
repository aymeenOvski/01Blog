package com.zone01.myblog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
    @NotBlank(message = "Comment content cannot be empty")
    @Size(max = 1000, message = "Comment content exceeds maximum length")
    String content
) {}
