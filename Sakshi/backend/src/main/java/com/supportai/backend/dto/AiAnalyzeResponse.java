package com.supportai.backend.dto;

import lombok.Builder;

@Builder
public record AiAnalyzeResponse(
        String summary,
        String rootCause,
        String solution,
        String preventiveRecommendation,
        boolean humanSupportRequired
) {
}

