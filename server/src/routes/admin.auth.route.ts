const express = require("express");
const adminAuthRouter = express.Router()
import { validateLogin, isRequestValidated } from '../validations/admin.auth.validations'

import  {authController} from '../controllers/admin.auth.controller'

adminAuthRouter.post("/login",validateLogin, isRequestValidated, authController.login);
adminAuthRouter.post("/logout", authController.logout)

export default adminAuthRouter;