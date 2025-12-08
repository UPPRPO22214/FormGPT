package com.formgpt.survey_service.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
public class CreateSurveyRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private List<CreateQuestionRequest> questions;
}