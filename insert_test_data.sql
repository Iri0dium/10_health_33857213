USE health;

-- Remove old test data so this script can be run again
DELETE FROM workouts;
DELETE FROM users;

-- Reset automatic ID values
ALTER TABLE workouts AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- Default marking account
-- Username: gold
-- Password: smiths123ABC$
INSERT INTO users (username, email, password)
VALUES (
    'gold',
    'gold@gold.ac.uk',
    '$2b$10$GMCoL2sgLgKvRo7w61.6quA/1DifEHQlvgiD65jjZNJXvrXU1fnkm'
);

-- Sample workout records for the gold user
INSERT INTO workouts
(user_id, exercise_name, workout_type, duration, calories, workout_date, notes)
VALUES
(1, 'Morning Run', 'Cardio', 30, 250, '2026-07-20', 'Easy run in the park'),
(1, 'Push Ups', 'Strength', 20, 120, '2026-07-22', 'Three sets of push ups'),
(1, 'Cycling', 'Cardio', 45, 400, '2026-07-24', 'Outdoor cycling session'),
(1, 'Yoga', 'Flexibility', 35, 100, '2026-07-26', 'Relaxing evening yoga'),
(1, 'Swimming', 'Cardio', 40, 320, '2026-07-28', 'Swimming at the local pool');