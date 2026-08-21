package com.supportai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TicketCreateRequest(
        @NotNull Integer userId,
        @NotBlank @Size(max = 255) String subject,
        @NotBlank @Size(max = 100) String issueType,
        @NotBlank String description,
        @NotBlank @Size(max = 10) String priority,
        @Size(max = 100) String employeeName,
        @Size(max = 100) String department
) {
}
