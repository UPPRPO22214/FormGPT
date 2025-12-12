package com.formgpt.survey_service.exception;

public class GPTServiceException extends RuntimeException {
    public GPTServiceException(String message) {
        super(message);
    }

    public GPTServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}