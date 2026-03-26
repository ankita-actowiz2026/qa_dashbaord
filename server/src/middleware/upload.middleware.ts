import multer from "multer";
import path from "path";
import fs from "fs";
const uploadDir = "uploads/";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ✅ Create folder if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const allowedExtensions = [".xlsx", ".xls", ".csv", ".json"];

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only .xlsx, .xls, .csv, .json files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
  },
});
