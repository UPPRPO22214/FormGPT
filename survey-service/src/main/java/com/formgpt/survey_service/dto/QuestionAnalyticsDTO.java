package com.formgpt.survey_service.dto;

import lombok.Data;

@Data
public class QuestionAnalyticsDTO {
    private Long questionId;
    private String questionTitle;
    private String questionType;
    private Integer totalAnswers;
    private Object answerDistribution;
}