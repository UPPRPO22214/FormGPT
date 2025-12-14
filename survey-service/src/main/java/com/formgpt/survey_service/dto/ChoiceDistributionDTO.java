package com.formgpt.survey_service.dto;

import lombok.Data;

import java.util.List;

@Data
public class ChoiceDistributionDTO {
    private List<String> options;
    private List<Integer> counts;
    private List<Double> percentages;
}