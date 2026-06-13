// server/src/database.ts
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// If we are on Render (which provides a DATABASE_URL), use the cloud database with SSL. 
// Otherwise, fall back to your local PostgreSQL database.
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // This line is critical for Render/Neon!
        }
      },
      logging: false
    })
  : new Sequelize('pccoe_marketplace', 'postgres', 'my_super_secret_production_key_2026', {
      host: 'localhost',
      dialect: 'postgres',
      logging: false
    });

export default sequelize;