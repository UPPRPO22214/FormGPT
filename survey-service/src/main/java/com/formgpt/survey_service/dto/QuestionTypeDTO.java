package com.formgpt.survey_service.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.formgpt.survey_service.entity.QuestionType;

public enum QuestionTypeDTO {
    SINGLE_CHOICE("single-choice"),
    MULTIPLE_CHOICE("multiple-choice"),
    TEXT("text"),
    SCALE("scale-1-10");

    private final String apiValue;

    QuestionTypeDTO(String apiValue) {
        this.apiValue = apiValue;
    }

    @JsonValue
    public String getApiValue() {
        return apiValue;
    }

    @JsonCreator
    public static QuestionTypeDTO fromApiValue(String apiValue) {
        for (QuestionTypeDTO type : values()) {
            if (type.apiValue.equalsIgnoreCase(apiValue)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown question type: " + apiValue);
    }

    public QuestionType toEntityType() {
        return switch (this) {
            case SINGLE_CHOICE -> QuestionType.SINGLE_CHOICE;
            case MULTIPLE_CHOICE -> QuestionType.MULTIPLE_CHOICE;
            case TEXT -> QuestionType.TEXT;
            case SCALE -> QuestionType.SCALE;
        };
    }

    public static QuestionTypeDTO fromEntityType(QuestionType entityType) {
        return switch (entityType) {
            case SINGLE_CHOICE -> SINGLE_CHOICE;
            case MULTIPLE_CHOICE -> MULTIPLE_CHOICE;
            case TEXT -> TEXT;
            case SCALE -> SCALE;
        };
    }
}
