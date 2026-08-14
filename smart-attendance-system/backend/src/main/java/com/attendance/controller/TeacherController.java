package com.attendance.controller;

import com.attendance.dto.AttendanceResultResponse;
import com.attendance.dto.CreateClassRequest;
import com.attendance.entity.ClassSession;
import com.attendance.entity.Teacher;
import com.attendance.repository.StudentRepository;
import com.attendance.repository.TeacherRepository;
import com.attendance.service.AttendanceService;
import com.attendance.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;
    private final AttendanceService attendanceService;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;

    /**
     * Resolves the currently logged-in teacher from the JWT (subject = email).
     */
    private Teacher getCurrentTeacher() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return teacherRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Teacher not found for token"));
    }

    @PostMapping("/class")
    public ResponseEntity<?> createClass(@Valid @RequestBody CreateClassRequest request) {
        Teacher teacher = getCurrentTeacher();
        // sourceType/fileName get updated later when attendance is actually taken
        ClassSession session = teacherService.createClass(request, teacher.getId(), "PENDING", null);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/classes")
    public ResponseEntity<?> getMyClasses() {
        Teacher teacher = getCurrentTeacher();
        return ResponseEntity.ok(teacherService.getClassesByTeacher(teacher.getId()));
    }

    /**
     * Take attendance using 1-50 uploaded classroom images.
     */
    @PostMapping("/class/{classSessionId}/attendance/images")
    public ResponseEntity<?> takeAttendanceFromImages(@PathVariable Long classSessionId,
                                                       @RequestParam("images") List<MultipartFile> images) {
        if (images.isEmpty() || images.size() > 50) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please upload between 1 and 50 images"));
        }
        try {
            AttendanceResultResponse result = attendanceService.processImages(classSessionId, images);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Take attendance using 1-3 uploaded videos.
     */
    @PostMapping("/class/{classSessionId}/attendance/video")
    public ResponseEntity<?> takeAttendanceFromVideo(@PathVariable Long classSessionId,
                                                      @RequestParam("videos") List<MultipartFile> videos) {
        if (videos.isEmpty() || videos.size() > 3) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please upload between 1 and 3 videos"));
        }
        try {
            AttendanceResultResponse result = attendanceService.processVideo(classSessionId, videos);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * View the already-recorded attendance for a class session -
     * lets a teacher check present/absent lists anytime, not just right after processing.
     */
    @GetMapping("/class/{classSessionId}/attendance")
    public ResponseEntity<?> viewAttendance(@PathVariable Long classSessionId) {
        try {
            return ResponseEntity.ok(attendanceService.getSessionResult(classSessionId));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * View every student in the database (teachers can browse the full student list too).
     */
    @GetMapping("/students")
    public ResponseEntity<?> getAllStudents() {
        return ResponseEntity.ok(studentRepository.findAll());
    }

    /**
     * Delete a student record entirely (also removes their attendance history - cascade delete).
     */
    @DeleteMapping("/student/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        if (!studentRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "Student not found"));
        }
        studentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Student deleted"));
    }

    /**
     * Delete a class session entirely (also removes its attendance records - cascade delete).
     */
    @DeleteMapping("/class/{classSessionId}")
    public ResponseEntity<?> deleteClass(@PathVariable Long classSessionId) {
        try {
            teacherService.deleteClass(classSessionId);
            return ResponseEntity.ok(Map.of("message", "Class deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Shows every student's attendance status for TODAY across all their classes -
     * Present, Absent, or Not marked yet.
     */
    @GetMapping("/attendance/today")
    public ResponseEntity<?> getTodayStatus() {
        return ResponseEntity.ok(attendanceService.getTodayStatus());
    }

    @GetMapping("/attendance/weekly")
    public ResponseEntity<?> getWeeklyTrend() {
        return ResponseEntity.ok(attendanceService.getWeeklyTrend());
    }
}
