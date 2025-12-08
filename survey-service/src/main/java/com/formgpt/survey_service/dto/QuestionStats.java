package com.formgpt.survey_service.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class QuestionStats {
    private String questionText;
    private String questionType;
    private Map<String, Integer> optionsCount;
    private List<TextAnswer> textAnswers;
    private ScaleStats scaleStats;
}
