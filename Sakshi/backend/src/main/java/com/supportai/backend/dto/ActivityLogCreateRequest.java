package com.supportai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ActivityLogCreateRequest(
        @NotNull Integer ticketId,
        @NotBlank String action,
        @NotNull Integer performedBy,
        String remarks
) {
}

