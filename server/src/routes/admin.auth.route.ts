const express = require("express");
const adminAuthRouter = express.Router();
import {
  validateLogin,
  isRequestValidated,
  changePasswordValidator,
  updateProfileValidator,
} from "../validations/admin.auth.validations";
import authentication from "../middleware/auth.middleware";
import { authController } from "../controllers/admin.auth.controller";

adminAuthRouter.post(
  "/login",
  validateLogin,
  isRequestValidated,
  authController.login,
);
adminAuthRouter.post("/logout", authController.logout);
adminAuthRouter.get("/profile", authentication, authController.profile);
adminAuthRouter.post(
  "/change_password",
  authentication,
  isRequestValidated,
  changePasswordValidator,
  authController.changePassword,
);
adminAuthRouter.post(
  "/update_profile",
  authentication,
  isRequestValidated,
  updateProfileValidator,
  authController.updateProfile,
);
export default adminAuthRouter;
