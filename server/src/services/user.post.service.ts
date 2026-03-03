import Post from "../models/post.model";
import  IPost  from "../interface/post.interface";
import  ApiError  from "../utils/api.error";
import { Types } from "mongoose";

export class PostService {
  async createPost(data: IPost): Promise<IPost> {

    const email = data.email.toLowerCase().trim();    
    const existing = await Post.findOne({ email: email });    
    if(existing){          
      throw new ApiError("Email already used", 409);     
    }    
    return Post.create({
      title: data.title,
      email:data.email,
      description: data.description,
      author: data.author,
      published: data.published,
      option_type: data.option_type,
      skills:Array.isArray(data.skills) ? data.skills : [],
      tags:Array.isArray(data.tags) ? data.tags : [],
      createdAt:new Date()
    });
  }

  async getPosts(): Promise<IPost[]> {
    return Post.find().sort({_id:-1});
  }
 async getPostsWithPagination(query: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const {
    search = '',
    page = 1,
    limit = 10,
    sortBy = '_id',
    sortOrder = 'desc',
  } = query;

  const skip = (page - 1) * limit;

  // 🔍 Search condition
  const searchQuery = search
    ? {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  // 🔃 Sorting
  const sortOptions: any = {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
  };

  // 📄 Fetch data
  const [data, total] = await Promise.all([
    Post.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),

    Post.countDocuments(searchQuery),
  ]);

  return {
    data,
    total,
    page,
    limit,
  };
}
  async getPost(id: string): Promise<IPost | null> {   
    if (!Types.ObjectId.isValid(id)) { 
        throw new ApiError("Invalid post id", 400);            
      }
    const post = await Post.findById(id);
    if (!post) {        
        throw new ApiError("Post not found", 404);
    }
    return post;
  }

  async updatePost(id: string, data: Partial<IPost>): Promise<IPost | null> {
    if (!Types.ObjectId.isValid(id)) { 
        throw new ApiError("Invalid post id", 400);            
      }
      if (data.email) {
        const exists = await Post.findOne({ email: data.email, _id: { $ne: id } });
        if (exists) {
          throw new ApiError("Email already used", 409);
        }
      }  
    const post = await Post.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });   
    if (!post) {
      throw new ApiError("Post not found", 404);
    }
    return post;
  }
  
  async deletePost(id: string): Promise<IPost | null> {
    if (!Types.ObjectId.isValid(id)) { 
        throw new ApiError("Invalid post id", 400);            
    }
    const post = await Post.findByIdAndDelete(id);
    if (!post) {
     throw new ApiError("Post not found", 404);
    }
    return post
  }
  async testPost(id: string): Promise<IPost | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid post id", 400);
    }

    const data = await Post.findById(id); 
    if (!data) 
      throw new ApiError("Post not found", 404);
    
    return data;
  }
}
export const postService = new PostService();
