package com.formgpt.survey_service.dto;

import com.formgpt.survey_service.entity.User;

public record UserProfileResponseDTO(
        String id,
        String email,
        String createdAt
) {
    public static UserProfileResponseDTO from(User user) {
        return new UserProfileResponseDTO(
                user.getId().toString(),
                user.getEmail(),
                user.getCreatedAt().toString()
        );
    }
}