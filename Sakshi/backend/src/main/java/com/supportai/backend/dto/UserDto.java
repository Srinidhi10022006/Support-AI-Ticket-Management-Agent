package com.supportai.backend.dto;

import lombok.Builder;

@Builder
public record UserDto(
        Integer userId,
        String employeeId,
        String fullName,
        String email,
        String department,
        String role
) {
}

