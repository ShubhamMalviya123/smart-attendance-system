package com.attendance.controller;

import com.attendance.dto.AddStudentRequest;
import com.attendance.dto.AddSubjectRequest;
import com.attendance.dto.AddTeacherRequest;
import com.attendance.service.AdminService;
import com.attendance.service.AiServiceClient;
import com.attendance.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AiServiceClient aiServiceClient;
    private final AttendanceService attendanceService;

    @PostMapping("/teacher")
    public ResponseEntity<?> addTeacher(@Valid @RequestBody AddTeacherRequest request) {
        try {
            return ResponseEntity.ok(adminService.addTeacher(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/student")
    public ResponseEntity<?> addStudent(@Valid @RequestBody AddStudentRequest request) {
        try {
            return ResponseEntity.ok(adminService.addStudent(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/subject")
    public ResponseEntity<?> addSubject(@Valid @RequestBody AddSubjectRequest request) {
        try {
            return ResponseEntity.ok(adminService.addSubject(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Register a student's face using 1-5 images.
     * Forwards images to the Python AI service to generate a face encoding,
     * then saves the encoding against the student record.
     */
    @PostMapping("/student/{rollNo}/register-face")
    public ResponseEntity<?> registerFace(@PathVariable String rollNo,
                                           @RequestParam("images") List<MultipartFile> images) {
        if (images.isEmpty() || images.size() > 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please upload between 1 and 5 images"));
        }
        try {
            String encoding = aiServiceClient.generateEncoding(images);
            adminService.saveFaceEncoding(rollNo, encoding);
            return ResponseEntity.ok(Map.of("message", "Face registered successfully for roll no " + rollNo));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Face registration failed: " + e.getMessage()));
        }
    }

    // ---------- List everything in the database ----------

    @GetMapping("/teachers")
    public ResponseEntity<?> getAllTeachers() {
        return ResponseEntity.ok(adminService.getAllTeachers());
    }

    @GetMapping("/students")
    public ResponseEntity<?> getAllStudents() {
        return ResponseEntity.ok(adminService.getAllStudents());
    }

    @GetMapping("/subjects")
    public ResponseEntity<?> getAllSubjects() {
        return ResponseEntity.ok(adminService.getAllSubjects());
    }

    // ---------- Delete ----------

    @DeleteMapping("/teacher/{id}")
    public ResponseEntity<?> deleteTeacher(@PathVariable Long id) {
        try {
            adminService.deleteTeacher(id);
            return ResponseEntity.ok(Map.of("message", "Teacher deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/student/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        try {
            adminService.deleteStudent(id);
            return ResponseEntity.ok(Map.of("message", "Student deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/subject/{id}")
    public ResponseEntity<?> deleteSubject(@PathVariable Long id) {
        try {
            adminService.deleteSubject(id);
            return ResponseEntity.ok(Map.of("message", "Subject deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ---------- Update ----------

    @PutMapping("/teacher/{id}")
    public ResponseEntity<?> updateTeacher(@PathVariable Long id, @Valid @RequestBody com.attendance.dto.UpdateTeacherRequest request) {
        try {
            return ResponseEntity.ok(adminService.updateTeacher(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/student/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @Valid @RequestBody AddStudentRequest request) {
        try {
            return ResponseEntity.ok(adminService.updateStudent(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/subject/{id}")
    public ResponseEntity<?> updateSubject(@PathVariable Long id, @Valid @RequestBody AddSubjectRequest request) {
        try {
            return ResponseEntity.ok(adminService.updateSubject(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ---------- Attendance summary (for dashboard stats) ----------

    @GetMapping("/attendance/today")
    public ResponseEntity<?> getTodayStatus() {
        return ResponseEntity.ok(attendanceService.getTodayStatus());
    }

    @GetMapping("/attendance/weekly")
    public ResponseEntity<?> getWeeklyTrend() {
        return ResponseEntity.ok(attendanceService.getWeeklyTrend());
    }
}
