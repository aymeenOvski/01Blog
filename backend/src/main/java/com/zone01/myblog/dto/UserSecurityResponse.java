package com.zone01.myblog.dto;

public record UserSecurityResponse(
    String username,
    String email,
    String message
) {}
