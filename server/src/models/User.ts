// server/src/models/User.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class User extends Model {
  // TypeScript declaration so the server knows this property exists
  public phone_number?: string; 
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    college_domain: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Stored separately (e.g. 'mit.edu') to easily gate features by school"
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // --- NEW PHONE NUMBER FIELD ---
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true, // Set to true so older users without phone numbers don't break the database
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true, // Automatically adds createdAt and updatedAt columns
  }
);

export default User;