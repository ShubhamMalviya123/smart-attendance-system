-- ============================================
-- Smart AI Classroom Attendance System
-- Database Schema (MySQL 8+)
-- ============================================

CREATE DATABASE IF NOT EXISTS smart_attendance_db;
USE smart_attendance_db;

-- ============================================
-- 1. TEACHERS TABLE
-- ============================================
CREATE TABLE teachers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,   -- BCrypt hashed
    role VARCHAR(20) NOT NULL DEFAULT 'TEACHER', -- TEACHER or ADMIN
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. STUDENTS TABLE
-- ============================================
CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    branch VARCHAR(50),
    semester VARCHAR(20),
    section VARCHAR(10),
    face_encoding LONGTEXT,       -- stores 128-d encoding as JSON string
    face_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. SUBJECTS TABLE
-- ============================================
CREATE TABLE subjects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20),
    teacher_id BIGINT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- ============================================
-- 4. CLASS SESSIONS TABLE (a "Take Attendance" event)
-- ============================================
CREATE TABLE class_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    section VARCHAR(10) NOT NULL,
    class_date DATE NOT NULL,
    class_day VARCHAR(15) NOT NULL,     -- Monday, Tuesday...
    class_time TIME NOT NULL,
    source_type VARCHAR(10) NOT NULL,   -- VIDEO or IMAGE
    file_name VARCHAR(255),             -- uploaded video/image reference
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSED, FAILED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- ============================================
-- 5. ATTENDANCE TABLE
-- ============================================
CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    class_session_id BIGINT NOT NULL,
    subject_name VARCHAR(100) NOT NULL,   -- denormalized for fast reports
    class_date DATE NOT NULL,
    class_day VARCHAR(15) NOT NULL,
    class_time TIME NOT NULL,
    status VARCHAR(10) NOT NULL,          -- PRESENT or ABSENT
    confidence_score DECIMAL(5,4),        -- AI match confidence (nullable for manual)
    marked_by VARCHAR(20) DEFAULT 'AI',   -- AI or MANUAL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (student_id, class_session_id)  -- no duplicate attendance
);

-- ============================================
-- INDEXES for fast reporting
-- ============================================
CREATE INDEX idx_attendance_date ON attendance(class_date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_session ON attendance(class_session_id);
CREATE INDEX idx_students_semester_section ON students(semester, section);

-- ============================================
-- SEED DATA
-- ============================================
-- NOTE: The default ADMIN account (admin@college.edu / admin123) is created
-- automatically by the Spring Boot backend on first startup (see
-- backend/.../config/DataInitializer.java), with a properly generated
-- BCrypt hash. Do NOT insert a teachers row here for it - the backend
-- handles this so the password is guaranteed to actually work.
--
-- After logging in as admin, add real teachers and subjects through the
-- Admin Dashboard UI (or POST /api/admin/teacher, /api/admin/subject) -
-- those passwords will be hashed correctly too.

-- Sample Students (safe to seed directly - no passwords involved)
INSERT INTO students (roll_no, name, email, branch, semester, section)
VALUES
('101', 'Rahul', 'rahul@college.edu', 'MCA', 'MCA 3rd', 'A'),
('102', 'Aman', 'aman@college.edu', 'MCA', 'MCA 3rd', 'A'),
('105', 'Rohan', 'rohan@college.edu', 'MCA', 'MCA 3rd', 'A'),
('107', 'Ankit', 'ankit@college.edu', 'MCA', 'MCA 3rd', 'A');
