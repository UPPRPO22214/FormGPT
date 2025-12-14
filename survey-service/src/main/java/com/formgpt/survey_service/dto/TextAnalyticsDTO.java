package com.formgpt.survey_service.dto;

import lombok.Data;

import java.util.List;

@Data
public class TextAnalyticsDTO {
    private Integer totalAnswers;
    private List<String> wordCloud;
    private List<String> sampleAnswers;
}