const db = require('./config/db');
let bcrypt;
try { bcrypt = require('bcryptjs'); } catch (e) { bcrypt = require('bcrypt'); }

const users = [
  ['admin',  'admin@test.com',  'admin'],
  ['adrien', 'adrien@test.com', 'employee'],
  ['Keryl',  'Keryl@test.com',  'employee']
];

(async () => {
  try {
    const hash = await bcrypt.hash('123456', 10);
    for (const [username, email, role] of users) {
      await db.query(
        'INSERT IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hash, role]
      );
    }
    const [rows] = await db.query('SELECT id, username, email, role FROM users');
    console.table(rows);
  } catch (e) {
    console.error('❌ Seed failed:', e.message);
  } finally {
    await db.end();
    process.exit(0);
  }
})();
