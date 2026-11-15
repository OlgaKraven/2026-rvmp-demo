INSERT INTO users (login, password_hash, full_name, phone, email, role) VALUES
  ('Admin', '__ADMIN_HASH__', 'Администратор портала', '8(900)000-00-00', 'admin@example.test', 'admin'),
  ('student01', '__STUDENT_HASH__', 'Иванов Иван Иванович', '8(900)123-45-67', 'student01@example.test', 'user');

INSERT INTO applications (user_id, course, start_date, payment, status)
  SELECT id, 'Основы веб-дизайна', '2027-04-15', 'cash', 'completed' FROM users WHERE login = 'student01';
INSERT INTO applications (user_id, course, start_date, payment, status)
  SELECT id, 'Основы проектирования баз данных', '2027-04-20', 'transfer', 'new' FROM users WHERE login = 'student01';

INSERT INTO reviews (application_id, body)
  SELECT applications.id, 'Примеры помогли разобраться в адаптивной вёрстке.'
  FROM applications JOIN users ON users.id = applications.user_id
  WHERE users.login = 'student01' AND applications.status = 'completed';
