UPDATE sessions SET hall_caption = 'Задние ряды' WHERE hall_caption = 'Амфитеатр';
UPDATE sessions SET hall_caption = 'Партер и задние ряды' WHERE hall_caption IN ('Партер и балкон', 'Партер и бельэтаж');
