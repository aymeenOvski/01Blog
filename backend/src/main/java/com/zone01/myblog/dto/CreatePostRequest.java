package com.zone01.myblog.dto;

import org.springframework.web.multipart.MultipartFile;

public record CreatePostRequest(
    String content,
    MultipartFile file
) {}
