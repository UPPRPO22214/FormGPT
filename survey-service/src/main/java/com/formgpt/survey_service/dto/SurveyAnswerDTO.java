package com.formgpt.survey_service.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class SurveyAnswerDTO {
    @NotNull(message = "Answers are required")
    private List<AnswerDTO> answers;
}