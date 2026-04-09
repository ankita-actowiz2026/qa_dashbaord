import { body, param } from "express-validator";

export const createValidationRuleValidator = [
  body("user_id").notEmpty().withMessage("user_id is required"),
  body("file_name")
    .notEmpty()
    .withMessage("file_name is required"),
  body("rules").notEmpty().withMessage("rules is required"),
];

export const updateValidationRuleValidator = [
  param("id").isMongoId().withMessage("Invalid ID"),
  body("file_name")
    .optional()
    .notEmpty()
    .withMessage("file_name cannot be empty"),
];

export const idValidator = [
  param("id").isMongoId().withMessage("Invalid ID"),
];