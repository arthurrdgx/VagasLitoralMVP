require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const csrf = require('csurf');
const { createDbConnection } = require('./db/database');
const { initDb } = require('./db/init');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const PORT = parseInt(process.env.PORT, 10) || 3000;

async function bootstrap() {
  const app = express();
  const db = await createDbConnection();
  await initDb(db);

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(
    session({
      store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'db') }),
      name: 'sid',
      secret: process.env.SESSION_SECRET || 'unsafe-dev-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 8
      }
    })
  );

  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  app.use(csrf());

  app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    res.locals.currentUser = req.session.user || null;
    next();
  });

  app.use('/', publicRoutes);
  app.use('/admin', adminRoutes);

  app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
      return res.status(403).send('Invalid CSRF token.');
    }

    console.error(err);
    return res.status(500).send('Internal Server Error');
  });

  app.listen(PORT, () => {
    console.info(`Server listening on http://localhost:${PORT}`);
  });
}

bootstrap();
