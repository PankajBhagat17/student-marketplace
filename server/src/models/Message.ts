// server/src/models/Message.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class Message extends Model {
  public id!: number;
  public listing_id!: number;
  public sender_email!: string;
  public receiver_email!: string;
  public content!: string;
  public readonly createdAt!: Date;
}

Message.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  listing_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sender_email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  receiver_email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'Message',
  tableName: 'messages'
});

export default Message;