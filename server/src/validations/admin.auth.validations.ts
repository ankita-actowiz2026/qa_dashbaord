import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import ApiError from "../utils/api.error";

export const validateLogin = [
  body("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
];
export const updateProfileValidator = [
  body("first_name").notEmpty().withMessage("First name is required"),

  body("last_name").notEmpty().withMessage("Last name is required"),
];
export const changePasswordValidator = [
  body("user_id").notEmpty().withMessage("User ID is required"),

  body("current_password")
    .notEmpty()
    .withMessage("Current password is required"),

  body("new_password")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("confirm_password")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];
export const isRequestValidated = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(errors.array()[0].msg, 422);
  }
  next();
};
