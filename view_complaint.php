<?php
/**
 * Online Students' Complaint System - Imo State Polytechnic, Omuma
 * Page: view_complaint.php (Thread View for Complaint, Auto-Response & Manual Follow-ups)
 */

session_start();

$user_id    = $_SESSION['user_id'] ?? 2;
$full_name  = $_SESSION['full_name'] ?? 'Chidi Chukwuemeka';
$reg_number = $_SESSION['reg_number'] ?? 'IMOPOLY/ND/2024/0142';

$complaint_id = intval($_GET['id'] ?? ($_GET['complaint_id'] ?? 1001));

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'imopoly_complaint_db';

$complaint = null;
$responses = [];
$error_msg = '';
$success_msg = '';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Handle student follow-up reply POST
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['followup_reply'])) {
        $reply_text = trim($_POST['reply_text'] ?? '');
        if (!empty($reply_text)) {
            $stmt_resp = $pdo->prepare("
                INSERT INTO responses (complaint_id, responder_type, response_text, created_at)
                VALUES (:cid, 'student', :text, NOW())
            ");
            $stmt_resp->execute([':cid' => $complaint_id, ':text' => $reply_text]);
            
            // Log notification for admin
            $pdo->query("
                INSERT INTO admin_notifications (complaint_id, notification_type, message, is_read, timestamp)
                VALUES ($complaint_id, 'status_change', 'Student posted follow-up reply on Ticket #$complaint_id', 0, NOW())
            ");

            $success_msg = "Your follow-up reply has been added to the complaint thread.";
        }
    }

    // Fetch complaint record
    $stmt = $pdo->prepare("SELECT * FROM complaints WHERE complaint_id = :id LIMIT 1");
    $stmt->execute([':id' => $complaint_id]);
    $complaint = $stmt->fetch();

    if ($complaint) {
        // Fetch thread responses
        $stmt_r = $pdo->prepare("SELECT * FROM responses WHERE complaint_id = :id ORDER BY created_at ASC");
        $stmt_r->execute([':id' => $complaint_id]);
        $responses = $stmt_r->fetchAll();
    }
} catch (PDOException $e) {
    // Fallback Mock Data if database connection is unavailable
    $complaint = [
        'complaint_id' => $complaint_id,
        'user_id' => 2,
        'studentID' => 'IMOPOLY/ND/2024/0142',
        'subject' => 'Delayed First Semester Result Publication for Computer Science',
        'category' => 'Result Delay',
        'content' => 'My ND1 first semester exam results for HOD201 and COM112 have not been updated on my student portal despite completing clearances.',
        'description' => 'My ND1 first semester exam results for HOD201 and COM112 have not been updated on my student portal despite completing clearances.',
        'status' => 'Auto-Responded',
        'created_at' => '2026-07-20 10:15:00'
    ];
    $responses = [
        [
            'response_id' => 1,
            'complaint_id' => $complaint_id,
            'responder_type' => 'system',
            'response_text' => "AUTOMATED SYSTEM ACKNOWLEDGMENT: Your complaint regarding 'Result Delay' has been evaluated by the Imo Poly automated evaluation engine. Semester exam results are processed sequentially by the Academic Board. Please verify with your HOD office that your course registration form was uploaded.",
            'created_at' => '2026-07-20 10:15:02'
        ]
    ];
}

if (!$complaint) {
    die("Complaint Record #$complaint_id Not Found.");
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thread View #<?= $complaint_id ?> - Imo State Polytechnic, Omuma</title>
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

  <!-- Header Banner -->
  <header class="bg-blue-900 text-white border-b border-blue-950 shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-sm border border-slate-200 overflow-hidden">
          <img src="https://res.cloudinary.com/n4kwtphh/image/upload/v1785941933/photo_2026-07-28_22-46-21_vuamoj.jpg" onerror="this.src='/logo.png'" alt="Imo State Polytechnic Logo" class="w-full h-full object-contain" />
        </div>
        <div>
          <h1 class="text-base font-bold tracking-tight uppercase">Imo State Polytechnic, Omuma</h1>
          <p class="text-xs font-mono text-emerald-300">Complaint Thread & History</p>
        </div>
      </div>

      <a href="student_dashboard.php" class="text-xs font-mono text-white bg-blue-950 hover:bg-blue-800 px-3.5 py-2 rounded-xl border border-blue-800 transition">
        ← Back to Dashboard
      </a>
    </div>
  </header>

  <!-- Content Container -->
  <main class="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-6">

    <?php if ($success_msg): ?>
      <div class="p-4 bg-emerald-900 text-white rounded-2xl border border-emerald-700 shadow-md">
        ✅ <?= htmlspecialchars($success_msg) ?>
      </div>
    <?php endif; ?>

    <!-- Ticket Summary Card Header -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div class="flex items-center space-x-2">
          <span class="font-mono font-bold text-xs text-blue-800 bg-blue-100 px-2.5 py-1 rounded-md border border-blue-300">
            Ticket #<?= htmlspecialchars($complaint['complaint_id']) ?>
          </span>
          <span class="text-xs font-mono font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
            <?= htmlspecialchars($complaint['category']) ?>
          </span>
        </div>

        <div>
          <?php
            $status_badge = 'bg-slate-100 text-slate-700 border-slate-300';
            $st = strtolower($complaint['status']);
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
          <span class="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold border <?= $status_badge ?>">
            Status: <?= htmlspecialchars($complaint['status']) ?>
          </span>
        </div>
      </div>

      <h2 class="text-xl font-bold text-slate-900"><?= htmlspecialchars($complaint['subject']) ?></h2>

      <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
        <div class="font-mono font-bold text-slate-400 text-[10px] uppercase mb-1">Original Lodged Description:</div>
        <p><?= htmlspecialchars($complaint['content'] ?: $complaint['description']) ?></p>
      </div>

      <div class="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
        <span>Lodged by: <strong><?= htmlspecialchars($complaint['studentID']) ?></strong></span>
        <span>Date: <?= htmlspecialchars($complaint['created_at']) ?></span>
      </div>
    </div>

    <!-- Response History Thread Timeline -->
    <div class="space-y-4">
      <h3 class="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
        <span>Thread Communication History</span>
        <span class="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px]"><?= count($responses) ?> Messages</span>
      </h3>

      <?php foreach ($responses as $resp): ?>
        <?php 
          $is_system = strtolower($resp['responder_type']) === 'system';
          $is_admin  = strtolower($resp['responder_type']) === 'admin';
        ?>
        <div class="p-5 rounded-2xl border shadow-sm space-y-2 <?= 
          $is_system 
            ? 'bg-slate-950 text-emerald-300 border-slate-800' 
            : ($is_admin ? 'bg-blue-950 text-blue-100 border-blue-900' : 'bg-white text-slate-900 border-slate-200') 
        ?>">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <div class="flex items-center space-x-2 font-mono font-bold text-xs">
              <?php if ($is_system): ?>
                <span class="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 text-[10px]">🤖 SYSTEM AUTO-MATCHED REPLY</span>
              <?php elseif ($is_admin): ?>
                <span class="px-2 py-0.5 rounded bg-blue-800 text-blue-200 text-[10px]">🛡️ ADMINISTRATIVE FOLLOW-UP</span>
              <?php else: ?>
                <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px]">👤 STUDENT FOLLOW-UP</span>
              <?php endif; ?>
            </div>
            <span class="text-[10px] font-mono opacity-70"><?= htmlspecialchars($resp['created_at']) ?></span>
          </div>

          <p class="text-xs leading-relaxed whitespace-pre-wrap pt-1">
            <?= htmlspecialchars($resp['response_text']) ?>
          </p>
        </div>
      <?php endforeach; ?>
    </div>

    <!-- Student Follow-up Reply Box -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
      <h4 class="text-xs font-mono font-bold text-slate-900 uppercase">Post Additional Reply or Clarification</h4>
      <form method="POST" action="view_complaint.php?id=<?= $complaint_id ?>" class="space-y-3">
        <textarea 
          name="reply_text" 
          rows="3" 
          required
          placeholder="Type your follow-up response or additional details here..."
          class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
        ></textarea>
        <div class="flex justify-end">
          <button 
            type="submit" 
            name="followup_reply"
            class="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition"
          >
            Submit Reply
          </button>
        </div>
      </form>
    </div>

  </main>

  <footer class="bg-slate-900 text-slate-400 py-4 px-4 border-t border-slate-800 text-center text-xs font-mono space-y-1">
    <p class="font-semibold text-slate-300">Online Students' Complaint System &copy; 2026</p>
    <p class="text-slate-400">Imo State Polytechnic Omuma (Orlu East LGA, Imo State)</p>
    <p class="text-slate-500">Created by: Ebubedike Kelechi Humphrey - 08068880163</p>
  </footer>

</body>
</html>
