const bcrypt = require('bcryptjs');

async function initDb(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      posting_date TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      contact TEXT NOT NULL,
      contract_type TEXT NOT NULL,
      optional_salary TEXT,
      posting_duration INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PUBLISHED')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY,
      posting_date TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      contact TEXT NOT NULL,
      contract_type TEXT NOT NULL,
      optional_salary TEXT,
      posting_duration INTEGER NOT NULL,
      published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      source_submission_id INTEGER,
      FOREIGN KEY(source_submission_id) REFERENCES submissions(id)
    );
  `);

  const adminUsername = process.env.ADMIN_USER || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn('ADMIN_PASSWORD is not set. Login will not be possible until it is configured.');
  } else {
    const existing = await db.get('SELECT id FROM users WHERE username = ?', adminUsername);
    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await db.run(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        adminUsername,
        passwordHash,
        'ADMIN'
      );
      console.info(`Admin user \"${adminUsername}\" created.`);
    }
  }

  const jobsCount = await db.get('SELECT COUNT(*) as total FROM jobs');
  if (jobsCount.total === 0) {
    const sampleJobs = [
      ['2026-01-10', 'Frontend Developer', 'MarTech Studio', 'Santos', 'Rua A, 10', 'hr@martech.com', 'CLT', 'R$ 5.000', 30],
      ['2026-01-11', 'Backend Engineer', 'Blue API', 'Praia Grande', 'Av. Brasil, 222', 'jobs@blueapi.com', 'PJ', 'R$ 7.000', 45],
      ['2026-01-12', 'QA Analyst', 'SafeTest', 'Guarujá', 'Rua das Flores, 50', 'qa@safetest.com', 'CLT', null, 20],
      ['2026-01-13', 'Product Designer', 'Pixel Coast', 'São Vicente', 'Av. Central, 88', 'talent@pixelcoast.com', 'CLT', 'R$ 6.000', 30],
      ['2026-01-14', 'DevOps Engineer', 'Cloud Harbor', 'Cubatão', 'Rua Porto, 8', 'devops@cloudharbor.com', 'PJ', null, 60],
      ['2026-01-15', 'Data Analyst', 'Insight Wave', 'Santos', 'Rua B, 12', 'careers@insightwave.com', 'CLT', 'R$ 4.500', 30],
      ['2026-01-16', 'Support Specialist', 'AtendeJá', 'Praia Grande', 'Av. Mar, 100', 'rh@atendeja.com', 'CLT', null, 15]
    ];

    for (const job of sampleJobs) {
      await db.run(
        `INSERT INTO jobs (posting_date, title, company, city, address, contact, contract_type, optional_salary, posting_duration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ...job
      );
    }
  }

  const submissionsCount = await db.get("SELECT COUNT(*) as total FROM submissions WHERE status = 'PENDING'");
  if (submissionsCount.total === 0) {
    await db.run(
      `INSERT INTO submissions (posting_date, title, company, city, address, contact, contract_type, optional_salary, posting_duration, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      '2026-02-01',
      'Marketing Assistant',
      'Litoral Ads',
      'Santos',
      'Rua Propaganda, 5',
      'contato@litoralads.com',
      'CLT',
      'R$ 3.200',
      20
    );
  }

}

module.exports = { initDb };
