package com.formgpt.survey_service.dto;

import lombok.Data;

@Data
public class CsvExportRequestDTO {
    private CsvFormat format = CsvFormat.BY_RESPONDENT;
    private boolean includeMetadata = true;

    public enum CsvFormat {
        BY_RESPONDENT,
        BY_QUESTION
    }
}