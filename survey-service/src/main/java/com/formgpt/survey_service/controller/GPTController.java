package com.formgpt.survey_service.controller;

import com.formgpt.survey_service.dto.*;
import com.formgpt.survey_service.service.GPTSurveyService;
import com.formgpt.survey_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/gpt")
@RequiredArgsConstructor
public class GPTController {
    private final GPTSurveyService gptSurveyService;
    private final UserService userService;

    @PostMapping("/surveys/create")
    public ResponseEntity<SurveyResponseDTO> createSurveyWithGPT(
            @Valid @RequestBody GPTSurveyCreateRequestDTO request) {
        log.info("Received GPT survey creation request: {}", request.getDescription());

        var currentUser = userService.getCurrentUser();
        SurveyResponseDTO survey = gptSurveyService.createSurveyWithGPT(request, currentUser);

        log.info("GPT survey created successfully, ID: {}", survey.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(survey);
    }

    @PostMapping("/surveys/{surveyId}/questions")
    public ResponseEntity<QuestionResponseDTO> addQuestionToSurveyWithGPT(
            @PathVariable Long surveyId,
            @Valid @RequestBody GPTAddQuestionRequestDTO request) {
        log.info("Adding GPT question to survey: {}", surveyId);

        var currentUser = userService.getCurrentUser();
        QuestionResponseDTO question = gptSurveyService.addQuestionToSurveyWithGPT(surveyId, request, currentUser);

        log.info("GPT question added successfully, ID: {}", question.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(question);
    }

    @PutMapping("/questions/{questionId}/edit")
    public ResponseEntity<QuestionResponseDTO> improveQuestionWithGPT(
            @PathVariable Long questionId,
            @Valid @RequestBody(required = false) GPTQuestionImproveRequestDTO request) {
        log.info("Improving question with GPT: {}", questionId);

        var currentUser = userService.getCurrentUser();

        GPTQuestionImproveRequestDTO requestDTO = request != null ? request : new GPTQuestionImproveRequestDTO();

        QuestionResponseDTO question = gptSurveyService.improveQuestionWithGPT(questionId, requestDTO, currentUser);

        log.info("Question improved successfully, ID: {}", question.getId());
        return ResponseEntity.ok(question);
    }
}