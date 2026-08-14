package com.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "class_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "subject_id", nullable = false)
    private Long subjectId;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(nullable = false)
    private String semester;

    @Column(nullable = false)
    private String section;

    @Column(name = "class_date", nullable = false)
    private LocalDate classDate;

    @Column(name = "class_day", nullable = false)
    private String classDay;

    @Column(name = "class_time", nullable = false)
    private LocalTime classTime;

    @Column(name = "source_type", nullable = false)
    private String sourceType;

    @Column(name = "file_name")
    private String fileName;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
