import  {Schema, model,} from 'mongoose'
import  IUser, {Status,UserType}  from "../interface/user.interface";

const userSchema = new Schema<IUser>({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },    
    status: {
        type: String,
        enum: Object.values(Status), 
        default: Status.ACTIVE,
    }, 
    role: {
      type: String,
      enum: Object.values(UserType),
      default: UserType.QA,      
    },
     deletedAt: {
      type: Date,
      default: null,
    },
},{ timestamps: true })
 const User = model<IUser>('User', userSchema )
 export default User