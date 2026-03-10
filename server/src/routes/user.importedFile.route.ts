import express, { Request, Response, NextFunction } from "express";
import { addImportedFile } from "../controllers/user.importedFile.controller";
import {
  validateAdd,
  isRequestValidated,
  validateEdit,
  validateId,
} from "../validations/user.importedFile.validations";

import multer from "multer";

// Configure multer for large file uploads
export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./uploads");
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
  limits: {
    fileSize: 2048 * 1024 * 1024, // 2GB limit for large files
  },
});

const importedFileRouter = express.Router();
import authentication from "../middleware/auth.middleware";

// Middleware to set extended timeout for large file processing
const setExtendedTimeout = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const timeout = 30 * 60 * 1000;

  req.setTimeout(timeout);
  res.setTimeout(timeout);

  if (req.socket) req.socket.setTimeout(timeout);
  if (res.socket) res.socket.setTimeout(timeout);

  next();
};

// Import file upload endpoint
importedFileRouter.post(
  "/",
  setExtendedTimeout,
  authentication,
  upload.single("file"),
  addImportedFile,
);

export default importedFileRouter;
