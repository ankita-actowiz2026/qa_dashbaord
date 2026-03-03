import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

//const uploadPath = path.join(__dirname, "../uploads");
const uploadPath ="uploads"

// Ensure folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage: StorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadPath);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;
    cb(null, uniqueName);
  },
});

export const singleUpload = multer({
  storage,

  limits: { fileSize: 5 * 1024 * 1024 },

  fileFilter: (_req: Request, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp","application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});