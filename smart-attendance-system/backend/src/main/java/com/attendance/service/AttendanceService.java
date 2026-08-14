package com.attendance.service;

import com.attendance.dto.AttendanceResultResponse;
import com.attendance.dto.StudentAttendanceDTO;
import com.attendance.entity.Attendance;
import com.attendance.entity.ClassSession;
import com.attendance.entity.Student;
import com.attendance.repository.AttendanceRepository;
import com.attendance.repository.ClassSessionRepository;
import com.attendance.repository.StudentRepository;
import com.attendance.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core Attendance Engine:
 * 1. Takes recognized roll numbers from AI service
 * 2. Marks them PRESENT
 * 3. Marks every other registered student (in that semester+section) as ABSENT
 * 4. Saves everything to MySQL, prevents duplicates
 */
@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final ClassSessionRepository classSessionRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final AttendanceRepository attendanceRepository;
    private final AiServiceClient aiServiceClient;

    public AttendanceResultResponse processImages(Long classSessionId, List<MultipartFile> images) {
        ClassSession session = classSessionRepository.findById(classSessionId)
                .orElseThrow(() -> new RuntimeException("Class session not found"));

        List<Student> allStudents = studentRepository.findBySemesterAndSection(session.getSemester(), session.getSection());
        String knownEncodingsJson = buildKnownEncodingsJson(allStudents);

        Map<String, Object> aiResult = aiServiceClient.recognizeFromImages(images, knownEncodingsJson);
        return finalizeAttendance(session, allStudents, aiResult);
    }

    public AttendanceResultResponse processVideo(Long classSessionId, List<MultipartFile> videos) {
        ClassSession session = classSessionRepository.findById(classSessionId)
                .orElseThrow(() -> new RuntimeException("Class session not found"));

        List<Student> allStudents = studentRepository.findBySemesterAndSection(session.getSemester(), session.getSection());
        String knownEncodingsJson = buildKnownEncodingsJson(allStudents);

        Map<String, Object> aiResult = aiServiceClient.recognizeFromVideo(videos, knownEncodingsJson);
        return finalizeAttendance(session, allStudents, aiResult);
    }

    @SuppressWarnings("unchecked")
    private AttendanceResultResponse finalizeAttendance(ClassSession session, List<Student> allStudents, Map<String, Object> aiResult) {

        // Expected AI response shape: { "recognized": [ {"roll_no": "101", "confidence": 0.92}, ... ] }
        List<Map<String, Object>> recognized = (List<Map<String, Object>>) aiResult.getOrDefault("recognized", new ArrayList<>());

        Map<String, Double> recognizedRollToConfidence = new HashMap<>();
        for (Map<String, Object> r : recognized) {
            recognizedRollToConfidence.put(String.valueOf(r.get("roll_no")), Double.valueOf(String.valueOf(r.get("confidence"))));
        }

        String subjectName = subjectRepository.findById(session.getSubjectId())
                .map(s -> s.getSubjectName())
                .orElse("UNKNOWN");

        List<StudentAttendanceDTO> presentList = new ArrayList<>();
        List<StudentAttendanceDTO> absentList = new ArrayList<>();

        for (Student student : allStudents) {
            boolean isPresent = recognizedRollToConfidence.containsKey(student.getRollNo());

            // Skip if attendance already exists for this student + session (avoid duplicates)
            boolean alreadyMarked = attendanceRepository.findByClassSessionId(session.getId()).stream()
                    .anyMatch(a -> a.getStudentId().equals(student.getId()));
            if (alreadyMarked) continue;

            Attendance attendance = Attendance.builder()
                    .studentId(student.getId())
                    .classSessionId(session.getId())
                    .subjectName(subjectName)
                    .classDate(session.getClassDate())
                    .classDay(session.getClassDay())
                    .classTime(session.getClassTime())
                    .status(isPresent ? "PRESENT" : "ABSENT")
                    .confidenceScore(isPresent ? BigDecimal.valueOf(recognizedRollToConfidence.get(student.getRollNo())) : null)
                    .markedBy("AI")
                    .build();

            attendanceRepository.save(attendance);

            StudentAttendanceDTO dto = new StudentAttendanceDTO(
                    student.getRollNo(), student.getName(),
                    attendance.getStatus(),
                    isPresent ? recognizedRollToConfidence.get(student.getRollNo()) : null
            );

            if (isPresent) presentList.add(dto); else absentList.add(dto);
        }

        session.setStatus("PROCESSED");
        classSessionRepository.save(session);

        return new AttendanceResultResponse(
                session.getId(), allStudents.size(), presentList.size(), absentList.size(), presentList, absentList
        );
    }

    private String buildKnownEncodingsJson(List<Student> students) {
        // Builds a JSON array: [{"roll_no": "101", "encoding": [...]}, ...]
        // Only includes students who actually have a registered face encoding.
        List<String> entries = new ArrayList<>();
        for (Student s : students) {
            if (s.getFaceEncoding() == null || s.getFaceEncoding().isBlank()) continue;
            entries.add("{\"roll_no\":\"" + s.getRollNo() + "\",\"encoding\":" + s.getFaceEncoding() + "}");
        }
        return "[" + String.join(",", entries) + "]";
    }

    public List<Attendance> getAttendanceByStudent(Long studentId) {
        return attendanceRepository.findByStudentId(studentId);
    }

    /**
     * Fetches the already-saved attendance result for a class session,
     * so a teacher can view who was present/absent at any time later -
     * not just immediately after processing images/video.
     */
    public AttendanceResultResponse getSessionResult(Long classSessionId) {
        List<Attendance> records = attendanceRepository.findByClassSessionId(classSessionId);
        if (records.isEmpty()) {
            throw new RuntimeException("No attendance has been recorded for this class yet");
        }

        List<StudentAttendanceDTO> presentList = new ArrayList<>();
        List<StudentAttendanceDTO> absentList = new ArrayList<>();

        for (Attendance a : records) {
            Student student = studentRepository.findById(a.getStudentId()).orElse(null);
            String rollNo = student != null ? student.getRollNo() : "?";
            String name = student != null ? student.getName() : "Unknown";

            Double confidence = a.getConfidenceScore() != null ? a.getConfidenceScore().doubleValue() : null;
            StudentAttendanceDTO dto = new StudentAttendanceDTO(rollNo, name, a.getStatus(), confidence);

            if ("PRESENT".equals(a.getStatus())) presentList.add(dto);
            else absentList.add(dto);
        }

        return new AttendanceResultResponse(
                classSessionId, records.size(), presentList.size(), absentList.size(), presentList, absentList
        );
    }

    /**
     * For every student in the system, shows today's attendance status:
     * PRESENT if marked present in any class today, ABSENT if marked absent
     * (and never present) today, or NOT_MARKED if no attendance has been
     * taken for them yet today.
     */
    public List<com.attendance.dto.StudentStatusDTO> getTodayStatus() {
        java.time.LocalDate today = java.time.LocalDate.now();
        List<Attendance> todayRecords = attendanceRepository.findByClassDate(today);

        // studentId -> true if present in at least one class today
        Map<Long, Boolean> presentMap = new HashMap<>();
        Map<Long, Boolean> hasAnyRecord = new HashMap<>();
        for (Attendance a : todayRecords) {
            hasAnyRecord.put(a.getStudentId(), true);
            if ("PRESENT".equals(a.getStatus())) {
                presentMap.put(a.getStudentId(), true);
            }
        }

        List<Student> allStudents = studentRepository.findAll();
        List<com.attendance.dto.StudentStatusDTO> result = new ArrayList<>();

        for (Student s : allStudents) {
            String status;
            if (Boolean.TRUE.equals(presentMap.get(s.getId()))) {
                status = "PRESENT";
            } else if (Boolean.TRUE.equals(hasAnyRecord.get(s.getId()))) {
                status = "ABSENT";
            } else {
                status = "NOT_MARKED";
            }
            result.add(new com.attendance.dto.StudentStatusDTO(
                    s.getId(), s.getRollNo(), s.getName(), s.getSemester(), s.getSection(), status
            ));
        }
        return result;
    }

    /**
     * Real attendance trend for the last 7 days (including today), computed
     * directly from recorded attendance - no simulated or placeholder data.
     * A day with no attendance taken shows percentage -1 (meaning "no data").
     */
    public List<com.attendance.dto.DailyStatDTO> getWeeklyTrend() {
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate start = today.minusDays(6);
        List<Attendance> records = attendanceRepository.findByClassDateBetween(start, today);

        List<com.attendance.dto.DailyStatDTO> result = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            java.time.LocalDate day = start.plusDays(i);
            long present = records.stream().filter(a -> a.getClassDate().equals(day) && "PRESENT".equals(a.getStatus())).count();
            long total = records.stream().filter(a -> a.getClassDate().equals(day)).count();
            int pct = total > 0 ? (int) Math.round((present * 100.0) / total) : -1;
            String dayLabel = day.getDayOfWeek().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH);
            result.add(new com.attendance.dto.DailyStatDTO(day.toString(), dayLabel, present, total, pct));
        }
        return result;
    }
}
