package com.supportai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AiAnalyzeRequest(
        @Size(max = 100) String employeeName,
        @NotBlank @Size(max = 255) String subject,
        @NotBlank @Size(max = 100) String issueType,
        @Size(max = 10) String priority,
        @NotBlank String description,
        List<ChatMessage> messages
) {
    public record ChatMessage(
            String role,
            String content
    ) {
    }
}

