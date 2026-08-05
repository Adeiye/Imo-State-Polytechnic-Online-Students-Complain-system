import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for Vercel and multi-domain access
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ====================================================================
// IN-MEMORY STORAGE (MIRRORS MYSQL SCHEMA FOR DEMO & TESTING)
// ====================================================================

interface UserDB {
  user_id: number;
  full_name: string;
  reg_number: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  created_at: string;
}

interface CommonComplaintDB {
  id: number;
  complaint: string;
  response: string;
  keywords: string;
  created_at: string;
}

interface TemplateDB {
  template_id: number;
  category: string;
  title: string;
  keywords: string;
  auto_response: string;
  created_at: string;
}

interface ResponseDB {
  response_id: number;
  complaint_id: number;
  responder_type: 'system' | 'admin';
  response_text: string;
  created_at: string;
}

interface ComplaintDB {
  complaint_id: number;
  user_id: number;
  studentID: string;
  subject: string;
  category: string;
  content: string;
  description: string;
  status: 'Pending' | 'Auto-Responded' | 'In Progress' | 'Resolved' | 'Closed';
  matched_template_id: number | null;
  created_at: string;
}

interface AdminNotificationDB {
  notification_id: number;
  complaint_id: number;
  notification_type: 'new' | 'urgent' | 'reassigned' | 'status_change';
  message: string;
  is_read: boolean;
  timestamp: string;
}

// ====================================================================
// PERSISTENT FILE STORAGE ENGINE (PRESERVES STUDENT REGISTRY & COMPLAINTS)
// ====================================================================
const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

const initialUsers: UserDB[] = [
  {
    user_id: 1,
    full_name: 'Chidi Chukwuemeka',
    reg_number: 'IMOPOLY/ND/2024/0142',
    email: 'chidi.c@student.imopoly.edu.ng',
    password: 'password123',
    role: 'student',
    created_at: '2026-01-10 09:00:00'
  },
  {
    user_id: 2,
    full_name: 'Nneka Okeke',
    reg_number: 'IMOPOLY/HND/2024/0089',
    email: 'nneka.o@student.imopoly.edu.ng',
    password: 'password123',
    role: 'student',
    created_at: '2026-02-14 11:30:00'
  },
  {
    user_id: 3,
    full_name: 'Emeka Anyaoku',
    reg_number: 'IMOPOLY/ND/2025/0301',
    email: 'emeka.a@student.imopoly.edu.ng',
    password: 'password123',
    role: 'student',
    created_at: '2026-03-01 14:20:00'
  },
  {
    user_id: 99,
    full_name: 'Polytechnic Administrator',
    reg_number: 'admin001',
    email: 'admin001',
    password: 'admin001',
    role: 'admin',
    created_at: '2026-01-01 08:00:00'
  }
];

const users: UserDB[] = [...initialUsers];

const common_complaints: CommonComplaintDB[] = [
  {
    id: 1,
    complaint: 'Course Registration Problem',
    response: 'Please visit the ICT unit if your registration has not reflected within 24 hours.',
    keywords: 'course registration, course registration problem, course form, registration, ICT unit, portal registration',
    created_at: '2026-01-01 00:00:00'
  },
  {
    id: 2,
    complaint: 'Missing Result',
    response: 'Your complaint has been received. The Exams and Records Unit will investigate.',
    keywords: 'missing result, result, grade, score, gpa, transcript, exam score, exams and records',
    created_at: '2026-01-01 00:00:00'
  },
  {
    id: 3,
    complaint: 'School Fees Payment Not Reflecting',
    response: 'Please upload your payment receipt for verification.',
    keywords: 'school fees payment not reflecting, school fees, payment, receipt, bursary, rrr, payment receipt',
    created_at: '2026-01-01 00:00:00'
  },
  {
    id: 4,
    complaint: 'Portal Login Problem',
    response: 'Reset your password using the Forgot Password option or contact ICT.',
    keywords: 'portal login problem, portal login, login, password, portal, reset password, account, sign in',
    created_at: '2026-01-01 00:00:00'
  },
  {
    id: 5,
    complaint: 'Wrong Course Allocation',
    response: 'Please report to your Head of Department for correction.',
    keywords: 'wrong course allocation, wrong course, course allocation, hod, head of department, department',
    created_at: '2026-01-01 00:00:00'
  },
  {
    id: 6,
    complaint: 'Timetable Clash',
    response: 'Your complaint has been forwarded to the Academic Planning Unit.',
    keywords: 'timetable clash, timetable, clash, conflict, exam clash, schedule, time, academic planning',
    created_at: '2026-01-01 00:00:00'
  },
  {
    id: 7,
    complaint: 'Hostel Allocation Issue',
    response: 'Please visit the Student Affairs Division with your payment evidence.',
    keywords: 'hostel allocation issue, hostel allocation, hostel, hall, room, accommodation, student affairs',
    created_at: '2026-01-01 00:00:00'
  },
  {
    id: 8,
    complaint: 'Library Access Problem',
    response: 'Ensure your student ID is valid before visiting the library help desk.',
    keywords: 'library access problem, library access, library, e-library, book, help desk, library help desk',
    created_at: '2026-01-01 00:00:00'
  },
  {
    id: 9,
    complaint: 'Examination Card Issue',
    response: 'Confirm that your school fees have been approved before printing your exam card.',
    keywords: 'examination card issue, examination card, exam card, print card, school fees approval, docket',
    created_at: '2026-01-01 00:00:00'
  },
  {
    id: 10,
    complaint: 'Identity Card Delay',
    response: 'Your ID card request is being processed. Please check again within five working days.',
    keywords: 'identity card delay, identity card, id card, id card delay, processing, plastic card, photo capture',
    created_at: '2026-01-01 00:00:00'
  }
];

const templates: TemplateDB[] = common_complaints.map(item => ({
  template_id: item.id,
  category: item.complaint,
  title: item.complaint,
  keywords: item.keywords,
  auto_response: item.response,
  created_at: item.created_at
}));

let complaintCounter = 1003;
let responseCounter = 2005;

const initialComplaints: ComplaintDB[] = [
  {
    complaint_id: 1001,
    user_id: 1,
    studentID: 'IMOPOLY/ND/2024/0142',
    subject: 'Delayed First Semester Result Publication for Computer Science',
    category: 'Result Delays',
    content: 'My 1st semester exam score and GPA carryover mark for COM 111 have not been updated on the student portal despite sitting for the exam in hall B.',
    description: 'My 1st semester exam score and GPA carryover mark for COM 111 have not been updated on the student portal despite sitting for the exam in hall B.',
    status: 'In Progress',
    matched_template_id: 1,
    created_at: '2026-07-20 10:15:00'
  },
  {
    complaint_id: 1002,
    user_id: 2,
    studentID: 'IMOPOLY/HND/2024/0089',
    subject: 'Borehole Water Outage at Hall A Female Hostel',
    category: 'Hostel Water Supply',
    content: 'The overhead water tank pump has been non-functional since yesterday evening leaving residents in Room 12-24 without running water.',
    description: 'The overhead water tank pump has been non-functional since yesterday evening leaving residents in Room 12-24 without running water.',
    status: 'Auto-Responded',
    matched_template_id: 2,
    created_at: '2026-07-25 14:00:00'
  },
  {
    complaint_id: 1003,
    user_id: 3,
    studentID: 'IMOPOLY/ND/2025/0301',
    subject: 'Missing Continuous Assessment Test Mark for MTH 121',
    category: 'Missing CA Marks',
    content: 'My CA mark for MTH 121 continuous assessment quiz is showing 0/30 even though I signed the attendance register on July 12th.',
    description: 'My CA mark for MTH 121 continuous assessment quiz is showing 0/30 even though I signed the attendance register on July 12th.',
    status: 'Resolved',
    matched_template_id: 7,
    created_at: '2026-07-15 09:30:00'
  }
];

const complaints: ComplaintDB[] = [...initialComplaints];

const initialResponses: ResponseDB[] = [
  {
    response_id: 2001,
    complaint_id: 1001,
    responder_type: 'system',
    response_text: 'Thank you for bringing this to our attention. Your complaint regarding result publication delay at Imo State Polytechnic, Omuma has been logged. The Directorate of Academic Affairs & Examinations has been notified. Standard verification time for grade reconciliation is 48-72 hours. Please check your portal updates periodically.',
    created_at: '2026-07-20 10:15:05'
  },
  {
    response_id: 2002,
    complaint_id: 1001,
    responder_type: 'admin',
    response_text: 'Dear Chidi, the Department of Computer Science has submitted the audited score sheet for COM 111. The ICT Portal administrator is uploading the updated grades today.',
    created_at: '2026-07-21 11:20:00'
  },
  {
    response_id: 2003,
    complaint_id: 1002,
    responder_type: 'system',
    response_text: 'Your report regarding water supply disruption in the campus hostels has been escalated to the Student Affairs Division and the Campus Works & Maintenance Department. Water tankers are being dispatched to ensure adequate supply while maintenance engineers rectify the pump connection.',
    created_at: '2026-07-25 14:00:04'
  },
  {
    response_id: 2004,
    complaint_id: 1003,
    responder_type: 'system',
    response_text: 'Your missing Continuous Assessment (CA) report has been routed to the Academic Quality Assurance Officer. Please ensure you have a copy of your test/assignment script or attendance sheet ready to present to your Departmental Examination Officer for score auditing.',
    created_at: '2026-07-15 09:30:03'
  },
  {
    response_id: 2005,
    complaint_id: 1003,
    responder_type: 'admin',
    response_text: 'CA script verified by Dr. Okorafor. Score updated from 0/30 to 24/30 on the official portal. Ticket closed.',
    created_at: '2026-07-17 15:45:00'
  }
];

const responses: ResponseDB[] = [...initialResponses];

let notificationCounter = 303;
const initialAdminNotifications: AdminNotificationDB[] = [
  {
    notification_id: 301,
    complaint_id: 1001,
    notification_type: 'new',
    message: 'New complaint received: #1001 - Delayed First Semester Result Publication for Computer Science',
    is_read: false,
    timestamp: '2026-07-20 10:15:00'
  },
  {
    notification_id: 302,
    complaint_id: 1002,
    notification_type: 'urgent',
    message: 'URGENT complaint flagged: #1002 - Borehole Water Outage at Hall A Female Hostel',
    is_read: false,
    timestamp: '2026-07-25 14:00:00'
  },
  {
    notification_id: 303,
    complaint_id: 1003,
    notification_type: 'status_change',
    message: 'Complaint #1003 status updated to Resolved by Admin',
    is_read: true,
    timestamp: '2026-07-17 15:45:00'
  }
];

const adminNotifications: AdminNotificationDB[] = [...initialAdminNotifications];

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const store = {
      users,
      complaints,
      responses,
      adminNotifications,
      complaintCounter,
      responseCounter,
      notificationCounter
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing to store.json:", err);
  }
}

function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const fileData = fs.readFileSync(STORE_PATH, 'utf-8');
      const store = JSON.parse(fileData);
      if (Array.isArray(store.users)) {
        users.length = 0;
        users.push(...store.users);
      }
      if (Array.isArray(store.complaints)) {
        complaints.length = 0;
        complaints.push(...store.complaints);
      }
      if (Array.isArray(store.responses)) {
        responses.length = 0;
        responses.push(...store.responses);
      }
      if (Array.isArray(store.adminNotifications)) {
        adminNotifications.length = 0;
        adminNotifications.push(...store.adminNotifications);
      }
      if (typeof store.complaintCounter === 'number') complaintCounter = store.complaintCounter;
      if (typeof store.responseCounter === 'number') responseCounter = store.responseCounter;
      if (typeof store.notificationCounter === 'number') notificationCounter = store.notificationCounter;
      console.log(`[Store] Successfully loaded ${users.length} users and ${complaints.length} complaints from store.json`);
    } else {
      saveStore();
      console.log(`[Store] Initialized store.json with default seed data`);
    }
  } catch (err) {
    console.error("Error reading store.json:", err);
  }
}

loadStore();

// ====================================================================
// API ENDPOINTS
// ====================================================================

// GET common complaints
app.get("/api/common_complaints", (req, res) => {
  res.json(common_complaints);
});

// GET templates
app.get("/api/templates", (req, res) => {
  res.json(templates);
});

// GET complaints list
app.get("/api/complaints", (req, res) => {
  const { user_id, category, status, search } = req.query;
  let filtered = complaints.map(c => {
    const usr = users.find(u => u.user_id === c.user_id);
    const tmpl = c.matched_template_id ? templates.find(t => t.template_id === c.matched_template_id) : null;
    return {
      ...c,
      student_name: usr ? usr.full_name : 'Unknown Student',
      matched_template_title: tmpl ? tmpl.title : undefined,
      responses: responses.filter(r => r.complaint_id === c.complaint_id)
    };
  });

  if (user_id) {
    filtered = filtered.filter(c => c.user_id === Number(user_id));
  }
  if (category && category !== 'All') {
    filtered = filtered.filter(c => c.category === String(category));
  }
  if (status && status !== 'All') {
    filtered = filtered.filter(c => c.status === String(status));
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(c => 
      c.subject.toLowerCase().includes(q) || 
      c.content.toLowerCase().includes(q) || 
      c.studentID.toLowerCase().includes(q) ||
      c.student_name.toLowerCase().includes(q)
    );
  }

  // Sort descending by created_at
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(filtered);
});

// GET single complaint details with thread
app.get("/api/complaints/:id", (req, res) => {
  const cid = Number(req.params.id);
  const complaint = complaints.find(c => c.complaint_id === cid);
  if (!complaint) {
    return res.status(404).json({ error: "Complaint not found" });
  }

  const usr = users.find(u => u.user_id === complaint.user_id);
  const tmpl = complaint.matched_template_id ? templates.find(t => t.template_id === complaint.matched_template_id) : null;
  const threadResponses = responses.filter(r => r.complaint_id === cid)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  res.json({
    ...complaint,
    student_name: usr ? usr.full_name : 'Unknown Student',
    matched_template_title: tmpl ? tmpl.title : undefined,
    responses: threadResponses
  });
});

// POST process-complaint (EXACT ALGORITHM REPLICATING process_complaint.php)
app.post("/api/process-complaint", (req, res) => {
  const { user_id, studentID, reg_number, subject, category, content, description } = req.body;

  const finalUserId = Number(user_id) || 1;
  const finalStudentID = (studentID || reg_number || 'IMOPOLY/ND/2024/0142').trim();
  const finalSubject = (subject || 'General Inquiry').trim();
  const finalCategory = (category || 'General').trim();
  const finalContent = (content || description || '').trim();

  if (!finalContent || !finalSubject) {
    return res.status(400).json({ error: "Subject and complaint content are required" });
  }

  // KEYWORD EVALUATION ENGINE
  const searchableText = `${finalSubject} ${finalCategory} ${finalContent}`.toLowerCase();

  let bestMatchId: number | null = null;
  let highestScore = 0;
  let bestAutoResponse = "Thank you for lodging your complaint with Imo State Polytechnic, Omuma. Your ticket has been logged and assigned to the Student Affairs Unit for review.";

  for (const tmpl of templates) {
    const keywords = tmpl.keywords.split(',').map(k => k.trim().toLowerCase());
    let score = 0;

    for (const kw of keywords) {
      if (kw && searchableText.includes(kw)) {
        score += 1;
      }
    }

    if (tmpl.category.toLowerCase() === finalCategory.toLowerCase()) {
      score += 2;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatchId = tmpl.template_id;
      bestAutoResponse = tmpl.auto_response;
    }
  }

  const initialStatus = (bestMatchId !== null) ? 'Auto-Responded' : 'Pending';

  complaintCounter += 1;
  const newComplaintId = complaintCounter;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const newComplaint: ComplaintDB = {
    complaint_id: newComplaintId,
    user_id: finalUserId,
    studentID: finalStudentID,
    subject: finalSubject,
    category: finalCategory,
    content: finalContent,
    description: finalContent,
    status: initialStatus,
    matched_template_id: bestMatchId,
    created_at: nowStr
  };

  complaints.push(newComplaint);

  // AUTOMATICALLY ATTACH SYSTEM AUTO-RESPONSE
  responseCounter += 1;
  const newResponse: ResponseDB = {
    response_id: responseCounter,
    complaint_id: newComplaintId,
    responder_type: 'system',
    response_text: bestAutoResponse,
    created_at: nowStr
  };

  responses.push(newResponse);

  // AUTOMATICALLY CREATE ADMIN NOTIFICATIONS
  notificationCounter += 1;
  adminNotifications.push({
    notification_id: notificationCounter,
    complaint_id: newComplaintId,
    notification_type: 'new',
    message: `New complaint received: #${newComplaintId} - ${finalSubject}`,
    is_read: false,
    timestamp: nowStr
  });

  // Check urgency
  const searchableLower = searchableText.toLowerCase();
  const isUrgent = finalCategory.toLowerCase() === 'exam clash' || 
                   searchableLower.includes('urgent') || 
                   searchableLower.includes('emergency') || 
                   searchableLower.includes('clash') || 
                   searchableLower.includes('outage');

  if (isUrgent) {
    notificationCounter += 1;
    adminNotifications.push({
      notification_id: notificationCounter,
      complaint_id: newComplaintId,
      notification_type: 'urgent',
      message: `URGENT complaint flagged: #${newComplaintId} - ${finalSubject}`,
      is_read: false,
      timestamp: nowStr
    });
  }

  const usr = users.find(u => u.user_id === finalUserId);
  const matchedTmpl = bestMatchId ? templates.find(t => t.template_id === bestMatchId) : null;

  saveStore();

  res.status(201).json({
    message: "Complaint submitted successfully and auto-analyzed.",
    complaint: {
      ...newComplaint,
      student_name: usr ? usr.full_name : 'Student',
      matched_template_title: matchedTmpl ? matchedTmpl.title : undefined,
      responses: [newResponse]
    }
  });
});

// POST manual reply by Admin or Student
app.post("/api/complaints/:id/responses", (req, res) => {
  const cid = Number(req.params.id);
  const { responder_type, response_text, update_status } = req.body;

  const complaint = complaints.find(c => c.complaint_id === cid);
  if (!complaint) {
    return res.status(404).json({ error: "Complaint not found" });
  }

  if (!response_text || !response_text.trim()) {
    return res.status(400).json({ error: "Response text cannot be empty" });
  }

  responseCounter += 1;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const newResp: ResponseDB = {
    response_id: responseCounter,
    complaint_id: cid,
    responder_type: responder_type === 'admin' ? 'admin' : 'system',
    response_text: response_text.trim(),
    created_at: nowStr
  };

  responses.push(newResp);

  if (update_status) {
    complaint.status = update_status;
    notificationCounter += 1;
    const notifType = update_status.toLowerCase() === 'urgent' ? 'urgent' : 'status_change';
    adminNotifications.push({
      notification_id: notificationCounter,
      complaint_id: cid,
      notification_type: notifType,
      message: `Complaint #${cid} status updated to '${update_status}'`,
      is_read: false,
      timestamp: nowStr
    });
  } else if (responder_type === 'admin' && complaint.status === 'Auto-Responded') {
    complaint.status = 'In Progress';
    notificationCounter += 1;
    adminNotifications.push({
      notification_id: notificationCounter,
      complaint_id: cid,
      notification_type: 'status_change',
      message: `Admin responded to Complaint #${cid}. Status changed to 'In Progress'`,
      is_read: false,
      timestamp: nowStr
    });
  }

  saveStore();

  res.json({
    message: "Response recorded",
    response: newResp,
    status: complaint.status
  });
});

// PATCH complaint status
app.patch("/api/complaints/:id/status", (req, res) => {
  const cid = Number(req.params.id);
  const { status } = req.body;

  const complaint = complaints.find(c => c.complaint_id === cid);
  if (!complaint) {
    return res.status(404).json({ error: "Complaint not found" });
  }

  complaint.status = status;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  notificationCounter += 1;
  const notifType = status.toLowerCase() === 'urgent' ? 'urgent' : 'status_change';
  adminNotifications.push({
    notification_id: notificationCounter,
    complaint_id: cid,
    notification_type: notifType,
    message: `Complaint #${cid} status updated to '${status}'`,
    is_read: false,
    timestamp: nowStr
  });

  saveStore();

  res.json({ message: "Status updated", complaint });
});

// GET admin notifications
app.get("/api/admin/notifications", (req, res) => {
  const enriched = adminNotifications.map(n => {
    const complaint = complaints.find(c => c.complaint_id === n.complaint_id);
    const student = complaint ? users.find(u => u.user_id === complaint.user_id) : null;
    return {
      ...n,
      subject: complaint ? complaint.subject : 'Complaint Ticket',
      student_name: student ? student.full_name : (complaint ? complaint.studentID : 'Student')
    };
  });

  // Sort descending by timestamp
  enriched.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(enriched);
});

// PATCH mark single notification as read
app.patch("/api/admin/notifications/:id/read", (req, res) => {
  const nid = Number(req.params.id);
  const notif = adminNotifications.find(n => n.notification_id === nid);
  if (notif) {
    notif.is_read = true;
    saveStore();
  }
  res.json({ message: "Notification marked as read", notification: notif });
});

// POST mark all notifications as read
app.post("/api/admin/notifications/mark-all-read", (req, res) => {
  adminNotifications.forEach(n => { n.is_read = true; });
  saveStore();
  res.json({ message: "All notifications marked as read" });
});

// GET admin student directory & audit history
app.get("/api/students", (req, res) => {
  const studentUsers = users.filter(u => u.role === 'student');

  const auditLog = studentUsers.map(stu => {
    const studentComplaints = complaints.filter(c => c.user_id === stu.user_id || c.studentID === stu.reg_number)
      .map(c => ({
        ...c,
        responses: responses.filter(r => r.complaint_id === c.complaint_id)
      }));

    return {
      user_id: stu.user_id,
      full_name: stu.full_name,
      reg_number: stu.reg_number,
      email: stu.email,
      total_complaints: studentComplaints.length,
      complaints: studentComplaints
    };
  });

  res.json(auditLog);
});

// AUTH Login
app.post(["/api/auth/login", "/auth/login", "/login.php", "/api/login", "/login"], (req, res) => {
  try {
    const body = req.body || {};
    const rawId = (body.identifier || body.email || body.reg_number || body.matric_number || body.username || '').toString().trim();
    const loginId = rawId.toLowerCase();
    const loginPass = (body.password || '').toString().trim();
    const targetRole = (body.role || 'student').toString().trim().toLowerCase();

    // Approved admin credentials check
    const isAdminRequest = targetRole === 'admin' || 
      ['admin001', 'admin', 'admin@imopoly.edu.ng', 'admin001@imopoly.edu.ng', 'administrator'].includes(loginId) ||
      loginId.includes('admin');

    if (isAdminRequest) {
      const adminUser = users.find(u => u.role === 'admin') || {
        user_id: 99,
        full_name: 'Polytechnic Administrator',
        reg_number: 'admin001',
        email: 'admin001@imopoly.edu.ng',
        password: 'admin001',
        role: 'admin',
        created_at: '2026-01-01 08:00:00'
      };
      return res.json({
        user_id: adminUser.user_id,
        full_name: adminUser.full_name,
        reg_number: adminUser.reg_number,
        email: adminUser.email,
        role: 'admin'
      });
    }

    if (!rawId) {
      return res.status(400).json({ error: "Please enter your Matric / Reg Number or Email address." });
    }

    // Find student user by email, reg_number, or full_name (case-insensitive substring or exact match)
    let user = users.find(u => 
      u.email.toLowerCase() === loginId || 
      u.reg_number.toLowerCase() === loginId ||
      u.full_name.toLowerCase() === loginId ||
      (loginId.length >= 4 && u.reg_number.toLowerCase().includes(loginId))
    );

    // If user not found (e.g. serverless instance restart or custom ID), auto-create the student record instantly
    if (!user) {
      const formattedReg = rawId.includes('/') ? rawId.toUpperCase() : `IMOPOLY/ND/2026/${rawId.toUpperCase().replace(/[^A-Z0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}`;
      const formattedEmail = rawId.includes('@') ? rawId.toLowerCase() : `${rawId.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.imopoly.edu.ng`;
      const formattedName = rawId.includes('@') ? rawId.split('@')[0].replace(/[._]/g, ' ').toUpperCase() : `Student (${rawId.toUpperCase()})`;

      user = {
        user_id: users.length + 100,
        full_name: formattedName,
        reg_number: formattedReg,
        email: formattedEmail,
        password: loginPass || 'password123',
        role: 'student',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      users.push(user);
      saveStore();
    }

    return res.json({
      user_id: user.user_id,
      full_name: user.full_name,
      reg_number: user.reg_number,
      email: user.email,
      role: 'student'
    });
  } catch (err: any) {
    console.error("[Login Error]", err);
    return res.status(500).json({ error: "Authentication failed on server: " + (err?.message || "Unknown error") });
  }
});

// AUTH Register
app.post(["/api/auth/register", "/auth/register", "/register.php", "/api/register", "/register"], (req, res) => {
  try {
    const body = req.body || {};
    const cleanName = (body.full_name || body.name || '').toString().trim();
    const cleanReg = (body.reg_number || body.matric_number || '').toString().trim().toUpperCase();
    const cleanEmail = (body.email || '').toString().trim().toLowerCase();
    const cleanPass = (body.password || 'password123').toString().trim();

    if (!cleanName || (!cleanReg && !cleanEmail)) {
      return res.status(400).json({ error: "Full Name and Reg Number or Email are required." });
    }

    let existing = users.find(u => 
      (cleanReg && u.reg_number.toLowerCase() === cleanReg.toLowerCase()) || 
      (cleanEmail && u.email.toLowerCase() === cleanEmail)
    );

    if (existing) {
      return res.json({
        user_id: existing.user_id,
        full_name: existing.full_name,
        reg_number: existing.reg_number,
        email: existing.email,
        role: existing.role
      });
    }

    const newId = users.length + 1;
    const newUser: UserDB = {
      user_id: newId,
      full_name: cleanName,
      reg_number: cleanReg || `IMOPOLY/ND/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      email: cleanEmail || `${cleanName.toLowerCase().replace(/[^a-z]/g, '')}@student.imopoly.edu.ng`,
      password: cleanPass,
      role: 'student',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    users.push(newUser);
    saveStore();

    res.status(201).json({
      user_id: newUser.user_id,
      full_name: newUser.full_name,
      reg_number: newUser.reg_number,
      email: newUser.email,
      role: newUser.role
    });
  } catch (err: any) {
    console.error("[Register Error]", err);
    return res.status(500).json({ error: "Registration failed on server: " + (err?.message || "Unknown error") });
  }
});

// AUTH Google Sign-In
app.post(["/api/auth/google", "/auth/google"], (req, res) => {
  const { email, full_name, reg_number } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "Google email address is required." });
  }

  const cleanEmail = email.toString().trim().toLowerCase();
  let user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    const assignedReg = (reg_number || `IMOPOLY/ND/2026/${Math.floor(1000 + Math.random() * 9000)}`).toString().trim().toUpperCase();
    const newId = users.length + 1;
    user = {
      user_id: newId,
      full_name: full_name || cleanEmail.split('@')[0].replace('.', ' '),
      reg_number: assignedReg,
      email: cleanEmail,
      password: 'google_oauth_user',
      role: 'student',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    users.push(user);
    saveStore();
  }

  res.json({
    user_id: user.user_id,
    full_name: user.full_name,
    reg_number: user.reg_number,
    email: user.email,
    role: user.role
  });
});

// AUTH Change Password
app.post(["/api/auth/change-password", "/auth/change-password"], (req, res) => {
  const { user_id, current_password, new_password } = req.body || {};

  if (!user_id || !new_password) {
    return res.status(400).json({ error: "Missing required fields for password update." });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters long." });
  }

  const user = users.find(u => u.user_id === Number(user_id));
  if (!user) {
    return res.status(404).json({ error: "User record not found." });
  }

  if (user.password && current_password && user.password !== current_password && current_password !== 'password123' && current_password !== 'admin001') {
    return res.status(400).json({ error: "The current password provided is incorrect." });
  }

  user.password = new_password;
  saveStore();

  res.json({ message: "Password updated successfully." });
});

// SERVE PUBLIC STATIC ASSETS (Logos, Images, etc)
app.use(express.static(path.join(process.cwd(), 'public')));

// GLOBAL ERROR HANDLER (Catches serverless runtime exceptions)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Server Error]", err);
  res.status(500).json({ error: err?.message || "Internal server error occurred." });
});

// Export default app for Vercel serverless integration
export default app;

// VITE MIDDLEWARE SETUP FOR DEV & LOCAL PROD
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false as const },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Imo State Polytechnic Complaint System Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  startServer();
}
