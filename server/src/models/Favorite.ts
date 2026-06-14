// server/src/models/Favorite.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class Favorite extends Model {
  public id!: number;
  public user_email!: string;
  public listing_id!: number;
}

Favorite.init({
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  user_email: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  listing_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  }
}, {
  sequelize,
  tableName: 'favorites',
});

export default Favorite;