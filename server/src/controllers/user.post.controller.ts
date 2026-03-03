import { Request, Response, NextFunction } from "express";
import { postService } from "../services/user.post.service";
import  IPost , {GetPostsQuery}  from "../interface/post.interface";
import { Types } from "mongoose";

class PostController {
  addPost = async (req: Request<{}, {}, IPost>, res: Response, next: NextFunction): Promise<void> => {
    try {     
      const post = await postService.createPost(req.body);
      res.status(201).json({"success":true,"message":"Post created successfully","data":post});
    } catch (error) {         
      next(error);
    }
  };

  getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {     
      const posts = await postService.getPosts();
      res.status(200).json({success: true,data: posts});
    } catch (error) {
      next(error);
    }
  };

  getPost = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;     
      const post = await postService.getPost(id);
      res.status(200).json({success: true,data: post});
    } catch (error) {
      next(error); 
    }
};
 getPostsWithPagination = async (req: Request, res: Response) => {
  const query: GetPostsQuery = {
    search: req.query.search as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as 'asc' | 'desc',
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10,
  };

  const posts = await postService.getPostsWithPagination(query);
  res.json(posts);
};
  updatePost = async (req: Request<{ id: string }, {}, Partial<IPost>>, res: Response, next: NextFunction): Promise<void> => {
    try {      
      const post = await postService.updatePost(req.params.id, req.body);
      res.status(200).json({"success":true,"message":"Post updated successfully","data":post});
    } catch (error) {
      next(error);
    }
  };

  deletePost = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {     
      await postService.deletePost(req.params.id);     
      res.status(200).json({"success":true,"message":"Post deleted successfully","data":[]});
    } catch (error) {
      next(error);
    }
  };

  testPost= async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await postService.testPost(req.body.id);
      res.status(200).json({"success":true,"message":"Post deleted successfully","data":data});
    } catch (error) {
      next(error);
    }
  };
}
export const postController = new PostController();
