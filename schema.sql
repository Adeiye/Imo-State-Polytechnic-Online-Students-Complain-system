-- ====================================================================
-- Online Students' Complaint System
-- Institution: Imo State Polytechnic, Omuma (Orlu East LGA, Imo State)
-- Database Schema for MySQL
-- Created by: Ebubedike Kelechi Humphrey - 08068880163
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `imopoly_complaint_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `imopoly_complaint_db`;

-- --------------------------------------------------------------------
-- 1. Users Table
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `admin_notifications`;
DROP TABLE IF EXISTS `responses`;
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `common_complaints`;
DROP TABLE IF EXISTS `templates`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `reg_number` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'admin') DEFAULT 'student',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------
-- 2. Common Complaints Table (10 Core Student Complaints & Auto Responses)
-- --------------------------------------------------------------------
CREATE TABLE `common_complaints` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint` VARCHAR(255) NOT NULL,
  `response` TEXT NOT NULL,
  `keywords` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------
-- 3. Templates Table (Structural compatibility for pre-stored complaints)
-- --------------------------------------------------------------------
CREATE TABLE `templates` (
  `template_id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` VARCHAR(100) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `keywords` TEXT NOT NULL,
  `auto_response` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------
-- 4. Complaints Table
-- --------------------------------------------------------------------
CREATE TABLE `complaints` (
  `complaint_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `studentID` VARCHAR(50) NOT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `content` TEXT NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('Pending', 'Auto-Responded', 'In Progress', 'Resolved', 'Closed') DEFAULT 'In Progress',
  `matched_template_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`matched_template_id`) REFERENCES `templates`(`template_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------
-- 5. Responses Table (Thread responses from System Auto-Reply or Admin)
-- --------------------------------------------------------------------
CREATE TABLE `responses` (
  `response_id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `responder_type` ENUM('system', 'admin') NOT NULL,
  `response_text` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`complaint_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------
-- 6. Admin Notifications Table
-- --------------------------------------------------------------------
CREATE TABLE `admin_notifications` (
  `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `notification_type` ENUM('new', 'urgent', 'reassigned', 'status_change') DEFAULT 'new',
  `message` VARCHAR(255) DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`complaint_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================================
-- PRE-POPULATE THE EXACT 10 CORE STUDENT COMPLAINTS AND RESPONSES
-- ====================================================================

INSERT INTO `common_complaints` (`id`, `complaint`, `response`, `keywords`) VALUES
(
  1,
  'Course Registration Problem',
  'Please visit the ICT unit if your registration has not reflected within 24 hours.',
  'course registration problem, course registration, course form, registration, ICT unit, portal registration'
),
(
  2,
  'Missing Result',
  'Your complaint has been received. The Exams and Records Unit will investigate.',
  'missing result, result, grade, score, gpa, transcript, exam score, exams and records'
),
(
  3,
  'School Fees Payment Not Reflecting',
  'Please upload your payment receipt for verification.',
  'school fees payment not reflecting, school fees, payment, receipt, bursary, rrr, payment receipt'
),
(
  4,
  'Portal Login Problem',
  'Reset your password using the Forgot Password option or contact ICT.',
  'portal login problem, portal login, login, password, portal, reset password, account, sign in'
),
(
  5,
  'Wrong Course Allocation',
  'Please contact your Head of Department for correction.',
  'wrong course allocation, wrong course, course allocation, hod, head of department, department'
),
(
  6,
  'Timetable Clash',
  'Your timetable complaint has been forwarded to the Academic Planning Unit.',
  'timetable clash, timetable, clash, conflict, exam clash, schedule, time, academic planning'
),
(
  7,
  'Hostel Allocation Issue',
  'Please visit the Student Affairs Division with your payment evidence.',
  'hostel allocation issue, hostel allocation, hostel, hall, room, accommodation, student affairs'
),
(
  8,
  'Library Access Problem',
  'Ensure your student ID is valid before visiting the library help desk.',
  'library access problem, library access, library, e-library, book, help desk, library help desk'
),
(
  9,
  'Examination Card Issue',
  'Confirm that your school fees have been approved before printing your exam card.',
  'examination card issue, examination card, exam card, print card, school fees approval, docket'
),
(
  10,
  'Identity Card Delay',
  'Your ID card request is being processed. Please check again within five working days.',
  'identity card delay, identity card, id card, id card delay, processing, plastic card, photo capture'
);

INSERT INTO `templates` (`template_id`, `category`, `title`, `keywords`, `auto_response`) VALUES
(
  1,
  'Course Registration Problem',
  'Course Registration Problem',
  'course registration problem, course registration, course form, registration, ICT unit, portal registration',
  'Please visit the ICT unit if your registration has not reflected within 24 hours.'
),
(
  2,
  'Missing Result',
  'Missing Result',
  'missing result, result, grade, score, gpa, transcript, exam score, exams and records',
  'Your complaint has been received. The Exams and Records Unit will investigate.'
),
(
  3,
  'School Fees Payment Not Reflecting',
  'School Fees Payment Not Reflecting',
  'school fees payment not reflecting, school fees, payment, receipt, bursary, rrr, payment receipt',
  'Please upload your payment receipt for verification.'
),
(
  4,
  'Portal Login Problem',
  'Portal Login Problem',
  'portal login problem, portal login, login, password, portal, reset password, account, sign in',
  'Reset your password using the Forgot Password option or contact ICT.'
),
(
  5,
  'Wrong Course Allocation',
  'Wrong Course Allocation',
  'wrong course allocation, wrong course, course allocation, hod, head of department, department',
  'Please contact your Head of Department for correction.'
),
(
  6,
  'Timetable Clash',
  'Timetable Clash',
  'timetable clash, timetable, clash, conflict, exam clash, schedule, time, academic planning',
  'Your timetable complaint has been forwarded to the Academic Planning Unit.'
),
(
  7,
  'Hostel Allocation Issue',
  'Hostel Allocation Issue',
  'hostel allocation issue, hostel allocation, hostel, hall, room, accommodation, student affairs',
  'Please visit the Student Affairs Division with your payment evidence.'
),
(
  8,
  'Library Access Problem',
  'Library Access Problem',
  'library access problem, library access, library, e-library, book, help desk, library help desk',
  'Ensure your student ID is valid before visiting the library help desk.'
),
(
  9,
  'Examination Card Issue',
  'Examination Card Issue',
  'examination card issue, examination card, exam card, print card, school fees approval, docket',
  'Confirm that your school fees have been approved before printing your exam card.'
),
(
  10,
  'Identity Card Delay',
  'Identity Card Delay',
  'identity card delay, identity card, id card, id card delay, processing, plastic card, photo capture',
  'Your ID card request is being processed. Please check again within five working days.'
);

-- Pre-populate default Administrator Account and Sample Student
INSERT INTO `users` (`full_name`, `reg_number`, `email`, `password`, `role`) VALUES
('Polytechnic Administrator', 'ADMIN/2026/001', 'admin@imopoly.edu.ng', '$2y$10$32I643pYm13U8tXyR5w0xe3D0y/E40xJvJ40xJvJ40xJvJ40xJvJ4', 'admin'),
('Chidi Chukwuemeka', 'IMOPOLY/ND/2024/0142', 'chidi.c@student.imopoly.edu.ng', '$2y$10$e8.s2M02s30NlD6t8X681eD86rB50Y2x9wN3z2G5S3z8G5S3z8G5S', 'student');

-- Pre-populate sample Admin Notifications
INSERT INTO `admin_notifications` (`complaint_id`, `notification_type`, `message`, `is_read`, `timestamp`) VALUES
(1001, 'new', 'New complaint received: #1001 - Course Registration Problem for COM112', 0, NOW()),
(1002, 'urgent', 'URGENT complaint flagged: #1002 - Missing Result for MTH121', 0, NOW());
