package com.formgpt.survey_service.dto;

import lombok.Data;

import java.util.List;

@Data
public class UpdateSurveyRequestDTO {
    private String title;
    private String description;
    private List<CreateQuestionRequestDTO> questions;
}
