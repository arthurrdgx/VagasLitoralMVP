const express = require('express');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const perPage = 6;
    const offset = (page - 1) * perPage;

    const total = await req.db.get('SELECT COUNT(*) as total FROM jobs');

    const jobs = await req.db.all(
      `SELECT id, posting_date, title, company, city, address, contact, contract_type, optional_salary, posting_duration
       FROM jobs
       ORDER BY posting_date DESC, id DESC
       LIMIT ? OFFSET ?`,
      perPage,
      offset
    );

    const totalPages = Math.max(Math.ceil(total.total / perPage), 1);

    res.render('home', {
      jobs,
      page,
      totalPages
    });
  } catch (error) {
    next(error);
  }
});

router.get('/submit-info', (req, res) => {
  res.render('submit-info', {
    googleFormUrl: process.env.GOOGLE_FORM_URL || 'https://forms.gle/your-form-id'
  });
});

module.exports = router;
