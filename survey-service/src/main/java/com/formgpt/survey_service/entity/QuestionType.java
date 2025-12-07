package com.formgpt.survey_service.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum QuestionType {
    SINGLE_CHOICE,
    MULTIPLE_CHOICE,
    TEXT,
    SCALE;

    @JsonCreator
    public static QuestionType fromApiValue(String apiValue) {
        return switch (apiValue) {
            case "single-choice" -> SINGLE_CHOICE;
            case "multiple-choice" -> MULTIPLE_CHOICE;
            case "text" -> TEXT;
            case "scale-1-10" -> SCALE;
            default -> throw new IllegalArgumentException("Unknown question type: " + apiValue);
        };
    }

    @JsonValue
    public String getApiValue() {
        return switch (this) {
            case SINGLE_CHOICE -> "single-choice";
            case MULTIPLE_CHOICE -> "multiple-choice";
            case TEXT -> "text";
            case SCALE -> "scale-1-10";
        };
    }
}