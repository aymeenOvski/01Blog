package com.zone01.myblog.dto;

import java.util.List;

public record PagedResponse<T>(
        List<T> content,
        int number,
        int totalPages,
        long totalElements,
        boolean first,
        boolean last) {
}
