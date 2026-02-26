# Vagas Litoral MVP

A secure MVP web app to publish job openings in a blog-style homepage.

## Features

- Public homepage showing **published job postings** with all requested fields:
  - `id`, `posting_date`, `title`, `company`, `city`, `address`, `contact`, `contract_type`, `optional_salary`, `posting_duration`
- Pagination with **6 jobs per page**.
- A dedicated page with only a link to a Google Form for collecting submissions.
- Secure admin panel with:
  - Username/password authentication
  - Password hashing (`bcryptjs`)
  - Session-based auth (`express-session` + SQLite session store)
  - Access control middleware for admin-only routes
  - CSRF protection (`csurf`)
  - Secure headers (`helmet`)
  - Login rate limiting (`express-rate-limit`)
- Manual publication workflow:
  - Admin reviews pending submissions
  - Admin clicks "Publish" to move posting to public homepage

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Update `.env` with secure values:

- `SESSION_SECRET`: long random string
- `ADMIN_USER`: your admin username
- `ADMIN_PASSWORD`: your admin password
- `GOOGLE_FORM_URL`: the Google Form URL people should use

4. Run app:

```bash
npm start
```

## URLs

- Home page: `http://localhost:3000/`
- Submission info page: `http://localhost:3000/submit-info`
- Admin login: `http://localhost:3000/admin/login`
- Admin dashboard: `http://localhost:3000/admin`

## Notes

- On first run, database and tables are auto-created under `src/db/`.
- If there are no jobs, sample data is auto-seeded to demonstrate pagination and moderation.
- If `ADMIN_PASSWORD` is not set, admin login is intentionally unavailable until configured.
