package com.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DailyStatDTO {
    private String date;       // yyyy-MM-dd
    private String dayLabel;   // Mon, Tue, ...
    private long presentCount;
    private long totalMarked;
    private int percentage;    // 0-100, or -1 if no data that day
}
