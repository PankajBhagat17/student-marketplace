// server/src/models/Category.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class Category extends Model {}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // e.g., "engineering-textbooks"
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true, // Null means it's a top-level category
    },
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
  }
);

export default Category;