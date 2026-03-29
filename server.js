const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const xss = require('xss');
const { body, validationResult } = require('express-validator');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
}
testConnection();

// ==================== AUTHENTICATION ROUTES ====================

// Check if student ID exists
app.get('/api/auth/check-id/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT student_id FROM users WHERE student_id = ?',
            [req.params.id]
        );
        res.json({ exists: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if phone exists
app.get('/api/auth/check-phone/:phone', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT phone FROM users WHERE phone = ?',
            [req.params.phone]
        );
        res.json({ exists: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if email exists
app.get('/api/auth/check-email/:email', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT email FROM users WHERE email = ?',
            [req.params.email]
        );
        res.json({ exists: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User signup// User signup
app.post('/api/auth/signup', [
    body('student_id').notEmpty().withMessage('Student ID is required').isLength({ min: 6, max: 20 }).withMessage('Student ID must be 6-20 characters'),
    body('name').notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('department').notEmpty().withMessage('Department is required').isIn([
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
    ]).withMessage('Invalid department selected'),
    body('phone').notEmpty().withMessage('Phone number is required').matches(/^\+8801[3-9]\d{8}$/).withMessage('Phone number must be in format +8801XXXXXXXXX'),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { student_id, name, department, phone, email, password } = req.body;

    try {
        // Check for duplicates
        const [existing] = await pool.query(
            'SELECT student_id, phone, email FROM users WHERE student_id = ? OR phone = ? OR email = ?',
            [student_id, phone, email]
        );

        if (existing.length > 0) {
            const duplicate = existing[0];
            if (duplicate.student_id === student_id) {
                return res.status(400).json({ error: 'Student ID already exists' });
            }
            if (duplicate.phone === phone) {
                return res.status(400).json({ error: 'Phone number already registered' });
            }
            if (duplicate.email === email) {
                return res.status(400).json({ error: 'Email already registered' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.query(
            'INSERT INTO users (student_id, name, department, phone, email, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
            [student_id, name, department, phone, email, hashedPassword]
        );

        res.status(201).json({ 
            message: 'User created successfully',
            user_id: result.insertId 
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User login
app.post('/api/auth/login', async (req, res) => {
    const { student_id, password } = req.body;

    try {
        const [rows] = await pool.query(
            'SELECT user_id, student_id, name, department, phone, email, password_hash, role FROM users WHERE student_id = ?',
            [student_id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Remove password hash from response
        delete user.password_hash;
        
        res.json({ 
            message: 'Login successful',
            user: user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== EVENT ROUTES ====================

// Get all events
app.get('/api/events', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM events ORDER BY event_date ASC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM events WHERE event_id = ?',
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== USER ROUTES ====================

// Get user profile
app.get('/api/user/profile/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT user_id, student_id, name, department, phone, email, role FROM users WHERE user_id = ?',
            [req.params.userId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's registered events
app.get('/api/user/events/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT e.*, r.registration_date 
             FROM registrations r 
             JOIN events e ON r.event_id = e.event_id 
             WHERE r.user_id = ?`,
            [req.params.userId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's payment history with pagination
app.get('/api/user/payment-history/:userId', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    try {
        // Get total count
        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM payments WHERE user_id = ?',
            [req.params.userId]
        );
        const total = countResult[0].total;
        
        // Get payments
        const [payments] = await pool.query(
            `SELECT p.*, 
                    GROUP_CONCAT(e.event_name SEPARATOR ', ') as event_names
             FROM payments p
             LEFT JOIN payment_events pe ON p.payment_id = pe.payment_id
             LEFT JOIN events e ON pe.event_id = e.event_id
             WHERE p.user_id = ?
             GROUP BY p.payment_id
             ORDER BY p.payment_date DESC
             LIMIT ? OFFSET ?`,
            [req.params.userId, limit, offset]
        );
        
        res.json({
            payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== PAYMENT ROUTES ====================

// Verify transaction ID uniqueness
app.get('/api/payments/verify-tsid/:tsid', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT transaction_id FROM payments WHERE transaction_id = ?',
            [req.params.tsid]
        );
        res.json({ exists: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit payment
app.post('/api/payments/submit', [
    body('user_id').isInt(),
    body('payment_method').isIn(['bkash', 'nagad']),
    body('account_number').matches(/^\+8801[3-9]\d{8}$/),
    body('transaction_id').isLength({ min: 8, max: 20 }),
    body('total_amount').isFloat({ min: 0 }),
    body('event_ids').isArray().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, payment_method, account_number, transaction_id, total_amount, event_ids } = req.body;
    
    console.log('Received payment request:', { user_id, payment_method, account_number, transaction_id, total_amount, event_ids });

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Check if transaction ID already exists
        const [existing] = await connection.query(
            'SELECT transaction_id FROM payments WHERE transaction_id = ?',
            [transaction_id]
        );
        
        if (existing.length > 0) {
            await connection.rollback();
            console.log('Transaction ID already exists:', transaction_id);
            return res.status(400).json({ error: 'Transaction ID already exists' });
        }
        
        // Create payment record
        const [paymentResult] = await connection.query(
            'INSERT INTO payments (user_id, payment_method, account_number, transaction_id, total_amount, status) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, payment_method, account_number, transaction_id, total_amount, 'pending']
        );
        
        const payment_id = paymentResult.insertId;
        console.log('Payment created with ID:', payment_id);
        
        // Link events to payment
        for (const event_id of event_ids) {
            await connection.query(
                'INSERT INTO payment_events (payment_id, event_id) VALUES (?, ?)',
                [payment_id, event_id]
            );
            console.log('Linked event:', event_id);
        }
        
        await connection.commit();
        console.log('Payment transaction committed successfully');
        
        res.status(201).json({ 
            message: 'Payment submitted successfully',
            payment_id: payment_id
        });
    } catch (error) {
        await connection.rollback();
        console.error('Payment submission error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    } finally {
        connection.release();
    }
});

// ==================== ADMIN ROUTES ====================

// Get all events (admin)
app.get('/api/admin/events', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM events ORDER BY event_date DESC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create event
app.post('/api/admin/events', [
    body('event_name').notEmpty().isLength({ max: 100 }),
    body('event_price').isFloat({ min: 0 }),
    body('event_date').isDate(),
    body('event_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('event_description').optional()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { event_name, event_price, event_date, event_time, event_description } = req.body;
    
    try {
        const [result] = await pool.query(
            'INSERT INTO events (event_name, event_price, event_date, event_time, event_description) VALUES (?, ?, ?, ?, ?)',
            [event_name, event_price, event_date, event_time, event_description || '']
        );
        
        res.status(201).json({ 
            message: 'Event created successfully',
            event_id: result.insertId
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update event
app.put('/api/admin/events/:id', [
    body('event_name').notEmpty().isLength({ max: 100 }),
    body('event_price').isFloat({ min: 0 }),
    body('event_date').isDate(),
    body('event_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('event_description').optional()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { event_name, event_price, event_date, event_time, event_description } = req.body;
    
    try {
        const [result] = await pool.query(
            'UPDATE events SET event_name = ?, event_price = ?, event_date = ?, event_time = ?, event_description = ? WHERE event_id = ?',
            [event_name, event_price, event_date, event_time, event_description || '', req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete event
app.delete('/api/admin/events/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM events WHERE event_id = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all payments with filters
app.get('/api/admin/payments', async (req, res) => {
    const { status } = req.query;
    let query = `
        SELECT p.*, u.name, u.student_id, u.phone, u.email,
               GROUP_CONCAT(e.event_name SEPARATOR ', ') as event_names
        FROM payments p
        JOIN users u ON p.user_id = u.user_id
        LEFT JOIN payment_events pe ON p.payment_id = pe.payment_id
        LEFT JOIN events e ON pe.event_id = e.event_id
    `;
    const params = [];
    
    if (status) {
        query += ' WHERE p.status = ?';
        params.push(status);
    }
    
    query += ' GROUP BY p.payment_id ORDER BY p.payment_date DESC';
    
    try {
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify payment (accept/reject)
app.put('/api/admin/payments/:id/verify', [
    body('status').isIn(['confirmed', 'error']),
    body('feedback').optional()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { status, feedback } = req.body;
    const payment_id = req.params.id;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Get payment details
        const [paymentRows] = await connection.query(
            'SELECT * FROM payments WHERE payment_id = ?',
            [payment_id]
        );
        
        if (paymentRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        const payment = paymentRows[0];
        
        // Update payment status
        await connection.query(
            'UPDATE payments SET status = ?, admin_feedback = ? WHERE payment_id = ?',
            [status, feedback || null, payment_id]
        );
        
        // If confirmed, register user for events
        if (status === 'confirmed') {
            const [eventRows] = await connection.query(
                'SELECT event_id FROM payment_events WHERE payment_id = ?',
                [payment_id]
            );
            
            for (const event of eventRows) {
                await connection.query(
                    'INSERT IGNORE INTO registrations (user_id, event_id) VALUES (?, ?)',
                    [payment.user_id, event.event_id]
                );
            }
        }
        
        await connection.commit();
        res.json({ message: 'Payment verified successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Payment verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// Get admin payment info
app.get('/api/admin/payment-info', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM admin_payment_info WHERE is_active = TRUE'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get dashboard statistics
app.get('/api/admin/dashboard/stats', async (req, res) => {
    try {
        const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        const [totalPayments] = await pool.query('SELECT COUNT(*) as count, SUM(total_amount) as total FROM payments WHERE status = "confirmed"');
        const [pendingPayments] = await pool.query('SELECT COUNT(*) as count FROM payments WHERE status = "pending"');
        const [eventStats] = await pool.query(`
            SELECT e.event_id, e.event_name, COUNT(r.registration_id) as registrations
            FROM events e
            LEFT JOIN registrations r ON e.event_id = r.event_id
            GROUP BY e.event_id
        `);
        
        res.json({
            totalUsers: totalUsers[0].count,
            totalPayments: totalPayments[0].count,
            totalAmount: totalPayments[0].total || 0,
            pendingPayments: pendingPayments[0].count,
            eventStats: eventStats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get club content
app.get('/api/content/club-info', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT content_html FROM club_content WHERE content_key = "club-info"'
        );
        res.json({ content: rows[0]?.content_html || '' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update club content (admin only)
app.put('/api/content/club-info', [
    body('content').notEmpty(),
    body('user_id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { content, user_id } = req.body;
    const sanitizedContent = xss(content);
    
    try {
        await pool.query(
            'UPDATE club_content SET content_html = ?, updated_by = ? WHERE content_key = "club-info"',
            [sanitizedContent, user_id]
        );
        
        res.json({ message: 'Content updated successfully' });
    } catch (error) {
        console.error('Update content error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` Frontend: http://localhost:${PORT}`);
    console.log(` Admin: http://localhost:${PORT}/admin/dashboard.html`);
});