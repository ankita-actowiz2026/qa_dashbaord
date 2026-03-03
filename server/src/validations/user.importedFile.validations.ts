import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import Post from "../models/importedFile.model";
import  ApiError  from "../utils/api.error";
import { param } from "express-validator";

export const validateId = [
  param("id").isMongoId().withMessage("Invalid ID"),
];
export const validateAdd = [
];
export const validateEdit = [
];
export const isRequestValidated = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(errors.array().map(e => e.msg).join(", "),422);            
  }
  next();
};
