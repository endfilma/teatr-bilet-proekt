import base64
import io
import json
import os
import random
import smtplib
import string
import urllib.request
import urllib.error
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import boto3
import psycopg2
import psycopg2.extras
import qrcode

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
}

MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
          'августа', 'сентября', 'октября', 'ноября', 'декабря']


def esc(value) -> str:
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def response(status: int, payload: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(payload, ensure_ascii=False, default=str),
    }


def order_code() -> str:
    return 'HL-' + ''.join(random.choices(string.digits, k=6))


def make_qr(code: str) -> str:
    img = qrcode.make(f'HELIOS-TICKET:{code}')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    key_id = os.environ['AWS_ACCESS_KEY_ID']
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=key_id,
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    key = f'tickets/{code}.png'
    s3.put_object(Bucket='files', Key=key, Body=buf.getvalue(), ContentType='image/png')
    return f'https://cdn.poehali.dev/projects/{key_id}/bucket/{key}'


def create_payment(code: str, total: int, email: str, title: str, return_url: str):
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret = os.environ.get('YOOKASSA_SECRET_KEY', '')
    if not shop_id or not secret:
        return None, None
    auth = base64.b64encode(f'{shop_id}:{secret}'.encode()).decode()
    payload = json.dumps({
        'amount': {'value': f'{total}.00', 'currency': 'RUB'},
        'capture': True,
        'confirmation': {'type': 'redirect', 'return_url': return_url},
        'description': f'Билеты «{title}», заказ {code}',
        'metadata': {'code': code},
        'receipt': {
            'customer': {'email': email},
            'items': [{
                'description': f'Билет на «{title}»'[:120],
                'quantity': '1.00',
                'amount': {'value': f'{total}.00', 'currency': 'RUB'},
                'vat_code': 1,
            }],
        },
    }, ensure_ascii=False).encode()
    req = urllib.request.Request(
        'https://api.yookassa.ru/v3/payments',
        data=payload,
        headers={
            'Authorization': f'Basic {auth}',
            'Idempotence-Key': code,
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as res:
            data = json.loads(res.read().decode())
        return data.get('id'), data.get('confirmation', {}).get('confirmation_url')
    except Exception as exc:
        print('yookassa error:', exc)
        return None, None


def send_mail(to_addr: str, subject: str, html: str) -> bool:
    host = os.environ.get('SMTP_HOST', '')
    user = os.environ.get('SMTP_USER', '')
    password = os.environ.get('SMTP_PASSWORD', '')
    if not (host and user and password and to_addr):
        return False
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f'Театр Гелиос <{user}>'
    msg['To'] = to_addr
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    try:
        with smtplib.SMTP_SSL(host, 465, timeout=12) as server:
            server.login(user, password)
            server.sendmail(user, [to_addr], msg.as_string())
        return True
    except Exception as exc:
        print('smtp error:', exc)
        return False


def ticket_html(order: dict, show_title: str, when: str, hall: str, qr_url: str, paid: bool) -> str:
    seats = ' · '.join(f"ряд {s['row']}, место {s['num']}" for s in order['seats'])
    status = 'Оплачено' if paid else 'Ожидает оплаты'
    return f"""
<div style="font-family:Arial,sans-serif;background:#1D2230;color:#EEF1F8;padding:28px;border-radius:20px;max-width:560px">
  <p style="letter-spacing:.16em;font-size:12px;color:#98A0B4;margin:0 0 8px">ТЕАТР ГЕЛИОС · ЭЛЕКТРОННЫЙ БИЛЕТ</p>
  <h1 style="margin:0 0 6px;font-size:28px;color:#E3C766">{show_title}</h1>
  <p style="margin:0 0 18px;color:#98A0B4">{when} · {hall}</p>
  <div style="background:#161A26;border-radius:14px;padding:18px;margin-bottom:18px">
    <p style="margin:0 0 6px"><b>Заказ:</b> {order['code']}</p>
    <p style="margin:0 0 6px"><b>Места:</b> {seats}</p>
    <p style="margin:0 0 6px"><b>Сумма:</b> {order['total']} ₽</p>
    <p style="margin:0"><b>Статус:</b> {status}</p>
  </div>
  <div style="text-align:center;background:#FFFFFF;border-radius:14px;padding:16px">
    <img src="{qr_url}" alt="QR-код билета" width="200" height="200" style="display:block;margin:0 auto" />
  </div>
  <p style="color:#98A0B4;font-size:13px;margin-top:16px">Покажите QR-код на входе. Зал открывается за 40 минут до начала.</p>
</div>
"""


def handler(event: dict, context) -> dict:
    """Бронирование билетов: заказ, оплата картой, электронный билет с QR-кодом на почту."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'isBase64Encoded': False, 'body': ''}

    db = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        code = params.get('code', '')
        cur.execute(f"SELECT code, status, total, qr_url FROM orders WHERE code = {esc(code)}")
        row = cur.fetchone()
        db.close()
        if not row:
            return response(404, {'error': 'Заказ не найден'})
        return response(200, dict(row))

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', 'create')

    if action == 'paid':
        code = body.get('code') or (body.get('object') or {}).get('metadata', {}).get('code', '')
        cur.execute(
            f"UPDATE orders SET status = 'paid', paid_at = NOW() WHERE code = {esc(code)} AND status <> 'paid'"
        )
        db.commit()
        cur.execute(
            "SELECT o.*, sh.title, s.starts_at, s.hall_caption FROM orders o "
            "JOIN sessions s ON s.id = o.session_id JOIN shows sh ON sh.id = s.show_id "
            f"WHERE o.code = {esc(code)}"
        )
        row = cur.fetchone()
        db.close()
        if not row:
            return response(404, {'error': 'Заказ не найден'})
        order = dict(row)
        starts = order['starts_at']
        when = f"{starts.day} {MONTHS[starts.month - 1]} · {starts.strftime('%H:%M')}"
        html = ticket_html(order, order['title'], when, order['hall_caption'], order['qr_url'], True)
        send_mail(order['email'], f"Билеты оплачены — «{order['title']}»", html)
        admin = os.environ.get('ADMIN_EMAIL', '')
        if admin:
            send_mail(admin, f"Оплачен заказ {order['code']}", html)
        return response(200, {'status': 'paid'})

    name = str(body.get('name', '')).strip()
    email = str(body.get('email', '')).strip()
    phone = str(body.get('phone', '')).strip()
    session_id = body.get('sessionId')
    seats = body.get('seats') or []
    total = int(body.get('total') or 0)
    return_url = body.get('returnUrl') or 'https://poehali.dev'

    if not (name and email and phone and session_id and seats):
        db.close()
        return response(400, {'error': 'Заполните данные и выберите места'})

    cur.execute(
        "SELECT s.id, s.starts_at, s.hall_caption, sh.title FROM sessions s "
        f"JOIN shows sh ON sh.id = s.show_id WHERE s.id = {esc(int(session_id))}"
    )
    session = cur.fetchone()
    if not session:
        db.close()
        return response(404, {'error': 'Сеанс не найден'})

    seat_ids = [str(s.get('id')) for s in seats]
    in_list = ', '.join(esc(s) for s in seat_ids)
    cur.execute(
        "SELECT b.seat_id FROM booked_seats b JOIN orders o ON o.id = b.order_id "
        f"WHERE b.session_id = {esc(int(session_id))} AND b.seat_id IN ({in_list}) "
        "AND o.status IN ('pending', 'paid')"
    )
    taken = [r['seat_id'] for r in cur.fetchall()]
    if taken:
        db.close()
        return response(409, {'error': 'Часть мест уже заняли', 'taken': taken})

    code = order_code()
    qr_url = make_qr(code)
    payment_id, payment_url = create_payment(code, total, email, session['title'], return_url)

    cur.execute(
        "INSERT INTO orders (code, session_id, customer_name, email, phone, seats, total, status, payment_id, payment_url, qr_url) "
        f"VALUES ({esc(code)}, {esc(int(session_id))}, {esc(name)}, {esc(email)}, {esc(phone)}, "
        f"{esc(json.dumps(seats, ensure_ascii=False))}::jsonb, {esc(total)}, 'pending', "
        f"{esc(payment_id)}, {esc(payment_url)}, {esc(qr_url)}) RETURNING id"
    )
    order_id = cur.fetchone()['id']
    for seat_id in seat_ids:
        cur.execute(
            "INSERT INTO booked_seats (session_id, seat_id, order_id) VALUES ("
            f"{esc(int(session_id))}, {esc(seat_id)}, {esc(order_id)}) ON CONFLICT DO NOTHING"
        )
    db.commit()

    starts = session['starts_at']
    when = f"{starts.day} {MONTHS[starts.month - 1]} · {starts.strftime('%H:%M')}"
    order = {'code': code, 'seats': seats, 'total': total}
    html = ticket_html(order, session['title'], when, session['hall_caption'], qr_url, False)
    if payment_url:
        html += (f'<p style="font-family:Arial,sans-serif"><a href="{payment_url}" '
                 f'style="color:#E3C766">Оплатить билеты картой</a></p>')
    sent = send_mail(email, f"Ваши билеты на «{session['title']}»", html)

    admin = os.environ.get('ADMIN_EMAIL', '')
    if admin:
        send_mail(
            admin,
            f"Новая бронь {code} — «{session['title']}»",
            html + f'<p style="font-family:Arial,sans-serif">Зритель: {name}, {email}, {phone}</p>',
        )

    db.close()
    return response(200, {
        'code': code,
        'qrUrl': qr_url,
        'paymentUrl': payment_url,
        'emailSent': sent,
        'status': 'pending',
    })
