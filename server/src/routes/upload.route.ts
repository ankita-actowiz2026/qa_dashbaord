import express from "express";
import { upload } from "../middleware/upload.middleware";
import { parseExcelFile } from "../services/parseExcel.service";

const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File not uploaded" });
    }

    const result = await parseExcelFile(req.file.path);

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
