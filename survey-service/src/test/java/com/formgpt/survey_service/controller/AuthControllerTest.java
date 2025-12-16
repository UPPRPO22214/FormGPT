package com.formgpt.survey_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.formgpt.survey_service.dto.AuthRequestDTO;
import com.formgpt.survey_service.dto.JwtAuthenticationResponseDTO;
import com.formgpt.survey_service.service.AuthenticationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthenticationService authenticationService;

    @InjectMocks
    private AuthController authController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void register_ValidRequest_ReturnsJwtToken() throws Exception {
        // Arrange
        AuthRequestDTO request = new AuthRequestDTO();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        JwtAuthenticationResponseDTO response = new JwtAuthenticationResponseDTO();
        response.setToken("jwt-token-123");

        when(authenticationService.signUp(any(AuthRequestDTO.class)))
                .thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-123"));
    }

    @Test
    void register_InvalidEmail_ReturnsBadRequest() throws Exception {
        // Arrange
        AuthRequestDTO request = new AuthRequestDTO();
        request.setEmail("invalid-email");
        request.setPassword("password123");

        // Act & Assert
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_EmptyPassword_ReturnsBadRequest() throws Exception {
        // Arrange
        AuthRequestDTO request = new AuthRequestDTO();
        request.setEmail("test@example.com");
        request.setPassword("");

        // Act & Assert
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_PasswordTooShort_ReturnsBadRequest() throws Exception {
        // Arrange
        AuthRequestDTO request = new AuthRequestDTO();
        request.setEmail("test@example.com");
        request.setPassword("123"); // меньше 8 символов

        // Act & Assert
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_ValidCredentials_ReturnsJwtToken() throws Exception {
        // Arrange
        AuthRequestDTO request = new AuthRequestDTO();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        JwtAuthenticationResponseDTO response = new JwtAuthenticationResponseDTO();
        response.setToken("jwt-token-123");

        when(authenticationService.signIn(any(AuthRequestDTO.class)))
                .thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-123"));
    }

    @Test
    void login_InvalidEmailFormat_ReturnsBadRequest() throws Exception {
        // Arrange
        AuthRequestDTO request = new AuthRequestDTO();
        request.setEmail("not-an-email");
        request.setPassword("password123");

        // Act & Assert
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}