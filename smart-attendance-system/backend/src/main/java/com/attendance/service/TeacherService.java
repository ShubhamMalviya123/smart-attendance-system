package com.attendance.service;

import com.attendance.dto.CreateClassRequest;
import com.attendance.entity.ClassSession;
import com.attendance.repository.ClassSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class TeacherService {

    private final ClassSessionRepository classSessionRepository;

    public ClassSession createClass(CreateClassRequest request, Long teacherId, String sourceType, String fileName) {
        String dayName = request.getClassDate().getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        ClassSession session = ClassSession.builder()
                .subjectId(request.getSubjectId())
                .teacherId(teacherId)
                .semester(request.getSemester())
                .section(request.getSection())
                .classDate(request.getClassDate())
                .classDay(dayName)
                .classTime(request.getClassTime())
                .sourceType(sourceType)
                .fileName(fileName)
                .status("PENDING")
                .build();

        return classSessionRepository.save(session);
    }

    public List<ClassSession> getClassesByTeacher(Long teacherId) {
        return classSessionRepository.findByTeacherId(teacherId);
    }

    /**
     * Deletes a class session. Its attendance records are removed too
     * (ON DELETE CASCADE at the database level).
     */
    public void deleteClass(Long classSessionId) {
        if (!classSessionRepository.existsById(classSessionId)) {
            throw new RuntimeException("Class not found");
        }
        classSessionRepository.deleteById(classSessionId);
    }
}
