package com.formgpt.survey_service.repository;

import com.formgpt.survey_service.entity.Form;
import com.formgpt.survey_service.entity.Response;
import com.formgpt.survey_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ResponseRepository extends JpaRepository<Response, Long> {
    Optional<Response> findByFormAndUser(Form form, User user);
    boolean existsByFormAndUser(Form form, User user);
}
