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
    public ResponseEntity<List<SurveyResponse>> getUserSurveys() {
        var currentUser = userService.getCurrentUser();
        List<SurveyResponse> surveys = surveyService.getUserSurveys(currentUser);
        return ResponseEntity.ok(surveys);
    }

    @GetMapping("/{surveyId}")
    public ResponseEntity<SurveyResponse> getSurvey(@PathVariable Long surveyId) {
        SurveyResponse survey = surveyService.getSurvey(surveyId);
        return ResponseEntity.ok(survey);
    }

    @PostMapping
    public ResponseEntity<SurveyResponse> createSurvey(
            @Valid @RequestBody CreateSurveyRequest request) {
        var currentUser = userService.getCurrentUser();
        SurveyResponse survey = surveyService.createSurvey(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(survey);
    }

    @PutMapping("/{surveyId}")
    public ResponseEntity<SurveyResponse> updateSurvey(
            @PathVariable Long surveyId,
            @Valid @RequestBody CreateSurveyRequest request) {
        var currentUser = userService.getCurrentUser();
        SurveyResponse survey = surveyService.updateSurvey(surveyId, request, currentUser);
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
            @Valid @RequestBody SurveyAnswer answerDTO) {
        var currentUser = userService.getCurrentUser();
        surveyService.submitAnswers(surveyId, answerDTO, currentUser);
        return ResponseEntity.ok().body(Map.of("success", true));
    }

    @GetMapping("/{surveyId}/stats")
    public ResponseEntity<SurveyStats> getSurveyStats(
            @PathVariable Long surveyId) {
        var currentUser = userService.getCurrentUser();
        SurveyStats stats = surveyService.getSurveyStats(surveyId, currentUser);
        return ResponseEntity.ok(stats);
    }
}