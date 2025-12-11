import mysql from 'mysql2/promise';

// Basic MySQL connection pool for storing prompts & responses
// Make sure these env vars are set in your .env:
// DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'comic_generation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Insert a chat prompt + response into the `comics` table.
 * Schema is expected to be the one you created in MySQL Workbench.
 */
export async function insertComicPrompt({ promptText, responseData }) {
  // Minimal insert: store user prompt and full response JSON as metadata
  const [result] = await pool.execute(
    `INSERT INTO comics (prompt_text, status, metadata)
     VALUES (?, ?, ?)`,
    [
      promptText,
      'completed',
      responseData ? JSON.stringify(responseData) : null,
    ],
  );

  return result.insertId;
}


