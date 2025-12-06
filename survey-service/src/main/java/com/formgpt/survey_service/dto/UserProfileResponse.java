package com.formgpt.survey_service.dto;

import com.formgpt.survey_service.entity.User;

public record UserProfileResponse(
        String id,
        String email,
        String createdAt
) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getId().toString(),
                user.getEmail(),
                user.getCreatedAt().toString()
        );
    }
}