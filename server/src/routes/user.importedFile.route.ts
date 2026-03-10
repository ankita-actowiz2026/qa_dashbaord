import express, { Request, Response, NextFunction } from "express";
import { addImportedFile } from "../controllers/user.importedFile.controller";
import { upload } from "../middleware/upload.middleware";
const importedFileRouter = express.Router();
// Import file upload endpoint
importedFileRouter.post("/", upload.single("file"), addImportedFile);

export default importedFileRouter;
