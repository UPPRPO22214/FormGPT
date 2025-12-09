package com.formgpt.survey_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.formgpt.survey_service.dto.AuthRequestDTO;
import com.formgpt.survey_service.dto.JwtAuthenticationResponseDTO;
import com.formgpt.survey_service.service.AuthenticationService;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    public JwtAuthenticationResponseDTO register(@RequestBody @Valid AuthRequestDTO request) {
        return authenticationService.signUp(request);
    }

    @PostMapping("/login")
    public JwtAuthenticationResponseDTO login(@RequestBody @Valid AuthRequestDTO request) {
        return authenticationService.signIn(request);
    }
}
