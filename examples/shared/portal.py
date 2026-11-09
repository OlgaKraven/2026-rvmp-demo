"""Сервер портала. app.py передаёт подключение выбранной СУБД."""
from contextlib import closing
from datetime import date
from pathlib import Path
import json
import secrets

from flask import Flask, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from forms import registration_errors, parse_course_date


COURSES = json.loads(Path(__file__).with_name('courses.json').read_text(encoding='utf8'))


def create_app(connect_db, db_error, **cursor_options):
    folder = Path(__file__).resolve().parent
    config = json.loads((folder / 'config.local.json').read_text(encoding='utf-8-sig'))
    module = 1 if config.get('module') == 1 else 2
    app = Flask(__name__, static_folder='public', static_url_path='')
    app.secret_key = config['secret']
    app.config.update(SESSION_COOKIE_NAME=config['cookie'], SESSION_COOKIE_SAMESITE='Lax', MAX_CONTENT_LENGTH=16384)

    @app.get('/')
    def index():
        return app.send_static_file('index.html')

    @app.route('/api', methods=['GET', 'POST'])
    def api():
        data = request.get_json(silent=True)
        if request.method == 'POST':
            if not isinstance(data, dict) or not session.get('csrf') or data.get('csrf') != session['csrf']:
                return {'error': 'Обновите страницу и повторите действие.'}, 403
        try:
            with closing(connect_db(config)) as db, db.cursor(**cursor_options) as cursor:
                if request.method == 'GET':
                    return read_portal(cursor, module)
                response, status = change_portal(cursor, data, module)
                if status < 400:
                    db.commit()
                else:
                    db.rollback()
                return response, status
        except db_error as error:
            if getattr(error, 'sqlstate', None) == '23505' or getattr(error, 'errno', None) == 1062:
                return {'errors': {'login': 'Этот логин уже занят.'}}, 422
            app.logger.exception('Ошибка операции с базой')
            return {'error': 'Откройте настройки подключения и проверьте схему базы.'}, 503

    return app


def read_portal(cursor, module):
    user = session.get('user')
    rows = []
    if user:
        sql = '''SELECT a.id, a.course, a.start_date, a.payment, a.status, u.login
                 FROM applications a JOIN users u ON a.user_id = u.id'''
        if user['role'] == 'admin':
            cursor.execute(sql + ' ORDER BY a.id DESC')
        else:
            cursor.execute(sql + ' WHERE a.user_id = %s ORDER BY a.id DESC', (user['id'],))
        rows = cursor.fetchall()
        for row in rows:
            row['start_date'] = row['start_date'].isoformat()
        if user['role'] != 'admin':
            cursor.execute('''SELECT r.application_id, r.body FROM reviews r
                              JOIN applications a ON a.id = r.application_id
                              WHERE a.user_id = %s ORDER BY r.id''', (user['id'],))
            reviews = {}
            for review in cursor.fetchall():
                reviews.setdefault(review['application_id'], []).append(review['body'])
            for row in rows:
                row['reviews'] = reviews.get(row['id'], [])
    if 'csrf' not in session:
        session['csrf'] = secrets.token_hex(32)
    return {'user': user, 'rows': rows, 'csrf': session['csrf'], 'module': module, 'courses': COURSES}


def change_portal(cursor, data, module):
    def value(key):
        item = data.get(key)
        return item.strip() if isinstance(item, str) else ''

    action = value('action')
    module1 = module == 1
    user = session.get('user')
    if action == 'register':
        form = {key: value(key) for key in ('login', 'password', 'full_name', 'phone', 'email')}
        form['password'] = data.get('password') if isinstance(data.get('password'), str) else ''
        errors = registration_errors(form)
        if len(form['password']) > 128:
            errors['password'] = 'Используйте до 128 символов.'
        if errors:
            return {'errors': errors}, 422
        cursor.execute('SELECT id FROM users WHERE login = %s', (form['login'],))
        if cursor.fetchone():
            return {'errors': {'login': 'Этот логин уже занят.'}}, 422
        cursor.execute('''INSERT INTO users (login,password_hash,full_name,phone,email)
                          VALUES (%s,%s,%s,%s,%s)''',
                       (form['login'], generate_password_hash(form['password']), form['full_name'], form['phone'], form['email']))
        return {'ok': True, 'message': 'Пользователь создан. Войдите с новым логином.'}, 200
    if action == 'login':
        cursor.execute('SELECT id, login, role, password_hash FROM users WHERE login = %s', (value('login'),))
        row = cursor.fetchone()
        password = data.get('password')
        if not row or not isinstance(password, str) or not check_password_hash(row['password_hash'], password):
            return {'errors': {'login': 'Проверьте логин и пароль.'}}, 422
        row.pop('password_hash')
        session.clear()
        session['user'] = row
        return {'ok': True, 'message': 'Вход выполнен.'}, 200
    if action == 'logout':
        session.clear()
        return {'ok': True, 'message': 'Вы вышли из аккаунта.'}, 200
    if not user:
        return {'error': 'Сначала войдите в аккаунт.'}, 403
    if action == 'apply' and user['role'] == 'user':
        course, payment = value('course'), value('payment')
        raw_date = value('start_date')
        errors = {}
        if not course or len(course) > 180 or (not module1 and course not in COURSES):
            errors['course'] = 'Укажите курс из задания.'
        if payment not in ('cash', 'transfer'):
            errors['payment'] = 'Выберите способ оплаты.'
        try:
            start_date = date.fromisoformat(raw_date) if module1 else parse_course_date(raw_date)
            if module1 and raw_date != start_date.isoformat():
                start_date = None
        except ValueError:
            start_date = None
        if not start_date or start_date.year < 1000:
            errors['start_date'] = 'Укажите существующую дату в нужном формате.'
        if errors:
            return {'errors': errors}, 422
        cursor.execute('INSERT INTO applications (user_id,course,start_date,payment) VALUES (%s,%s,%s,%s)',
                       (user['id'], course, start_date, payment))
        return {'ok': True, 'message': 'Заявка отправлена.'}, 200
    raw_id = value('id')
    if not raw_id.isascii() or not raw_id.isdecimal() or len(raw_id) > 9:
        return {'error': 'Откройте список заявок и повторите действие.'}, 422
    item_id = int(raw_id)
    if action == 'status' and user['role'] == 'admin':
        status = value(f'status-{item_id}')
        if status not in ('in_progress', 'completed'):
            return {'error': 'Выберите новый статус.'}, 422
        cursor.execute('SELECT id FROM applications WHERE id = %s FOR UPDATE', (item_id,))
        if not cursor.fetchone():
            return {'error': 'Заявка больше недоступна.'}, 404
        cursor.execute('UPDATE applications SET status = %s WHERE id = %s', (status, item_id))
        return {'ok': True, 'message': 'Статус обновлён.'}, 200
    if action == 'review' and user['role'] == 'user':
        body = value(f'body-{item_id}')
        if not body or len(body) > 1000:
            return {'errors': {f'body-{item_id}': 'Введите отзыв длиной от 1 до 1000 символов.'}}, 422
        sql = '''INSERT INTO reviews (application_id, body)
                 SELECT id, %s FROM applications WHERE id = %s AND user_id = %s'''
        cursor.execute(sql if module1 else sql + " AND status = 'completed'", (body, item_id, user['id']))
        if not cursor.rowcount:
            return {'error': 'Проверьте владельца заявки и статус обучения.'}, 403
        return {'ok': True, 'message': 'Отзыв сохранён.'}, 200
    return {'error': 'Эта операция недоступна для вашей роли.'}, 403
