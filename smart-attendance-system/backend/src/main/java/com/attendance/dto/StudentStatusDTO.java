package com.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StudentStatusDTO {
    private Long id;
    private String rollNo;
    private String name;
    private String semester;
    private String section;
    private String status; // PRESENT, ABSENT, or NOT_MARKED
}
