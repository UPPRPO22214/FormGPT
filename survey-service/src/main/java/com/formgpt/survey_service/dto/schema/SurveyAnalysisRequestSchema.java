package com.formgpt.survey_service.dto.schema;

import lombok.Data;
import java.util.List;

@Data
public class SurveyAnalysisRequestSchema {
    private SurveyInfo survey;
    private List<QuestionAnalysis> questions;

    @Data
    public static class SurveyInfo {
        private String title;
        private String description;
        private Integer totalRespondents;
        private Integer completedCount;
        private Integer incompletedCount;
    }

    @Data
    public static class QuestionAnalysis {
        private String questionText;
        private String questionType;
        private List<String> options;
        private Integer totalAnswers;
        private Object statistics;
    }
}