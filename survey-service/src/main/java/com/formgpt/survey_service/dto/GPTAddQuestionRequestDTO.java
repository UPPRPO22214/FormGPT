package com.formgpt.survey_service.dto;

import lombok.Data;

@Data
public class GPTAddQuestionRequestDTO {
    private String topic;
    private String targetAudience;
}
