from datetime import datetime
import re


def registration_errors(form: dict[str, str]) -> dict[str, str]:
    errors = {}
    login = form.get("login", "").strip()
    password = form.get("password", "")
    name = form.get("full_name", "").strip()
    phone = form.get("phone", "").strip()
    email = form.get("email", "").strip()

    if not re.fullmatch(r"[A-Za-z0-9]{6,64}", login):
        errors["login"] = "Введите от 6 до 64 латинских букв и цифр."
    if len(password) < 8:
        errors["password"] = "Введите не менее 8 символов."
    if len(name) > 150 or not re.fullmatch(r"[А-Яа-яЁё]+(?: +[А-Яа-яЁё]+)*", name):
        errors["full_name"] = "Введите ФИО кириллицей и через пробел."
    if not re.fullmatch(r"8\([0-9]{3}\)[0-9]{3}-[0-9]{2}-[0-9]{2}", phone):
        errors["phone"] = "Введите телефон в формате 8(XXX)XXX-XX-XX."
    if len(email) > 254 or not re.fullmatch(r"[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+", email):
        errors["email"] = "Проверьте адрес электронной почты."
    return errors


def parse_course_date(value: str):
    if not re.fullmatch(r"[0-9]{2}\.[0-9]{2}\.[0-9]{4}", value):
        return None
    try:
        date = datetime.strptime(value, "%d.%m.%Y").date()
        return date if date.year >= 1000 else None
    except ValueError:
        return None
