package com.formgpt.survey_service.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class SurveyAnswer {
    @NotNull(message = "Survey ID is required")
    private Long surveyId;

    @NotNull(message = "Answers are required")
    private List<AnswerDTO> answers;
}