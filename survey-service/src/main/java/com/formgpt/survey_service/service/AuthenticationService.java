package com.formgpt.survey_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.formgpt.survey_service.dto.JwtAuthenticationResponseDTO;
import com.formgpt.survey_service.dto.AuthRequestDTO;
import com.formgpt.survey_service.entity.User;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public JwtAuthenticationResponseDTO signUp(AuthRequestDTO request) {
        var user = new User();
        user.setEmail(request.getEmail());
        user.setHashPassword(passwordEncoder.encode(request.getPassword()));

        userService.create(user);

        var jwt = jwtService.generateToken(user);
        return new JwtAuthenticationResponseDTO(jwt);
    }

    public JwtAuthenticationResponseDTO signIn(AuthRequestDTO request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),   // email вместо username
                        request.getPassword()
                )
        );

        var user = userService.getByEmail(request.getEmail());

        var jwt = jwtService.generateToken(user);
        return new JwtAuthenticationResponseDTO(jwt);
    }
}
