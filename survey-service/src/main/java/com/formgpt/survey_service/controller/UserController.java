package com.formgpt.survey_service.controller;

import com.formgpt.survey_service.dto.UserProfileResponse;
import com.formgpt.survey_service.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser() {
        var currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(UserProfileResponse.from(currentUser));
    }
}
