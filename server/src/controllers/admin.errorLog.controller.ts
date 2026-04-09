import { Request, Response, NextFunction } from "express";
import { errorLog } from "../models/errorLog";

// ✅ GET BY ID
export const getErrorLogById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
     const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({ message: "fileName is required" });
    }

    const data = await errorLog.findOne({ fileName }).lean();

    if (!data) {
      return res.status(404).json({ message: "No errors found for this file" });
    }

    return res.status(200).json({
      fileName: data.fileName,
      totalErrors: data.errors?.length || 0,
      errors: data.errors || [],
    });
  } catch (error: any) {
    next(error);
  }
};

