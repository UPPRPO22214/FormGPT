package com.formgpt.survey_service.dto;

import lombok.Data;

import java.util.List;

@Data
public class SurveyAnalyticsDTO {
    private Long surveyId;
    private String title;
    private String description;
    private Integer totalRespondents;
    private Integer completedCount;
    private Integer incompletedCount;
    private List<QuestionAnalyticsDTO> questionsAnalytics;
    private String gptAnalysis;
}