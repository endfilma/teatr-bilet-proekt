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


def clean_blocks(raw) -> list:
    blocks = []
    for i, b in enumerate(raw or []):
        blocks.append({
            'id': str(b.get('id') or f'block-{i + 1}'),
            'label': str(b.get('label') or 'Партер').strip() or 'Партер',
            'position': b.get('position') if b.get('position') in ('left', 'right', 'front') else 'front',
            'priceMultiplier': round(float(b.get('priceMultiplier') or 1), 2),
            'rows': max(0, int(b.get('rows') or 0)),
            'seatsPerRow': max(0, int(b.get('seatsPerRow') or 0)),
            'aisleAfter': sorted({int(x) for x in (b.get('aisleAfter') or []) if str(x).strip() != ''}),
            'rowGapAfter': sorted({int(x) for x in (b.get('rowGapAfter') or []) if str(x).strip() != ''}),
        })
    return blocks


def hall_capacity(blocks: list) -> int:
    return sum(b['rows'] * b['seatsPerRow'] for b in blocks)


def load_catalog(cur) -> dict:
    cur.execute("SELECT * FROM halls ORDER BY sort_order, id")
    halls = [{
        'id': r['id'],
        'name': r['name'],
        'isActive': r['is_active'],
        'layout': r['layout'],
        'totalSeats': r['total_seats'],
        'sortOrder': r['sort_order'],
    } for r in cur.fetchall()]

    cur.execute("SELECT * FROM shows ORDER BY sort_order, id")
    shows = [dict(r) for r in cur.fetchall()]

    cur.execute(
        "SELECT s.*, sh.slug, sh.title, sh.scene, sh.genre, sh.meta, "
        "sh.annotation, sh.director, sh.price_from AS show_price, sh.hall_id, "
        "sh.buy_label, h.total_seats AS hall_total_seats, h.name AS hall_name "
        "FROM sessions s JOIN shows sh ON sh.id = s.show_id "
        "LEFT JOIN halls h ON h.id = sh.hall_id "
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
        capacity = r['hall_total_seats'] or 100
        sessions.append({
            'id': str(r['id']),
            'showId': r['show_id'],
            'slug': r['slug'],
            'title': r['title'],
            'scene': r['hall_name'] or r['scene'],
            'genre': r['genre'],
            'meta': r['meta'],
            'annotation': r['annotation'],
            'director': r['director'],
            'date': f"{starts.day} {MONTHS[starts.month - 1]}",
            'time': starts.strftime('%H:%M'),
            'dateLabel': date_label(starts),
            'startsAt': starts.isoformat(),
            'hallCaption': r['hall_caption'],
            'hallId': r['hall_id'],
            'buyLabel': r['buy_label'] or 'Купить',
            'priceFrom': r['price_from'] or r['show_price'],
            'free': max(0, capacity - len(occupied.get(str(r['id']), []))),
        })

    cur.execute("SELECT * FROM site_sections ORDER BY sort_order, id")
    sections = [{
        'key': r['key'],
        'label': r['label'],
        'anchor': r['anchor'],
        'isVisible': r['is_visible'],
        'sortOrder': r['sort_order'],
    } for r in cur.fetchall()]

    return {
        'sections': sections,
        'halls': halls,
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
            'hallId': s['hall_id'],
            'buyLabel': s['buy_label'] or 'Купить',
        } for s in shows],
        'sessions': sessions,
        'occupied': occupied,
    }


def handler(event: dict, context) -> dict:
    """Каталог театра: залы, спектакли и афиша для сайта, редактирование для администратора."""
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
            if action == 'save_hall':
                hid = body.get('id')
                blocks = clean_blocks(body.get('blocks'))
                capacity = hall_capacity(blocks)
                layout_json = json.dumps({'blocks': blocks}, ensure_ascii=False)
                name = body.get('name') or 'Новый зал'
                is_active = bool(body.get('isActive', True))
                sort_order = int(body.get('sortOrder') or 100)
                if hid:
                    cur.execute(
                        f"UPDATE halls SET name = {esc(name)}, layout = {esc(layout_json)}::jsonb, "
                        f"total_seats = {esc(capacity)}, is_active = {esc(is_active)}, "
                        f"sort_order = {esc(sort_order)} WHERE id = {esc(int(hid))}"
                    )
                else:
                    cur.execute(
                        "INSERT INTO halls (name, layout, total_seats, is_active, sort_order) VALUES ("
                        f"{esc(name)}, {esc(layout_json)}::jsonb, {esc(capacity)}, {esc(is_active)}, {esc(sort_order)})"
                    )
            elif action == 'toggle_hall':
                cur.execute(
                    f"UPDATE halls SET is_active = {esc(bool(body.get('isActive', True)))} "
                    f"WHERE id = {esc(int(body['id']))}"
                )
            elif action == 'save_show':
                sid = body.get('id')
                slug = body.get('slug') or f"show-{int(datetime.now().timestamp())}"
                hall_id = body.get('hallId')
                scene_val = None
                if hall_id:
                    cur.execute(f"SELECT name FROM halls WHERE id = {esc(int(hall_id))}")
                    hrow = cur.fetchone()
                    scene_val = hrow['name'] if hrow else None
                scene_val = scene_val or body.get('scene') or 'Большая сцена'
                buy_label = str(body.get('buyLabel') or 'Купить').strip() or 'Купить'
                fields = (
                    f"title={esc(body.get('title', ''))}, scene={esc(scene_val)}, "
                    f"genre={esc(body.get('genre', 'Драма'))}, meta={esc(body.get('meta', ''))}, "
                    f"annotation={esc(body.get('annotation', ''))}, director={esc(body.get('director', ''))}, "
                    f"price_from={esc(int(body.get('priceFrom') or 800))}, "
                    f"is_active={esc(bool(body.get('isActive', True)))}, "
                    f"sort_order={esc(int(body.get('sortOrder') or 100))}, "
                    f"hall_id={esc(int(hall_id)) if hall_id else 'NULL'}, "
                    f"buy_label={esc(buy_label)}"
                )
                if sid:
                    cur.execute(f"UPDATE shows SET {fields} WHERE id = {esc(int(sid))}")
                else:
                    cur.execute(
                        "INSERT INTO shows (slug, title, scene, genre, meta, annotation, director, price_from, "
                        "is_active, sort_order, hall_id, buy_label) "
                        f"VALUES ({esc(slug)}, {esc(body.get('title', ''))}, {esc(scene_val)}, "
                        f"{esc(body.get('genre', 'Драма'))}, {esc(body.get('meta', ''))}, {esc(body.get('annotation', ''))}, "
                        f"{esc(body.get('director', ''))}, {esc(int(body.get('priceFrom') or 800))}, "
                        f"{esc(bool(body.get('isActive', True)))}, {esc(int(body.get('sortOrder') or 100))}, "
                        f"{esc(int(hall_id)) if hall_id else 'NULL'}, {esc(buy_label)})"
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
            elif action == 'toggle_section':
                cur.execute(
                    f"UPDATE site_sections SET is_visible = {esc(bool(body.get('isVisible', True)))} "
                    f"WHERE key = {esc(body.get('key', ''))}"
                )
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
