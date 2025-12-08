package com.formgpt.survey_service.repository;

import com.formgpt.survey_service.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    @Query("SELECT COUNT(DISTINCT r.user.id) FROM Response r WHERE r.form.id = :formId")
    Integer countRespondentsByFormId(@Param("formId") Long formId);

    @Query("SELECT a.option.text as optionText, COUNT(a) as count " +
            "FROM Answer a " +
            "WHERE a.question.id = :questionId AND a.option IS NOT NULL " +
            "GROUP BY a.option.text " +
            "ORDER BY count DESC")
    List<Object[]> countAnswersByQuestionId(@Param("questionId") Long questionId);

    @Query("SELECT a.valueText, u.name, r.createdAt " +
            "FROM Answer a " +
            "JOIN a.response r " +
            "LEFT JOIN r.user u " +
            "WHERE a.question.id = :questionId AND a.valueText IS NOT NULL " +
            "ORDER BY r.createdAt DESC")
    List<Object[]> getTextAnswersByQuestionId(@Param("questionId") Long questionId);

    @Query("SELECT a.valueText " +
            "FROM Answer a " +
            "WHERE a.question.id = :questionId " +
            "AND a.question.type = com.formgpt.survey_service.entity.QuestionType.SCALE " +
            "AND a.valueText IS NOT NULL")
    List<String> getScaleAnswersByQuestionId(@Param("questionId") Long questionId);

    Long countByQuestionId(Long questionId);

    List<Answer> findByQuestionId(Long questionId);

    @Query("SELECT COUNT(a) FROM Answer a WHERE a.question.form.id = :formId")
    Long countByFormId(@Param("formId") Long formId);
}