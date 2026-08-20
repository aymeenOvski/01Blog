package com.zone01.myblog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;

public record PostResponse(
    Long id,
    String username,
    String avatarUrl,
    String content,
    List<String> mediaUrls,
    LocalDateTime createdAt,
    @JsonProperty("likesCount") Long likeCount,
    @JsonProperty("isLiked") Boolean likedByCurrentUser,
    @JsonProperty("commentsCount") Long commentCount
) {}
