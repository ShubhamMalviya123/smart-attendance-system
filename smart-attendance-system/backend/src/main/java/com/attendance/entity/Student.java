package com.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "roll_no", nullable = false, unique = true)
    private String rollNo;

    @Column(nullable = false)
    private String name;

    private String email;
    private String branch;
    private String semester;
    private String section;

    @Lob
    @Column(name = "face_encoding", columnDefinition = "LONGTEXT")
    private String faceEncoding;

    @Column(name = "face_registered")
    @Builder.Default
    private Boolean faceRegistered = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
