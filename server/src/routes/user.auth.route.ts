import express from "express";
import {authController}  from '../controllers/user.auth.controller'
import { validateLogin, validateRegister ,isRequestValidated } from '../validations/user.auth.validations'
import { singleUpload } from "../middleware/singleupload.middleware";
import authentication from "../middleware/auth.middleware"

const authRouter = express.Router()

authRouter.post('/login', validateLogin, isRequestValidated, authController.login)
authRouter.post("/logout",authentication, isRequestValidated, authController.logout);
authRouter.get("/profile", authentication, authController.profile);

export default authRouter;