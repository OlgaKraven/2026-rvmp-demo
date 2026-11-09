<?php
declare(strict_types=1);

function registrationErrors(array $form): array
{
    $errors = [];
    $login = trim($form['login'] ?? '');
    $password = $form['password'] ?? '';
    $name = trim($form['full_name'] ?? '');
    $phone = trim($form['phone'] ?? '');
    $email = trim($form['email'] ?? '');

    if (!preg_match('/\A[A-Za-z0-9]{6,64}\z/', $login)) {
        $errors['login'] = 'Введите от 6 до 64 латинских букв и цифр.';
    }
    if (mb_strlen($password) < 8 || strlen($password) > 72) {
        $errors['password'] = 'Введите не менее 8 символов, до 72 байт.';
    }
    if (!preg_match('/\A[А-Яа-яЁё]+(?: +[А-Яа-яЁё]+)*\z/u', $name) || mb_strlen($name) > 150) {
        $errors['full_name'] = 'Введите ФИО кириллицей и через пробел.';
    }
    if (!preg_match('/\A8\([0-9]{3}\)[0-9]{3}-[0-9]{2}-[0-9]{2}\z/', $phone)) {
        $errors['phone'] = 'Введите телефон в формате 8(XXX)XXX-XX-XX.';
    }
    if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Проверьте адрес электронной почты.';
    }
    return $errors;
}

function parseCourseDate(string $value): ?string
{
    $date = DateTimeImmutable::createFromFormat('!d.m.Y', $value);
    if (!$date || $date->format('d.m.Y') !== $value || (int)$date->format('Y') < 1000) {
        return null;
    }
    return $date->format('Y-m-d');
}

// userId берётся из сессии после проверки входа.
function addCourseReview(PDO $db, int $userId, int $applicationId, string $text, bool $requireCompleted): bool
{
    $query = $db->prepare(
        "INSERT INTO reviews (application_id, body)
         SELECT id, :body FROM applications
         WHERE id = :application_id AND user_id = :user_id"
        . ($requireCompleted ? " AND status = 'completed'" : '')
    );
    $query->execute(['body' => $text, 'application_id' => $applicationId, 'user_id' => $userId]);
    return $query->rowCount() === 1;
}
