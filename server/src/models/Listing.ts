// server/src/models/Listing.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class Listing extends Model {
  public id!: number;
  public title!: string;
  public price!: number;
  public category!: string;
  public seller_email!: string;
  public seller_phone?: string; 
  public imageUrl!: string; 
  public status!: string; // <-- NEW
}

Listing.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  seller_email: { type: DataTypes.STRING, allowNull: false },
  seller_phone: { type: DataTypes.STRING, allowNull: true },
  imageUrl: { type: DataTypes.STRING, allowNull: true },
  // --- NEW STATUS FIELD ---
  status: {
    type: DataTypes.STRING,
    defaultValue: 'available',
  }
}, {
  sequelize,
  tableName: 'listings',
});

export default Listing;