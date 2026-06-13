// server/src/models/Listing.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class Listing extends Model {
  public id!: number;
  public title!: string;
  public price!: number;
  public category!: string;
  public seller_email!: string;
  public seller_phone?: string; // <-- NEW: Added phone number
  public imageUrl!: string; 
}

Listing.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  seller_email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // --- NEW PHONE FIELD ---
  seller_phone: {
    type: DataTypes.STRING,
    allowNull: true, // Set to true so old listings without numbers don't crash
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true, 
  }
}, {
  sequelize,
  tableName: 'listings',
});

export default Listing;