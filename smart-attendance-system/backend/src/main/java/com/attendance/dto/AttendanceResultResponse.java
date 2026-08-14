package com.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class AttendanceResultResponse {
    private Long classSessionId;
    private int totalStudents;
    private int presentCount;
    private int absentCount;
    private List<StudentAttendanceDTO> presentStudents;
    private List<StudentAttendanceDTO> absentStudents;
}
