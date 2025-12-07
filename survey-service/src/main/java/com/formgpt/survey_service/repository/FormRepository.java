package com.formgpt.survey_service.repository;

import com.formgpt.survey_service.entity.Form;
import com.formgpt.survey_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FormRepository extends JpaRepository<Form, Long> {
    List<Form> findByCreatorOrderByCreatedAtDesc(User creator);
    Optional<Form> findByIdAndCreator(Long id, User creator);
}
