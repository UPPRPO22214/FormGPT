package com.formgpt.survey_service.service;

import com.formgpt.survey_service.dto.CsvExportRequestDTO;
import com.formgpt.survey_service.entity.*;
import com.formgpt.survey_service.repository.AnswerRepository;
import com.formgpt.survey_service.repository.FormRepository;
import com.formgpt.survey_service.repository.ResponseRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CsvExportService {

    private final FormRepository formRepository;
    private final ResponseRepository responseRepository;
    private final AnswerRepository answerRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String CSV_SEPARATOR = ",";
    private static final String CSV_QUOTE = "\"";

    @Transactional(readOnly = true)
    public byte[] exportSurveyToCsv(Long surveyId, User user, CsvExportRequestDTO request) {
        Form form = formRepository.findByIdAndCreator(surveyId, user)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found or access denied"));

        log.info("Exporting survey {} to CSV, format: {}", surveyId, request.getFormat());

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try (PrintWriter writer = new PrintWriter(outputStream, true, StandardCharsets.UTF_8)) {
            writer.write('\ufeff');

            switch (request.getFormat()) {
                case BY_RESPONDENT:
                    exportByRespondent(writer, form, request);
                    break;
                case BY_QUESTION:
                    exportByQuestion(writer, form, request);
                    break;
            }

            writer.flush();
        }

        return outputStream.toByteArray();
    }

    private void exportByRespondent(PrintWriter writer, Form form, CsvExportRequestDTO request) {
        List<Question> questions = form.getQuestions().stream()
                .sorted(Comparator.comparingInt(Question::getOrderIndex))
                .collect(Collectors.toList());

        List<Response> responses = responseRepository.findByForm(form);

        List<String> headers = new ArrayList<>();
        if (request.isIncludeMetadata()) {
            headers.add("respondent_id");
            headers.add("respondent_email");
            headers.add("completion_status");
            headers.add("response_date");
        }

        for (Question question : questions) {
            headers.add(escapeCsv(question.getText()));
        }

        writeCsvLine(writer, headers);

        for (Response response : responses) {
            List<String> row = new ArrayList<>();

            if (request.isIncludeMetadata()) {
                row.add(response.getUser() != null ? response.getUser().getId().toString() : "anonymous");
                row.add(response.getUser() != null ? escapeCsv(response.getUser().getEmail()) : "");
                row.add(isResponseComplete(response) ? "COMPLETED" : "INCOMPLETE");
                row.add(response.getCreatedAt().format(DATE_FORMATTER));
            }

            Map<Long, String> answerMap = response.getAnswers().stream()
                    .collect(Collectors.toMap(
                            answer -> answer.getQuestion().getId(),
                            answer -> formatAnswerValue(answer)
                    ));

            for (Question question : questions) {
                String answer = answerMap.get(question.getId());
                row.add(answer != null ? escapeCsv(answer) : "");
            }

            writeCsvLine(writer, row);
        }
    }

    private void exportByQuestion(PrintWriter writer, Form form, CsvExportRequestDTO request) {
        List<Question> questions = form.getQuestions().stream()
                .sorted(Comparator.comparingInt(Question::getOrderIndex))
                .collect(Collectors.toList());

        List<String> headers = Arrays.asList(
                "question_id",
                "question_text",
                "question_type",
                "response_option",
                "count",
                "percentage"
        );

        writeCsvLine(writer, headers);

        for (Question question : questions) {
            Map<String, Long> distribution = getQuestionDistribution(question);
            long totalAnswers = distribution.values().stream().mapToLong(Long::longValue).sum();

            if (question.getType() == QuestionType.SINGLE_CHOICE || question.getType() == QuestionType.MULTIPLE_CHOICE) {
                for (QuestionOption option : question.getOptions()) {
                    long count = distribution.getOrDefault(option.getText(), 0L);
                    double percentage = totalAnswers > 0 ? (count * 100.0) / totalAnswers : 0.0;

                    List<String> row = Arrays.asList(
                            question.getId().toString(),
                            escapeCsv(question.getText()),
                            question.getType().getApiValue(),
                            escapeCsv(option.getText()),
                            String.valueOf(count),
                            String.format("%.1f%%", percentage)
                    );

                    writeCsvLine(writer, row);
                }
            } else if (question.getType() == QuestionType.SCALE) {
                for (int i = 1; i <= 10; i++) {
                    long count = distribution.getOrDefault(String.valueOf(i), 0L);
                    double percentage = totalAnswers > 0 ? (count * 100.0) / totalAnswers : 0.0;

                    List<String> row = Arrays.asList(
                            question.getId().toString(),
                            escapeCsv(question.getText()),
                            question.getType().getApiValue(),
                            String.valueOf(i),
                            String.valueOf(count),
                            String.format("%.1f%%", percentage)
                    );

                    writeCsvLine(writer, row);
                }
            } else if (question.getType() == QuestionType.TEXT) {
                List<String> row = Arrays.asList(
                        question.getId().toString(),
                        escapeCsv(question.getText()),
                        question.getType().getApiValue(),
                        "TEXT_RESPONSE",
                        String.valueOf(totalAnswers),
                        "100.0%"
                );

                writeCsvLine(writer, row);
            }
        }
    }

    private Map<String, Long> getQuestionDistribution(Question question) {
        Map<String, Long> distribution = new HashMap<>();

        switch (question.getType()) {
            case SINGLE_CHOICE:
                List<Object[]> results = answerRepository.countAnswersByQuestionId(question.getId());
                for (Object[] row : results) {
                    String optionText = (String) row[0];
                    Long count = (Long) row[1];
                    distribution.put(optionText, count);
                }
                break;

            case MULTIPLE_CHOICE:
                List<String> multipleChoiceAnswers = answerRepository.findMultipleChoiceAnswersByQuestionId(question.getId());
                for (QuestionOption option : question.getOptions()) {
                    long count = multipleChoiceAnswers.stream()
                            .filter(answer -> answer != null && answer.contains(option.getText()))
                            .count();
                    distribution.put(option.getText(), count);
                }
                break;

            case SCALE:
                List<String> scaleAnswers = answerRepository.getScaleAnswersByQuestionId(question.getId());
                for (int i = 1; i <= 10; i++) {
                    int finalI = i;
                    long count = scaleAnswers.stream()
                            .filter(value -> String.valueOf(finalI).equals(value))
                            .count();
                    distribution.put(String.valueOf(i), count);
                }
                break;

            case TEXT:
                long count = answerRepository.findTextAnswersByQuestionId(question.getId()).size();
                distribution.put("TEXT_RESPONSE", count);
                break;
        }

        return distribution;
    }

    private String formatAnswerValue(Answer answer) {
        if (answer.getOption() != null) {
            return answer.getOption().getText();
        } else if (answer.getValueText() != null) {
            return answer.getValueText();
        }
        return "";
    }

    private boolean isResponseComplete(Response response) {
        Form form = response.getForm();
        Set<Long> answeredQuestionIds = response.getAnswers().stream()
                .map(answer -> answer.getQuestion().getId())
                .collect(Collectors.toSet());

        return form.getQuestions().stream()
                .filter(Question::getRequired)
                .allMatch(q -> answeredQuestionIds.contains(q.getId()));
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }

        if (value.contains(CSV_SEPARATOR) || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return CSV_QUOTE + value.replace("\"", "\"\"") + CSV_QUOTE;
        }

        return value;
    }

    private void writeCsvLine(PrintWriter writer, List<String> values) {
        writer.println(String.join(CSV_SEPARATOR, values));
    }
}