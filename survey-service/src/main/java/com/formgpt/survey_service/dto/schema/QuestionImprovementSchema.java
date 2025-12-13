package com.formgpt.survey_service.dto.schema;

import lombok.Data;

import java.util.List;

@Data
public class QuestionImprovementSchema {
    private String text;
    private String answer_type;
    private List<String> answer_options;
    private String prompt;
}
