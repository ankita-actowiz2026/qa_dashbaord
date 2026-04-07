import express from "express";
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
  body("user_id").notEmpty().withMessage("user_id is required"),
  body("file_name")
    .notEmpty()
    .withMessage("file_name is required"),
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
const idValidator = [
  param("id").isMongoId().withMessage("Invalid ID"),
];


// 🔥 ROUTES

// CREATE
router.post("/", createValidator, validateRequest, createFileRules);

// GET ALL
router.get("/", getAllFileRules);

// GET BY ID
router.get("/:id", idValidator, validateRequest, getFileRulesById);

// UPDATE
router.put("/:id", updateValidator, validateRequest, updateFileRules);

// DELETE
router.delete("/:id", idValidator, validateRequest, deleteFileRules);

export default router;