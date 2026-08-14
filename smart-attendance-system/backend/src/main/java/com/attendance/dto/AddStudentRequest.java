package com.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddStudentRequest {
    @NotBlank
    private String rollNo;

    @NotBlank
    private String name;

    private String email;
    private String branch;

    @NotBlank
    private String semester;

    @NotBlank
    private String section;
}
