package com.formgpt.survey_service.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class SurveyResponse {
    private Long id;
    private String title;
    private String description;
    private UUID ownerId;
    private List<QuestionResponse> questions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}