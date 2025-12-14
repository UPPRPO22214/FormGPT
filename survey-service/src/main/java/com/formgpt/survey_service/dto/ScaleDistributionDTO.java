package com.formgpt.survey_service.dto;

import lombok.Data;

import java.util.List;

@Data
public class ScaleDistributionDTO {
    private Integer min;
    private Integer max;
    private Double average;
    private List<Integer> distribution;
    private Double median;
}