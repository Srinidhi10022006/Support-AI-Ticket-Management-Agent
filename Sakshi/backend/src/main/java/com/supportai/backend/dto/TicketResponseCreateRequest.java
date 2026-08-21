package com.supportai.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record TicketResponseCreateRequest(
        @NotNull Integer ticketId,
        @NotBlank String generatedResponse,
        @DecimalMin(value = "0.00") @Digits(integer = 3, fraction = 2) BigDecimal confidenceScore
) {
}

