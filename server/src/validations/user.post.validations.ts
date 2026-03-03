import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import Post from "../models/post.model";
import  ApiError  from "../utils/api.error";
import { param } from "express-validator";

export const validateId = [
  param("id").isMongoId().withMessage("Invalid ID"),
];
export const validateAdd = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("email").trim().notEmpty().withMessage("email is required")
               .isEmail().withMessage("Invalid email format"),
  // body("email").notEmpty().withMessage("email is required")
  //              .isEmail().withMessage("Invalid email format")
  //              .custom(async (value) => {
  //               const existingUser = await Post.findOne({ email: value });
  //               if (existingUser) {
  //                 throw new Error("Email already exists");
  //               }
  //               return true;
  //              }),
  body("author").trim().notEmpty().withMessage("Author Name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("published").isBoolean().withMessage("Published is required"),
  body("option_type").trim().notEmpty().withMessage("Option Type is required"),
  body("skills").isArray({ min: 1 }).withMessage("Skills must be array with at least 1 item"),
  body("skills.*").trim().notEmpty().withMessage("Skill items cannot be empty"),
  body("tags").isArray({ min: 1 }).withMessage("Tags must be array with at least 1 item"),
  body("tags.*").trim().notEmpty().withMessage("Tag items cannot be empty"),
];
export const validateEdit = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("email").trim().notEmpty().withMessage("email is required")
              .isEmail().withMessage("Invalid email format"),
  // body("email").notEmpty().withMessage("email is required")
  //              .isEmail().withMessage("Invalid email format")
  //              .custom(async (value, { req }) => {
  //               const id = req?.params?.id;
  //                 const existingUser = await Post.findOne({
  //                   email: value,
  //                   _id: { $ne: id }, 
  //                 });
  //                 if (existingUser) {
  //                   throw new Error("Email already exists");
  //                 }
  //                 return true;
  //               }),
  body("author").trim().notEmpty().withMessage("Author Name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("published").isBoolean().withMessage("Published is required"),
  body("option_type").trim().notEmpty().withMessage("Option Type is required"),
  body("skills").isArray({ min: 1 }).withMessage("Skills must be array with at least 1 item"),
  body("skills.*").trim().notEmpty().withMessage("Skill items cannot be empty"),
  body("tags").isArray({ min: 1 }).withMessage("Tags must be array with at least 1 item"),
  body("tags.*").trim().notEmpty().withMessage("Tag items cannot be empty"),
];
export const isRequestValidated = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(errors.array().map(e => e.msg).join(", "),422);            
  }
  next();
};
