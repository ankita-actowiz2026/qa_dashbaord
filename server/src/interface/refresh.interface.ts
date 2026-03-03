import { Types } from 'mongoose';

export default interface IRefreshToken {
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
}

