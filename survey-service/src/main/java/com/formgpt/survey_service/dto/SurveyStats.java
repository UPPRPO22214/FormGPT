package com.formgpt.survey_service.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class SurveyStats {
    private Integer respondents;
    private Map<Long, QuestionStats> answersDistribution;
}