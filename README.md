# Lolalalolo

Lolalalolo is a health and fitness tracking web application created for the Dynamic Web Applications module.

The application allows users to register, log in and manage their own workout records. Users can add, view, edit, delete and search workouts stored in a MySQL database.

## Features

- Home page
- About page
- User registration
- Login and logout
- Password hashing with bcrypt
- Session-based access control
- Add workout records
- View workout records
- Edit workout records
- Delete workout records
- Search workout records
- Dashboard statistics
- MySQL database storage
- Server-side form validation
- Basic error handling
- Responsive CSS layout

## Technology Stack

The application was built using:

- Node.js
- Express
- EJS
- MySQL
- HTML
- CSS

No front-end frameworks such as React or Angular were used.

## Project Structure

```text
10_health_33857213/
├── index.js
├── package.json
├── package-lock.json
├── create_db.sql
├── insert_test_data.sql
├── links.txt
├── README.md
├── .env.example
├── .gitignore
├── public/
│   └── css/
│       └── style.css
└── views/
    ├── partials/
    │   ├── header.ejs
    │   └── footer.ejs
    ├── index.ejs
    ├── about.ejs
    ├── login.ejs
    ├── register.ejs
    ├── dashboard.ejs
    ├── workouts.ejs
    ├── add-workout.ejs
    ├── edit-workout.ejs
    └── search.ejs
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Iri0dium/10_health_33857213.git
```

2. Open the project directory:

```bash
cd 10_health_33857213
```

3. Install all required modules:

```bash
npm install
```

4. Create the MySQL database and tables by running:

```text
create_db.sql
```

5. Insert the required test data by running:

```text
insert_test_data.sql
```

6. Create a `.env` file in the project root using the following values:

```env
HEALTH_HOST=localhost
HEALTH_USER=health_app
HEALTH_PASSWORD=qwertyuiop
HEALTH_DATABASE=health
HEALTH_BASE_PATH=http://localhost:8000
SESSION_SECRET=replace_with_a_session_secret
```

7. Start the application:

```bash
node index.js
```

8. Open the application in a browser:

```text
http://localhost:8000
```

The application listens on port `8000`.

## Default Login

The default marking account is:

```text
Username: gold
Password: smiths123ABC$
```

This account is inserted by `insert_test_data.sql`.

## Database

The database is called:

```text
health
```

The application uses two tables:

### users

Stores registered user accounts.

Main fields:

- `id`
- `username`
- `email`
- `password`
- `created_at`

### workouts

Stores workout records belonging to users.

Main fields:

- `id`
- `user_id`
- `exercise_name`
- `workout_type`
- `duration`
- `calories`
- `workout_date`
- `notes`
- `created_at`

There is a one-to-many relationship between `users` and `workouts`. One user can have many workout records.

## Main Routes

```text
/                  Home page
/about             About page
/login             Login page
/register          Registration page
/dashboard         User dashboard
/workouts          Workout list
/workouts/add      Add workout form
/search             Search workout records
/logout             Log out
```

The edit and delete routes use the workout ID.

```text
/workouts/edit/:id
/workouts/delete/:id
```

## Validation and Security

The application includes the following security techniques:

- Passwords are hashed using bcrypt.
- Express sessions are used to store login information.
- Private routes are protected by login middleware.
- SQL queries use parameter placeholders.
- Users can only edit or delete their own workout records.
- Registration data is checked using server-side validation.
- Workout duration must be greater than zero.
- Calories cannot be negative.
- Email addresses are validated before registration.

## Search

The search page searches the MySQL database using the workout exercise name and workout type.

The SQL query uses `LIKE` so partial keywords can be used.

Examples:

```text
Run
Cardio
Yoga
```

## Dashboard

The dashboard displays:

- Total number of workouts
- Total workout minutes
- Total calories
- Five most recent workouts

The statistics use MySQL functions including:

```text
COUNT
SUM
COALESCE
ORDER BY
LIMIT
```

## GitHub

Repository:

```text
https://github.com/Iri0dium/10_health_33857213
```

The module tutor should be added as a collaborator using the username:

```text
lfern002
```

## Student

```text
Name: Xiangan XIE
Student ID: 33857213
```

## AI Declaration

Generative AI was used as a development support tool during this assignment. It was used to explain Node.js, Express, EJS and MySQL concepts, assist with debugging, suggest possible code structures and help improve documentation. All code was reviewed, tested and adapted before being included in the application.