export interface IPost {
  _id:string;
  title: string;
  email: string;
  description: string;
  author: string;
  published: boolean;
  option_type: string;
  skills: string[];
  tags: string[];
  createdAt: Date;
}
