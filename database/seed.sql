USE relay_db;
INSERT IGNORE INTO users (name, email, username, password_hash, role) VALUES ('System Admin', 'admin@example.com', 'admin', '$2b$12$replace-with-a-real-bcrypt-hash', 'ADMIN');
