CREATE TABLE users (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(16) NOT NULL,
    email VARCHAR(254) NOT NULL,
    role VARCHAR(8) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE applications (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    course VARCHAR(180) NOT NULL,
    start_date DATE NOT NULL,
    payment VARCHAR(12) NOT NULL CHECK (payment IN ('cash', 'transfer')),
    status VARCHAR(16) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed')),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    application_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    FOREIGN KEY (application_id) REFERENCES applications(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
