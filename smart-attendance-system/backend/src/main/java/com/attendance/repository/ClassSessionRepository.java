package com.attendance.repository;

import com.attendance.entity.ClassSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {
    List<ClassSession> findByTeacherId(Long teacherId);
    List<ClassSession> findBySubjectId(Long subjectId);
}
