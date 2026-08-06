CREATE TABLE observations (
    id          VARCHAR(50)  PRIMARY KEY,
    hazard      VARCHAR(255),
    status      VARCHAR(100),
    dept        VARCHAR(255),
    description TEXT,
    obs_time    DATETIME,
    submitter   VARCHAR(100),
    obs_type    VARCHAR(255),
    area        VARCHAR(255),
    sub_area    VARCHAR(255),
    who         VARCHAR(500),
    measures    TEXT,
    photos      JSON,
    ai_category    VARCHAR(50),
    ai_category_cn VARCHAR(50),
    ai_confidence  VARCHAR(10),
    ai_method      VARCHAR(50),
    ai_reasoning   TEXT,
    ai_analyzed_at DATETIME,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_obs_time (obs_time),
    INDEX idx_area (area),
    INDEX idx_hazard (hazard),
    INDEX idx_status (status)
);

CREATE TABLE safety_awards (
    id          VARCHAR(50) PRIMARY KEY,
    score       INT DEFAULT 0,
    level       VARCHAR(20) DEFAULT 'normal',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE feedback (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    type        VARCHAR(20),
    content     TEXT NOT NULL,
    contact     VARCHAR(100),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL
);

-- Default admin: admin / admin123
-- BCrypt hash of "admin123" (10 rounds)
INSERT INTO admin_users (username, password) VALUES ('admin', '$2b$10$dVm9ACRbO2R5SWz37Oy6x.hQ5nT4Ug3Rs7LOM3XyvS.g1XySJJqka');
