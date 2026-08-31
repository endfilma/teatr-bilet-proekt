CREATE TABLE IF NOT EXISTS site_sections (
    id SERIAL PRIMARY KEY,
    key VARCHAR(40) UNIQUE NOT NULL,
    label VARCHAR(120) NOT NULL,
    anchor VARCHAR(60) NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 100
);

INSERT INTO site_sections (key, label, anchor, sort_order) VALUES
('afisha', 'Афиша', 'afisha', 10),
('repertuar', 'Репертуар', 'repertuar', 20),
('bilety', 'Билеты', 'bilety', 30),
('truppa', 'Труппа', 'truppa', 40),
('novosti', 'Новости', 'novosti', 50),
('kontakty', 'Контакты', 'kontakty', 60)
ON CONFLICT (key) DO NOTHING;
