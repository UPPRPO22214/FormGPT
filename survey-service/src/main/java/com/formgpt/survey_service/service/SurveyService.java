package com.formgpt.survey_service.service;

import com.formgpt.survey_service.dto.*;
import com.formgpt.survey_service.entity.*;
import com.formgpt.survey_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SurveyService {
    private final FormRepository formRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final ResponseRepository responseRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;

    public List<SurveyResponse> getUserSurveys(User user) {
        return formRepository.findByCreatorOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToSurveyResponseDTO)
                .collect(Collectors.toList());
    }

    public SurveyResponse getSurvey(Long surveyId) {
        Form form = formRepository.findById(surveyId)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found"));
        return mapToSurveyResponseDTO(form);
    }

    @Transactional
    public SurveyResponse createSurvey(CreateSurveyRequest request, User user) {
        Form form = Form.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .creator(user)
                .build();

        formRepository.save(form);

        if (request.getQuestions() != null) {
            for (int i = 0; i < request.getQuestions().size(); i++) {
                CreateQuestionRequest questionDTO = request.getQuestions().get(i);
                createQuestion(form, questionDTO, i);
            }
        }

        formRepository.flush();
        Form refreshedForm = formRepository.findById(form.getId())
                .orElseThrow(() -> new EntityNotFoundException("Form not found"));

        refreshedForm.getQuestions().size();

        return mapToSurveyResponseDTO(refreshedForm);
    }

    @Transactional
    public SurveyResponse updateSurvey(Long surveyId, CreateSurveyRequest request, User user) {
        Form form = formRepository.findByIdAndCreator(surveyId, user)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found or access denied"));

        form.setTitle(request.getTitle());
        form.setDescription(request.getDescription());

        if (request.getQuestions() != null) {
            updateQuestions(form, request.getQuestions());
        }

        formRepository.save(form);
        return mapToSurveyResponseDTO(form);
    }

    @Transactional
    public void deleteSurvey(Long surveyId, User user) {
        Form form = formRepository.findByIdAndCreator(surveyId, user)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found or access denied"));
        formRepository.delete(form);
    }

    @Transactional
    public void submitAnswers(Long surveyId, SurveyAnswer answerDTO, User user) {
        Form form = formRepository.findById(surveyId)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found"));

        if (responseRepository.existsByFormAndUser(form, user)) {
            throw new IllegalStateException("User has already submitted answers for this survey");
        }

        Response response = Response.builder()
                .form(form)
                .user(user)
                .build();

        responseRepository.save(response);

        for (AnswerDTO answerDTOItem : answerDTO.getAnswers()) {
            Question question = questionRepository.findById(answerDTOItem.getQuestionId())
                    .orElseThrow(() -> new EntityNotFoundException("Question not found"));

            if (!question.getForm().getId().equals(surveyId)) {
                throw new IllegalArgumentException("Question doesn't belong to this survey");
            }

            Answer answer = Answer.builder()
                    .response(response)
                    .question(question)
                    .valueText(answerDTOItem.getValue())
                    .build();

            if (question.getType() == QuestionType.SINGLE_CHOICE ||
                    question.getType() == QuestionType.MULTIPLE_CHOICE) {

                Optional<QuestionOption> option = question.getOptions().stream()
                        .filter(opt -> opt.getText().equals(answerDTOItem.getValue()))
                        .findFirst();

                option.ifPresent(answer::setOption);
            }

            answerRepository.save(answer);
        }
    }

    private void createQuestion(Form form, CreateQuestionRequest dto, int index) {
        Question question = Question.builder()
                .form(form)
                .text(dto.getTitle())
                .type(dto.getType())
                .orderIndex(index)
                .build();

        questionRepository.save(question);

        form.getQuestions().add(question);

        if (dto.getOptions() != null) {
            for (int i = 0; i < dto.getOptions().size(); i++) {
                QuestionOption option = QuestionOption.builder()
                        .question(question)
                        .text(dto.getOptions().get(i))
                        .orderIndex(i)
                        .build();
                questionOptionRepository.save(option);
            }
        }
    }

    private void updateQuestions(Form form, List<CreateQuestionRequest> questionDTOs) {
        List<Question> existingQuestions = questionRepository.findByFormIdOrderByOrderIndexAsc(form.getId());
        Set<Long> newQuestionIds = questionDTOs.stream()
                .map(CreateQuestionRequest::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        existingQuestions.stream()
                .filter(q -> !newQuestionIds.contains(q.getId()))
                .forEach(questionRepository::delete);

        for (int i = 0; i < questionDTOs.size(); i++) {
            CreateQuestionRequest dto = questionDTOs.get(i);

            if (dto.getId() != null) {
                Question question = questionRepository.findById(dto.getId())
                        .orElseThrow(() -> new EntityNotFoundException("Question not found"));

                question.setText(dto.getTitle());
                question.setType(dto.getType());
                question.setOrderIndex(i);
                questionRepository.save(question);

                updateQuestionOptions(question, dto.getOptions());
            } else {
                createQuestion(form, dto, i);
            }
        }
    }

    private void updateQuestionOptions(Question question, List<String> options) {
        if (options == null) return;

        questionOptionRepository.deleteAll(question.getOptions());

        for (int i = 0; i < options.size(); i++) {
            QuestionOption option = QuestionOption.builder()
                    .question(question)
                    .text(options.get(i))
                    .orderIndex(i)
                    .build();
            questionOptionRepository.save(option);
        }
    }

    private SurveyResponse mapToSurveyResponseDTO(Form form) {
        SurveyResponse dto = new SurveyResponse();
        dto.setId(form.getId());
        dto.setTitle(form.getTitle());
        dto.setDescription(form.getDescription());
        dto.setOwnerId(form.getCreator().getId());
        dto.setCreatedAt(form.getCreatedAt());
        dto.setUpdatedAt(form.getCreatedAt());

        List<QuestionResponse> questionDTOs = new ArrayList<>();
        if (form.getQuestions() != null) {
            questionDTOs = form.getQuestions().stream()
                    .map(this::mapToQuestionResponseDTO)
                    .collect(Collectors.toList());
        }

        dto.setQuestions(questionDTOs);
        return dto;
    }

    private QuestionResponse mapToQuestionResponseDTO(Question question) {
        QuestionResponse dto = new QuestionResponse();
        dto.setId(question.getId());
        dto.setSurveyId(question.getForm().getId());
        dto.setTitle(question.getText());
        dto.setType(question.getType().getApiValue());

        if (question.getOptions() != null) {
            List<String> optionTexts = question.getOptions().stream()
                    .map(QuestionOption::getText)
                    .collect(Collectors.toList());
            dto.setOptions(optionTexts);
        }

        return dto;
    }

    public SurveyStats getSurveyStats(Long surveyId, User user) {
        Form form = formRepository.findByIdAndCreator(surveyId, user)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found or access denied"));

        SurveyStats stats = new SurveyStats();

        Integer respondents = answerRepository.countRespondentsByFormId(surveyId);
        stats.setRespondents(respondents != null ? respondents : 0);

        Map<Long, QuestionStats> answersDistribution = new HashMap<>();
        List<Question> questions = questionRepository.findByFormIdOrderByOrderIndexAsc(surveyId);

        for (Question question : questions) {
            QuestionStats questionStats = new QuestionStats();
            questionStats.setQuestionText(question.getText());
            questionStats.setQuestionType(question.getType().getApiValue());

            switch (question.getType()) {
                case SINGLE_CHOICE:
                case MULTIPLE_CHOICE:
                    questionStats.setOptionsCount(getOptionsStats(question.getId()));
                    break;
                case TEXT:
                    questionStats.setTextAnswers(getTextAnswers(question.getId()));
                    break;
                case SCALE:
                    questionStats.setScaleStats(getScaleStats(question.getId()));
                    break;
            }

            answersDistribution.put(question.getId(), questionStats);
        }

        stats.setAnswersDistribution(answersDistribution);
        return stats;
    }

    private Map<String, Integer> getOptionsStats(Long questionId) {
        List<Object[]> results = answerRepository.countAnswersByQuestionId(questionId);
        Map<String, Integer> stats = new HashMap<>();

        for (Object[] row : results) {
            String optionText = (String) row[0];
            Long count = (Long) row[1];
            stats.put(optionText, count.intValue());
        }

        return stats;
    }

    private List<TextAnswer> getTextAnswers(Long questionId) {
        List<Object[]> results = answerRepository.getTextAnswersByQuestionId(questionId);
        List<TextAnswer> answers = new ArrayList<>();

        for (Object[] row : results) {
            TextAnswer dto = new TextAnswer();
            dto.setAnswer((String) row[0]);
            dto.setRespondentName((String) row[1]);
            if (row[2] != null) {
                dto.setCreatedAt(row[2].toString());
            }
            answers.add(dto);
        }

        return answers;
    }

    private ScaleStats getScaleStats(Long questionId) {
        List<String> stringValues = answerRepository.getScaleAnswersByQuestionId(questionId);

        if (stringValues.isEmpty()) {
            return null;
        }

        List<Integer> values = stringValues.stream()
                .filter(v -> v != null && v.matches("\\d+"))
                .map(Integer::parseInt)
                .filter(v -> v >= 1 && v <= 10)
                .collect(Collectors.toList());

        if (values.isEmpty()) {
            return null;
        }

        ScaleStats stats = new ScaleStats();

        double average = values.stream()
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
        stats.setAverage(Math.round(average * 100.0) / 100.0);

        stats.setMin(values.stream().min(Integer::compare).orElse(0));
        stats.setMax(values.stream().max(Integer::compare).orElse(0));

        Map<Integer, Integer> distribution = new HashMap<>();
        for (int i = 1; i <= 10; i++) {
            distribution.put(i, 0);
        }

        values.forEach(value -> {
            if (value >= 1 && value <= 10) {
                distribution.put(value, distribution.get(value) + 1);
            }
        });

        stats.setDistribution(distribution);

        return stats;
    }
}
