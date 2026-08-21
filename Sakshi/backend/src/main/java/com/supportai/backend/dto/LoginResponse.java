package com.supportai.backend.dto;

import lombok.Builder;

@Builder
public record LoginResponse(
        String message,
        String dashboardRoute,
        UserDto user
) {
}

