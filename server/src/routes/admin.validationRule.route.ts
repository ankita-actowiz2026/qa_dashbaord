import express from "express";
import { authentication } from "../middleware/auth.middleware";
import { body, param, validationResult } from "express-validator";
import {
  createValidationRule,
  getAllValidationRules,
  getValidationRulesById,
  updateValidationRule,
  deleteValidationRule,
} from "../controllers/admin.validationRule.controller";

const validateRuleRouter = express.Router();

// ✅ VALIDATION HANDLER
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }
  next();
};

// ✅ CREATE VALIDATOR
const createValidator = [
  body("feed_name").notEmpty().withMessage("feed name is required"),
  body("file_name").notEmpty().withMessage("file name is required"),
  body("rules").notEmpty().withMessage("rules is required"),
];

// ✅ UPDATE VALIDATOR
const updateValidator = [
  param("id").isMongoId().withMessage("Invalid ID"),
  body("file_name")
    .optional()
    .notEmpty()
    .withMessage("file_name cannot be empty"),
];

// ✅ ID VALIDATOR
const idValidator = [param("id").isMongoId().withMessage("Invalid ID")];

// 🔥 ROUTES

// CREATE
validateRuleRouter.post(
  "/",
  authentication,
  createValidator,
  validateRequest,
  createValidationRule,
);

// GET ALL
validateRuleRouter.get("/", authentication, getAllValidationRules);

// GET BY ID
validateRuleRouter.get(
  "/:id",
  authentication,
  idValidator,
  validateRequest,
  getValidationRulesById,
);

// UPDATE
validateRuleRouter.put(
  "/:id",
  authentication,
  updateValidator,
  validateRequest,
  updateValidationRule,
);

// DELETE
validateRuleRouter.delete(
  "/:id",
  authentication,
  idValidator,
  validateRequest,
  deleteValidationRule,
);

export default validateRuleRouter;
