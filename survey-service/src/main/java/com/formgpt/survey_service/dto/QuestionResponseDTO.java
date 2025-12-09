package com.formgpt.survey_service.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuestionResponseDTO {
    private Long id;
    private Long surveyId;
    private String title;
    private String type;
    private List<String> options;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}