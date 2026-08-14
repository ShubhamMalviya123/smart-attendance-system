package com.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreateClassRequest {
    @NotNull
    private Long subjectId;

    @NotBlank
    private String semester;

    @NotBlank
    private String section;

    @NotNull
    private LocalDate classDate;

    @NotNull
    private LocalTime classTime;
}
