package com.formgpt.survey_service.client;

import com.formgpt.survey_service.dto.schema.*;
import com.formgpt.survey_service.exception.GPTServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class GPTClient {
    private final RestTemplate restTemplate;

    @Value("${gpt.service.url:http://gpt-service:8000}")
    private String gptServiceUrl;

    public FormSchema createForm(FormGenerationSchema request) {
        String url = gptServiceUrl + "/forms/create";
        log.info("Calling GPT service to create form: {}", request.getTopic());

        try {
            ResponseEntity<FormSchema> response = restTemplate.postForEntity(
                    url,
                    request,
                    FormSchema.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Form created successfully: {}", response.getBody().getTitle());
                return response.getBody();
            } else {
                log.error("Failed to create form. Status: {}", response.getStatusCode());
                throw new GPTServiceException("Failed to create form. Status: " + response.getStatusCode());
            }
        } catch (HttpClientErrorException e) {
            log.error("Client error when calling GPT service: {}", e.getMessage());
            throw new GPTServiceException("GPT service client error: " + e.getMessage(), e);
        } catch (HttpServerErrorException e) {
            log.error("Server error when calling GPT service: {}", e.getMessage());
            throw new GPTServiceException("GPT service server error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error when calling GPT service: {}", e.getMessage(), e);
            throw new GPTServiceException("Unexpected error calling GPT service: " + e.getMessage(), e);
        }
    }

    public QuestionSchema generateQuestion(QuestionGenerationSchema request) {
        String url = gptServiceUrl + "/questions/generate";
        log.info("Calling GPT service to generate question on topic: {}", request.getTopic());

        try {
            ResponseEntity<QuestionSchema> response = restTemplate.postForEntity(
                    url,
                    request,
                    QuestionSchema.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Question generated successfully");
                return response.getBody();
            } else {
                log.error("Failed to generate question. Status: {}", response.getStatusCode());
                throw new GPTServiceException("Failed to generate question");
            }
        } catch (HttpClientErrorException e) {
            log.error("Client error when generating question: {}", e.getMessage());
            throw new GPTServiceException("GPT service client error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error when generating question: {}", e.getMessage(), e);
            throw new GPTServiceException("Unexpected error generating question: " + e.getMessage(), e);
        }
    }

    public QuestionSchema improveQuestion(QuestionImprovementSchema request) {
        String url = gptServiceUrl + "/questions/improve";
        log.info("Calling GPT service to improve question: {}", request.getText());

        try {
            ResponseEntity<QuestionSchema> response = restTemplate.postForEntity(
                    url,
                    request,
                    QuestionSchema.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Question improved successfully");
                return response.getBody();
            } else {
                log.error("Failed to improve question. Status: {}", response.getStatusCode());
                throw new GPTServiceException("Failed to improve question");
            }
        } catch (HttpClientErrorException e) {
            log.error("Client error when improving question: {}", e.getMessage());
            throw new GPTServiceException("GPT service client error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error when improving question: {}", e.getMessage(), e);
            throw new GPTServiceException("Unexpected error improving question: " + e.getMessage(), e);
        }
    }


    public List<QuestionSchema> generateMultipleQuestions(MultipleQuestionGenerationSchema request) {
        String url = gptServiceUrl + "/questions/generate_multiple";
        log.info("Calling GPT service to generate {} questions on topic: {}",
                request.getQuestions_count(), request.getTopic());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<MultipleQuestionGenerationSchema> entity = new HttpEntity<>(request, headers);

            ResponseEntity<List<QuestionSchema>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<List<QuestionSchema>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Successfully generated {} questions", response.getBody().size());
                return response.getBody();
            } else {
                log.error("Failed to generate multiple questions. Status: {}", response.getStatusCode());
                throw new GPTServiceException("Failed to generate multiple questions");
            }
        } catch (HttpClientErrorException e) {
            log.error("Client error when generating multiple questions: {}", e.getMessage());
            throw new GPTServiceException("GPT service client error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error when generating multiple questions: {}", e.getMessage(), e);
            throw new GPTServiceException("Unexpected error generating questions: " + e.getMessage(), e);
        }
    }
}