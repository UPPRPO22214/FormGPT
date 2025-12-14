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
            if (response.getAnswers() == null) {
                response.setAnswers(new ArrayList<>());
            }
            answerRepository.deleteAll(response.getAnswers());
            response.getAnswers().clear();
        } else {
            response = Response.builder()
                    .form(form)
                    .user(user)
                    .answers(new ArrayList<>())
                    .build();
            responseRepository.save(response);
        }

        if (response.getAnswers() == null) {
            response.setAnswers(new ArrayList<>());
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

            if (question.getType() == QuestionType.SINGLE_CHOICE || question.getType() == QuestionType.MULTIPLE_CHOICE) {
                if (question.getType() == QuestionType.SINGLE_CHOICE) {
                    Optional<QuestionOption> option = question.getOptions().stream()
                            .filter(opt -> opt.getText().equals(answerDTOItem.getValue()))
                            .findFirst();

                    if (option.isEmpty()) {
                        throw new ValidationException("Вариант ответа '" + answerDTOItem.getValue() + "' не существует в вопросе '" + question.getText() + "'");
                    }

                    option.ifPresent(answer::setOption);
                } else {
                    String[] choices = answerDTOItem.getValue().split(";");
                    for (String choice : choices) {
                        String trimmedChoice = choice.trim();
                        if (!trimmedChoice.isEmpty()) {
                            boolean isValid = question.getOptions().stream()
                                    .anyMatch(option -> option.getText().equals(trimmedChoice));
                            if (!isValid) {
                                throw new ValidationException("Для вопроса '" + question.getText() + "' выбран несуществующий вариант: '" + trimmedChoice + "'");
                            }
                        }
                    }
                }
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

    public SurveyAnalyticsDTO getSurveyAnalytics(Long surveyId, User user, boolean includeGPT) {
        Form form = formRepository.findByIdAndCreator(surveyId, user)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found or access denied"));

        SurveyAnalyticsDTO analytics = new SurveyAnalyticsDTO();
        analytics.setSurveyId(form.getId());
        analytics.setTitle(form.getTitle());
        analytics.setDescription(form.getDescription());

        Integer totalResponses = responseRepository.countByFormId(surveyId);
        analytics.setTotalRespondents(totalResponses != null ? totalResponses : 0);

        // TODO: Здесь нужно реализовать логику для completed/incompleted count
        analytics.setCompletedCount(analytics.getTotalRespondents());
        analytics.setIncompletedCount(0);

        List<Question> questions = questionRepository.findByFormIdOrderByOrderIndexAsc(surveyId);
        List<QuestionAnalyticsDTO> questionAnalytics = questions.stream()
                .map(question -> getQuestionAnalytics(question, surveyId))
                .collect(Collectors.toList());

        analytics.setQuestionsAnalytics(questionAnalytics);

        if (includeGPT) {
            analytics.setGptAnalysis(generateGPTAnalysis(analytics));
        }

        return analytics;
    }

    private QuestionAnalyticsDTO getQuestionAnalytics(Question question, Long surveyId) {
        QuestionAnalyticsDTO analytics = new QuestionAnalyticsDTO();
        analytics.setQuestionId(question.getId());
        analytics.setQuestionTitle(question.getText());
        analytics.setQuestionType(question.getType().getApiValue());

        Long totalAnswers = answerRepository.countByQuestionId(question.getId());
        analytics.setTotalAnswers(totalAnswers != null ? totalAnswers.intValue() : 0);

        switch (question.getType()) {
            case SINGLE_CHOICE:
            case MULTIPLE_CHOICE:
                analytics.setAnswerDistribution(getChoiceDistribution(question));
                break;
            case SCALE:
                analytics.setAnswerDistribution(getScaleDistribution(question));
                break;
            case TEXT:
                analytics.setAnswerDistribution(getTextAnalytics(question));
                break;
        }

        return analytics;
    }

    private ChoiceDistributionDTO getChoiceDistribution(Question question) {
        ChoiceDistributionDTO distribution = new ChoiceDistributionDTO();

        List<String> options = question.getOptions().stream()
                .map(QuestionOption::getText)
                .collect(Collectors.toList());
        distribution.setOptions(options);

        List<Integer> counts = new ArrayList<>();
        List<Double> percentages = new ArrayList<>();

        Long totalAnswers = answerRepository.countByQuestionId(question.getId());
        int total = totalAnswers != null ? totalAnswers.intValue() : 0;

        if (question.getType() == QuestionType.MULTIPLE_CHOICE) {
            for (String option : options) {
                Long optionCount = answerRepository.countMultipleChoiceByQuestionIdAndOptionText(
                        question.getId(), option);
                int count = optionCount != null ? optionCount.intValue() : 0;
                counts.add(count);

                double percentage = total > 0 ? (count * 100.0) / total : 0.0;
                percentages.add(Math.round(percentage * 10.0) / 10.0);
            }
        } else {
            for (String option : options) {
                Long optionCount = answerRepository.countByQuestionIdAndOptionText(question.getId(), option);
                int count = optionCount != null ? optionCount.intValue() : 0;
                counts.add(count);

                double percentage = total > 0 ? (count * 100.0) / total : 0.0;
                percentages.add(Math.round(percentage * 10.0) / 10.0);
            }
        }

        distribution.setCounts(counts);
        distribution.setPercentages(percentages);

        return distribution;
    }

    private ScaleDistributionDTO getScaleDistribution(Question question) {
        ScaleDistributionDTO distribution = new ScaleDistributionDTO();

        List<Integer> values = answerRepository.findScaleValuesByQuestionId(question.getId()).stream()
                .filter(Objects::nonNull)
                .map(Integer::parseInt)
                .filter(v -> v >= 1 && v <= 10)
                .collect(Collectors.toList());

        if (values.isEmpty()) {
            distribution.setMin(0);
            distribution.setMax(0);
            distribution.setAverage(0.0);
            distribution.setMedian(0.0);
            distribution.setDistribution(Arrays.asList(0, 0, 0, 0, 0, 0, 0, 0, 0, 0));
            return distribution;
        }

        int min = values.stream().min(Integer::compare).orElse(0);
        int max = values.stream().max(Integer::compare).orElse(0);
        double average = values.stream().mapToInt(Integer::intValue).average().orElse(0.0);

        List<Integer> sortedValues = new ArrayList<>(values);
        Collections.sort(sortedValues);
        double median;
        int size = sortedValues.size();
        if (size % 2 == 0) {
            median = (sortedValues.get(size / 2 - 1) + sortedValues.get(size / 2)) / 2.0;
        } else {
            median = sortedValues.get(size / 2);
        }

        List<Integer> scaleDistribution = new ArrayList<>(10);
        for (int i = 1; i <= 10; i++) {
            final int scaleValue = i;
            long count = values.stream().filter(v -> v == scaleValue).count();
            scaleDistribution.add((int) count);
        }

        distribution.setMin(min);
        distribution.setMax(max);
        distribution.setAverage(Math.round(average * 10.0) / 10.0);
        distribution.setMedian(Math.round(median * 10.0) / 10.0);
        distribution.setDistribution(scaleDistribution);

        return distribution;
    }

    private TextAnalyticsDTO getTextAnalytics(Question question) {
        TextAnalyticsDTO analytics = new TextAnalyticsDTO();

        List<String> textAnswers = answerRepository.findTextAnswersByQuestionId(question.getId());

        analytics.setTotalAnswers(textAnswers.size());

        List<String> wordCloud = textAnswers.stream()
                .flatMap(answer -> Arrays.stream(answer.toLowerCase().split("\\s+")))
                .filter(word -> word.length() > 3)
                .filter(word -> !word.matches(".*\\d+.*"))
                .collect(Collectors.groupingBy(word -> word, Collectors.counting()))
                .entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .limit(10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        analytics.setWordCloud(wordCloud);

        List<String> sampleAnswers = textAnswers.stream()
                .filter(answer -> answer.length() > 0)
                .limit(5)
                .collect(Collectors.toList());

        analytics.setSampleAnswers(sampleAnswers);

        return analytics;
    }

    private String generateGPTAnalysis(SurveyAnalyticsDTO analytics) {
        // TODO: Здесь нужно интегрировать с GPT API для генерации анализа
        return "GPT анализ будет реализован в следующей итерации.\n" +
                "Всего респондентов: " + analytics.getTotalRespondents() + "\n" +
                "Вопросов: " + analytics.getQuestionsAnalytics().size();
    }
}
