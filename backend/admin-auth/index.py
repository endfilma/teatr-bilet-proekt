import hashlib
import json
import os

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
}


def handler(event: dict, context) -> dict:
    """Вход администратора театра: проверяет пароль и выдаёт токен доступа к разделу управления."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'isBase64Encoded': False, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    password = str(body.get('password', ''))
    secret = os.environ.get('ADMIN_PASSWORD', '')

    if not secret:
        return {
            'statusCode': 503,
            'headers': {**CORS, 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Пароль администратора ещё не задан'}, ensure_ascii=False),
        }

    if password != secret:
        return {
            'statusCode': 401,
            'headers': {**CORS, 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Неверный пароль'}, ensure_ascii=False),
        }

    token = hashlib.sha256(('helios::' + secret).encode()).hexdigest()
    return {
        'statusCode': 200,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps({'token': token}, ensure_ascii=False),
    }
