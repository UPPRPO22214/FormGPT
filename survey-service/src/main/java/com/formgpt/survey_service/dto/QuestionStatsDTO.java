package com.formgpt.survey_service.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class QuestionStatsDTO {
    private String questionText;
    private String questionType;
    private Map<String, Integer> optionsCount;
    private List<TextAnswerDTO> textAnswerDTOS;
    private ScaleStatsDTO scaleStatsDTO;
}
