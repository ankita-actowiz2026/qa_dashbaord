import express, { Request, Response, NextFunction } from "express";
import { importFileController } from "../controllers/user.importedFile.controller";
import { upload } from "../middleware/upload.middleware";
import { authentication } from "../middleware/auth.middleware";
const importedFileRouter = express.Router();

importedFileRouter.post(
  "/",
  authentication,
  importFileController.addImportedFile,
);

importedFileRouter.post(
  "/read_header",
  upload.single("file"),
  authentication,
  importFileController.readHeader,
);
importedFileRouter.get(
  "/validation-response/:fileName",
  authentication,
  importFileController.validationResponse,
);
importedFileRouter.get(
  "/download/:fileName",
  authentication,
  importFileController.downloadFile,
);

export default importedFileRouter;
