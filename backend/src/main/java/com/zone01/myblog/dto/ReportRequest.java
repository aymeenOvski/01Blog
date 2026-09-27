package com.zone01.myblog.dto;

import com.zone01.myblog.model.enums.ReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReportRequest(

                Long targetPostId,

                String targetUsername,

                @NotNull(message = "Reason is required") ReportReason reason,

                @Size(max = 1000, message = "Description must not exceed 1000 characters") String description

) {
}