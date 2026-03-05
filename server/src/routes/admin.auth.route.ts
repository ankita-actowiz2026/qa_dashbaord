const express = require("express");
const adminAuthRouter = express.Router()
import { validateLogin, isRequestValidated } from '../validations/admin.auth.validations'
import authentication from "../middleware/auth.middleware"

import  {authController} from '../controllers/admin.auth.controller'

adminAuthRouter.post("/login",validateLogin, isRequestValidated, authController.login);
adminAuthRouter.post("/logout", authController.logout)
adminAuthRouter.get("/me", authentication, authController.me);
export default adminAuthRouter;