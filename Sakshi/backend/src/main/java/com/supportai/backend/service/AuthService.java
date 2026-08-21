package com.supportai.backend.service;

import com.supportai.backend.dto.LoginRequest;
import com.supportai.backend.dto.LoginResponse;
import com.supportai.backend.dto.UserDto;
import com.supportai.backend.entity.UserEntity;
import com.supportai.backend.exception.InvalidCredentialsException;
import com.supportai.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    public LoginResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!user.getPassword().equals(request.password())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        return LoginResponse.builder()
                .message("Login successful")
                .dashboardRoute("ADMIN".equalsIgnoreCase(user.getRole()) ? "/admin" : "/dashboard")
                .user(toUserDto(user))
                .build();
    }

    private UserDto toUserDto(UserEntity user) {
        return UserDto.builder()
                .userId(user.getUserId())
                .employeeId(user.getEmployeeId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .role(user.getRole())
                .build();
    }
}

