<?php
$host = 'alabartetoscana.cz';       // např. localhost
$db   = 'HufR54hK';  // název DB
$user = 'kD8ltKOG';   // uživatel DB
$pass = 'y4Ss10m^-~I)U4pXQ-<?';     // heslo DB
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    // echo "Připojeno k databázi!";
} catch (PDOException $e) {
    die("Chyba připojení: " . $e->getMessage());
}
?>
