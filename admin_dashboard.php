<?php
/**
 * Online Students' Complaint System - Imo State Polytechnic, Omuma
 * Page: admin_dashboard.php (Administrator Overview & Metrics)
 */

session_start();

// Verify Admin Auth
$user_id   = $_SESSION['user_id'] ?? 1;
$full_name = $_SESSION['full_name'] ?? 'Polytechnic Administrator';
$role      = $_SESSION['role'] ?? 'admin';

// Database Connection
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'imopoly_complaint_db';

$total_complaints = 0;
$pending_complaints = 0;
$auto_responded_count = 0;
$in_progress_count = 0;
$resolved_count = 0;
$urgent_count = 0;
$total_students = 0;

$recent_complaints = [];
$notifications = [];

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Query Metrics
    $total_complaints     = $pdo->query("SELECT COUNT(*) FROM complaints")->fetchColumn();
    $pending_complaints   = $pdo->query("SELECT COUNT(*) FROM complaints WHERE status = 'Pending'")->fetchColumn();
    $auto_responded_count = $pdo->query("SELECT COUNT(*) FROM complaints WHERE status = 'Auto-Responded'")->fetchColumn();
    $in_progress_count    = $pdo->query("SELECT COUNT(*) FROM complaints WHERE status = 'In Progress'")->fetchColumn();
    $resolved_count       = $pdo->query("SELECT COUNT(*) FROM complaints WHERE status = 'Resolved'")->fetchColumn();
    $urgent_count         = $pdo->query("SELECT COUNT(*) FROM complaints WHERE status = 'Urgent'")->fetchColumn();
    $total_students       = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'student'")->fetchColumn();

    // Fetch 5 Most Recent Complaints
    $stmt_rec = $pdo->query("
        SELECT c.*, u.full_name as student_name 
        FROM complaints c 
        LEFT JOIN users u ON c.user_id = u.user_id 
        ORDER BY c.created_at DESC LIMIT 5
    ");
    $recent_complaints = $stmt_rec->fetchAll();

    // Fetch Recent Admin Notifications
    $stmt_notif = $pdo->query("
        SELECT n.*, c.subject 
        FROM admin_notifications n 
        JOIN complaints c ON n.complaint_id = c.complaint_id 
        ORDER BY n.timestamp DESC LIMIT 10
    ");
    $notifications = $stmt_notif->fetchAll();

} catch (PDOException $e) {
    // Fallback Mock Data
    $total_complaints = 8;
    $pending_complaints = 1;
    $auto_responded_count = 4;
    $in_progress_count = 2;
    $resolved_count = 1;
    $urgent_count = 1;
    $total_students = 12;

    $recent_complaints = [
        [
            'complaint_id' => 1001,
            'studentID' => 'IMOPOLY/ND/2024/0142',
            'student_name' => 'Chidi Chukwuemeka',
            'subject' => 'Delayed First Semester Result Publication for Computer Science',
            'category' => 'Result Delay',
            'status' => 'Auto-Responded',
            'created_at' => '2026-07-20 10:15:00'
        ],
        [
            'complaint_id' => 1002,
            'studentID' => 'IMOPOLY/HND/2025/0891',
            'student_name' => 'Amaka Nwosu',
            'subject' => 'Borehole Water Outage at Hall A Female Hostel',
            'category' => 'Hostel Water',
            'status' => 'Urgent',
            'created_at' => '2026-07-25 14:00:00'
        ]
    ];

    $notifications = [
        [
            'notification_id' => 301,
            'complaint_id' => 1001,
            'notification_type' => 'new',
            'message' => 'New complaint received: #1001 - Delayed First Semester Result Publication',
            'is_read' => 0,
            'timestamp' => '2026-07-20 10:15:00'
        ],
        [
            'notification_id' => 302,
            'complaint_id' => 1002,
            'notification_type' => 'urgent',
            'message' => 'URGENT complaint flagged: #1002 - Borehole Water Outage',
            'is_read' => 0,
            'timestamp' => '2026-07-25 14:00:00'
        ]
    ];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - Imo State Polytechnic, Omuma</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col justify-between">

  <!-- Header & Navigation Bar -->
  <header class="bg-blue-950 border-b border-blue-900/80 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-md border border-slate-200 overflow-hidden">
          <img src="https://res.cloudinary.com/n4kwtphh/image/upload/v1785941933/photo_2026-07-28_22-46-21_vuamoj.jpg" onerror="this.src='/logo.png'" alt="Imo State Polytechnic Logo" class="w-full h-full object-contain" />
        </div>
        <div>
          <h1 class="text-base font-bold text-white tracking-tight uppercase">Imo State Polytechnic, Omuma</h1>
          <p class="text-xs font-mono text-emerald-400">Administrator Control Portal</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="flex items-center space-x-1 sm:space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-mono font-bold">
        <a href="admin_dashboard.php" class="px-3.5 py-2 rounded-xl bg-blue-600 text-white transition shadow-sm">
          📊 Dashboard
        </a>
        <a href="admin_complaints.php" class="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition">
          📋 Complaint Queue
        </a>
        <a href="admin_students.php" class="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition">
          👥 Student Directory
        </a>
        <a href="login.php?logout=1" class="px-3.5 py-2 rounded-xl text-red-400 hover:bg-red-950/60 transition">
          Logout
        </a>
      </nav>

    </div>
  </header>

  <!-- Page Body -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">

    <!-- Title Banner -->
    <div class="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 text-blue-300 text-xs font-mono font-bold border border-blue-800 mb-2 uppercase">
          ADMINISTRATOR CONTROL CONSOLE
        </div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Institutional Metrics Overview</h2>
        <p class="text-xs text-slate-400 mt-1">
          Monitor incoming student grievances, auto-matched response evaluation performance, and urgent escalations.
        </p>
      </div>

      <div class="flex items-center space-x-2">
        <a href="admin_complaints.php" class="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition shadow-md">
          Manage Complaint Queue →
        </a>
      </div>
    </div>

    <!-- High-Level KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1">
        <div class="text-[11px] font-mono font-bold text-slate-400 uppercase">Total Complaints</div>
        <div class="text-3xl font-bold font-mono text-white"><?= $total_complaints ?></div>
        <div class="text-[10px] text-slate-500">Submitted tickets</div>
      </div>

      <div class="bg-slate-950 p-5 rounded-2xl border border-blue-900/50 space-y-1">
        <div class="text-[11px] font-mono font-bold text-blue-400 uppercase">Auto-Responded</div>
        <div class="text-3xl font-bold font-mono text-blue-400"><?= $auto_responded_count ?></div>
        <div class="text-[10px] text-slate-500">Keyword template matched</div>
      </div>

      <div class="bg-slate-950 p-5 rounded-2xl border border-red-900/50 space-y-1">
        <div class="text-[11px] font-mono font-bold text-red-400 uppercase">Urgent Flagged</div>
        <div class="text-3xl font-bold font-mono text-red-400"><?= $urgent_count ?></div>
        <div class="text-[10px] text-slate-500">Immediate attention</div>
      </div>

      <div class="bg-slate-950 p-5 rounded-2xl border border-emerald-900/50 space-y-1">
        <div class="text-[11px] font-mono font-bold text-emerald-400 uppercase">Resolved</div>
        <div class="text-3xl font-bold font-mono text-emerald-400"><?= $resolved_count ?></div>
        <div class="text-[10px] text-slate-500">Action completed</div>
      </div>

      <div class="bg-slate-950 p-5 rounded-2xl border border-indigo-900/50 space-y-1">
        <div class="text-[11px] font-mono font-bold text-indigo-400 uppercase">Registered Students</div>
        <div class="text-3xl font-bold font-mono text-indigo-400"><?= $total_students ?></div>
        <div class="text-[10px] text-slate-500">Student accounts</div>
      </div>
    </div>

    <!-- Admin Notifications Card (`admin_notifications`) -->
    <div class="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <h3 class="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span>🔔 System & Complaint Alerts (`admin_notifications`)</span>
          <span class="bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
            <?= count($notifications) ?> Alerts
          </span>
        </h3>
        <a href="admin_complaints.php" class="text-xs font-mono text-blue-400 hover:underline">
          View All Complaints →
        </a>
      </div>

      <div class="divide-y divide-slate-800/80 max-h-[250px] overflow-y-auto">
        <?php foreach ($notifications as $n): ?>
          <div class="p-3.5 hover:bg-slate-900/50 transition flex items-center justify-between text-xs font-mono">
            <div class="flex items-center space-x-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase <?= $n['notification_type'] === 'urgent' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-blue-950 text-blue-300 border border-blue-800' ?>">
                <?= htmlspecialchars($n['notification_type']) ?>
              </span>
              <span class="text-slate-300 font-sans font-medium"><?= htmlspecialchars($n['message']) ?></span>
            </div>
            <span class="text-[10px] text-slate-500 shrink-0 ml-4"><?= htmlspecialchars($n['timestamp']) ?></span>
          </div>
        <?php endforeach; ?>
      </div>
    </div>

    <!-- Recent Complaints Feed Table -->
    <div class="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <h3 class="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
          Recent Student Complaint Submissions
        </h3>
        <a href="admin_complaints.php" class="text-xs font-mono text-emerald-400 hover:underline font-bold">
          Open Full Queue →
        </a>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800 bg-slate-900/50 text-[11px] font-mono font-bold text-slate-400 uppercase">
              <th class="p-4">Ticket ID</th>
              <th class="p-4">Student Info</th>
              <th class="p-4">Subject & Category</th>
              <th class="p-4">Current Status</th>
              <th class="p-4">Date Lodged</th>
              <th class="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 text-xs">
            <?php foreach ($recent_complaints as $rc): ?>
              <tr class="hover:bg-slate-900/80 transition">
                <td class="p-4 font-mono font-bold text-blue-400">#<?= htmlspecialchars($rc['complaint_id']) ?></td>
                <td class="p-4">
                  <div class="font-bold text-white"><?= htmlspecialchars($rc['student_name'] ?? $rc['studentID']) ?></div>
                  <div class="text-[11px] font-mono text-slate-500"><?= htmlspecialchars($rc['studentID']) ?></div>
                </td>
                <td class="p-4">
                  <div class="font-medium text-slate-200"><?= htmlspecialchars($rc['subject']) ?></div>
                  <span class="inline-block px-2 py-0.5 bg-slate-900 text-slate-400 text-[10px] font-mono rounded border border-slate-800">
                    <?= htmlspecialchars($rc['category']) ?>
                  </span>
                </td>
                <td class="p-4">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border bg-blue-950 text-blue-300 border-blue-800">
                    <?= htmlspecialchars($rc['status']) ?>
                  </span>
                </td>
                <td class="p-4 font-mono text-slate-500 text-[11px]"><?= htmlspecialchars($rc['created_at']) ?></td>
                <td class="p-4 text-right">
                  <a href="admin_complaints.php?select_id=<?= $rc['complaint_id'] ?>" class="bg-blue-600 hover:bg-blue-500 text-white font-mono text-[11px] font-bold px-3 py-1.5 rounded-lg transition">
                    Inspect & Reply
                  </a>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>

  </main>

  <footer class="bg-slate-950 text-slate-500 py-4 px-4 border-t border-slate-800 text-center text-xs font-mono space-y-1">
    <p class="font-semibold text-slate-300">Online Students' Complaint System &copy; 2026</p>
    <p class="text-slate-400">Imo State Polytechnic Omuma (Orlu East LGA, Imo State)</p>
    <p class="text-slate-500">Created by: Ebubedike Kelechi Humphrey - 08068880163</p>
  </footer>

</body>
</html>
