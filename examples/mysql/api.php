<?php
declare(strict_types=1);

require dirname(__DIR__) . '/forms.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
ini_set('display_errors', '0');
ini_set('session.use_strict_mode', '1');
session_name('rvmp_php');
session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Lax']);

function reply(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function runQuery(PDO $db, string $sql, array $args = []): PDOStatement
{
    $statement = $db->prepare($sql);
    $statement->execute($args);
    return $statement;
}

try {
    $file = getenv('RVMP_PHP_CONFIG') ?: 'C:/xampp/rvmp-php-config.json';
    $config = json_decode(ltrim((string)file_get_contents($file), "\xEF\xBB\xBF"), true, flags: JSON_THROW_ON_ERROR);
    $connection = $config['database'];
    $db = new PDO(
        "mysql:host={$connection['host']};port={$connection['port']};dbname={$connection['database']};charset=utf8mb4",
        $connection['user'], $connection['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
         PDO::ATTR_EMULATE_PREPARES => false]
    );
    $module = ($config['module'] ?? 2) === 1 ? 1 : 2;
    $courses = json_decode(file_get_contents(dirname(__DIR__) . '/courses.json'), true, flags: JSON_THROW_ON_ERROR);
    $user = $_SESSION['user'] ?? null;

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $rows = [];
        if ($user) {
            $sql = 'SELECT a.id,a.course,a.start_date,a.payment,a.status,u.login
                    FROM applications a JOIN users u ON a.user_id=u.id';
            $isAdmin = $user['role'] === 'admin';
            $rows = runQuery($db, $sql . ($isAdmin ? '' : ' WHERE a.user_id=?') . ' ORDER BY a.id DESC',
                $isAdmin ? [] : [$user['id']])->fetchAll();
            if (!$isAdmin) {
                $reviews = runQuery($db, 'SELECT r.application_id,r.body FROM reviews r
                    JOIN applications a ON a.id=r.application_id WHERE a.user_id=? ORDER BY r.id', [$user['id']])->fetchAll(PDO::FETCH_GROUP | PDO::FETCH_COLUMN);
                foreach ($rows as &$row) {
                    $row['reviews'] = $reviews[$row['id']] ?? [];
                }
                unset($row);
            }
        }
        $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
        reply(['user' => $user, 'rows' => $rows, 'csrf' => $_SESSION['csrf'], 'module' => $module, 'courses' => $courses]);
    }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        reply(['error' => 'Откройте страницу портала.'], 405);
    }
    $data = json_decode(file_get_contents('php://input', length: 16384), true);
    if (!is_array($data) || !isset($_SESSION['csrf']) || !is_string($data['csrf'] ?? null)
        || !hash_equals($_SESSION['csrf'], $data['csrf'])) {
        reply(['error' => 'Обновите страницу и повторите действие.'], 403);
    }

    $value = static fn(string $key): string => is_string($data[$key] ?? null) ? trim($data[$key]) : '';
    $password = is_string($data['password'] ?? null) ? $data['password'] : '';
    $action = $value('action');
    if ($action === 'register') {
        $form = ['login' => $value('login'), 'password' => $password, 'full_name' => $value('full_name'),
                 'phone' => $value('phone'), 'email' => $value('email')];
        $errors = registrationErrors($form);
        if ($errors) {
            reply(['errors' => $errors], 422);
        }
        try {
            runQuery($db, 'INSERT INTO users (login,password_hash,full_name,phone,email) VALUES (?,?,?,?,?)',
                [$form['login'], password_hash($password, PASSWORD_DEFAULT), $form['full_name'], $form['phone'], $form['email']]);
        } catch (PDOException $error) {
            if (($error->errorInfo[1] ?? null) === 1062) {
                reply(['errors' => ['login' => 'Этот логин уже занят.']], 422);
            }
            throw $error;
        }
        reply(['ok' => true, 'message' => 'Пользователь создан. Войдите с новым логином.']);
    }
    if ($action === 'login') {
        $row = runQuery($db, 'SELECT id,login,role,password_hash FROM users WHERE login=?', [$value('login')])->fetch();
        if (!$row || !password_verify($password, $row['password_hash'])) {
            reply(['errors' => ['login' => 'Проверьте логин и пароль.']], 422);
        }
        unset($row['password_hash']);
        session_regenerate_id(true);
        $_SESSION = ['user' => $row];
        reply(['ok' => true, 'message' => 'Вход выполнен.']);
    }
    if ($action === 'logout') {
        $_SESSION = [];
        session_regenerate_id(true);
        reply(['ok' => true, 'message' => 'Вы вышли из аккаунта.']);
    }
    if (!$user) {
        reply(['error' => 'Сначала войдите в аккаунт.'], 403);
    }
    if ($action === 'apply' && $user['role'] === 'user') {
        $course = $value('course');
        $payment = $value('payment');
        $rawDate = $value('start_date');
        if ($module === 1) {
            $date = DateTimeImmutable::createFromFormat('!Y-m-d', $rawDate);
            $start = $date && $date->format('Y-m-d') === $rawDate && (int)$date->format('Y') >= 1000 ? $rawDate : null;
        } else {
            $start = parseCourseDate($rawDate);
        }
        $errors = [];
        if (!$course || mb_strlen($course) > 180 || ($module === 2 && !in_array($course, $courses, true))) {
            $errors['course'] = 'Укажите курс из задания.';
        }
        if (!in_array($payment, ['cash', 'transfer'], true)) {
            $errors['payment'] = 'Выберите способ оплаты.';
        }
        if (!$start) {
            $errors['start_date'] = 'Укажите существующую дату в нужном формате.';
        }
        if ($errors) {
            reply(['errors' => $errors], 422);
        }
        runQuery($db, 'INSERT INTO applications (user_id,course,start_date,payment) VALUES (?,?,?,?)',
            [$user['id'], $course, $start, $payment]);
        reply(['ok' => true, 'message' => 'Заявка отправлена.']);
    }
    $id = filter_var($value('id'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 2147483647]]);
    if (!$id) {
        reply(['error' => 'Откройте список заявок и повторите действие.'], 422);
    }
    if ($action === 'status' && $user['role'] === 'admin') {
        $status = $value("status-$id");
        if (!in_array($status, ['in_progress', 'completed'], true)) {
            reply(['error' => 'Выберите новый статус.'], 422);
        }
        if (!runQuery($db, 'SELECT id FROM applications WHERE id=?', [$id])->fetch()) {
            reply(['error' => 'Заявка больше недоступна.'], 404);
        }
        runQuery($db, 'UPDATE applications SET status=? WHERE id=?', [$status, $id]);
        reply(['ok' => true, 'message' => 'Статус обновлён.']);
    }
    if ($action === 'review' && $user['role'] === 'user') {
        $body = $value("body-$id");
        if (!$body || mb_strlen($body) > 1000) {
            reply(['errors' => ["body-$id" => 'Введите отзыв длиной от 1 до 1000 символов.']], 422);
        }
        $saved = addCourseReview($db, (int)$user['id'], $id, $body, $module === 2);
        if (!$saved) {
            reply(['error' => 'Проверьте владельца заявки и статус обучения.'], 403);
        }
        reply(['ok' => true, 'message' => 'Отзыв сохранён.']);
    }
    reply(['error' => 'Эта операция недоступна для вашей роли.'], 403);
} catch (Throwable $error) {
    error_log((string)$error);
    reply(['error' => 'Откройте настройки подключения и проверьте схему базы.'], 503);
}
