package com.formgpt.survey_service.dto;

import lombok.Data;

@Data
public class TextAnswer {
    private String answer;
    private String respondentName;
    private String createdAt;
}
