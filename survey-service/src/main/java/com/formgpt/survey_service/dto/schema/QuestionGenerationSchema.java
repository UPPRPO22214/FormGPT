package com.formgpt.survey_service.dto.schema;

import lombok.Data;

@Data
public class QuestionGenerationSchema {
    private String topic;
    private String target_audience;
}
