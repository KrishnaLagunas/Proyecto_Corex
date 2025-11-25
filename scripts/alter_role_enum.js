require('dotenv').config();
const { sequelize } = require('../src/config/database');

(async () => {
  try {
    console.log('Step 1: Allow both admin and superadmin temporarily...');
    await sequelize.query("ALTER TABLE usuarios MODIFY COLUMN role ENUM('admin','superadmin','funcionario','ciudadano') NOT NULL DEFAULT 'ciudadano'");
    console.log('Step 2: Update rows from admin to superadmin...');
    await sequelize.query("UPDATE usuarios SET role='superadmin' WHERE role='admin'");
    console.log('Step 3: Remove legacy admin from ENUM...');
    await sequelize.query("ALTER TABLE usuarios MODIFY COLUMN role ENUM('superadmin','funcionario','ciudadano') NOT NULL DEFAULT 'ciudadano'");
    const [rows] = await sequelize.query("SELECT role, COUNT(*) as count FROM usuarios GROUP BY role");
    console.log('Role distribution:', rows);
  } catch (e) {
    console.error('Migration error:', e);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
