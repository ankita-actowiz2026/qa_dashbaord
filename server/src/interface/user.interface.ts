export default interface IUser {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  status: Status;
  role: string;
  deletedAt?: Date | null;
}
export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive",
}
export enum UserType {
  ADMIN = "Admin",
  QA = "QA",
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
export interface IChangePassword {
  user_id: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
}
export interface IUpdateProfile {
  user_id: string;
  first_name: string;
  last_name: string;
}
