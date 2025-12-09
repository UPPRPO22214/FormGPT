package com.formgpt.survey_service.controller;

import com.formgpt.survey_service.dto.*;
import com.formgpt.survey_service.service.SurveyService;
import com.formgpt.survey_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/surveys")
@RequiredArgsConstructor
public class SurveyController {
    private final SurveyService surveyService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<SurveyResponseDTO>> getUserSurveys() {
        var currentUser = userService.getCurrentUser();
        List<SurveyResponseDTO> surveys = surveyService.getUserSurveys(currentUser);
        return ResponseEntity.ok(surveys);
    }

    @GetMapping("/{surveyId}")
    public ResponseEntity<SurveyWithAnswersResponseDTO> getSurvey(@PathVariable Long surveyId) {
        var currentUser = userService.getCurrentUser();
        SurveyWithAnswersResponseDTO survey = surveyService.getSurveyWithAnswers(surveyId, currentUser);
        return ResponseEntity.ok(survey);
    }

    @PostMapping
    public ResponseEntity<SurveyResponseDTO> createSurvey(
            @Valid @RequestBody CreateSurveyRequestDTO request) {
        var currentUser = userService.getCurrentUser();
        SurveyResponseDTO survey = surveyService.createSurvey(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(survey);
    }

    @PutMapping("/{surveyId}")
    public ResponseEntity<SurveyResponseDTO> updateSurvey(
            @PathVariable Long surveyId,
            @Valid @RequestBody UpdateSurveyRequestDTO request) {
        var currentUser = userService.getCurrentUser();
        SurveyResponseDTO survey = surveyService.updateSurvey(surveyId, request, currentUser);
        return ResponseEntity.ok(survey);
    }

    @DeleteMapping("/{surveyId}")
    public ResponseEntity<Void> deleteSurvey(@PathVariable Long surveyId) {
        var currentUser = userService.getCurrentUser();
        surveyService.deleteSurvey(surveyId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{surveyId}/answers")
    public ResponseEntity<?> submitAnswers(
            @PathVariable Long surveyId,
            @Valid @RequestBody SurveyAnswerDTO answerDTO) {
        var currentUser = userService.getCurrentUser();
        surveyService.submitAnswers(surveyId, answerDTO, currentUser);
        return ResponseEntity.ok().body(Map.of("success", true));
    }

    @GetMapping("/{surveyId}/stats")
    public ResponseEntity<SurveyStatsDTO> getSurveyStats(
            @PathVariable Long surveyId) {
        var currentUser = userService.getCurrentUser();
        SurveyStatsDTO stats = surveyService.getSurveyStats(surveyId, currentUser);
        return ResponseEntity.ok(stats);
    }
}