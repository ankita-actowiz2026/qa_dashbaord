export default interface IPost {
  title: string;
  email:string;
  description: string;
  author: string;
  published: boolean;
  option_type:string;
  skills:string[];
  tags:string[];
  createdAt:Date;
}


export interface GetPostsQuery {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}