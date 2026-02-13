<?php
require_once __DIR__ . '/auth/bootstrap.php';

logout_admin();
header('Location: login.php');
exit;
