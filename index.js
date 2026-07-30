// Load values from the .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

const app = express();

const port = 8000;

// Use EJS as the view engine
app.set('view engine', 'ejs');

// Read data submitted from HTML forms
app.use(express.urlencoded({ extended: false }));

// Allow the browser to access files inside the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Create login sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 600000
        }
    })
);

// Connect to the health database
const db = mysql.createPool({
    host: process.env.HEALTH_HOST,
    user: process.env.HEALTH_USER,
    password: process.env.HEALTH_PASSWORD,
    database: process.env.HEALTH_DATABASE
});

// Test the database connection
db.getConnection(function (err, connection) {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to the health database');
        connection.release();
    }
});

// Home page
app.get('/', function (req, res) {
    res.send(`
        <h1>Lolalalolo</h1>
        <p>A simple health and fitness tracking application.</p>
        <p><a href="/about">About</a></p>
    `);
});

// Make login information available in all EJS pages
app.use(function (req, res, next) {
    res.locals.loggedIn = Boolean(req.session.userId);
    res.locals.username = req.session.username || null;
    next();
});

// Home page
app.get('/', function (req, res) {
    res.render('index', {
        loggedIn: Boolean(req.session.userId)
    });
});

// About page
app.get('/about', function (req, res) {
    res.render('about', {
        loggedIn: Boolean(req.session.userId)
    });
});

// Check whether a user is logged in
function redirectLogin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    next();
}

// Process the login form
app.post('/login', function (req, res, next) {
    const username = req.body.username;
    const password = req.body.password;

    // Find the user using a parameterised SQL query
    const sql = `
        SELECT *
        FROM users
        WHERE username = ?
    `;

    db.query(sql, [username], function (err, results) {
        if (err) {
            return next(err);
        }

        if (results.length === 0) {
            return res.render('login', {
                loggedIn: false,
                error: 'Incorrect username or password.'
            });
        }

        const user = results[0];

        // Compare the submitted password with the stored bcrypt hash
        bcrypt.compare(password, user.password, function (compareErr, same) {
            if (compareErr) {
                return next(compareErr);
            }

            if (!same) {
                return res.render('login', {
                    loggedIn: false,
                    error: 'Incorrect username or password.'
                });
            }

            // Store the logged-in user in the session
            req.session.userId = user.id;
            req.session.username = user.username;

            res.redirect('/dashboard');
        });
    });
});

// Add a workout to the database
app.post('/workouts/add', redirectLogin, function (req, res, next) {
    const exerciseName = req.body.exercise_name;
    const workoutType = req.body.workout_type;
    const duration = parseInt(req.body.duration);
    const calories = parseInt(req.body.calories) || 0;
    const workoutDate = req.body.workout_date;
    const notes = req.body.notes;

    // Basic server-side validation
    if (
        !exerciseName ||
        !workoutType ||
        !workoutDate ||
        Number.isNaN(duration) ||
        duration <= 0 ||
        calories < 0
    ) {
        return res.render('add-workout', {
            loggedIn: true,
            error: 'Please enter valid workout information.'
        });
    }

    const sql = `
        INSERT INTO workouts
        (
            user_id,
            exercise_name,
            workout_type,
            duration,
            calories,
            workout_date,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        req.session.userId,
        exerciseName,
        workoutType,
        duration,
        calories,
        workoutDate,
        notes
    ];

    db.query(sql, values, function (err) {
        if (err) {
            return next(err);
        }

        res.redirect('/workouts');
    });
});

// Dashboard page with simple workout statistics
app.get('/dashboard', redirectLogin, function (req, res, next) {
    const statisticsSql = `
        SELECT
            COUNT(*) AS total_workouts,
            COALESCE(SUM(duration), 0) AS total_minutes,
            COALESCE(SUM(calories), 0) AS total_calories
        FROM workouts
        WHERE user_id = ?
    `;

    const recentSql = `
        SELECT *
        FROM workouts
        WHERE user_id = ?
        ORDER BY workout_date DESC
        LIMIT 5
    `;

    db.query(
        statisticsSql,
        [req.session.userId],
        function (statisticsError, statisticsResults) {
            if (statisticsError) {
                return next(statisticsError);
            }

            db.query(
                recentSql,
                [req.session.userId],
                function (recentError, recentResults) {
                    if (recentError) {
                        return next(recentError);
                    }

                    res.render('dashboard', {
                        loggedIn: true,
                        username: req.session.username,
                        statistics: statisticsResults[0],
                        recentWorkouts: recentResults
                    });
                }
            );
        }
    );
});

// Log the user out
app.get('/logout', redirectLogin, function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            return res.redirect('/dashboard');
        }

        res.redirect('/');
    });
});

// Show all workouts belonging to the logged-in user
app.get('/workouts', redirectLogin, function (req, res, next) {
    const sql = `
        SELECT *
        FROM workouts
        WHERE user_id = ?
        ORDER BY workout_date DESC
    `;

    db.query(sql, [req.session.userId], function (err, results) {
        if (err) {
            return next(err);
        }

        res.render('workouts', {
            loggedIn: true,
            workouts: results
        });
    });
});

// Show the add workout form
app.get('/workouts/add', redirectLogin, function (req, res) {
    res.render('add-workout', {
        loggedIn: true,
        error: null
    });
});

// Show the edit form for one workout
app.get('/workouts/edit/:id', redirectLogin, function (req, res, next) {
    const workoutId = req.params.id;

    const sql = `
        SELECT *
        FROM workouts
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        sql,
        [workoutId, req.session.userId],
        function (err, results) {
            if (err) {
                return next(err);
            }

            if (results.length === 0) {
                return res.status(404).send('Workout not found.');
            }

            res.render('edit-workout', {
                loggedIn: true,
                workout: results[0],
                error: null
            });
        }
    );
});

// Update one workout
app.post('/workouts/edit/:id', redirectLogin, function (req, res, next) {
    const workoutId = req.params.id;
    const exerciseName = req.body.exercise_name;
    const workoutType = req.body.workout_type;
    const duration = parseInt(req.body.duration);
    const calories = parseInt(req.body.calories) || 0;
    const workoutDate = req.body.workout_date;
    const notes = req.body.notes;

    if (
        !exerciseName ||
        !workoutType ||
        !workoutDate ||
        Number.isNaN(duration) ||
        duration <= 0 ||
        calories < 0
    ) {
        return res.render('edit-workout', {
            loggedIn: true,
            workout: {
                id: workoutId,
                exercise_name: exerciseName,
                workout_type: workoutType,
                duration: duration,
                calories: calories,
                workout_date: workoutDate,
                notes: notes
            },
            error: 'Please enter valid workout information.'
        });
    }

    const sql = `
        UPDATE workouts
        SET exercise_name = ?,
            workout_type = ?,
            duration = ?,
            calories = ?,
            workout_date = ?,
            notes = ?
        WHERE id = ?
        AND user_id = ?
    `;

    const values = [
        exerciseName,
        workoutType,
        duration,
        calories,
        workoutDate,
        notes,
        workoutId,
        req.session.userId
    ];

    db.query(sql, values, function (err) {
        if (err) {
            return next(err);
        }

        res.redirect('/workouts');
    });
});

// Delete one workout
app.post('/workouts/delete/:id', redirectLogin, function (req, res, next) {
    const workoutId = req.params.id;

    const sql = `
        DELETE FROM workouts
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        sql,
        [workoutId, req.session.userId],
        function (err) {
            if (err) {
                return next(err);
            }

            res.redirect('/workouts');
        }
    );
});

// Search workout records in the database
app.get('/search', redirectLogin, function (req, res, next) {
    const keyword = req.query.keyword || '';

    // Show the search page before the form is submitted
    if (typeof req.query.keyword === 'undefined') {
        return res.render('search', {
            loggedIn: true,
            keyword: '',
            searched: false,
            workouts: []
        });
    }

    const searchTerm = `%${keyword}%`;

    const sql = `
        SELECT *
        FROM workouts
        WHERE user_id = ?
        AND (
            exercise_name LIKE ?
            OR workout_type LIKE ?
        )
        ORDER BY workout_date DESC
    `;

    db.query(
        sql,
        [req.session.userId, searchTerm, searchTerm],
        function (err, results) {
            if (err) {
                return next(err);
            }

            res.render('search', {
                loggedIn: true,
                keyword: keyword,
                searched: true,
                workouts: results
            });
        }
    );
});

// Show the registration page
app.get('/register', function (req, res) {
    res.render('register', {
        loggedIn: Boolean(req.session.userId),
        errors: [],
        formData: {}
    });
});

// Create a new user account
app.post(
    '/register',
    [
        body('username')
            .trim()
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters.'),

        body('email')
            .trim()
            .isEmail()
            .withMessage('Please enter a valid email address.')
            .normalizeEmail(),

        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must contain at least 8 characters.')
            .matches(/[a-z]/)
            .withMessage('Password must contain a lowercase letter.')
            .matches(/[A-Z]/)
            .withMessage('Password must contain an uppercase letter.')
            .matches(/[0-9]/)
            .withMessage('Password must contain a number.')
            .matches(/[^A-Za-z0-9]/)
            .withMessage('Password must contain a special character.')
    ],
    function (req, res, next) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('register', {
                loggedIn: false,
                errors: errors.array(),
                formData: {
                    username: req.body.username,
                    email: req.body.email
                }
            });
        }

        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;

        // Check whether the username or email already exists
        const checkSql = `
            SELECT id
            FROM users
            WHERE username = ?
            OR email = ?
        `;

        db.query(checkSql, [username, email], function (checkError, results) {
            if (checkError) {
                return next(checkError);
            }

            if (results.length > 0) {
                return res.render('register', {
                    loggedIn: false,
                    errors: [
                        {
                            msg: 'That username or email is already registered.'
                        }
                    ],
                    formData: {
                        username: username,
                        email: email
                    }
                });
            }

            // Hash the password before storing it
            bcrypt.hash(password, 10, function (hashError, hashedPassword) {
                if (hashError) {
                    return next(hashError);
                }

                const insertSql = `
                    INSERT INTO users (username, email, password)
                    VALUES (?, ?, ?)
                `;

                db.query(
                    insertSql,
                    [username, email, hashedPassword],
                    function (insertError) {
                        if (insertError) {
                            return next(insertError);
                        }

                        res.redirect('/login');
                    }
                );
            });
        });
    }
);

// 404
app.use(function (req, res) {
    res.status(404).send('<h1>404 - Page not found</h1>');
});

// 500 error
app.use(function (err, req, res, next) {
    console.error(err);

    res.status(500).send(`
        <h1>500 - Server error</h1>
        <p>Something went wrong. Please try again.</p>
        <p><a href="/">Return home</a></p>
    `);
});

// Start the application on port 8000
app.listen(port, function () {
    console.log(`Lolalalolo is running on http://localhost:${port}`);
});