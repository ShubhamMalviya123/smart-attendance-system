package com.attendance.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateTeacherRequest {
    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    // Optional on update - leave blank to keep the existing password unchanged
    private String password;
}
