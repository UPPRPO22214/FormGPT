package com.formgpt.survey_service.dto;

import lombok.Data;
import java.util.Map;

@Data
public class ScaleStats {
    private Double average;
    private Integer min;
    private Integer max;
    private Map<Integer, Integer> distribution;
}