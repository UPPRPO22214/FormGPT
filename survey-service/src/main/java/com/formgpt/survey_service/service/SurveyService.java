package com.formgpt.survey_service.service;

import com.formgpt.survey_service.dto.*;
import com.formgpt.survey_service.entity.*;
import com.formgpt.survey_service.exception.ValidationException;
import com.formgpt.survey_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;
import java.util.*;
import java.util.function.Function;
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

    public List<SurveyResponseDTO> getUserSurveys(User user) {
        return formRepository.findByCreatorOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToSurveyResponseDTO)
                .collect(Collectors.toList());
    }

    public SurveyWithAnswersResponseDTO getSurveyWithAnswers(Long surveyId, User user) {
        Form form = formRepository.findById(surveyId)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found"));

        return mapToSurveyWithAnswersDTO(form, user);
    }

    @Transactional
    public SurveyResponseDTO createSurvey(CreateSurveyRequestDTO request, User user) {
        Form form = Form.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .creator(user)
                .build();

        formRepository.save(form);

        if (request.getQuestions() != null) {
            for (int i = 0; i < request.getQuestions().size(); i++) {
                CreateQuestionRequestDTO questionDTO = request.getQuestions().get(i);
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
    public SurveyResponseDTO updateSurvey(Long surveyId, UpdateSurveyRequestDTO request, User user) {
        Form form = formRepository.findByIdAndCreator(surveyId, user)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found or access denied"));

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            form.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            form.setDescription(request.getDescription());
        }

        if (request.getQuestions() != null) {
            updateQuestions(form, request.getQuestions());
        }

        formRepository.save(form);

        Form refreshedForm = formRepository.findById(form.getId()).get();
        return mapToSurveyResponseDTO(refreshedForm);
    }

    @Transactional
    public void deleteSurvey(Long surveyId, User user) {
        Form form = formRepository.findByIdAndCreator(surveyId, user)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found or access denied"));
        formRepository.delete(form);
    }

    @Transactional
    public void submitAnswers(Long surveyId, SurveyAnswerDTO answerDTO, User user) {
        Form form = formRepository.findById(surveyId)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found"));

        Optional<Response> existingResponse = responseRepository.findByFormAndUser(form, user);

        Response response;
        if (existingResponse.isPresent()) {
            response = existingResponse.get();
            answerRepository.deleteAll(response.getAnswers());
            response.getAnswers().clear();
        } else {
            response = Response.builder()
                    .form(form)
                    .user(user)
                    .build();
            responseRepository.save(response);
        }

        List<Question> allQuestions = questionRepository.findByFormIdOrderByOrderIndexAsc(surveyId);
        Map<Long, AnswerDTO> answersByQuestionId = answerDTO.getAnswers().stream()
                .collect(Collectors.toMap(AnswerDTO::getQuestionId, Function.identity()));

        List<String> validationErrors = new ArrayList<>();

        for (Question question : allQuestions) {
            AnswerDTO userAnswer = answersByQuestionId.get(question.getId());

            if (question.getRequired() && (userAnswer == null || userAnswer.getValue() == null || userAnswer.getValue().trim().isEmpty())) {
                validationErrors.add("Вопрос '" + question.getText() + "' является обязательным");
            }

            if (userAnswer != null && userAnswer.getValue() != null) {
                String error = validateAnswer(question, userAnswer.getValue());
                if (error != null) {
                    validationErrors.add(error);
                }
            }
        }

        if (!validationErrors.isEmpty()) {
            throw new ValidationException("Ошибки валидации ответов: " + String.join("; ", validationErrors));
        }

        for (AnswerDTO answerDTOItem : answerDTO.getAnswers()) {
            Question question = questionRepository.findById(answerDTOItem.getQuestionId())
                    .orElseThrow(() -> new EntityNotFoundException("Question not found"));

            if (!question.getForm().getId().equals(surveyId)) {
                throw new ValidationException("Question doesn't belong to this survey");
            }

            Answer answer = Answer.builder()
                    .response(response)
                    .question(question)
                    .valueText(answerDTOItem.getValue())
                    .build();

            if (question.getType() == QuestionType.SINGLE_CHOICE) {
                Optional<QuestionOption> option = question.getOptions().stream()
                        .filter(opt -> opt.getText().equals(answerDTOItem.getValue()))
                        .findFirst();

                if (option.isEmpty()) {
                    throw new ValidationException("Вариант ответа '" + answerDTOItem.getValue() + "' не существует в вопросе '" + question.getText() + "'");
                }

                option.ifPresent(answer::setOption);
            }

            answerRepository.save(answer);
            response.getAnswers().add(answer);
        }

        responseRepository.save(response);
    }

    private String validateAnswer(Question question, String answerValue) {
        if (answerValue == null || answerValue.trim().isEmpty()) {
            return null;
        }

        switch (question.getType()) {
            case SINGLE_CHOICE:
                boolean isValidChoice = question.getOptions().stream()
                        .anyMatch(option -> option.getText().equals(answerValue));
                if (!isValidChoice) {
                    return "Для вопроса '" + question.getText() + "' выбран несуществующий вариант: '" + answerValue + "'";
                }
                break;

            case MULTIPLE_CHOICE:
                String[] choices = answerValue.split(";");
                for (String choice : choices) {
                    String trimmedChoice = choice.trim();
                    if (!trimmedChoice.isEmpty()) {
                        boolean isValid = question.getOptions().stream()
                                .anyMatch(option -> option.getText().equals(trimmedChoice));
                        if (!isValid) {
                            return "Для вопроса '" + question.getText() + "' выбран несуществующий вариант: '" + trimmedChoice + "'";
                        }
                    }
                }
                break;

            case SCALE:
                try {
                    int scaleValue = Integer.parseInt(answerValue);
                    if (scaleValue < 1 || scaleValue > 10) {
                        return "Для вопроса '" + question.getText() + "' значение шкалы должно быть от 1 до 10";
                    }
                } catch (NumberFormatException e) {
                    return "Для вопроса '" + question.getText() + "' значение должно быть числом от 1 до 10";
                }
                break;

            case TEXT:
                if (answerValue.length() > 1000) {
                    return "Текстовый ответ не должен превышать 1000 символов для вопроса '" + question.getText() + "'";
                }
                break;
        }

        return null;
    }

    private void createQuestion(Form form, CreateQuestionRequestDTO dto, int index) {
        Question question = Question.builder()
                .form(form)
                .text(dto.getTitle())
                .type(dto.getType())
                .orderIndex(index)
                .build();

        questionRepository.save(question);

        List<QuestionOption> options = new ArrayList<>();
        question.setOptions(options);

        form.getQuestions().add(question);

        if (dto.getOptions() != null) {
            for (int i = 0; i < dto.getOptions().size(); i++) {
                QuestionOption option = QuestionOption.builder()
                        .question(question)
                        .text(dto.getOptions().get(i))
                        .orderIndex(i)
                        .build();
                questionOptionRepository.save(option);
                options.add(option);
            }
        }
    }

    private void updateQuestions(Form form, List<CreateQuestionRequestDTO> questionDTOs) {
        List<Question> existingQuestions = questionRepository.findByFormIdOrderByOrderIndexAsc(form.getId());
        Set<Long> newQuestionIds = questionDTOs.stream()
                .map(CreateQuestionRequestDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        existingQuestions.stream()
                .filter(q -> !newQuestionIds.contains(q.getId()))
                .forEach(questionRepository::delete);

        for (int i = 0; i < questionDTOs.size(); i++) {
            CreateQuestionRequestDTO dto = questionDTOs.get(i);

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

    private void updateQuestionOptions(Question question, List<String> newOptions) {
        if (newOptions == null) {
            return;
        }

        if (newOptions.isEmpty()) {
            questionOptionRepository.deleteAll(question.getOptions());
            question.getOptions().clear();
            return;
        }

        Map<Integer, QuestionOption> existingOptionsByIndex = question.getOptions().stream()
                .collect(Collectors.toMap(QuestionOption::getOrderIndex, Function.identity()));

        for (int i = 0; i < newOptions.size(); i++) {
            String optionText = newOptions.get(i);

            if (existingOptionsByIndex.containsKey(i)) {
                QuestionOption existingOption = existingOptionsByIndex.get(i);
                existingOption.setText(optionText);
                questionOptionRepository.save(existingOption);
                existingOptionsByIndex.remove(i);
            } else {
                QuestionOption newOption = QuestionOption.builder()
                        .question(question)
                        .text(optionText)
                        .orderIndex(i)
                        .build();
                questionOptionRepository.save(newOption);
                question.getOptions().add(newOption);
            }
        }

        if (!existingOptionsByIndex.isEmpty()) {
            questionOptionRepository.deleteAll(existingOptionsByIndex.values());
            question.getOptions().removeAll(existingOptionsByIndex.values());
        }
    }

    private SurveyResponseDTO mapToSurveyResponseDTO(Form form) {
        SurveyResponseDTO dto = new SurveyResponseDTO();
        dto.setId(form.getId());
        dto.setTitle(form.getTitle());
        dto.setDescription(form.getDescription());
        dto.setOwnerId(form.getCreator().getId());
        dto.setCreatedAt(form.getCreatedAt());
        dto.setUpdatedAt(form.getCreatedAt());

        List<QuestionResponseDTO> questionDTOs = new ArrayList<>();
        if (form.getQuestions() != null) {
            questionDTOs = form.getQuestions().stream()
                    .map(this::mapToQuestionResponseDTO)
                    .collect(Collectors.toList());
        }

        dto.setQuestions(questionDTOs);
        return dto;
    }

    private QuestionResponseDTO mapToQuestionResponseDTO(Question question) {
        QuestionResponseDTO dto = new QuestionResponseDTO();
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

    private SurveyWithAnswersResponseDTO mapToSurveyWithAnswersDTO(Form form, User user) {
        SurveyWithAnswersResponseDTO dto = new SurveyWithAnswersResponseDTO();
        dto.setId(form.getId());
        dto.setTitle(form.getTitle());
        dto.setDescription(form.getDescription());
        dto.setOwnerId(form.getCreator().getId());
        dto.setCreatedAt(form.getCreatedAt());
        dto.setUpdatedAt(form.getCreatedAt());

        Optional<Response> userResponse = responseRepository.findByFormAndUser(form, user);

        if (userResponse.isPresent()) {
            dto.setHasUserResponded(true);
            dto.setUserRespondedAt(userResponse.get().getCreatedAt());

            Map<Long, String> userAnswers = userResponse.get().getAnswers().stream()
                    .collect(Collectors.toMap(
                            answer -> answer.getQuestion().getId(),
                            answer -> answer.getOption() != null ?
                                    answer.getOption().getText() :
                                    (answer.getValueText() != null ? answer.getValueText() : "")
                    ));

            List<QuestionWithAnswerDTO> questionDTOs = new ArrayList<>();
            if (form.getQuestions() != null) {
                questionDTOs = form.getQuestions().stream()
                        .map(question -> mapToQuestionWithAnswerDTO(question, userAnswers))
                        .collect(Collectors.toList());
            }
            dto.setQuestions(questionDTOs);

        } else {
            dto.setHasUserResponded(false);
            dto.setUserRespondedAt(null);

            List<QuestionWithAnswerDTO> questionDTOs = new ArrayList<>();
            if (form.getQuestions() != null) {
                questionDTOs = form.getQuestions().stream()
                        .map(question -> mapToQuestionWithAnswerDTO(question, null))
                        .collect(Collectors.toList());
            }
            dto.setQuestions(questionDTOs);
        }

        return dto;
    }

    private QuestionWithAnswerDTO mapToQuestionWithAnswerDTO(Question question, Map<Long, String> userAnswers) {
        QuestionWithAnswerDTO dto = new QuestionWithAnswerDTO();
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

        if (userAnswers != null && userAnswers.containsKey(question.getId())) {
            dto.setUserAnswer(userAnswers.get(question.getId()));
        } else {
            dto.setUserAnswer(null);
        }

        return dto;
    }

    public SurveyStatsDTO getSurveyStats(Long surveyId, User user) {
        Form form = formRepository.findByIdAndCreator(surveyId, user)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found or access denied"));

        SurveyStatsDTO stats = new SurveyStatsDTO();

        Integer respondents = answerRepository.countRespondentsByFormId(surveyId);
        stats.setRespondents(respondents != null ? respondents : 0);

        Map<Long, QuestionStatsDTO> answersDistribution = new HashMap<>();
        List<Question> questions = questionRepository.findByFormIdOrderByOrderIndexAsc(surveyId);

        for (Question question : questions) {
            QuestionStatsDTO questionStatsDTO = new QuestionStatsDTO();
            questionStatsDTO.setQuestionText(question.getText());
            questionStatsDTO.setQuestionType(question.getType().getApiValue());

            switch (question.getType()) {
                case SINGLE_CHOICE:
                case MULTIPLE_CHOICE:
                    questionStatsDTO.setOptionsCount(getOptionsStats(question.getId()));
                    break;
                case TEXT:
                    questionStatsDTO.setTextAnswerDTOS(getTextAnswers(question.getId()));
                    break;
                case SCALE:
                    questionStatsDTO.setScaleStatsDTO(getScaleStats(question.getId()));
                    break;
            }

            answersDistribution.put(question.getId(), questionStatsDTO);
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

    private List<TextAnswerDTO> getTextAnswers(Long questionId) {
        List<Object[]> results = answerRepository.getTextAnswersByQuestionId(questionId);
        List<TextAnswerDTO> answers = new ArrayList<>();

        for (Object[] row : results) {
            TextAnswerDTO dto = new TextAnswerDTO();
            dto.setAnswer((String) row[0]);
            dto.setRespondentName((String) row[1]);
            if (row[2] != null) {
                dto.setCreatedAt(row[2].toString());
            }
            answers.add(dto);
        }

        return answers;
    }

    private ScaleStatsDTO getScaleStats(Long questionId) {
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

        ScaleStatsDTO stats = new ScaleStatsDTO();

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
