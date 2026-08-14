package com.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddSubjectRequest {
    @NotBlank
    private String subjectName;

    private String subjectCode;

    @NotNull
    private Long teacherId;

    @NotBlank
    private String semester;
}
