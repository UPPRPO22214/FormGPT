package com.formgpt.survey_service.controller;

import com.formgpt.survey_service.dto.*;
import com.formgpt.survey_service.service.CsvExportService;
import com.formgpt.survey_service.service.SurveyService;
import com.formgpt.survey_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.hibernate.annotations.Parameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/surveys")
@RequiredArgsConstructor
public class SurveyController {
    private final SurveyService surveyService;
    private final UserService userService;
    private final CsvExportService csvExportService;

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

    @GetMapping("/{surveyId}/analytics")
    public ResponseEntity<SurveyAnalyticsDTO> getSurveyAnalytics(
            @PathVariable Long surveyId,
            @RequestParam(defaultValue = "false") boolean includeGPT) {
        var currentUser = userService.getCurrentUser();
        SurveyAnalyticsDTO analytics = surveyService.getSurveyAnalytics(surveyId, currentUser, includeGPT);
        return ResponseEntity.ok(analytics);
    }

    @GetMapping(value = "/{surveyId}/export/csv", produces = "text/csv; charset=UTF-8")
    public ResponseEntity<byte[]> exportSurveyToCsv(
            @PathVariable Long surveyId,
            @RequestParam(defaultValue = "by-respondent") String format,
            @RequestParam(defaultValue = "true") boolean includeMetadata) {

        var currentUser = userService.getCurrentUser();

        CsvExportRequestDTO request = new CsvExportRequestDTO();

        if ("by-question".equalsIgnoreCase(format)) {
            request.setFormat(CsvExportRequestDTO.CsvFormat.BY_QUESTION);
        } else {
            request.setFormat(CsvExportRequestDTO.CsvFormat.BY_RESPONDENT);
        }

        request.setIncludeMetadata(includeMetadata);

        byte[] csvData = csvExportService.exportSurveyToCsv(surveyId, currentUser, request);

        String fileName = String.format("survey-%d-results-%s.csv",
                surveyId, LocalDate.now());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        headers.setContentDispositionFormData("attachment", fileName);
        headers.setContentLength(csvData.length);

        return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
    }
}