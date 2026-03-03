import  {Schema, model,} from 'mongoose'
import  IRefreshToken  from "../interface/refresh.interface";
const refreshSchema = new Schema<IRefreshToken>({  
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
});
const RefreshToken = model<IRefreshToken>('RefreshToken', refreshSchema )
export default RefreshToken
