import  {Schema, model,} from 'mongoose'
import  IPost  from "../interface/post.interface";

const postSchema = new Schema<IPost>({
    title: {
        type: String,
    },
    email: {
        type: String,
    },
    description: {
        type: String,
    },
    author: {
        type: String,
    },
    published: {
        type: Boolean,
        default: false
    },   
    option_type: {
        type: String,
    },
    skills :[String],
    tags:[String],
    createdAt: {
        type: Date,
        default: Date.now
}
//, { timestamps: true });
})
 const Post = model<IPost>('Post', postSchema )
 export default Post