package com.formgpt.survey_service.dto.schema;

import lombok.Data;

import java.util.List;

@Data
public class FormSchema {
    private String title;
    private List<QuestionSchema> questions;
}
