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

    @Query("SELECT COUNT(a) FROM Answer a " +
            "WHERE a.question.id = :questionId " +
            "AND a.option.text = :optionText")
    Long countByQuestionIdAndOptionText(@Param("questionId") Long questionId,
                                        @Param("optionText") String optionText);

    @Query("SELECT a.valueText FROM Answer a " +
            "WHERE a.question.id = :questionId " +
            "AND a.question.type = com.formgpt.survey_service.entity.QuestionType.TEXT " +
            "AND a.valueText IS NOT NULL AND a.valueText != ''")
    List<String> findTextAnswersByQuestionId(@Param("questionId") Long questionId);

    @Query("SELECT a.valueText FROM Answer a " +
            "WHERE a.question.id = :questionId " +
            "AND a.question.type = com.formgpt.survey_service.entity.QuestionType.SCALE " +
            "AND a.valueText IS NOT NULL AND a.valueText != ''")
    List<String> findScaleValuesByQuestionId(@Param("questionId") Long questionId);

    @Query("SELECT CASE WHEN COUNT(DISTINCT q.id) = COUNT(DISTINCT a.question.id) THEN true ELSE false END " +
            "FROM Response r " +
            "JOIN r.form f " +
            "LEFT JOIN f.questions q ON q.required = true " +
            "LEFT JOIN Answer a ON a.response.id = r.id AND a.question.id = q.id " +
            "WHERE r.id = :responseId")
    Boolean isResponseComplete(@Param("responseId") Long responseId);

    @Query("SELECT a.valueText FROM Answer a " +
            "WHERE a.question.id = :questionId " +
            "AND a.question.type = com.formgpt.survey_service.entity.QuestionType.MULTIPLE_CHOICE " +
            "AND a.valueText IS NOT NULL")
    List<String> findMultipleChoiceAnswersByQuestionId(@Param("questionId") Long questionId);

    @Query("SELECT COUNT(a) FROM Answer a " +
            "WHERE a.question.id = :questionId " +
            "AND a.question.type = com.formgpt.survey_service.entity.QuestionType.MULTIPLE_CHOICE " +
            "AND a.valueText LIKE %:optionText%")
    Long countMultipleChoiceByQuestionIdAndOptionText(@Param("questionId") Long questionId,
                                                      @Param("optionText") String optionText);
}