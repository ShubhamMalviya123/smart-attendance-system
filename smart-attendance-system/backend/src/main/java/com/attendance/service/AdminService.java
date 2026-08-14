package com.attendance.service;

import com.attendance.dto.AddStudentRequest;
import com.attendance.dto.AddSubjectRequest;
import com.attendance.dto.AddTeacherRequest;
import com.attendance.entity.Student;
import com.attendance.entity.Subject;
import com.attendance.entity.Teacher;
import com.attendance.repository.StudentRepository;
import com.attendance.repository.SubjectRepository;
import com.attendance.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final PasswordEncoder passwordEncoder;

    public Teacher addTeacher(AddTeacherRequest request) {
        if (teacherRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Teacher with this email already exists");
        }
        Teacher teacher = Teacher.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("TEACHER")
                .build();
        return teacherRepository.save(teacher);
    }

    public Student addStudent(AddStudentRequest request) {
        if (studentRepository.findByRollNo(request.getRollNo()).isPresent()) {
            throw new RuntimeException("Student with this roll number already exists");
        }
        Student student = Student.builder()
                .rollNo(request.getRollNo())
                .name(request.getName())
                .email(request.getEmail())
                .branch(request.getBranch())
                .semester(request.getSemester())
                .section(request.getSection())
                .faceRegistered(false)
                .build();
        return studentRepository.save(student);
    }

    public Subject addSubject(AddSubjectRequest request) {
        Subject subject = Subject.builder()
                .subjectName(request.getSubjectName())
                .subjectCode(request.getSubjectCode())
                .teacherId(request.getTeacherId())
                .semester(request.getSemester())
                .build();
        return subjectRepository.save(subject);
    }

    public void saveFaceEncoding(String rollNo, String encodingJson) {
        Student student = studentRepository.findByRollNo(rollNo)
                .orElseThrow(() -> new RuntimeException("Student not found: " + rollNo));
        student.setFaceEncoding(encodingJson);
        student.setFaceRegistered(true);
        studentRepository.save(student);
    }

    // ---------- List all (for Admin to browse the full database) ----------

    public java.util.List<Teacher> getAllTeachers() {
        return teacherRepository.findAll();
    }

    public java.util.List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public java.util.List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    // ---------- Delete (cascade deletes related subjects/classes/attendance at the DB level) ----------

    public void deleteTeacher(Long id) {
        if (!teacherRepository.existsById(id)) {
            throw new RuntimeException("Teacher not found");
        }
        teacherRepository.deleteById(id);
    }

    public void deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new RuntimeException("Student not found");
        }
        studentRepository.deleteById(id);
    }

    public void deleteSubject(Long id) {
        if (!subjectRepository.existsById(id)) {
            throw new RuntimeException("Subject not found");
        }
        subjectRepository.deleteById(id);
    }

    // ---------- Update ----------

    public Teacher updateTeacher(Long id, com.attendance.dto.UpdateTeacherRequest request) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        teacher.setName(request.getName());
        teacher.setEmail(request.getEmail());
        // Only re-hash and update the password if a new one was actually provided
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            teacher.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        return teacherRepository.save(teacher);
    }

    public Student updateStudent(Long id, AddStudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        student.setRollNo(request.getRollNo());
        student.setName(request.getName());
        student.setEmail(request.getEmail());
        student.setBranch(request.getBranch());
        student.setSemester(request.getSemester());
        student.setSection(request.getSection());
        return studentRepository.save(student);
    }

    public Subject updateSubject(Long id, AddSubjectRequest request) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        subject.setSubjectName(request.getSubjectName());
        subject.setSubjectCode(request.getSubjectCode());
        subject.setTeacherId(request.getTeacherId());
        subject.setSemester(request.getSemester());
        return subjectRepository.save(subject);
    }
}
