package com.supportai.backend.dto;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record ActivityLogDto(
        Integer logId,
        Integer ticketId,
        String action,
        Integer performedBy,
        String performedByName,
        String remarks,
        LocalDateTime actionTime
) {
}

