import express from "express";
import { importedFileController } from '../controllers/user.importedFile.controller'
import { validateAdd, isRequestValidated, validateEdit, validateId } from '../validations/user.importedFile.validations'

import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // allow bigger file
});

const importedFileRouter = express.Router()
import authentication from "../middleware/auth.middleware"
importedFileRouter.post('/', authentication,upload.single("file"),  importedFileController.addImportedFile)
// importedFileRouter.get('/', authentication, importedFileController.getImportedFiles)
// importedFileRouter.get('/:id', authentication, validateId, importedFileController.getImportedFile)

export default importedFileRouter;