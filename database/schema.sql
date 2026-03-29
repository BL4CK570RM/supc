DROP DATABASE IF EXISTS science_fest_2026;
CREATE DATABASE science_fest_2026;
USE science_fest_2026;

-- Users Table with updated department enum
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department ENUM(
        'BSc in CSE',
        'BSc in Civil Engineering',
        'BSc in EEE',
        'BSc in Mechanical Engineering',
        'BSc in Textile Engineering',
        'BSc in Naval Architecture & Marine Engineering',
        'BSc in Fashion Design & Technology',
        'BSc in Apparel Manufacture & Technology',
        'Bachelor of Architecture',
        'Bachelor of Business Administration (BBA)',
        'Bachelor of Laws (LLB)',
        'BA (Hons) in Bangla'
    ) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    event_name VARCHAR(100) NOT NULL,
    event_price DECIMAL(10,2) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    event_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
    registration_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (user_id, event_id)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    payment_method ENUM('bkash', 'nagad') NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(20) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'error') DEFAULT 'pending',
    admin_feedback TEXT,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Payment Events Junction Table
CREATE TABLE IF NOT EXISTS payment_events (
    payment_event_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id INT NOT NULL,
    event_id INT NOT NULL,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

-- Club Content Table
CREATE TABLE IF NOT EXISTS club_content (
    content_id INT PRIMARY KEY AUTO_INCREMENT,
    content_key VARCHAR(50) UNIQUE NOT NULL,
    content_html TEXT NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Admin Payment Info Table
CREATE TABLE IF NOT EXISTS admin_payment_info (
    info_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_method ENUM('bkash', 'nagad') NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert admin user (password: admin123)
INSERT INTO users (student_id, name, department, phone, email, password_hash, role) 
VALUES ('ADMIN001', 'Admin User', 'BSc in CSE', '+8801234567890', 'admin@sciencefest.com', 
'$2b$10$YourHashedPasswordHere', 'admin');

-- Insert sample events
INSERT INTO events (event_name, event_price, event_date, event_time, event_description) VALUES
('Robotics Competition', 500.00, '2026-03-15', '10:00:00', 'Showcase your robotics skills'),
('Programming Contest', 300.00, '2026-03-16', '09:00:00', 'Algorithm and coding competition'),
('Science Quiz', 200.00, '2026-03-17', '14:00:00', 'Test your science knowledge'),
('Project Showcase', 400.00, '2026-03-18', '11:00:00', 'Present your innovative projects');

-- Insert admin payment info
INSERT INTO admin_payment_info (payment_method, account_number, is_active) VALUES
('bkash', '+8801234567890', TRUE),
('nagad', '+8809876543210', TRUE);

-- Insert club content
INSERT INTO club_content (content_key, content_html) VALUES 
('club-info', '<h2>Welcome to Science Fest 2026</h2><p>Join us for an exciting journey into science and technology!</p><p>This annual event brings together students from all departments to showcase their talents.</p>');