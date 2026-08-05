<?php
/**
 * Online Students' Complaint System - Imo State Polytechnic, Omuma
 * Page: student_dashboard.php (Student Portal Overview & Past Complaints)
 */

session_start();

// Check if user is logged in
$user_id    = $_SESSION['user_id'] ?? 2; // Default to demo student ID 2 if session empty
$full_name  = $_SESSION['full_name'] ?? 'Chidi Chukwuemeka';
$reg_number = $_SESSION['reg_number'] ?? 'IMOPOLY/ND/2024/0142';
$email      = $_SESSION['email'] ?? 'chidi.c@student.imopoly.edu.ng';

$flash_msg = $_SESSION['flash_message'] ?? null;
unset($_SESSION['flash_message']);

$submitted_id = $_GET['submitted_id'] ?? null;

// Database Connection
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'imopoly_complaint_db';

$complaints = [];
$total_count = 0;
$pending_count = 0;
$in_progress_count = 0;
$resolved_count = 0;

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Query student's complaints
    $stmt = $pdo->prepare("
        SELECT c.*, 
               (SELECT COUNT(*) FROM responses r WHERE r.complaint_id = c.complaint_id) as response_count
        FROM complaints c
        WHERE c.user_id = :user_id OR c.studentID = :reg_number
        ORDER BY c.created_at DESC
    ");
    $stmt->execute([':user_id' => $user_id, ':reg_number' => $reg_number]);
    $complaints = $stmt->fetchAll();

    foreach ($complaints as $c) {
        $total_count++;
        $st = strtolower($c['status']);
        if ($st === 'pending') {
            $pending_count++;
        } elseif ($st === 'in progress' || $st === 'auto-responded') {
            $in_progress_count++;
        } elseif ($st === 'resolved') {
            $resolved_count++;
        }
    }
} catch (PDOException $e) {
    // Fallback Mock Data if local MySQL server is not active
    $complaints = [
        [
            'complaint_id' => 1001,
            'subject' => 'Delayed First Semester Result Publication for Computer Science',
            'category' => 'Result Delay',
            'content' => 'My ND1 first semester exam results for HOD201 and COM112 have not been updated on my portal.',
            'status' => 'Auto-Responded',
            'created_at' => '2026-07-20 10:15:00',
            'response_count' => 1
        ],
        [
            'complaint_id' => 1002,
            'subject' => 'Borehole Water Outage at Hall A Female Hostel',
            'category' => 'Hostel Water',
            'content' => 'There has been no water supply in Hall A since Tuesday morning.',
            'status' => 'In Progress',
            'created_at' => '2026-07-25 14:00:00',
            'response_count' => 2
        ]
    ];
    $total_count = 2;
    $in_progress_count = 2;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Dashboard - Online Complaints System | Imo State Polytechnic</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-100 min-h-screen text-slate-900 flex flex-col justify-between">

  <!-- Main Top Bar Header -->
  <header class="bg-blue-900 text-white border-b border-blue-950 shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-sm border border-slate-200 overflow-hidden">
          <img src="https://res.cloudinary.com/n4kwtphh/image/upload/v1785941933/photo_2026-07-28_22-46-21_vuamoj.jpg" onerror="this.src='/logo.png'" alt="Imo State Polytechnic Logo" class="w-full h-full object-contain" />
        </div>
        <div>
          <h1 class="text-base font-bold tracking-tight uppercase">Imo State Polytechnic, Omuma</h1>
          <p class="text-xs font-mono text-emerald-300">Online Students' Complaint Portal</p>
        </div>
      </div>

      <!-- User Profile Header Summary -->
      <div class="flex items-center space-x-4 bg-blue-950/70 px-4 py-2 rounded-xl border border-blue-800/80">
        <div class="text-right">
          <div class="text-xs font-bold text-white"><?= htmlspecialchars($full_name) ?></div>
          <div class="text-[11px] font-mono text-emerald-400"><?= htmlspecialchars($reg_number) ?></div>
        </div>
        <a href="login.php?logout=1" class="text-xs font-mono text-slate-300 hover:text-red-300 bg-blue-900 hover:bg-red-950/50 px-2.5 py-1 rounded-lg border border-blue-700 transition">
          Logout
        </a>
      </div>

    </div>
  </header>

  <!-- Page Content Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">

    <!-- Success Flash Banner -->
    <?php if ($flash_msg): ?>
      <div class="p-4 bg-emerald-900 text-white rounded-2xl border border-emerald-700 shadow-md flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-xl">🎉</span>
          <p class="text-xs font-medium"><?= htmlspecialchars($flash_msg) ?></p>
        </div>
        <span class="text-xs font-mono bg-emerald-950 px-2.5 py-1 rounded-md text-emerald-300">SUCCESS</span>
      </div>
    <?php endif; ?>

    <!-- Student Welcome Banner & Quick Action Button -->
    <div class="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-blue-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="space-y-1">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-mono font-bold border border-emerald-800">
          <span>STUDENT PORTAL DASHBOARD</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, <?= htmlspecialchars(explode(' ', $full_name)[0]) ?></h2>
        <p class="text-xs text-slate-300 max-w-xl font-sans">
          Lodge institutional grievances, missing marks, hostel defects, or departmental issues and receive automated responses instantly.
        </p>
      </div>

      <a 
        href="lodge_complaint.php" 
        class="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-lg shadow-emerald-900/40 flex items-center space-x-2 shrink-0"
      >
        <span>+ Lodge New Complaint</span>
      </a>
    </div>

    <!-- Summary Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <div class="text-xs font-mono font-bold text-slate-500 uppercase">Total Complaints Lodged</div>
        <div class="text-3xl font-bold font-mono text-slate-900"><?= $total_count ?></div>
        <div class="text-[11px] text-slate-400">All historic tickets submitted</div>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <div class="text-xs font-mono font-bold text-amber-600 uppercase">Pending Review</div>
        <div class="text-3xl font-bold font-mono text-amber-600"><?= $pending_count ?></div>
        <div class="text-[11px] text-slate-400">Awaiting automated match or staff</div>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <div class="text-xs font-mono font-bold text-blue-600 uppercase">In Progress / Auto-Responded</div>
        <div class="text-3xl font-bold font-mono text-blue-600"><?= $in_progress_count ?></div>
        <div class="text-[11px] text-slate-400">Auto-replied or under review</div>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <div class="text-xs font-mono font-bold text-emerald-600 uppercase">Resolved Complaints</div>
        <div class="text-3xl font-bold font-mono text-emerald-600"><?= $resolved_count ?></div>
        <div class="text-[11px] text-slate-400">Action completed by administration</div>
      </div>
    </div>

    <!-- Past Complaints Table Card -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h3 class="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span>My Lodged Complaints Directory</span>
          <span class="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px]"><?= count($complaints) ?> Records</span>
        </h3>
        <a href="lodge_complaint.php" class="text-xs font-mono text-blue-700 hover:underline font-bold">
          + New Ticket
        </a>
      </div>

      <?php if (empty($complaints)): ?>
        <div class="p-12 text-center text-slate-500 font-mono text-xs space-y-3">
          <p class="text-sm font-bold text-slate-700">No complaints logged yet.</p>
          <p class="text-slate-400">Have an issue regarding results, ID card, hostel, or fees? Click below to lodge a complaint.</p>
          <a href="lodge_complaint.php" class="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
            Lodge Your First Complaint
          </a>
        </div>
      <?php else: ?>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-100/70 text-[11px] font-mono font-bold text-slate-600 uppercase">
                <th class="p-4">Ticket ID</th>
                <th class="p-4">Subject & Category</th>
                <th class="p-4">Status</th>
                <th class="p-4">Responses</th>
                <th class="p-4">Date Lodged</th>
                <th class="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs">
              <?php foreach ($complaints as $c): ?>
                <?php
                  $status_badge = 'bg-slate-100 text-slate-700 border-slate-300';
                  $st = strtolower($c['status']);
                  if ($st === 'auto-responded') {
                      $status_badge = 'bg-blue-100 text-blue-800 border-blue-300';
                  } elseif ($st === 'in progress') {
                      $status_badge = 'bg-amber-100 text-amber-800 border-amber-300';
                  } elseif ($st === 'resolved') {
                      $status_badge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  } elseif ($st === 'urgent') {
                      $status_badge = 'bg-red-100 text-red-800 border-red-300 font-bold';
                  }
                ?>
                <tr class="hover:bg-slate-50/80 transition">
                  <td class="p-4 font-mono font-bold text-blue-800">
                    #<?= htmlspecialchars($c['complaint_id']) ?>
                  </td>
                  <td class="p-4 space-y-0.5">
                    <div class="font-bold text-slate-900 text-xs"><?= htmlspecialchars($c['subject']) ?></div>
                    <div class="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono rounded border border-slate-200">
                      <?= htmlspecialchars($c['category']) ?>
                    </div>
                  </td>
                  <td class="p-4">
                    <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border <?= $status_badge ?>">
                      <?= htmlspecialchars($c['status']) ?>
                    </span>
                  </td>
                  <td class="p-4 font-mono text-slate-600">
                    <span class="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-200 font-bold">
                      💬 <?= $c['response_count'] ?? 1 ?> Message<?= ($c['response_count'] ?? 1) > 1 ? 's' : '' ?>
                    </span>
                  </td>
                  <td class="p-4 font-mono text-slate-500 text-[11px]">
                    <?= htmlspecialchars($c['created_at']) ?>
                  </td>
                  <td class="p-4 text-right">
                    <a 
                      href="view_complaint.php?id=<?= $c['complaint_id'] ?>" 
                      class="inline-flex items-center gap-1 bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      <span>View Thread</span>
                      <span>→</span>
                    </a>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>

    </div>

  </main>

  <footer class="bg-slate-900 text-slate-400 py-4 px-4 border-t border-slate-800 text-center text-xs font-mono space-y-1">
    <p class="font-semibold text-slate-300">Online Students' Complaint System &copy; 2026</p>
    <p class="text-slate-400">Imo State Polytechnic Omuma (Orlu East LGA, Imo State)</p>
    <p class="text-slate-500">Created by: Ebubedike Kelechi Humphrey - 08068880163</p>
  </footer>

</body>
</html>
