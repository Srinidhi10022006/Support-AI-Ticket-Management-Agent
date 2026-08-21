package com.supportai.backend.dto;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record TicketDto(
        Integer ticketId,
        Integer userId,
        String employeeId,
        String userName,
        String userEmail,
        String department,
        String subject,
        String issueType,
        String description,
        String priority,
        String status,
        String employeeName,
        LocalDateTime createdAt
) {
}

