package com.supportai.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record ApiErrorResponse(
        int status,
        String error,
        String message,
        List<String> details,
        LocalDateTime timestamp
) {
}

