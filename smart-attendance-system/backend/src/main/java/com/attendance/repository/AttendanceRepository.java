package com.attendance.repository;

import com.attendance.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByClassSessionId(Long classSessionId);

    List<Attendance> findByStudentId(Long studentId);

    List<Attendance> findByClassDateBetween(LocalDate start, LocalDate end);

    List<Attendance> findBySubjectNameAndClassDateBetween(String subjectName, LocalDate start, LocalDate end);

    List<Attendance> findByStudentIdAndClassDateBetween(Long studentId, LocalDate start, LocalDate end);

    List<Attendance> findByClassDate(LocalDate classDate);

    long countByClassSessionIdAndStatus(Long classSessionId, String status);
}
