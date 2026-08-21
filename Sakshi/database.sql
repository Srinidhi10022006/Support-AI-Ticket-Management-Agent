-- ============================================================
-- Support AI Ticket Management Agent - Database Schema
-- PostgreSQL Database Script
-- ============================================================

-- 1. USERS TABLE
-- Stores all system users (ADMIN and regular USER roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(50) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('USER', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TICKETS TABLE
-- Stores support tickets created by users
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subject VARCHAR(255) NOT NULL,
    issue_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed', 'Escalated')),
    ai_suggestion TEXT,
    employee_name VARCHAR(100),
    jira_issue_key VARCHAR(100),
    jira_issue_url TEXT,
    escalated_at TIMESTAMP,
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. TICKET RESPONSES TABLE
-- Stores AI-generated and Admin responses to tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_responses (
    response_id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    responder_id INTEGER,
    generated_response TEXT NOT NULL,
    response_type VARCHAR(10) DEFAULT 'AI' CHECK (response_type IN ('AI', 'ADMIN')),
    confidence_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_responses_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    CONSTRAINT fk_responses_responder FOREIGN KEY (responder_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 4. ACTIVITY LOGS TABLE
-- Stores every action performed on tickets for audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    performed_by INTEGER NOT NULL,
    remarks TEXT,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    CONSTRAINT fk_activity_user FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
-- Improve query performance on frequently accessed columns
-- ============================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_role ON users(role);

-- Tickets indexes
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_user_status ON tickets(user_id, status);

-- Ticket responses indexes
CREATE INDEX idx_responses_ticket_id ON ticket_responses(ticket_id);
CREATE INDEX idx_responses_responder_id ON ticket_responses(responder_id);
CREATE INDEX idx_responses_type ON ticket_responses(response_type);

-- Activity logs indexes
CREATE INDEX idx_activity_ticket_id ON activity_logs(ticket_id);
CREATE INDEX idx_activity_performed_by ON activity_logs(performed_by);
CREATE INDEX idx_activity_action_time ON activity_logs(action_time DESC);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- 5. Sample ADMIN record
-- Password: admin123 (plain text — matching existing auth logic)
INSERT INTO users (employee_id, full_name, email, password, department, role, created_at)
VALUES ('ADMIN001', 'System Administrator', 'admin@supportai.com', 'admin123', 'IT', 'ADMIN', CURRENT_TIMESTAMP);

-- 6. Sample USER record
-- Password: user123 (plain text — matching existing auth logic)
INSERT INTO users (employee_id, full_name, email, password, department, role, created_at)
VALUES ('EMP001', 'John Doe', 'john@example.com', 'user123', 'Engineering', 'USER', CURRENT_TIMESTAMP);

-- 7. Sample tickets
INSERT INTO tickets (user_id, subject, issue_type, description, priority, status, created_at)
VALUES
(2, 'Cannot access company VPN', 'Network Issue', 'I am unable to connect to the company VPN from my home office. The connection times out every time.', 'High', 'Open', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 'Laptop screen flickering', 'Hardware Issue', 'My laptop screen has started flickering intermittently. It happens every 10-15 minutes.', 'Medium', 'In Progress', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(2, 'Email client not syncing', 'Software Issue', 'Outlook is not syncing emails since yesterday. I have tried restarting but it did not help.', 'Low', 'Open', CURRENT_TIMESTAMP - INTERVAL '12 hours');

-- 8. Sample responses
INSERT INTO ticket_responses (ticket_id, responder_id, generated_response, response_type, confidence_score, created_at)
VALUES
(1, NULL, 'Based on the description, this appears to be a VPN connectivity issue. Suggested steps: 1) Check your internet connection 2) Verify VPN credentials 3) Try connecting from a different network 4) Contact IT if issue persists.', 'AI', 0.92, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, NULL, 'Screen flickering could be caused by: 1) Outdated graphics drivers 2) Display cable loose connection 3) Hardware malfunction. Recommended to run hardware diagnostics.', 'AI', 0.85, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(2, 1, 'Hardware team has been notified. Ticket escalated to Level 2 support for hardware inspection. Screen replacement may be required.', 'ADMIN', NULL, CURRENT_TIMESTAMP),
(3, NULL, 'Email sync issues can often be resolved by: 1) Checking internet connectivity 2) Restarting the mail client 3) Clearing cache 4) Checking server status.', 'AI', 0.78, CURRENT_TIMESTAMP - INTERVAL '12 hours');

-- 9. Sample activity logs
INSERT INTO activity_logs (ticket_id, action, performed_by, remarks, old_status, new_status, action_time)
VALUES
(1, 'Ticket Created', 2, 'Ticket created from user dashboard', NULL, 'Open', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(1, 'AI Suggestion Generated', 2, 'AI analyzed the issue and provided resolution steps', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 'Ticket Created', 2, 'Ticket created from user dashboard', NULL, 'Open', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(2, 'AI Suggestion Generated', 2, 'AI analyzed the issue and provided resolution steps', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(2, 'Admin Assigned', 1, 'Ticket assigned to IT hardware team for inspection', 'Open', 'In Progress', CURRENT_TIMESTAMP),
(2, 'Admin Response Added', 1, 'Admin provided response: Hardware team has been notified', NULL, NULL, CURRENT_TIMESTAMP),
(3, 'Ticket Created', 2, 'Ticket created from user dashboard', NULL, 'Open', CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(3, 'AI Suggestion Generated', 2, 'AI analyzed the issue and provided resolution steps', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '12 hours');

