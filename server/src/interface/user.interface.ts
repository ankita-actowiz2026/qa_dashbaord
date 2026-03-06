export default interface IUser {
  name: string;
  email:string,
  password: string,
  status: Status,
  role:string,
  deletedAt?: Date | null;
}
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
export enum UserType {
  ADMIN = 'Admin',
  QA = 'QA',
}

export interface ILoginResponse {
  //user: Omit<IUser, "password">;
  user: IUser;
  userToken: string;
}
export interface ILoginResponseAdmin {
  //user: Omit<IUser, "password">;
  user: IUser;
  adminToken: string;  
}
export interface ILogin {
  email: string;
  password: string;
}