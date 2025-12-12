package com.formgpt.survey_service.service;

import com.formgpt.survey_service.dto.CreateQuestionRequestDTO;
import com.formgpt.survey_service.dto.schema.QuestionImprovementSchema;
import com.formgpt.survey_service.dto.schema.QuestionSchema;
import com.formgpt.survey_service.entity.QuestionType;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class GPTTypeConverter {
    public QuestionType convertFromGPTAnswerType(String gptAnswerType) {
        if (gptAnswerType == null) {
            return QuestionType.TEXT;
        }

        return switch (gptAnswerType.toLowerCase()) {
            case "single_choice" -> QuestionType.SINGLE_CHOICE;
            case "multiple_choice" -> QuestionType.MULTIPLE_CHOICE;
            case "text" -> QuestionType.TEXT;
            case "numeric" -> QuestionType.SCALE;
            default -> {
                System.err.println("Unknown GPT answer type: " + gptAnswerType);
                yield QuestionType.TEXT;
            }
        };
    }

    public String convertToGPTAnswerType(QuestionType questionType) {
        if (questionType == null) {
            return "text";
        }

        return switch (questionType) {
            case SINGLE_CHOICE -> "single_choice";
            case MULTIPLE_CHOICE -> "multiple_choice";
            case TEXT -> "text";
            case SCALE -> "numeric";
        };
    }

    public CreateQuestionRequestDTO convertToQuestionDTO(QuestionSchema questionSchema) {
        CreateQuestionRequestDTO dto = new CreateQuestionRequestDTO();
        dto.setTitle(questionSchema.getText());
        dto.setType(convertFromGPTAnswerType(questionSchema.getAnswer_type()));

        if (questionSchema.getAnswer_options() != null) {
            dto.setOptions(new ArrayList<>(questionSchema.getAnswer_options()));
        }

        return dto;
    }

    public QuestionImprovementSchema convertToImprovementSchema(
            String questionText,
            QuestionType type,
            List<String> options,
            String prompt) {

        QuestionImprovementSchema schema = new QuestionImprovementSchema();
        schema.setText(questionText);
        schema.setAnswer_type(convertToGPTAnswerType(type));

        if (options != null) {
            schema.setAnswer_options(new ArrayList<>(options));
        }

        schema.setPrompt(prompt);
        return schema;
    }
}