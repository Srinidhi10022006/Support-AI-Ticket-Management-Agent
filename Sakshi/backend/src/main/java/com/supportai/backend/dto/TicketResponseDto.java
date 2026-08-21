package com.supportai.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record TicketResponseDto(
        Integer responseId,
        Integer ticketId,
        String generatedResponse,
        BigDecimal confidenceScore,
        LocalDateTime generatedAt
) {
}

