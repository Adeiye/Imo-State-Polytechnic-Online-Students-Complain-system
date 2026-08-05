<?php
/**
 * Online Students' Complaint System - Imo State Polytechnic, Omuma
 * Page: admin_complaints.php (Complaint Management, Filtering, Status Override & Manual Response)
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

$flash_msg = '';
$error_msg = '';

$selected_id = intval($_GET['select_id'] ?? ($_GET['updated_id'] ?? 0));

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Handle Staff Manual Response Submission
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_admin_response') {
        $complaint_id = intval($_POST['complaint_id']);
        $response_text = trim($_POST['response_text'] ?? '');
        $new_status    = trim($_POST['new_status'] ?? 'In Progress');

        if (!empty($response_text)) {
            // 1. Insert admin response
            $stmt_resp = $pdo->prepare("
                INSERT INTO responses (complaint_id, responder_type, response_text, created_at)
                VALUES (:cid, 'admin', :text, NOW())
            ");
            $stmt_resp->execute([':cid' => $complaint_id, ':text' => $response_text]);

            // 2. Update complaint status
            $stmt_upd = $pdo->prepare("UPDATE complaints SET status = :status WHERE complaint_id = :id");
            $stmt_upd->execute([':status' => $new_status, ':id' => $complaint_id]);

            // 3. Add to admin notifications log
            $stmt_notif = $pdo->prepare("
                INSERT INTO admin_notifications (complaint_id, notification_type, message, is_read, timestamp)
                VALUES (:cid, 'status_change', :msg, 1, NOW())
            ");
            $stmt_notif->execute([
                ':cid' => $complaint_id,
                ':msg' => "Admin replied to Complaint #{$complaint_id}. Status set to '{$new_status}'."
            ]);

            $flash_msg = "Manual staff response added and complaint status updated to '{$new_status}'.";
            $selected_id = $complaint_id;
        } else {
            $error_msg = "Please write a response message before submitting.";
        }
    }

    // Handle Direct Status Override
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'override_status') {
        $complaint_id = intval($_POST['complaint_id']);
        $override_status = trim($_POST['override_status'] ?? '');

        if (!empty($override_status)) {
            $stmt_upd = $pdo->prepare("UPDATE complaints SET status = :status WHERE complaint_id = :id");
            $stmt_upd->execute([':status' => $override_status, ':id' => $complaint_id]);

            $notif_type = (strtolower($override_status) === 'urgent') ? 'urgent' : 'status_change';
            $stmt_notif = $pdo->prepare("
                INSERT INTO admin_notifications (complaint_id, notification_type, message, is_read, timestamp)
                VALUES (:cid, :type, :msg, 1, NOW())
            ");
            $stmt_notif->execute([
                ':cid'  => $complaint_id,
                ':type' => $notif_type,
                ':msg'  => "Complaint #{$complaint_id} status manually overridden to '{$override_status}'"
            ]);

            $flash_msg = "Status for Complaint #{$complaint_id} updated to '{$override_status}'.";
            $selected_id = $complaint_id;
        }
    }

    // Read Filter Parameters
    $search_query      = trim($_GET['search'] ?? '');
    $filter_category   = trim($_GET['category'] ?? 'All');
    $filter_status     = trim($_GET['status'] ?? 'All');

    $sql = "
        SELECT c.*, u.full_name as student_name, u.email as student_email,
               (SELECT COUNT(*) FROM responses r WHERE r.complaint_id = c.complaint_id) as response_count
        FROM complaints c
        LEFT JOIN users u ON c.user_id = u.user_id
        WHERE 1=1
    ";
    $params = [];

    if (!empty($search_query)) {
        $sql .= " AND (c.studentID LIKE :search OR u.full_name LIKE :search OR c.subject LIKE :search OR c.complaint_id = :exact_id)";
        $params[':search']   = "%$search_query%";
        $params[':exact_id'] = intval($search_query);
    }

    if ($filter_category !== 'All' && !empty($filter_category)) {
        $sql .= " AND c.category = :category";
        $params[':category'] = $filter_category;
    }

    if ($filter_status !== 'All' && !empty($filter_status)) {
        $sql .= " AND c.status = :status";
        $params[':status'] = $filter_status;
    }

    $sql .= " ORDER BY c.created_at DESC";

    $stmt_list = $pdo->prepare($sql);
    $stmt_list->execute($params);
    $complaints = $stmt_list->fetchAll();

    // Fetch Details for Selected Ticket
    $selected_complaint = null;
    $selected_responses = [];

    if ($selected_id > 0) {
        $stmt_sel = $pdo->prepare("
            SELECT c.*, u.full_name as student_name, u.email as student_email 
            FROM complaints c 
            LEFT JOIN users u ON c.user_id = u.user_id 
            WHERE c.complaint_id = :id LIMIT 1
        ");
        $stmt_sel->execute([':id' => $selected_id]);
        $selected_complaint = $stmt_sel->fetch();

        if ($selected_complaint) {
            $stmt_r = $pdo->prepare("SELECT * FROM responses WHERE complaint_id = :id ORDER BY created_at ASC");
            $stmt_r->execute([':id' => $selected_id]);
            $selected_responses = $stmt_r->fetchAll();
        }
    }

} catch (PDOException $e) {
    // Fallback Mock Data
    $complaints = [
        [
            'complaint_id' => 1001,
            'studentID' => 'IMOPOLY/ND/2024/0142',
            'student_name' => 'Chidi Chukwuemeka',
            'subject' => 'Delayed First Semester Result Publication for Computer Science',
            'category' => 'Result Delay',
            'content' => 'My ND1 first semester exam results for HOD201 and COM112 have not been updated.',
            'status' => 'Auto-Responded',
            'response_count' => 1,
            'created_at' => '2026-07-20 10:15:00'
        ],
        [
            'complaint_id' => 1002,
            'studentID' => 'IMOPOLY/HND/2025/0891',
            'student_name' => 'Amaka Nwosu',
            'subject' => 'Borehole Water Outage at Hall A Female Hostel',
            'category' => 'Hostel Water',
            'content' => 'No water supply since Tuesday morning.',
            'status' => 'Urgent',
            'response_count' => 2,
            'created_at' => '2026-07-25 14:00:00'
        ]
    ];
}

$categories_list = [
    'Course Registration Problem',
    'Missing Result',
    'School Fees Payment Not Reflecting',
    'Portal Login Problem',
    'Wrong Course Allocation',
    'Timetable Clash',
    'Hostel Allocation Issue',
    'Library Access Problem',
    'Examination Card Issue',
    'Identity Card Delay',
    'General'
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complaint Queue - Imo State Polytechnic, Omuma</title>
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
          <p class="text-xs font-mono text-emerald-400">Admin Complaint Management Queue</p>
        </div>
      </div>

      <nav class="flex items-center space-x-1 sm:space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-mono font-bold">
        <a href="admin_dashboard.php" class="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition">
          📊 Dashboard
        </a>
        <a href="admin_complaints.php" class="px-3.5 py-2 rounded-xl bg-blue-600 text-white transition shadow-sm">
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

    <?php if ($flash_msg): ?>
      <div class="p-4 bg-emerald-950 border border-emerald-800 text-emerald-200 rounded-2xl text-xs font-medium shadow-md">
        ✅ <?= htmlspecialchars($flash_msg) ?>
      </div>
    <?php endif; ?>

    <?php if ($error_msg): ?>
      <div class="p-4 bg-red-950 border border-red-800 text-red-200 rounded-2xl text-xs font-medium shadow-md">
        ⚠️ <?= htmlspecialchars($error_msg) ?>
      </div>
    <?php endif; ?>

    <!-- Title & Filter Search Bar Header -->
    <div class="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 text-blue-300 text-xs font-mono font-bold border border-blue-800 mb-2 uppercase">
            INSTITUTIONAL TICKET DIRECTORY
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Complaint Queue & Resolution Overrides</h2>
          <p class="text-xs text-slate-400 mt-1">
            Search, filter, override system automated replies, and append manual staff resolutions.
          </p>
        </div>

        <div class="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-xl">
          Filtered Records: <strong><?= count($complaints) ?></strong>
        </div>
      </div>

      <!-- Filters & Search Form -->
      <form method="GET" action="admin_complaints.php" class="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
        <!-- Search Input -->
        <div class="sm:col-span-5">
          <input 
            type="text" 
            name="search" 
            value="<?= htmlspecialchars($search_query) ?>" 
            placeholder="Search by Matric Number, Name, Ticket ID..."
            class="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
        </div>

        <!-- Category Dropdown -->
        <div class="sm:col-span-3">
          <select 
            name="category" 
            onchange="this.form.submit()"
            class="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="All">Category: All</option>
            <?php foreach ($categories_list as $cat): ?>
              <option value="<?= htmlspecialchars($cat) ?>" <?= $filter_category === $cat ? 'selected' : '' ?>>
                <?= htmlspecialchars($cat) ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>

        <!-- Status Dropdown -->
        <div class="sm:col-span-2">
          <select 
            name="status" 
            onchange="this.form.submit()"
            class="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="All">Status: All</option>
            <option value="Pending" <?= $filter_status === 'Pending' ? 'selected' : '' ?>>Pending</option>
            <option value="Auto-Responded" <?= $filter_status === 'Auto-Responded' ? 'selected' : '' ?>>Auto-Responded</option>
            <option value="In Progress" <?= $filter_status === 'In Progress' ? 'selected' : '' ?>>In Progress</option>
            <option value="Resolved" <?= $filter_status === 'Resolved' ? 'selected' : '' ?>>Resolved</option>
            <option value="Urgent" <?= $filter_status === 'Urgent' ? 'selected' : '' ?>>Urgent</option>
          </select>
        </div>

        <!-- Submit Search Button -->
        <div class="sm:col-span-2">
          <button 
            type="submit" 
            class="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition shadow"
          >
            Filter Results
          </button>
        </div>
      </form>
    </div>

    <!-- Main Content Layout (Left: Table Queue | Right: Selected Inspection Panel) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Table Queue -->
      <div class="<?= $selected_complaint ? 'lg:col-span-6' : 'lg:col-span-12' ?>">
        <div class="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <h3 class="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Submitted Complaint Queue
            </h3>
            <span class="text-[10px] font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
              Click record to inspect & reply
            </span>
          </div>

          <div class="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
            <?php if (empty($complaints)): ?>
              <div class="p-8 text-center text-slate-500 font-mono text-xs">
                No complaints match the current search or filter criteria.
              </div>
            <?php else: ?>
              <?php foreach ($complaints as $c): ?>
                <?php $is_active = ($selected_complaint && $selected_complaint['complaint_id'] == $c['complaint_id']); ?>
                <div 
                  onclick="window.location.href='admin_complaints.php?select_id=<?= $c['complaint_id'] ?>&search=<?= urlencode($search_query) ?>&category=<?= urlencode($filter_category) ?>&status=<?= urlencode($filter_status) ?>'"
                  class="p-4 cursor-pointer transition flex items-start justify-between gap-3 <?= $is_active ? 'bg-blue-950 border-l-4 border-emerald-400' : 'hover:bg-slate-900' ?>"
                >
                  <div class="space-y-1">
                    <div class="flex items-center space-x-2">
                      <span class="font-mono font-bold text-xs text-blue-400">#<?= htmlspecialchars($c['complaint_id']) ?></span>
                      <span class="font-bold text-xs text-white"><?= htmlspecialchars($c['subject']) ?></span>
                    </div>

                    <div class="text-[11px] font-mono text-slate-400 flex flex-wrap items-center gap-2">
                      <span class="bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800 font-bold">
                        <?= htmlspecialchars($c['studentID']) ?>
                      </span>
                      <span><?= htmlspecialchars($c['student_name'] ?? 'Student') ?></span>
                    </div>

                    <div class="text-[10px] font-mono text-slate-500">
                      Category: <?= htmlspecialchars($c['category']) ?> | Lodged: <?= htmlspecialchars($c['created_at']) ?>
                    </div>
                  </div>

                  <div class="flex flex-col items-end space-y-1 shrink-0">
                    <?php
                      $st = strtolower($c['status']);
                      $badge = 'bg-blue-950 text-blue-300 border-blue-800';
                      if ($st === 'urgent') $badge = 'bg-red-950 text-red-300 border-red-800 font-bold';
                      elseif ($st === 'resolved') $badge = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                      elseif ($st === 'in progress') $badge = 'bg-amber-950 text-amber-300 border-amber-800';
                    ?>
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase <?= $badge ?>">
                      <?= htmlspecialchars($c['status']) ?>
                    </span>
                    <span class="text-[10px] font-mono text-slate-400">
                      💬 <?= $c['response_count'] ?? 1 ?> Msg
                    </span>
                  </div>
                </div>
              <?php endforeach; ?>
            <?php endif; ?>
          </div>
        </div>
      </div>

      <!-- Right Inspection & Response Panel -->
      <?php if ($selected_complaint): ?>
        <div class="lg:col-span-6 space-y-4">
          <div class="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl p-6 relative space-y-5">
            <a href="admin_complaints.php" class="absolute top-4 right-4 text-xs font-mono text-slate-400 hover:text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              ✕ Close
            </a>

            <!-- Header Info -->
            <div class="border-b border-slate-800 pb-4">
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-800 mb-2 uppercase">
                TICKET INSPECTION & RESPONSE
              </div>
              <h3 class="text-lg font-bold text-white">#<?= $selected_complaint['complaint_id'] ?> - <?= htmlspecialchars($selected_complaint['subject']) ?></h3>
              <p class="text-xs font-mono text-slate-400 mt-1">
                Student: <strong class="text-white"><?= htmlspecialchars($selected_complaint['student_name'] ?? $selected_complaint['studentID']) ?></strong> (<?= htmlspecialchars($selected_complaint['studentID']) ?>)
              </p>
            </div>

            <!-- Complaint Body -->
            <div class="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-200">
              <div class="font-mono font-bold text-blue-400 text-[10px] uppercase mb-1">Lodged Description:</div>
              <p class="whitespace-pre-wrap"><?= htmlspecialchars($selected_complaint['content'] ?: $selected_complaint['description']) ?></p>
            </div>

            <!-- Quick Status Override Form -->
            <form method="POST" action="admin_complaints.php" class="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
              <input type="hidden" name="action" value="override_status">
              <input type="hidden" name="complaint_id" value="<?= $selected_complaint['complaint_id'] ?>">
              
              <span class="text-xs font-mono font-bold text-slate-400 uppercase">Current Status:</span>
              <select name="override_status" class="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white">
                <option value="Pending" <?= $selected_complaint['status'] === 'Pending' ? 'selected' : '' ?>>Pending</option>
                <option value="Auto-Responded" <?= $selected_complaint['status'] === 'Auto-Responded' ? 'selected' : '' ?>>Auto-Responded</option>
                <option value="In Progress" <?= $selected_complaint['status'] === 'In Progress' ? 'selected' : '' ?>>In Progress</option>
                <option value="Urgent" <?= $selected_complaint['status'] === 'Urgent' ? 'selected' : '' ?>>Urgent</option>
                <option value="Resolved" <?= $selected_complaint['status'] === 'Resolved' ? 'selected' : '' ?>>Resolved</option>
              </select>

              <button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg transition">
                Update Status
              </button>
            </form>

            <!-- Thread Messages -->
            <div class="space-y-3">
              <div class="text-xs font-mono font-bold text-slate-400 uppercase">Thread Communication History:</div>
              <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                <?php foreach ($selected_responses as $resp): ?>
                  <?php $is_sys = strtolower($resp['responder_type']) === 'system'; ?>
                  <div class="p-3 rounded-xl text-xs border space-y-1 <?= $is_sys ? 'bg-slate-900 border-slate-800 text-emerald-300' : 'bg-blue-950 border-blue-900 text-slate-100' ?>">
                    <div class="flex items-center justify-between font-mono font-bold text-[10px]">
                      <span><?= $is_sys ? '🤖 SYSTEM AUTO-MATCHED' : (strtolower($resp['responder_type']) === 'admin' ? '🛡️ ADMIN STAFF' : '👤 STUDENT') ?></span>
                      <span class="opacity-70"><?= htmlspecialchars($resp['created_at']) ?></span>
                    </div>
                    <p class="whitespace-pre-wrap font-sans text-xs"><?= htmlspecialchars($resp['response_text']) ?></p>
                  </div>
                <?php endforeach; ?>
              </div>
            </div>

            <!-- Manual Staff Response Form -->
            <form method="POST" action="admin_complaints.php" class="space-y-3 pt-2 border-t border-slate-800">
              <input type="hidden" name="action" value="add_admin_response">
              <input type="hidden" name="complaint_id" value="<?= $selected_complaint['complaint_id'] ?>">

              <div class="flex items-center justify-between">
                <label class="block text-xs font-mono font-bold text-white uppercase">Add Manual Staff Reply</label>
                <div class="flex items-center space-x-2">
                  <span class="text-[10px] font-mono text-slate-400">Set Status To:</span>
                  <select name="new_status" class="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-emerald-400 font-bold">
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <textarea 
                name="response_text" 
                rows="3" 
                required
                placeholder="Type official administrative reply to student..."
                class="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-sans text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              ></textarea>

              <button 
                type="submit" 
                class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md"
              >
                Send Staff Reply & Update Thread
              </button>
            </form>

          </div>
        </div>
      <?php endif; ?>

    </div>

  </main>

  <footer class="bg-slate-950 text-slate-500 py-4 px-4 border-t border-slate-800 text-center text-xs font-mono space-y-1">
    <p class="font-semibold text-slate-300">Online Students' Complaint System &copy; 2026</p>
    <p class="text-slate-400">Imo State Polytechnic Omuma (Orlu East LGA, Imo State)</p>
    <p class="text-slate-500">Created by: Ebubedike Kelechi Humphrey - 08068880163</p>
  </footer>

</body>
</html>
