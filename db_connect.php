<?php
/**
 * Online Students' Complaint System
 * Institution: Imo State Polytechnic, Omuma (Orlu East LGA, Imo State)
 * Script: db_connect.php
 * Description: Database Connection Script using PDO
 * Created by: Ebubedike Kelechi Humphrey - 08068880163
 */

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'imopoly_complaint_db';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
} catch (PDOException $e) {
    // If PDO database connection fails, throw clean message
    error_log("Database Connection Error: " . $e->getMessage());
    $pdo = null;
}
?>
