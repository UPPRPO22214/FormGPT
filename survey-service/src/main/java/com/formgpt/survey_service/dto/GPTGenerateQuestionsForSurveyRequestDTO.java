package com.formgpt.survey_service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GPTGenerateQuestionsForSurveyRequestDTO {

    @NotNull(message = "Count is required")
    @Min(value = 1, message = "Count must be at least 1")
    @Max(value = 10, message = "Count cannot exceed 10")
    private Integer count;

    private String promt;
}