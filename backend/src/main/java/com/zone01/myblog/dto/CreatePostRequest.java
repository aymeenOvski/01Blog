package com.zone01.myblog.dto;

import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.constraints.AssertTrue;

public record CreatePostRequest(
    @Size(max = 2000, message = "Post content cannot exceed 2000 characters")
    String content,
    
    MultipartFile file
) {
    @AssertTrue(message = "Post must contain either text content or a file attachment")
    public boolean isHasContentOrFile() {
        boolean hasText = content != null && !content.trim().isEmpty();
        boolean hasAttachment = file != null && !file.isEmpty();
        return hasText || hasAttachment;
    }
}
