package com.zone01.myblog.dto;

import java.time.Instant;

public record CommentResponse(
    Long id,
    String username,
    String content,
    Instant createdAt
) {}
