package com.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.math.BigDecimal;

@Entity
@Table(name = "attendance", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "class_session_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "class_session_id", nullable = false)
    private Long classSessionId;

    @Column(name = "subject_name", nullable = false)
    private String subjectName;

    @Column(name = "class_date", nullable = false)
    private LocalDate classDate;

    @Column(name = "class_day", nullable = false)
    private String classDay;

    @Column(name = "class_time", nullable = false)
    private LocalTime classTime;

    @Column(nullable = false)
    private String status;

    @Column(name = "confidence_score")
    private BigDecimal confidenceScore;

    @Column(name = "marked_by")
    @Builder.Default
    private String markedBy = "AI";

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
