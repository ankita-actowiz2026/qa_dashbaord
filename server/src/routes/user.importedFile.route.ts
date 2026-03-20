import express, { Request, Response, NextFunction } from "express";
import { importFileController } from "../controllers/user.importedFile.controller";
import { upload } from "../middleware/upload.middleware";
const importedFileRouter = express.Router();

importedFileRouter.post(
  "/",
  upload.single("file"),
  importFileController.addImportedFile,
);

importedFileRouter.post(
  "/read_header",
  upload.single("file"),
  importFileController.readHeader,
);

export default importedFileRouter;
