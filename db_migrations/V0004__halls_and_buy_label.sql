CREATE TABLE IF NOT EXISTS halls (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    layout JSONB NOT NULL DEFAULT '{"blocks":[]}'::jsonb,
    total_seats INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE shows ADD COLUMN IF NOT EXISTS hall_id INTEGER REFERENCES halls(id);
ALTER TABLE shows ADD COLUMN IF NOT EXISTS buy_label VARCHAR(40) NOT NULL DEFAULT 'Купить';

INSERT INTO halls (name, is_active, layout, total_seats, sort_order) VALUES
('Большой зал', TRUE, '{"blocks":[{"id":"left","position":"left","category":"parter","rows":6,"seatsPerRow":5,"gapAfter":[]},{"id":"right","position":"right","category":"parter","rows":6,"seatsPerRow":5,"gapAfter":[]},{"id":"front","position":"front","category":"amfi","rows":4,"seatsPerRow":10,"gapAfter":[5]}]}'::jsonb, 100, 10),
('Малый зал', TRUE, '{"blocks":[{"id":"left","position":"left","category":"parter","rows":4,"seatsPerRow":4,"gapAfter":[]},{"id":"right","position":"right","category":"parter","rows":4,"seatsPerRow":4,"gapAfter":[]},{"id":"front","position":"front","category":"amfi","rows":2,"seatsPerRow":9,"gapAfter":[4]}]}'::jsonb, 50, 20)
ON CONFLICT DO NOTHING;

UPDATE shows SET hall_id = (SELECT id FROM halls WHERE name = 'Большой зал') WHERE scene = 'Большая сцена' AND hall_id IS NULL;
UPDATE shows SET hall_id = (SELECT id FROM halls WHERE name = 'Малый зал') WHERE scene = 'Малая сцена' AND hall_id IS NULL;
UPDATE shows SET hall_id = (SELECT id FROM halls WHERE name = 'Большой зал') WHERE hall_id IS NULL;
