// src/main/java/com/formgpt/survey_service/repository/ResponseRepository.java
package com.formgpt.survey_service.repository;

import com.formgpt.survey_service.entity.Form;
import com.formgpt.survey_service.entity.Response;
import com.formgpt.survey_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResponseRepository extends JpaRepository<Response, Long> {

    Optional<Response> findByFormAndUser(Form form, User user);

    List<Response> findByForm(Form form);

    @Query("SELECT COUNT(r) FROM Response r WHERE r.form.id = :formId")
    Integer countByFormId(@Param("formId") Long formId);

    @Query("SELECT COUNT(r) FROM Response r " +
            "WHERE r.form.id = :formId " +
            "AND NOT EXISTS (" +
            "    SELECT q.id FROM Question q " +
            "    WHERE q.form.id = :formId " +
            "    AND q.required = true " +
            "    AND NOT EXISTS (" +
            "        SELECT a.id FROM Answer a " +
            "        WHERE a.response.id = r.id " +
            "        AND a.question.id = q.id " +
            "    )" +
            ")")
    Integer countCompletedByFormId(@Param("formId") Long formId);

    @Query("SELECT DISTINCT r.user.id FROM Response r WHERE r.form.id = :formId AND r.user.id IS NOT NULL")
    List<String> findRespondentIdsByFormId(@Param("formId") Long formId);

    @Query("SELECT MIN(r.createdAt), MAX(r.createdAt) FROM Response r WHERE r.form.id = :formId")
    List<Object[]> getResponseTimeRangeByFormId(@Param("formId") Long formId);
}