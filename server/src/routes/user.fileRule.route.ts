import express from "express";
import { authentication } from "../middleware/auth.middleware";
import { body, param, validationResult } from "express-validator";
import {
  createFileRules,
  getAllFileRules,
  getFileRulesById,
  updateFileRules,
  deleteFileRules,
} from "../controllers/user.fileRules.controller";

const router = express.Router();

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
router.post(
  "/",
  authentication,
  createValidator,
  validateRequest,
  createFileRules,
);

// GET ALL
router.get("/", authentication, getAllFileRules);

// GET BY ID
router.get(
  "/:id",
  authentication,
  idValidator,
  validateRequest,
  getFileRulesById,
);

// UPDATE
router.put(
  "/:id",
  authentication,
  updateValidator,
  validateRequest,
  updateFileRules,
);

// DELETE
router.delete(
  "/:id",
  authentication,
  idValidator,
  validateRequest,
  deleteFileRules,
);

export default router;
