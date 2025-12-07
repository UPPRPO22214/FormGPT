package com.formgpt.survey_service.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class AnswerDTO {
    @NotNull(message = "Question ID is required")
    private Long questionId;

    private String value;
}
