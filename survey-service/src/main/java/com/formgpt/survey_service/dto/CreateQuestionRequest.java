package com.formgpt.survey_service.dto;

import com.formgpt.survey_service.entity.QuestionType;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class CreateQuestionRequest {
    private Long id;

    @NotBlank(message = "Question title is required")
    private String title;

    @NotNull(message = "Question type is required")
    private QuestionType type;

    private List<String> options;
}