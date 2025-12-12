package com.formgpt.survey_service.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

@Data
public class GPTSurveyCreateRequestDTO {
    @NotBlank(message = "Description is required")
    private String description;

    private String targetAudience;

    @NotNull(message = "Question count is required")
    @Min(value = 1, message = "Question count must be at least 1")
    @Max(value = 20, message = "Question count cannot exceed 20")
    private Integer questionCount;
}
