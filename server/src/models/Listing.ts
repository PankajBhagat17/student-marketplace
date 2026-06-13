// server/src/models/Listing.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class Listing extends Model {
  public id!: number;
  public title!: string;
  public price!: number;
  public category!: string;
  public seller_email!: string;
  public imageUrl!: string; // <-- NEW: Added image URL
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
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true, // true, so users can still post without an image if they want
  }
}, {
  sequelize,
  tableName: 'listings',
});

export default Listing;