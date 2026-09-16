package com.zone01.myblog.dto;

import java.time.LocalDateTime;

public record AdminPostResponse(
        Long id,
        String username,
        String content,
        String visibility,
        LocalDateTime createdAt
) {
}