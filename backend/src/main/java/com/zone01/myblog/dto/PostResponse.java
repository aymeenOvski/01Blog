package com.zone01.myblog.dto;

import java.time.LocalDateTime;

public record PostResponse(
    Long id,
    String username,
    String userAvatarUrl,
    String content,
    String mediaUrl,
    String mediaType,
    LocalDateTime createdAt,
    long likesCount,
    boolean isLiked,
    long commentsCount
) {}
