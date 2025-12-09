package com.formgpt.survey_service.dto;

import lombok.Data;

import java.util.Map;

@Data
public class SurveyStatsDTO {
    private Integer respondents;
    private Map<Long, QuestionStatsDTO> answersDistribution;
}