const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again later.'
});

router.get('/login', (req, res) => {
  res.render('admin/login', { error: null });
});

router.post(
  '/login',
  loginLimiter,
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).render('admin/login', { error: errors.array()[0].msg });
      }

      const { username, password } = req.body;
      const user = await req.db.get('SELECT * FROM users WHERE username = ?', username);
      if (!user) {
        return res.status(401).render('admin/login', { error: 'Invalid credentials.' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).render('admin/login', { error: 'Invalid credentials.' });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      return req.session.save(() => res.redirect('/admin'));
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sid');
    res.redirect('/admin/login');
  });
});

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const pendingSubmissions = await req.db.all(
      `SELECT id, posting_date, title, company, city, address, contact, contract_type, optional_salary, posting_duration, created_at
       FROM submissions
       WHERE status = 'PENDING'
       ORDER BY created_at DESC`
    );

    res.render('admin/dashboard', {
      pendingSubmissions,
      user: req.session.user
    });
  } catch (error) {
    next(error);
  }
});

router.post('/publish/:id', requireAdmin, async (req, res, next) => {
  try {
    const submissionId = parseInt(req.params.id, 10);
    if (!Number.isInteger(submissionId)) {
      return res.status(400).send('Invalid submission id.');
    }

    const submission = await req.db.get(
      `SELECT id, posting_date, title, company, city, address, contact, contract_type, optional_salary, posting_duration, status
       FROM submissions WHERE id = ?`,
      submissionId
    );

    if (!submission || submission.status !== 'PENDING') {
      return res.status(404).send('Submission not found or already published.');
    }

    await req.db.run('BEGIN');
    await req.db.run(
      `INSERT INTO jobs (id, posting_date, title, company, city, address, contact, contract_type, optional_salary, posting_duration, source_submission_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      submission.id,
      submission.posting_date,
      submission.title,
      submission.company,
      submission.city,
      submission.address,
      submission.contact,
      submission.contract_type,
      submission.optional_salary,
      submission.posting_duration,
      submission.id
    );

    await req.db.run("UPDATE submissions SET status = 'PUBLISHED' WHERE id = ?", submission.id);
    await req.db.run('COMMIT');

    return res.redirect('/admin');
  } catch (error) {
    await req.db.run('ROLLBACK');
    return next(error);
  }
});

module.exports = router;
