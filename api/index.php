<?php
declare(strict_types=1);

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    respond(500, ['message' => 'Missing api/config.php. Copy api/config.example.php to api/config.php and set database credentials.']);
}

$config = require $configPath;
$secureCookie = (bool)($config['app']['cookie_secure'] ?? true);
session_name($config['app']['session_name'] ?? 'em_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $secureCookie,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

$pdo = db($config);
initDatabase($pdo, $config);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = preg_replace('#^/api#', '', $path);
$path = '/' . trim($path, '/');
if ($path === '/') $path = '/';

try {
    route($pdo, $method, $path);
} catch (Throwable $error) {
    respond(500, ['message' => $error->getMessage()]);
}

function db(array $config): PDO
{
    $db = $config['db'];
    $charset = $db['charset'] ?? 'utf8mb4';
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $db['host'], $db['port'] ?? 3306, $db['name'], $charset);
    return new PDO($dsn, $db['user'], $db['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function initDatabase(PDO $pdo, array $config): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS em_users (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(160) NOT NULL,
            email VARCHAR(190) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('admin', 'member') NOT NULL DEFAULT 'member',
            active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_em_users_active (active),
            INDEX idx_em_users_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS em_app_data (
            data_key VARCHAR(64) PRIMARY KEY,
            data_json LONGTEXT NOT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $count = (int)$pdo->query("SELECT COUNT(*) FROM em_users")->fetchColumn();
    if ($count === 0) {
        $stmt = $pdo->prepare("
            INSERT INTO em_users (id, name, email, password_hash, role, active, created_at)
            VALUES (?, ?, ?, ?, 'admin', 1, NOW())
        ");
        $stmt->execute([
            bin2hex(random_bytes(16)),
            $config['app']['admin_name'] ?? 'Administrator',
            strtolower(trim($config['app']['admin_email'] ?? 'admin@example.com')),
            password_hash((string)($config['app']['admin_password'] ?? 'admin12345'), PASSWORD_DEFAULT),
        ]);
    }

    loadAppData($pdo, 'events', []);
    loadAppData($pdo, 'settings', defaultSettings());
}

function route(PDO $pdo, string $method, string $path): void
{
    if ($method === 'GET' && $path === '/auth/session') {
        respond(200, ['session' => currentSession($pdo)]);
    }

    if ($method === 'POST' && $path === '/auth/login') {
        $body = body();
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $password = (string)($body['password'] ?? '');
        $user = getUserByEmail($pdo, $email);

        if (!$user || !(bool)$user['active'] || !password_verify($password, $user['password_hash'])) {
            respond(401, ['message' => 'Email atau password tidak sesuai.']);
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['login_at'] = gmdate('c');
        respond(200, ['session' => publicUser($user) + ['loginAt' => $_SESSION['login_at']]]);
    }

    if ($method === 'POST' && $path === '/auth/logout') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool)$params['secure'], (bool)$params['httponly']);
        }
        session_destroy();
        respond(200, ['ok' => true]);
    }

    if ($method === 'GET' && $path === '/users') {
        requireAdmin($pdo);
        $users = $pdo->query("SELECT * FROM em_users ORDER BY created_at ASC")->fetchAll();
        respond(200, ['users' => array_map('publicUser', $users)]);
    }

    if ($method === 'POST' && $path === '/users') {
        requireAdmin($pdo);
        $body = body();
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $password = (string)($body['password'] ?? '');
        if (!trim((string)($body['name'] ?? '')) || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
            respond(400, ['message' => 'Nama, email valid, dan password minimal 8 karakter wajib diisi.']);
        }
        if (getUserByEmail($pdo, $email)) respond(409, ['message' => 'Email sudah terdaftar.']);

        $id = bin2hex(random_bytes(16));
        $stmt = $pdo->prepare("
            INSERT INTO em_users (id, name, email, password_hash, role, active, created_at)
            VALUES (?, ?, ?, ?, ?, 1, NOW())
        ");
        $stmt->execute([
            $id,
            trim((string)$body['name']),
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            ($body['role'] ?? '') === 'admin' ? 'admin' : 'member',
        ]);
        respond(201, ['user' => publicUser(getUserById($pdo, $id))]);
    }

    if (preg_match('#^/users/([^/]+)$#', $path, $match)) {
        $session = requireAdmin($pdo);
        $id = $match[1];
        $user = getUserById($pdo, $id);
        if (!$user) respond(404, ['message' => 'User tidak ditemukan.']);

        if ($method === 'PATCH') {
            $body = body();
            $name = array_key_exists('name', $body) ? trim((string)$body['name']) : $user['name'];
            $email = array_key_exists('email', $body) ? strtolower(trim((string)$body['email'])) : $user['email'];
            $role = array_key_exists('role', $body) && $body['role'] === 'admin' ? 'admin' : $user['role'];
            $active = array_key_exists('active', $body) && $id !== $session['id'] ? ((bool)$body['active'] ? 1 : 0) : (int)$user['active'];
            $passwordHash = !empty($body['password']) ? password_hash((string)$body['password'], PASSWORD_DEFAULT) : $user['password_hash'];

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(400, ['message' => 'Email tidak valid.']);
            if (!empty($body['password']) && strlen((string)$body['password']) < 8) respond(400, ['message' => 'Password minimal 8 karakter.']);
            $existing = getUserByEmail($pdo, $email);
            if ($existing && $existing['id'] !== $id) respond(409, ['message' => 'Email sudah terdaftar.']);

            $stmt = $pdo->prepare("
                UPDATE em_users
                SET name = ?, email = ?, role = ?, active = ?, password_hash = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$name, $email, $role, $active, $passwordHash, $id]);
            respond(200, ['user' => publicUser(getUserById($pdo, $id))]);
        }

        if ($method === 'DELETE') {
            if ($id === $session['id']) respond(400, ['message' => 'Tidak bisa menghapus user sendiri.']);
            $stmt = $pdo->prepare("DELETE FROM em_users WHERE id = ?");
            $stmt->execute([$id]);
            respond(200, ['ok' => true]);
        }
    }

    if ($method === 'GET' && $path === '/events') {
        requireAuth($pdo);
        respond(200, ['events' => loadAppData($pdo, 'events', [])]);
    }

    if ($method === 'PUT' && $path === '/events') {
        requireAuth($pdo);
        $body = body();
        if (!is_array($body['events'] ?? null)) respond(400, ['message' => 'events must be an array.']);
        saveAppData($pdo, 'events', $body['events']);
        respond(200, ['events' => $body['events']]);
    }

    if ($method === 'GET' && $path === '/settings') {
        requireAuth($pdo);
        respond(200, ['settings' => loadAppData($pdo, 'settings', defaultSettings())]);
    }

    if ($method === 'PUT' && $path === '/settings') {
        requireAuth($pdo);
        $body = body();
        if (!is_array($body['settings'] ?? null)) respond(400, ['message' => 'settings object is required.']);
        saveAppData($pdo, 'settings', $body['settings']);
        respond(200, ['settings' => $body['settings']]);
    }

    respond(404, ['message' => 'Not found']);
}

function body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = $raw ? json_decode($raw, true) : [];
    if (!is_array($data)) respond(400, ['message' => 'Invalid JSON.']);
    return $data;
}

function respond(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body);
    exit;
}

function getUserById(PDO $pdo, string $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM em_users WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function getUserByEmail(PDO $pdo, string $email): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM em_users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function publicUser(array $user): array
{
    return [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'active' => (bool)$user['active'],
        'createdAt' => $user['created_at'] ?? ($user['createdAt'] ?? null),
        'updatedAt' => $user['updated_at'] ?? ($user['updatedAt'] ?? null),
    ];
}

function currentSession(PDO $pdo): ?array
{
    if (empty($_SESSION['user_id'])) return null;
    $user = getUserById($pdo, (string)$_SESSION['user_id']);
    if (!$user || !(bool)$user['active']) return null;
    return publicUser($user) + ['loginAt' => $_SESSION['login_at'] ?? null];
}

function requireAuth(PDO $pdo): array
{
    $session = currentSession($pdo);
    if (!$session) respond(401, ['message' => 'Unauthorized']);
    return $session;
}

function requireAdmin(PDO $pdo): array
{
    $session = requireAuth($pdo);
    if ($session['role'] !== 'admin') respond(403, ['message' => 'Forbidden']);
    return $session;
}

function loadAppData(PDO $pdo, string $key, mixed $fallback): mixed
{
    $stmt = $pdo->prepare("SELECT data_json FROM em_app_data WHERE data_key = ? LIMIT 1");
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    if (!$row) {
        saveAppData($pdo, $key, $fallback);
        return $fallback;
    }
    return json_decode($row['data_json'], true);
}

function saveAppData(PDO $pdo, string $key, mixed $value): void
{
    $stmt = $pdo->prepare("
        INSERT INTO em_app_data (data_key, data_json, updated_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()
    ");
    $stmt->execute([$key, json_encode($value)]);
}

function defaultSettings(): array
{
    return [
        'members' => ['Coach Arifin', 'Marcom Lead', 'Marcom Content', 'Marcom Ops', 'Operator Zoom', 'Product Team'],
        'brands' => ['EPIC Hub', 'GOLDGRAM', 'MEEZAN GOLD', 'SILVERGRAM'],
        'ytChannels' => [
            'EPIC Hub' => '',
            'GOLDGRAM' => '',
            'MEEZAN GOLD' => '',
            'SILVERGRAM' => '',
        ],
    ];
}
