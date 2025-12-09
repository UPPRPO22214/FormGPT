package com.formgpt.survey_service.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class SurveyWithAnswersResponseDTO {
    private Long id;
    private String title;
    private String description;
    private UUID ownerId;
    private List<QuestionWithAnswerDTO> questions;
    private Boolean hasUserResponded;
    private LocalDateTime userRespondedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
