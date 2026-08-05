<?php
/**
 * Online Students' Complaint System - Imo State Polytechnic, Omuma
 * Page: lodge_complaint.php (Submit New Complaint Form)
 */

session_start();

$user_id    = $_SESSION['user_id'] ?? 2;
$full_name  = $_SESSION['full_name'] ?? 'Chidi Chukwuemeka';
$reg_number = $_SESSION['reg_number'] ?? 'IMOPOLY/ND/2024/0142';
$email      = $_SESSION['email'] ?? 'chidi.c@student.imopoly.edu.ng';

$error_msg = $_SESSION['error'] ?? null;
unset($_SESSION['error']);

// Categories matching the 10 common student complaints + Others
$categories = [
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
    'Others'
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lodge Complaint - Online Students' System | Imo State Polytechnic</title>
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

      <div class="flex items-center space-x-3">
        <a href="student_dashboard.php" class="text-xs font-mono text-white bg-blue-950 hover:bg-blue-800 px-3.5 py-2 rounded-xl border border-blue-800 transition">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content Form -->
  <main class="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-6">

    <!-- Title Banner -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-mono font-bold border border-blue-200 mb-2">
          <span>LODGE OFFICIAL COMPLAINT</span>
        </div>
        <h2 class="text-2xl font-bold text-slate-900">Submit Grievance or Inquiry</h2>
        <p class="text-xs text-slate-500 mt-1">
          Provide complete details below. Our intelligent engine will automatically evaluate your text against institutional resolution templates.
        </p>
      </div>

      <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 text-xs font-mono shrink-0">
        <div class="font-bold">⚡ Instant Auto-Reply Engine</div>
        <div class="text-[11px] text-emerald-700">Keywords matched automatically</div>
      </div>
    </div>

    <!-- Complaint Form Card -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">

      <?php if ($error_msg): ?>
        <div class="p-4 mb-6 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium">
          ⚠️ <?= htmlspecialchars($error_msg) ?>
        </div>
      <?php endif; ?>

      <form method="POST" action="process_complaint.php" class="space-y-6">

        <!-- Hidden User Info -->
        <input type="hidden" name="user_id" value="<?= htmlspecialchars($user_id) ?>">
        <input type="hidden" name="studentID" value="<?= htmlspecialchars($reg_number) ?>">

        <!-- Student Read-Only Info Box -->
        <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-slate-500 font-mono font-bold block uppercase text-[10px]">Student Name:</span>
            <span class="font-bold text-slate-900 text-sm"><?= htmlspecialchars($full_name) ?></span>
          </div>
          <div>
            <span class="text-slate-500 font-mono font-bold block uppercase text-[10px]">Matriculation Number:</span>
            <span class="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"><?= htmlspecialchars($reg_number) ?></span>
          </div>
        </div>

        <!-- Complaint Category -->
        <div>
          <label class="block text-xs font-mono font-bold text-slate-800 uppercase tracking-wider mb-2">
            Complaint Category <span class="text-red-500">*</span>
          </label>
          <select 
            name="category" 
            required
            class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          >
            <option value="" disabled selected>Select issue category...</option>
            <?php foreach ($categories as $cat): ?>
              <option value="<?= htmlspecialchars($cat) ?>"><?= htmlspecialchars($cat) ?></option>
            <?php endforeach; ?>
          </select>
          <p class="text-[11px] text-slate-500 mt-1">
            Tip: Selecting categories like <strong>'Exam Clash'</strong> or <strong>'Hostel Water'</strong> automatically flags urgency for administrative response.
          </p>
        </div>

        <!-- Subject Line -->
        <div>
          <label class="block text-xs font-mono font-bold text-slate-800 uppercase tracking-wider mb-2">
            Subject Title <span class="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="subject" 
            required
            placeholder="e.g. Missing CA marks for COM112 Computer Hardware" 
            class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          >
        </div>

        <!-- Detailed Description -->
        <div>
          <label class="block text-xs font-mono font-bold text-slate-800 uppercase tracking-wider mb-2">
            Detailed Complaint Description <span class="text-red-500">*</span>
          </label>
          <textarea 
            name="content" 
            rows="6" 
            required
            placeholder="Describe your issue clearly including relevant details (e.g. course codes, department, semester, hostel block, or transaction IDs)..." 
            class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition leading-relaxed"
          ></textarea>
        </div>

        <!-- Submit Buttons -->
        <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <a 
            href="student_dashboard.php" 
            class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-mono font-bold hover:bg-slate-100 transition"
          >
            Cancel
          </a>
          <button 
            type="submit" 
            class="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition shadow-md flex items-center space-x-2"
          >
            <span>Lodge Complaint & Run Auto-Analyzer</span>
            <span>→</span>
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
