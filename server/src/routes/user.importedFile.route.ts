import express, { Request, Response, NextFunction } from "express";
import { addImportedFile } from "../controllers/user.importedFile.controller";
///import { readHeaders } from "../controllers/user.onlyHeader1";

import { upload } from "../middleware/upload.middleware";
const importedFileRouter = express.Router();
// Import file upload endpoint
importedFileRouter.post("/", upload.single("file"), addImportedFile);
//importedFileRouter.post("/readHeaders", upload.single("file"), readHeaders);

export default importedFileRouter;
