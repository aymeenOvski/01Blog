package com.zone01.myblog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReportRequest(
    Long targetPostId,
    String targetUsername,
    @NotBlank(message = "Reason is required")
    @Size(max = 1000)
    String reason
) {}