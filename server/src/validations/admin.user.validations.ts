import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import  ApiError  from "../utils/api.error";
import { param } from "express-validator";

export const validateId = [
  param("id").isMongoId().withMessage("Invalid ID"),
];
export const validateAdd = [
  body("name").trim().notEmpty().withMessage("name is required"),
  body("email").trim().notEmpty().withMessage("email is required")
               .isEmail().withMessage("Invalid email format"),
  body("password").trim().notEmpty().withMessage("password is required"),
  body("status").trim().notEmpty().withMessage("status is required"),
];
export const validateEdit = [
  body("name").trim().notEmpty().withMessage("name is required"),  
  body("status").trim().notEmpty().withMessage("status is required"),
];
export const isRequestValidated = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(errors.array().map(e => e.msg).join(", "),422);            
  }
  next();
};
