<?php
/**
 * Online Students' Complaint System
 * Institution: Imo State Polytechnic, Omuma (Orlu East LGA, Imo State)
 * Script: process_complaint.php
 * Description: Core complaint submission and intelligent auto-response engine logic.
 * Created by: Ebubedike Kelechi Humphrey - 08068880163
 */

session_start();
require_once 'db_connect.php';

// --------------------------------------------------------------------
// ADMIN NOTIFICATION FETCHING ENDPOINT (GET)
// --------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_notifications') {
    header('Content-Type: application/json');
    if (!$pdo) {
        echo json_encode(['status' => 'error', 'message' => 'Database connection unavailable']);
        exit();
    }
    try {
        $stmt_notif = $pdo->query("
            SELECT n.*, c.subject, c.studentID, u.full_name as student_name
            FROM admin_notifications n
            JOIN complaints c ON n.complaint_id = c.complaint_id
            JOIN users u ON c.user_id = u.user_id
            ORDER BY n.timestamp DESC
            LIMIT 50
        ");
        $notifications = $stmt_notif->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $notifications]);
    } catch (Exception $ex) {
        echo json_encode(['status' => 'error', 'message' => $ex->getMessage()]);
    }
    exit();
}

// --------------------------------------------------------------------
// SECURE COMPLAINT FORM PROCESSING (POST)
// --------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // 1. Check if updating status via Admin or Student
    if (isset($_POST['action']) && $_POST['action'] === 'update_status') {
        $complaint_id = intval($_POST['complaint_id'] ?? 0);
        $new_status   = trim($_POST['status'] ?? 'Pending');

        if ($pdo && $complaint_id > 0) {
            $stmt_upd = $pdo->prepare("UPDATE complaints SET status = :status WHERE complaint_id = :id");
            $stmt_upd->execute([':status' => $new_status, ':id' => $complaint_id]);

            $notif_type = (strtolower($new_status) === 'urgent') ? 'urgent' : 'status_change';
            $notif_msg  = "Complaint #{$complaint_id} status updated to '{$new_status}'";

            $stmt_notif_upd = $pdo->prepare("
                INSERT INTO admin_notifications (complaint_id, notification_type, message, is_read, timestamp)
                VALUES (:complaint_id, :type, :message, 0, NOW())
            ");
            $stmt_notif_upd->execute([
                ':complaint_id' => $complaint_id,
                ':type'         => $notif_type,
                ':message'      => $notif_msg
            ]);
        }

        if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'success', 'message' => 'Status updated']);
            exit();
        }

        header("Location: view_complaint.php?id=" . $complaint_id);
        exit();
    }

    // 2. Read and sanitize complaint inputs
    $user_id     = isset($_POST['user_id']) ? intval($_POST['user_id']) : ($_SESSION['user_id'] ?? 1);
    $studentID   = isset($_POST['studentID']) ? trim($_POST['studentID']) : ($_POST['reg_number'] ?? 'IMOPOLY/STUDENT');
    $subject     = isset($_POST['subject']) ? trim($_POST['subject']) : 'General Complaint';
    $category    = isset($_POST['category']) ? trim($_POST['category']) : 'Others';
    $content     = isset($_POST['content']) ? trim($_POST['content']) : (isset($_POST['description']) ? trim($_POST['description']) : '');
    $description = $content;

    if (empty($content) || empty($subject)) {
        $_SESSION['error'] = "Subject and complaint description cannot be empty.";
        header("Location: lodge_complaint.php");
        exit();
    }

    // ----------------------------------------------------------------
    // INTELLIGENT AUTO-RESPONSE MATCHING ENGINE
    // ----------------------------------------------------------------
    // Define 10 core seed responses as fallback array in case DB query is offline
    $seed_templates = [
        1 => [
            'category' => 'Course Registration Problem',
            'response' => 'Please visit the ICT unit if your registration has not reflected within 24 hours.',
            'keywords' => ['course registration', 'registration problem', 'course form', 'registration', 'ict unit', 'portal registration']
        ],
        2 => [
            'category' => 'Missing Result',
            'response' => 'Your complaint has been received. The Exams and Records Unit will investigate.',
            'keywords' => ['missing result', 'result', 'grade', 'score', 'gpa', 'transcript', 'exam score', 'exams and records']
        ],
        3 => [
            'category' => 'School Fees Payment Not Reflecting',
            'response' => 'Please upload your payment receipt for verification.',
            'keywords' => ['school fees', 'payment not reflecting', 'payment', 'receipt', 'bursary', 'rrr', 'payment receipt']
        ],
        4 => [
            'category' => 'Portal Login Problem',
            'response' => 'Reset your password using the Forgot Password option or contact ICT.',
            'keywords' => ['portal login problem', 'portal login', 'login', 'password', 'portal', 'reset password', 'account', 'sign in']
        ],
        5 => [
            'category' => 'Wrong Course Allocation',
            'response' => 'Please contact your Head of Department for correction.',
            'keywords' => ['wrong course allocation', 'wrong course', 'course allocation', 'hod', 'head of department', 'department']
        ],
        6 => [
            'category' => 'Timetable Clash',
            'response' => 'Your timetable complaint has been forwarded to the Academic Planning Unit.',
            'keywords' => ['timetable clash', 'timetable', 'clash', 'conflict', 'exam clash', 'schedule', 'time', 'academic planning']
        ],
        7 => [
            'category' => 'Hostel Allocation Issue',
            'response' => 'Please visit the Student Affairs Division with your payment evidence.',
            'keywords' => ['hostel allocation issue', 'hostel allocation', 'hostel', 'hall', 'room', 'accommodation', 'student affairs']
        ],
        8 => [
            'category' => 'Library Access Problem',
            'response' => 'Ensure your student ID is valid before visiting the library help desk.',
            'keywords' => ['library access problem', 'library access', 'library', 'e-library', 'book', 'help desk', 'library help desk']
        ],
        9 => [
            'category' => 'Examination Card Issue',
            'response' => 'Confirm that your school fees have been approved before printing your exam card.',
            'keywords' => ['examination card issue', 'examination card', 'exam card', 'print card', 'school fees approval', 'docket']
        ],
        10 => [
            'category' => 'Identity Card Delay',
            'response' => 'Your ID card request is being processed. Please check again within five working days.',
            'keywords' => ['identity card delay', 'identity card', 'id card', 'id card delay', 'processing', 'plastic card', 'photo capture']
        ]
    ];

    $matched_template_id = null;
    $auto_response_text  = "Thank you for lodging your complaint with Imo State Polytechnic, Omuma. Your request has been recorded and routed to the Student Affairs Unit.";
    $highest_score       = 0;

    $searchable_text = strtolower($subject . " " . $category . " " . $content);

    // If database connection is active, query DB templates
    $db_templates = [];
    if ($pdo) {
        try {
            $stmt_cc = $pdo->query("SELECT * FROM common_complaints");
            $db_templates = $stmt_cc->fetchAll();
        } catch (Exception $e) {
            // Fallback
        }
    }

    if (!empty($db_templates)) {
        foreach ($db_templates as $tmpl) {
            $score = 0;
            $tmpl_title = strtolower($tmpl['complaint'] ?? '');
            $tmpl_kw    = strtolower($tmpl['keywords'] ?? '');

            if (strtolower($category) === $tmpl_title || strpos($tmpl_title, strtolower($category)) !== false) {
                $score += 3;
            }

            $keywords_array = array_map('trim', explode(',', $tmpl_kw));
            foreach ($keywords_array as $kw) {
                if (!empty($kw) && strpos($searchable_text, $kw) !== false) {
                    $score += 1;
                }
            }

            if ($score > $highest_score) {
                $highest_score       = $score;
                $matched_template_id = $tmpl['id'];
                $auto_response_text  = $tmpl['response'];
            }
        }
    } else {
        // Evaluate against local seed templates array
        foreach ($seed_templates as $id => $tmpl) {
            $score = 0;
            if (strtolower($category) === strtolower($tmpl['category'])) {
                $score += 3;
            }
            foreach ($tmpl['keywords'] as $kw) {
                if (strpos($searchable_text, $kw) !== false) {
                    $score += 1;
                }
            }
            if ($score > $highest_score) {
                $highest_score       = $score;
                $matched_template_id = $id;
                $auto_response_text  = $tmpl['response'];
            }
        }
    }

    // Determine initial status: 'Pending' or 'In Progress'
    $initial_status = ($matched_template_id !== null) ? 'Pending' : 'In Progress';

    // Check for urgent flagging
    $is_urgent = (
        strtolower($category) === 'timetable clash' ||
        strpos($searchable_text, 'urgent') !== false ||
        strpos($searchable_text, 'emergency') !== false ||
        strpos($searchable_text, 'clash') !== false
    );

    $complaint_id = 1000 + rand(1, 999);

    if ($pdo) {
        try {
            // Insert Complaint
            $insert_sql = "INSERT INTO complaints 
                (user_id, studentID, subject, category, content, description, status, matched_template_id, created_at)
                VALUES (:user_id, :studentID, :subject, :category, :content, :description, :status, :matched_template_id, NOW())";

            $stmt_insert = $pdo->prepare($insert_sql);
            $stmt_insert->execute([
                ':user_id'             => $user_id,
                ':studentID'           => $studentID,
                ':subject'             => $subject,
                ':category'            => $category,
                ':content'             => $content,
                ':description'         => $description,
                ':status'              => $initial_status,
                ':matched_template_id' => $matched_template_id
            ]);

            $complaint_id = $pdo->lastInsertId();

            // Insert Automated System Response
            $resp_sql = "INSERT INTO responses (complaint_id, responder_type, response_text, created_at) 
                         VALUES (:complaint_id, 'system', :response_text, NOW())";
            $stmt_resp = $pdo->prepare($resp_sql);
            $stmt_resp->execute([
                ':complaint_id'  => $complaint_id,
                ':response_text' => $auto_response_text
            ]);

            // Insert Admin Notification
            $notif_sql = "INSERT INTO admin_notifications (complaint_id, notification_type, message, is_read, timestamp)
                          VALUES (:complaint_id, 'new', :message, 0, NOW())";
            $stmt_notif = $pdo->prepare($notif_sql);
            $stmt_notif->execute([
                ':complaint_id' => $complaint_id,
                ':message'      => "New complaint received: #{$complaint_id} - {$subject}"
            ]);

            if ($is_urgent) {
                $urgent_sql = "INSERT INTO admin_notifications (complaint_id, notification_type, message, is_read, timestamp)
                               VALUES (:complaint_id, 'urgent', :message, 0, NOW())";
                $stmt_urgent = $pdo->prepare($urgent_sql);
                $stmt_urgent->execute([
                    ':complaint_id' => $complaint_id,
                    ':message'      => "URGENT complaint flagged: #{$complaint_id} - {$subject}"
                ]);
            }
        } catch (Exception $ex) {
            error_log("Error executing DB insert in process_complaint: " . $ex->getMessage());
        }
    }

    $_SESSION['flash_message'] = "Your complaint (#$complaint_id) has been submitted successfully.";

    // Support JSON response if requested by client-side API call
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'success',
            'complaint' => [
                'complaint_id' => $complaint_id,
                'user_id' => $user_id,
                'studentID' => $studentID,
                'subject' => $subject,
                'category' => $category,
                'content' => $content,
                'status' => $initial_status,
                'matched_template_id' => $matched_template_id,
                'created_at' => date('Y-m-d H:i:s')
            ],
            'auto_response' => $auto_response_text
        ]);
        exit();
    }

    // Redirect to view_complaint.php?id={id}
    header("Location: view_complaint.php?id=" . $complaint_id);
    exit();
} else {
    header("Location: lodge_complaint.php");
    exit();
}
?>
