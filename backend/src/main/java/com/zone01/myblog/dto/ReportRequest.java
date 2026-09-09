package com.zone01.myblog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReportRequest(
        @NotBlank(message = "Target username is required") String targetUsername,
        @NotBlank(message = "Reason is required") @Size(max = 1000) String reason) {
}