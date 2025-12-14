package com.formgpt.survey_service.dto.schema;

import lombok.Data;

import java.util.List;

@Data
public class MultipleQuestionGenerationSchema {
    private String topic;
    private String target_audience;
    private Integer questions_count;
    private List<QuestionSchema> previous_questions;
}