import express from "express";
import { authentication } from "../middleware/auth.middleware";
import { body, param, validationResult } from "express-validator";
import {
  getErrorLogById,
 
} from "../controllers/admin.errorLog.controller";

const errorLogRouter = express.Router();

// GET BY ID
errorLogRouter.get(
  "/:fileName",
  authentication, 
  getErrorLogById,
);

// UPDATE


export default errorLogRouter;
