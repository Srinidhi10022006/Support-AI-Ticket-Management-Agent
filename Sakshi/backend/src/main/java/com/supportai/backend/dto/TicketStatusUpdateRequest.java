package com.supportai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TicketStatusUpdateRequest(
        @NotBlank @Size(max = 20) String status,
        @NotNull Integer performedBy,
        String remarks
) {
}

