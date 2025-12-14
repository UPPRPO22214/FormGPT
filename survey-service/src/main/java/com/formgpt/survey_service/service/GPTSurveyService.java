package com.formgpt.survey_service.service;

import com.formgpt.survey_service.client.GPTClient;
import com.formgpt.survey_service.dto.*;
import com.formgpt.survey_service.dto.schema.*;
import com.formgpt.survey_service.entity.*;
import com.formgpt.survey_service.exception.GPTServiceException;
import com.formgpt.survey_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GPTSurveyService {
    private final GPTClient gptClient;
    private final GPTTypeConverter typeConverter;
    private final SurveyService surveyService;
    private final FormRepository formRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;

    @Transactional
    public SurveyResponseDTO createSurveyWithGPT(GPTSurveyCreateRequestDTO request, User user) {
        log.info("Creating survey with GPT for user: {}, topic: {}", user.getEmail(), request.getDescription());

        FormGenerationSchema gptRequest = new FormGenerationSchema();
        gptRequest.setTopic(request.getDescription());
        gptRequest.setQuestions_count(request.getQuestionCount());
        gptRequest.setTarget_audience(request.getTargetAudience());

        FormSchema gptResponse = gptClient.createForm(gptRequest);

        CreateSurveyRequestDTO surveyRequest = new CreateSurveyRequestDTO();
        surveyRequest.setTitle(gptResponse.getTitle());
        surveyRequest.setDescription("Сгенерировано GPT");

        if (gptResponse.getQuestions() != null) {
            List<CreateQuestionRequestDTO> questions = gptResponse.getQuestions().stream()
                    .map(typeConverter::convertToQuestionDTO)
                    .collect(Collectors.toList());
            surveyRequest.setQuestions(questions);
        }

        return surveyService.createSurvey(surveyRequest, user);
    }

    @Transactional
    public QuestionResponseDTO addQuestionToSurveyWithGPT(Long surveyId, GPTAddQuestionRequestDTO request, User user) {
        log.info("Adding GPT-generated question to survey: {}, user: {}", surveyId, user.getEmail());

        Form form = formRepository.findByIdAndCreator(surveyId, user)
                .orElseThrow(() -> new RuntimeException("Survey not found or access denied"));

        QuestionGenerationSchema gptRequest = new QuestionGenerationSchema();
        gptRequest.setTopic(request.getTopic() != null ? request.getTopic() : form.getTitle());
        gptRequest.setTarget_audience(request.getTargetAudience());

        QuestionSchema gptResponse = gptClient.generateQuestion(gptRequest);

        int maxOrderIndex = form.getQuestions().stream()
                .mapToInt(Question::getOrderIndex)
                .max()
                .orElse(-1);
        int newOrderIndex = maxOrderIndex + 1;

        Question question = Question.builder()
                .form(form)
                .text(gptResponse.getText())
                .type(typeConverter.convertFromGPTAnswerType(gptResponse.getAnswer_type()))
                .orderIndex(newOrderIndex)
                .required(false)
                .build();

        questionRepository.save(question);

        List<QuestionOption> options = new ArrayList<>();
        question.setOptions(options);

        if (gptResponse.getAnswer_options() != null && !gptResponse.getAnswer_options().isEmpty()) {
            for (int i = 0; i < gptResponse.getAnswer_options().size(); i++) {
                QuestionOption option = QuestionOption.builder()
                        .question(question)
                        .text(gptResponse.getAnswer_options().get(i))
                        .orderIndex(i)
                        .build();
                questionOptionRepository.save(option);
                options.add(option);
            }
        }

        form.getQuestions().add(question);
        formRepository.save(form);

        return convertToQuestionResponseDTO(question);
    }

    @Transactional
    public QuestionResponseDTO improveQuestionWithGPT(Long questionId, GPTQuestionImproveRequestDTO request, User user) {
        log.info("Improving question with GPT: {}, user: {}", questionId, user.getEmail());

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        if (!question.getForm().getCreator().getId().equals(user.getId())) {
            throw new GPTServiceException("You don't have permission to edit this question");
        }

        List<String> currentOptions = question.getOptions().stream()
                .map(QuestionOption::getText)
                .collect(Collectors.toList());

        QuestionImprovementSchema gptRequest = typeConverter.convertToImprovementSchema(
                question.getText(),
                question.getType(),
                currentOptions,
                request.getPrompt()
        );

        QuestionSchema gptResponse = gptClient.improveQuestion(gptRequest);

        question.setText(gptResponse.getText());
        question.setType(typeConverter.convertFromGPTAnswerType(gptResponse.getAnswer_type()));

        questionOptionRepository.deleteAll(question.getOptions());
        question.getOptions().clear();

        if (gptResponse.getAnswer_options() != null && !gptResponse.getAnswer_options().isEmpty()) {
            for (int i = 0; i < gptResponse.getAnswer_options().size(); i++) {
                QuestionOption option = QuestionOption.builder()
                        .question(question)
                        .text(gptResponse.getAnswer_options().get(i))
                        .orderIndex(i)
                        .build();
                questionOptionRepository.save(option);
                question.getOptions().add(option);
            }
        }

        questionRepository.save(question);

        return convertToQuestionResponseDTO(question);
    }

    private QuestionResponseDTO convertToQuestionResponseDTO(Question question) {
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

    @Transactional
    public List<QuestionResponseDTO> generateQuestionsForSurvey(
            Long surveyId,
            GPTGenerateQuestionsForSurveyRequestDTO request,
            User user) {

        log.info("Generating {} questions for survey: {}, user: {}, prompt: {}",
                request.getCount(), surveyId, user.getEmail(), request.getPromt());

        Form form = formRepository.findByIdAndCreator(surveyId, user)
                .orElseThrow(() -> new RuntimeException("Survey not found or access denied"));

        List<QuestionSchema> previousQuestions = form.getQuestions().stream()
                .map(this::convertQuestionToSchema)
                .collect(Collectors.toList());

        MultipleQuestionGenerationSchema gptRequest = new MultipleQuestionGenerationSchema();
        gptRequest.setTopic(form.getTitle());
        gptRequest.setQuestions_count(request.getCount());

        if (!previousQuestions.isEmpty()) {
            gptRequest.setPrevious_questions(previousQuestions);
        }

        String promptText = request.getPromt();
        if (promptText != null && !promptText.isEmpty()) {
            gptRequest.setTopic(form.getTitle() + " - " + promptText);
        }

        List<QuestionSchema> generatedQuestions = gptClient.generateMultipleQuestions(gptRequest);

        if (generatedQuestions == null || generatedQuestions.isEmpty()) {
            throw new GPTServiceException("GPT returned no questions");
        }

        int maxOrderIndex = form.getQuestions().stream()
                .mapToInt(Question::getOrderIndex)
                .max()
                .orElse(-1);

        List<QuestionResponseDTO> result = new ArrayList<>();

        for (QuestionSchema questionSchema : generatedQuestions) {
            maxOrderIndex++;

            Question question = Question.builder()
                    .form(form)
                    .text(questionSchema.getText())
                    .type(typeConverter.convertFromGPTAnswerType(questionSchema.getAnswer_type()))
                    .orderIndex(maxOrderIndex)
                    .required(false)
                    .build();

            questionRepository.save(question);

            if (questionSchema.getAnswer_options() != null && !questionSchema.getAnswer_options().isEmpty()) {
                List<QuestionOption> options = new ArrayList<>();

                for (int i = 0; i < questionSchema.getAnswer_options().size(); i++) {
                    QuestionOption option = QuestionOption.builder()
                            .question(question)
                            .text(questionSchema.getAnswer_options().get(i))
                            .orderIndex(i)
                            .build();
                    questionOptionRepository.save(option);
                    options.add(option);
                }

                question.setOptions(options);
            }

            form.getQuestions().add(question);

            result.add(convertToQuestionResponseDTO(question));
        }

        formRepository.save(form);

        log.info("Successfully added {} generated questions to survey {}",
                generatedQuestions.size(), surveyId);

        return result;
    }

    private QuestionSchema convertQuestionToSchema(Question question) {
        QuestionSchema schema = new QuestionSchema();
        schema.setText(question.getText());
        schema.setAnswer_type(typeConverter.convertToGPTAnswerType(question.getType()));

        if (question.getOptions() != null && !question.getOptions().isEmpty()) {
            List<String> options = question.getOptions().stream()
                    .map(QuestionOption::getText)
                    .collect(Collectors.toList());
            schema.setAnswer_options(options);
        }

        return schema;
    }
}