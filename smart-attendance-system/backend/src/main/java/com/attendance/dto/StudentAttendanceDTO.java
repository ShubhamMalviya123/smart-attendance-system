package com.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StudentAttendanceDTO {
    private String rollNo;
    private String name;
    private String status;
    private Double confidenceScore; // null for absentees/manual entries
}
