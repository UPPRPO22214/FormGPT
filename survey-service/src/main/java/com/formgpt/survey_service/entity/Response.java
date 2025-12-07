package com.formgpt.survey_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "responses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Response {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id", nullable = false)
    private Form form;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "response", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Answer> answers;

    @CreationTimestamp
    @Column(nullable = false)
    private LocalDateTime createdAt;
}
