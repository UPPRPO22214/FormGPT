package com.formgpt.survey_service.dto.schema;

import lombok.Data;

@Data
public class FormGenerationSchema {
    private String topic;
    private Integer questions_count;
    private String target_audience;
}