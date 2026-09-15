CREATE TABLE IF NOT EXISTS booking_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    name_required BOOLEAN NOT NULL DEFAULT TRUE,
    email_required BOOLEAN NOT NULL DEFAULT TRUE,
    phone_required BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO booking_settings (id, name_required, email_required, phone_required)
VALUES (1, TRUE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;
