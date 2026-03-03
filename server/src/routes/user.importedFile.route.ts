import express, { Request, Response, NextFunction } from "express";
import { importedFileController } from '../controllers/user.importedFile.controller'
import { validateAdd, isRequestValidated, validateEdit, validateId } from '../validations/user.importedFile.validations'

import multer from "multer";

// Configure multer for large file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 2048 * 1024 * 1024 // 2GB limit for large files
  },
});

const importedFileRouter = express.Router()
import authentication from "../middleware/auth.middleware"

// Middleware to set extended timeout for large file processing
const setExtendedTimeout = (req: Request, res: Response, next: NextFunction) => {
  // Set to 30 minutes (1800000ms)
  req.setTimeout(30 * 60 * 1000);
  res.setTimeout(30 * 60 * 1000);
  
  // Also disable socket timeouts
  (req.socket as any)?.setTimeout(30 * 60 * 1000);
  (res.socket as any)?.setTimeout(30 * 60 * 1000);
  
  next();
};

// Import file upload endpoint
importedFileRouter.post('/', 
  setExtendedTimeout,
  authentication,
  upload.single("file"),  
  importedFileController.addImportedFile
)

// importedFileRouter.get('/', authentication, importedFileController.getImportedFiles)
// importedFileRouter.get('/:id', authentication, validateId, importedFileController.getImportedFile)

export default importedFileRouter;