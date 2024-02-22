const pg = require('pg');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const connectionString = process.env.DATABASE_URL || 'postgres://localhost/the_acme_notes_db';
const client = new pg.Client(connectionString);

async function initializeDatabase() {
    try {
        await client.connect();
        console.log('Connected to database');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS flavors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                is_favorite BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await client.query(createTableQuery);

        const seedDataQuery = `
            INSERT INTO flavors (name, is_favorite) VALUES
            ('Chocolate', true),
            ('Vanilla', false),
            ('Strawberry', true);
        `;
        await client.query(seedDataQuery);

        console.log('Database initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

app.use(express.json());

app.get('/api/flavors', async (req, res, next) => {
    try {
        const query = 'SELECT * FROM flavors;';
        const { rows } = await client.query(query);
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

app.get('/api/flavors/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM flavors WHERE id = $1;';
        const { rows } = await client.query(query, [id]);
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

app.post('/api/flavors', async (req, res, next) => {
    try {
        const { name, is_favorite } = req.body;
        const query = 'INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *;';
        const { rows } = await client.query(query, [name, is_favorite]);
        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
});

app.delete('/api/flavors/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM flavors WHERE id = $1;';
        await client.query(query, [id]);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

app.put('/api/flavors/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, is_favorite } = req.body;
        const query = 'UPDATE flavors SET name = $1, is_favorite = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *;';
        const { rows } = await client.query(query, [name, is_favorite, id]);
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    initializeDatabase();
});
