CREATE TABLE IF NOT EXISTS shows (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(80) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    scene VARCHAR(60) NOT NULL DEFAULT 'Большая сцена',
    genre VARCHAR(60) NOT NULL DEFAULT 'Драма',
    meta VARCHAR(200) NOT NULL DEFAULT '',
    annotation TEXT NOT NULL DEFAULT '',
    director VARCHAR(200) NOT NULL DEFAULT '',
    price_from INTEGER NOT NULL DEFAULT 800,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    show_id INTEGER NOT NULL REFERENCES shows(id),
    starts_at TIMESTAMP NOT NULL,
    hall_caption VARCHAR(120) NOT NULL DEFAULT 'Партер',
    price_from INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_show ON sessions(show_id);
CREATE INDEX IF NOT EXISTS idx_sessions_starts ON sessions(starts_at);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    code VARCHAR(24) UNIQUE NOT NULL,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    customer_name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(60) NOT NULL,
    seats JSONB NOT NULL DEFAULT '[]',
    total INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_id VARCHAR(120),
    payment_url TEXT,
    qr_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS booked_seats (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    seat_id VARCHAR(20) NOT NULL,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, seat_id)
);

INSERT INTO shows (slug, title, scene, genre, meta, annotation, director, price_from, sort_order) VALUES
('groza', 'Гроза', 'Большая сцена', 'Драма', 'Драма · 2 ч 20 мин · 16+', 'Пьеса Островского в прочтении, где город Калинов становится тесной комнатой без окон. Спектакль идёт с одним антрактом.', 'Реж. Артём Верещагин', 800, 10),
('udar', 'Солнечный удар', 'Малая сцена', 'Классика', 'Моноспектакль · 1 ч 40 мин · 18+', 'Бунинская новелла на двоих: актёр, свет и пароходный гудок. Играется без антракта, зал на 120 мест.', 'Реж. Ирина Соловьёва', 1200, 20),
('kot', 'Кот в сапогах', 'Большая сцена', 'Детям', 'Для детей · 1 ч 10 мин · 6+', 'Музыкальная сказка с живым оркестром, тремя переодеваниями и котом, который умеет разговаривать со зрителем.', 'Реж. Павел Гринько', 600, 30),
('revizor', 'Ревизор', 'Большая сцена', 'Комедия', 'Комедия · 2 ч 40 мин · 12+', 'Гоголь без пыли: чиновники в стеклянном кабинете, а Хлестаков приезжает на самокате. Два антракта.', 'Реж. Артём Верещагин', 900, 40),
('vishnya', 'Вишнёвый сад', 'Большая сцена', 'Классика', 'Комедия · 2 ч 50 мин · 16+', 'Чехов, сыгранный как семейный вечер, который никак не может закончиться. Премьера сезона 2025/2026.', 'Реж. Ирина Соловьёва', 1000, 50),
('malenkiy-princ', 'Маленький принц', 'Малая сцена', 'Детям', 'Для семьи · 1 ч 20 мин · 6+', 'Сент-Экзюпери с теневым театром и песком: планеты появляются прямо на глазах у зрителей.', 'Реж. Павел Гринько', 700, 60)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO sessions (show_id, starts_at, hall_caption)
SELECT id, TIMESTAMP '2026-09-12 19:00', 'Партер' FROM shows WHERE slug = 'groza'
UNION ALL SELECT id, TIMESTAMP '2026-09-14 18:30', 'Амфитеатр' FROM shows WHERE slug = 'udar'
UNION ALL SELECT id, TIMESTAMP '2026-09-19 12:00', 'Партер и балкон' FROM shows WHERE slug = 'kot'
UNION ALL SELECT id, TIMESTAMP '2026-09-21 19:00', 'Партер' FROM shows WHERE slug = 'revizor'
UNION ALL SELECT id, TIMESTAMP '2026-09-27 18:00', 'Партер и бельэтаж' FROM shows WHERE slug = 'vishnya'
UNION ALL SELECT id, TIMESTAMP '2026-09-28 11:00', 'Амфитеатр' FROM shows WHERE slug = 'malenkiy-princ'
UNION ALL SELECT id, TIMESTAMP '2026-10-04 19:00', 'Партер' FROM shows WHERE slug = 'groza'
UNION ALL SELECT id, TIMESTAMP '2026-10-11 18:00', 'Партер и бельэтаж' FROM shows WHERE slug = 'vishnya';
