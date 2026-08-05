<?php
/**
 * Online Students' Complaint System - Imo State Polytechnic, Omuma
 * Page: register.php (Student Account Registration)
 */

session_start();

$error_msg = '';

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'imopoly_complaint_db';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $full_name  = trim($_POST['full_name'] ?? '');
    $reg_number = trim($_POST['reg_number'] ?? '');
    $email      = trim($_POST['email'] ?? '');
    $password   = trim($_POST['password'] ?? '');

    if (empty($full_name) || empty($reg_number) || empty($email) || empty($password)) {
        $error_msg = "All fields are required for student registration.";
    } elseif (strlen($password) < 6) {
        $error_msg = "Password must be at least 6 characters long.";
    } else {
        try {
            $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            // Check if matric number or email already exists
            $stmt = $pdo->prepare("SELECT user_id FROM users WHERE reg_number = :reg OR email = :email LIMIT 1");
            $stmt->execute([':reg' => $reg_number, ':email' => $email]);
            if ($stmt->fetch()) {
                $error_msg = "A student account with this Matric Number or Email already exists.";
            } else {
                $hashed_password = password_hash($password, PASSWORD_BCRYPT);
                $insert_stmt = $pdo->prepare("
                    INSERT INTO users (full_name, reg_number, email, password, role, created_at)
                    VALUES (:name, :reg, :email, :pass, 'student', NOW())
                ");
                $insert_stmt->execute([
                    ':name'  => $full_name,
                    ':reg'   => $reg_number,
                    ':email' => $email,
                    ':pass'  => $hashed_password
                ]);

                $_SESSION['success'] = "Account created successfully! You can now log in with your Matric Number.";
                header("Location: login.php");
                exit();
            }
        } catch (PDOException $e) {
            $error_msg = "Registration error: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Registration - Imo State Polytechnic, Omuma</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-900 min-h-screen flex flex-col justify-between text-slate-100">

  <!-- Header Banner -->
  <header class="bg-blue-950 border-b border-blue-900/80 px-4 py-4">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-md border border-slate-200 overflow-hidden">
          <img src="https://res.cloudinary.com/n4kwtphh/image/upload/v1785941933/photo_2026-07-28_22-46-21_vuamoj.jpg" onerror="this.src='/logo.png'" alt="Imo State Polytechnic Logo" class="w-full h-full object-contain" />
        </div>
        <div>
          <h1 class="text-sm md:text-base font-bold text-white tracking-tight uppercase">Imo State Polytechnic, Omuma</h1>
          <p class="text-[11px] font-mono text-emerald-400">Online Students' Complaint System</p>
        </div>
      </div>
      <div class="hidden sm:block text-right text-xs text-slate-400 font-mono">
        <span>Orlu East LGA, Imo State</span>
      </div>
    </div>
  </header>

  <!-- Register Form Card -->
  <main class="flex-1 flex items-center justify-center p-4 my-8">
    <div class="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      
      <div class="bg-blue-900/40 p-6 border-b border-slate-800 text-center">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-[11px] font-mono font-bold border border-emerald-800 mb-2 uppercase">
          STUDENT PORTAL REGISTRATION
        </div>
        <h2 class="text-2xl font-bold text-white tracking-tight">Create Student Account</h2>
        <p class="text-xs text-slate-400 mt-1">Register to lodge complaints and track resolution status</p>
      </div>

      <div class="p-6 space-y-4">

        <?php if (!empty($error_msg)): ?>
          <div class="p-3.5 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl font-medium">
            ⚠️ <?= htmlspecialchars($error_msg) ?>
          </div>
        <?php endif; ?>

        <form method="POST" action="register.php" class="space-y-4">
          <!-- Full Name -->
          <div>
            <label class="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
            <input 
              type="text" 
              name="full_name" 
              required
              placeholder="e.g. Chidi Chukwuemeka" 
              class="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
          </div>

          <!-- Matric Number -->
          <div>
            <label class="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">Matric / Registration Number</label>
            <input 
              type="text" 
              name="reg_number" 
              required
              placeholder="e.g. IMOPOLY/ND/2024/0142" 
              class="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
          </div>

          <!-- Email Address -->
          <div>
            <label class="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">Student Email Address</label>
            <input 
              type="email" 
              name="email" 
              required
              placeholder="e.g. chidi.c@student.imopoly.edu.ng" 
              class="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
          </div>

          <!-- Password -->
          <div>
            <label class="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">Account Password</label>
            <input 
              type="password" 
              name="password" 
              required
              placeholder="At least 6 characters" 
              class="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2"
          >
            <span>Complete Registration</span>
            <span>✓</span>
          </button>
        </form>

        <div class="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400 font-sans">
          Already registered? 
          <a href="login.php" class="font-bold text-blue-400 hover:underline">Log In Here</a>
        </div>
      </div>
    </div>
  </main>

  <footer class="bg-blue-950/60 border-t border-slate-800 py-4 px-4 text-center text-xs font-mono space-y-1">
    <p class="font-semibold text-slate-300">Online Students' Complaint System &copy; 2026</p>
    <p class="text-slate-400">Imo State Polytechnic Omuma (Orlu East LGA, Imo State)</p>
    <p class="text-slate-500">Created by: Ebubedike Kelechi Humphrey - 08068880163</p>
  </footer>

</body>
</html>
