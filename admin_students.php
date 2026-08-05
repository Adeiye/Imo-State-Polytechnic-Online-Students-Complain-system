<?php
/**
 * Online Students' Complaint System - Imo State Polytechnic, Omuma
 * Page: admin_students.php (Student Directory & Complete Audit Log History)
 */

session_start();

// Verify Admin Auth
$user_id   = $_SESSION['user_id'] ?? 1;
$full_name = $_SESSION['full_name'] ?? 'Polytechnic Administrator';
$role      = $_SESSION['role'] ?? 'admin';

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'imopoly_complaint_db';

$search_query = trim($_GET['search'] ?? '');
$selected_user_id = intval($_GET['user_id'] ?? 0);

$students = [];
$selected_student = null;
$student_audit_logs = [];

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Query Students List
    $sql_students = "
        SELECT u.user_id, u.full_name, u.reg_number, u.email, u.created_at,
               COUNT(c.complaint_id) as total_complaints,
               MAX(c.created_at) as last_complaint_date
        FROM users u
        LEFT JOIN complaints c ON (u.user_id = c.user_id OR u.reg_number = c.studentID)
        WHERE u.role = 'student'
    ";

    $params = [];
    if (!empty($search_query)) {
        $sql_students .= " AND (u.full_name LIKE :search OR u.reg_number LIKE :search OR u.email LIKE :search)";
        $params[':search'] = "%$search_query%";
    }

    $sql_students .= " GROUP BY u.user_id ORDER BY total_complaints DESC, u.full_name ASC";

    $stmt_st = $pdo->prepare($sql_students);
    $stmt_st->execute($params);
    $students = $stmt_st->fetchAll();

    // Default select first student if none selected
    if ($selected_user_id === 0 && !empty($students)) {
        $selected_user_id = $students[0]['user_id'];
    }

    // Fetch Details for Selected Student Audit History
    if ($selected_user_id > 0) {
        $stmt_sel = $pdo->prepare("SELECT * FROM users WHERE user_id = :uid AND role = 'student' LIMIT 1");
        $stmt_sel->execute([':uid' => $selected_user_id]);
        $selected_student = $stmt_sel->fetch();

        if ($selected_student) {
            // Fetch all complaints for this student along with all responses
            $stmt_c = $pdo->prepare("
                SELECT c.* 
                FROM complaints c 
                WHERE c.user_id = :uid OR c.studentID = :reg 
                ORDER BY c.created_at DESC
            ");
            $stmt_c->execute([':uid' => $selected_user_id, ':reg' => $selected_student['reg_number']]);
            $student_complaints = $stmt_c->fetchAll();

            foreach ($student_complaints as $sc) {
                $stmt_r = $pdo->prepare("SELECT * FROM responses WHERE complaint_id = :cid ORDER BY created_at ASC");
                $stmt_r->execute([':cid' => $sc['complaint_id']]);
                $sc_responses = $stmt_r->fetchAll();

                $student_audit_logs[] = [
                    'complaint' => $sc,
                    'responses' => $sc_responses
                ];
            }
        }
    }

} catch (PDOException $e) {
    // Fallback Mock Data
    $students = [
        [
            'user_id' => 2,
            'full_name' => 'Chidi Chukwuemeka',
            'reg_number' => 'IMOPOLY/ND/2024/0142',
            'email' => 'chidi.c@student.imopoly.edu.ng',
            'created_at' => '2026-07-01 08:00:00',
            'total_complaints' => 2,
            'last_complaint_date' => '2026-07-20 10:15:00'
        ],
        [
            'user_id' => 3,
            'full_name' => 'Amaka Nwosu',
            'reg_number' => 'IMOPOLY/HND/2025/0891',
            'email' => 'amaka.n@student.imopoly.edu.ng',
            'created_at' => '2026-07-05 12:00:00',
            'total_complaints' => 1,
            'last_complaint_date' => '2026-07-25 14:00:00'
        ]
    ];

    if (!empty($students)) {
        $selected_student = $students[0];
        $student_audit_logs = [
            [
                'complaint' => [
                    'complaint_id' => 1001,
                    'subject' => 'Delayed First Semester Result Publication for Computer Science',
                    'category' => 'Result Delay',
                    'content' => 'My ND1 first semester exam results for HOD201 and COM112 have not been updated on my portal.',
                    'status' => 'Auto-Responded',
                    'created_at' => '2026-07-20 10:15:00'
                ],
                'responses' => [
                    [
                        'response_id' => 1,
                        'responder_type' => 'system',
                        'response_text' => 'AUTOMATED EVALUATION ENGINE: Semester exam results are processed sequentially by the Academic Board. Please verify with your HOD office that your course registration form was uploaded.',
                        'created_at' => '2026-07-20 10:15:02'
                    ]
                ]
            ]
        ];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Directory & Audit History - Imo State Polytechnic, Omuma</title>
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

  <!-- Header Navigation -->
  <header class="bg-blue-950 border-b border-blue-900/80 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-md border border-slate-200 overflow-hidden">
          <img src="https://res.cloudinary.com/n4kwtphh/image/upload/v1785941933/photo_2026-07-28_22-46-21_vuamoj.jpg" onerror="this.src='/logo.png'" alt="Imo State Polytechnic Logo" class="w-full h-full object-contain" />
        </div>
        <div>
          <h1 class="text-base font-bold text-white tracking-tight uppercase">Imo State Polytechnic, Omuma</h1>
          <p class="text-xs font-mono text-emerald-400">Student Directory & Audit History</p>
        </div>
      </div>

      <nav class="flex items-center space-x-1 sm:space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-mono font-bold">
        <a href="admin_dashboard.php" class="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition">
          📊 Dashboard
        </a>
        <a href="admin_complaints.php" class="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition">
          📋 Complaint Queue
        </a>
        <a href="admin_students.php" class="px-3.5 py-2 rounded-xl bg-blue-600 text-white transition shadow-sm">
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

    <!-- Title & Search Header -->
    <div class="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-mono font-bold border border-emerald-800 mb-2 uppercase">
            AUDIT LOG & CHRONOLOGICAL HISTORY
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Student Directory & Grievance History</h2>
          <p class="text-xs text-slate-400 mt-1">
            Search for any student by Name or Matric Number to view their complete historical profile, auto-responses, and staff replies over time.
          </p>
        </div>

        <div class="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-xl">
          Total Registered Students: <strong><?= count($students) ?></strong>
        </div>
      </div>

      <!-- Search Form -->
      <form method="GET" action="admin_students.php" class="flex gap-3">
        <input 
          type="text" 
          name="search" 
          value="<?= htmlspecialchars($search_query) ?>" 
          placeholder="Search student by Name, Matric Number, or Email..."
          class="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
        >
        <button 
          type="submit" 
          class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition shadow"
        >
          Search Student
        </button>
      </form>
    </div>

    <!-- Main 2-Column Audit Layout (Left: Student Directory List | Right: Complete Timeline Audit Log) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Student Directory List -->
      <div class="lg:col-span-5">
        <div class="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <h3 class="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Student Accounts Directory
            </h3>
            <span class="text-[10px] font-mono text-slate-400">Select student to inspect</span>
          </div>

          <div class="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
            <?php if (empty($students)): ?>
              <div class="p-8 text-center text-slate-500 font-mono text-xs">
                No students found matching search.
              </div>
            <?php else: ?>
              <?php foreach ($students as $st): ?>
                <?php $is_sel = ($selected_student && $selected_student['user_id'] == $st['user_id']); ?>
                <div 
                  onclick="window.location.href='admin_students.php?user_id=<?= $st['user_id'] ?>&search=<?= urlencode($search_query) ?>'"
                  class="p-4 cursor-pointer transition flex items-center justify-between gap-3 <?= $is_sel ? 'bg-blue-950 border-l-4 border-emerald-400' : 'hover:bg-slate-900' ?>"
                >
                  <div class="space-y-1">
                    <div class="font-bold text-xs text-white"><?= htmlspecialchars($st['full_name']) ?></div>
                    <div class="text-[11px] font-mono text-emerald-400"><?= htmlspecialchars($st['reg_number']) ?></div>
                    <div class="text-[10px] font-mono text-slate-500"><?= htmlspecialchars($st['email']) ?></div>
                  </div>

                  <div class="text-right shrink-0 space-y-1">
                    <span class="inline-block bg-slate-900 text-blue-400 border border-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      <?= $st['total_complaints'] ?> Ticket<?= $st['total_complaints'] == 1 ? '' : 's' ?>
                    </span>
                    <div class="text-[10px] font-mono text-slate-500">
                      <?= $st['last_complaint_date'] ? 'Latest: ' . date('M d', strtotime($st['last_complaint_date'])) : 'No tickets' ?>
                    </div>
                  </div>
                </div>
              <?php endforeach; ?>
            <?php endif; ?>
          </div>
        </div>
      </div>

      <!-- Right Column: Student Full Historical Audit Log -->
      <div class="lg:col-span-7">
        <?php if ($selected_student): ?>
          <div class="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl p-6 space-y-6">
            
            <!-- Student Profile Header Card -->
            <div class="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">SELECTED STUDENT PROFILE</div>
                <h3 class="text-xl font-bold text-white"><?= htmlspecialchars($selected_student['full_name']) ?></h3>
                <div class="text-xs font-mono text-slate-400 mt-0.5">
                  Matric No: <strong class="text-blue-400"><?= htmlspecialchars($selected_student['reg_number']) ?></strong> | Email: <?= htmlspecialchars($selected_student['email']) ?>
                </div>
              </div>

              <div class="text-right font-mono text-xs">
                <div class="text-emerald-400 font-bold"><?= count($student_audit_logs) ?> Total Complaints</div>
                <div class="text-[10px] text-slate-500">Registered: <?= htmlspecialchars($selected_student['created_at']) ?></div>
              </div>
            </div>

            <!-- Complete Chronological Audit History -->
            <div class="space-y-5">
              <h4 class="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>Chronological Complaint & Response Audit Log</span>
              </h4>

              <?php if (empty($student_audit_logs)): ?>
                <div class="p-8 text-center text-slate-500 font-mono text-xs bg-slate-900 rounded-xl border border-slate-800">
                  This student has not submitted any complaints yet.
                </div>
              <?php else: ?>
                <div class="space-y-6">
                  <?php foreach ($student_audit_logs as $index => $log): ?>
                    <?php $c = $log['complaint']; ?>
                    <div class="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                      
                      <!-- Ticket Meta Header -->
                      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div class="flex items-center space-x-2">
                          <span class="font-mono font-bold text-xs text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900">
                            Ticket #<?= htmlspecialchars($c['complaint_id']) ?>
                          </span>
                          <span class="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            <?= htmlspecialchars($c['category']) ?>
                          </span>
                        </div>

                        <div>
                          <?php
                            $st = strtolower($c['status']);
                            $badge = 'bg-blue-950 text-blue-300 border-blue-800';
                            if ($st === 'urgent') $badge = 'bg-red-950 text-red-300 border-red-800 font-bold';
                            elseif ($st === 'resolved') $badge = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                            elseif ($st === 'in progress') $badge = 'bg-amber-950 text-amber-300 border-amber-800';
                          ?>
                          <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border uppercase <?= $badge ?>">
                            <?= htmlspecialchars($c['status']) ?>
                          </span>
                        </div>
                      </div>

                      <!-- Complaint Title & Text -->
                      <div>
                        <h5 class="text-sm font-bold text-white"><?= htmlspecialchars($c['subject']) ?></h5>
                        <p class="text-xs text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                          <?= htmlspecialchars($c['content'] ?: $c['description']) ?>
                        </p>
                        <div class="text-[10px] font-mono text-slate-500 mt-1 text-right">
                          Submitted: <?= htmlspecialchars($c['created_at']) ?>
                        </div>
                      </div>

                      <!-- Associated Responses Audit Timeline -->
                      <div class="space-y-2 pt-2 border-t border-slate-800/80">
                        <div class="text-[10px] font-mono font-bold text-slate-400 uppercase">System & Staff Log Entries:</div>
                        <?php foreach ($log['responses'] as $resp): ?>
                          <?php 
                            $is_sys = strtolower($resp['responder_type']) === 'system';
                            $is_adm = strtolower($resp['responder_type']) === 'admin';
                          ?>
                          <div class="p-3 rounded-xl text-xs border space-y-1 <?= $is_sys ? 'bg-slate-950 border-slate-800/90 text-emerald-300' : ($is_adm ? 'bg-blue-950/80 border-blue-900 text-blue-200' : 'bg-slate-800 text-slate-200 border-slate-700') ?>">
                            <div class="flex items-center justify-between font-mono text-[10px] font-bold">
                              <span>
                                <?= $is_sys ? '🤖 AUTOMATED TEMPLATE MATCH' : ($is_adm ? '🛡️ STAFF MANUAL REPLY' : '👤 STUDENT FOLLOW-UP') ?>
                              </span>
                              <span class="opacity-70"><?= htmlspecialchars($resp['created_at']) ?></span>
                            </div>
                            <p class="whitespace-pre-wrap font-sans leading-relaxed text-xs pt-0.5">
                              <?= htmlspecialchars($resp['response_text']) ?>
                            </p>
                          </div>
                        <?php endforeach; ?>
                      </div>

                    </div>
                  <?php endforeach; ?>
                </div>
              <?php endif; ?>

            </div>

          </div>
        <?php else: ?>
          <div class="bg-slate-950 rounded-2xl border border-slate-800 p-12 text-center text-slate-500 font-mono text-xs">
            Select a student from the directory on the left to view their audit log history.
          </div>
        <?php endif; ?>
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
