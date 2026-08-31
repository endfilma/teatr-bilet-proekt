import json
import os
import hashlib
from datetime import datetime

import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Access-Control-Max-Age': '86400',
}

MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
          'августа', 'сентября', 'октября', 'ноября', 'декабря']


def admin_token() -> str:
    secret = os.environ.get('ADMIN_PASSWORD', '')
    return hashlib.sha256(('helios::' + secret).encode()).hexdigest()


def conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def esc(value) -> str:
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def date_label(dt: datetime) -> str:
    return f"{dt.day} {MONTHS[dt.month - 1]} · {dt.strftime('%H:%M')}"


def response(status: int, payload: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(payload, ensure_ascii=False, default=str),
    }


def load_catalog(cur) -> dict:
    cur.execute("SELECT * FROM shows ORDER BY sort_order, id")
    shows = [dict(r) for r in cur.fetchall()]

    cur.execute(
        "SELECT s.*, sh.slug, sh.title, sh.scene, sh.genre, sh.meta, "
        "sh.annotation, sh.director, sh.price_from AS show_price "
        "FROM sessions s JOIN shows sh ON sh.id = s.show_id "
        "WHERE s.is_active = TRUE AND sh.is_active = TRUE "
        "ORDER BY s.starts_at"
    )
    rows = [dict(r) for r in cur.fetchall()]

    cur.execute(
        "SELECT b.session_id, b.seat_id FROM booked_seats b "
        "JOIN orders o ON o.id = b.order_id WHERE o.status IN ('pending', 'paid')"
    )
    occupied: dict = {}
    for row in cur.fetchall():
        occupied.setdefault(str(row['session_id']), []).append(row['seat_id'])

    sessions = []
    for r in rows:
        starts = r['starts_at']
        sessions.append({
            'id': str(r['id']),
            'showId': r['show_id'],
            'slug': r['slug'],
            'title': r['title'],
            'scene': r['scene'],
            'genre': r['genre'],
            'meta': r['meta'],
            'annotation': r['annotation'],
            'director': r['director'],
            'date': f"{starts.day} {MONTHS[starts.month - 1]}",
            'time': starts.strftime('%H:%M'),
            'dateLabel': date_label(starts),
            'startsAt': starts.isoformat(),
            'hallCaption': r['hall_caption'],
            'priceFrom': r['price_from'] or r['show_price'],
            'free': max(0, (50 if r['scene'] == 'Малая сцена' else 100)
                        - len(occupied.get(str(r['id']), []))),
        })

    return {
        'shows': [{
            'id': s['id'],
            'slug': s['slug'],
            'title': s['title'],
            'scene': s['scene'],
            'genre': s['genre'],
            'meta': s['meta'],
            'annotation': s['annotation'],
            'director': s['director'],
            'priceFrom': s['price_from'],
            'isActive': s['is_active'],
            'sortOrder': s['sort_order'],
        } for s in shows],
        'sessions': sessions,
        'occupied': occupied,
    }


def handler(event: dict, context) -> dict:
    """Каталог театра: афиша и спектакли для сайта, редактирование для администратора."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'isBase64Encoded': False, 'body': ''}

    if method == 'GET':
        with conn() as db:
            with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                return response(200, load_catalog(cur))

    headers = event.get('headers') or {}
    token = headers.get('X-Admin-Token') or headers.get('x-admin-token') or ''
    if token != admin_token():
        return response(401, {'error': 'Нужен вход администратора'})

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')

    with conn() as db:
        with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if action == 'save_show':
                sid = body.get('id')
                slug = body.get('slug') or f"show-{int(datetime.now().timestamp())}"
                fields = (
                    f"title={esc(body.get('title', ''))}, scene={esc(body.get('scene', 'Большая сцена'))}, "
                    f"genre={esc(body.get('genre', 'Драма'))}, meta={esc(body.get('meta', ''))}, "
                    f"annotation={esc(body.get('annotation', ''))}, director={esc(body.get('director', ''))}, "
                    f"price_from={esc(int(body.get('priceFrom') or 800))}, "
                    f"is_active={esc(bool(body.get('isActive', True)))}, "
                    f"sort_order={esc(int(body.get('sortOrder') or 100))}"
                )
                if sid:
                    cur.execute(f"UPDATE shows SET {fields} WHERE id = {esc(int(sid))}")
                else:
                    cur.execute(
                        "INSERT INTO shows (slug, title, scene, genre, meta, annotation, director, price_from, is_active, sort_order) "
                        f"VALUES ({esc(slug)}, {esc(body.get('title', ''))}, {esc(body.get('scene', 'Большая сцена'))}, "
                        f"{esc(body.get('genre', 'Драма'))}, {esc(body.get('meta', ''))}, {esc(body.get('annotation', ''))}, "
                        f"{esc(body.get('director', ''))}, {esc(int(body.get('priceFrom') or 800))}, "
                        f"{esc(bool(body.get('isActive', True)))}, {esc(int(body.get('sortOrder') or 100))})"
                    )
            elif action == 'archive_show':
                cur.execute(f"UPDATE shows SET is_active = FALSE WHERE id = {esc(int(body['id']))}")
            elif action == 'save_session':
                sid = body.get('id')
                starts = str(body.get('startsAt', '')).replace('T', ' ')[:16]
                price = body.get('priceFrom')
                price_sql = esc(int(price)) if price else 'NULL'
                if sid:
                    cur.execute(
                        f"UPDATE sessions SET show_id = {esc(int(body['showId']))}, "
                        f"starts_at = {esc(starts)}::timestamp, hall_caption = {esc(body.get('hallCaption', 'Партер'))}, "
                        f"price_from = {price_sql}, is_active = {esc(bool(body.get('isActive', True)))} "
                        f"WHERE id = {esc(int(sid))}"
                    )
                else:
                    cur.execute(
                        "INSERT INTO sessions (show_id, starts_at, hall_caption, price_from, is_active) VALUES ("
                        f"{esc(int(body['showId']))}, {esc(starts)}::timestamp, {esc(body.get('hallCaption', 'Партер'))}, "
                        f"{price_sql}, {esc(bool(body.get('isActive', True)))})"
                    )
            elif action == 'archive_session':
                cur.execute(f"UPDATE sessions SET is_active = FALSE WHERE id = {esc(int(body['id']))}")
            elif action == 'orders':
                cur.execute(
                    "SELECT o.code, o.customer_name, o.email, o.phone, o.total, o.status, o.created_at, "
                    "o.seats, sh.title, s.starts_at FROM orders o "
                    "JOIN sessions s ON s.id = o.session_id JOIN shows sh ON sh.id = s.show_id "
                    "ORDER BY o.created_at DESC LIMIT 100"
                )
                return response(200, {'orders': [dict(r) for r in cur.fetchall()]})
            else:
                return response(400, {'error': 'Неизвестное действие'})

            return response(200, load_catalog(cur))