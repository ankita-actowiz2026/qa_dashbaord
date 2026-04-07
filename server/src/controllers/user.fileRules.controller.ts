import { Request, Response, NextFunction } from "express";
import { FileRules } from "../models/fileRules.model";

// ✅ CREATE
export const createFileRules = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id, feed_name, file_name, rules } = req.body;

    const response = await FileRules.create({
      user_id,
      feed_name: feed_name || null,
      file_name,
      rules,
    });

    res.status(200).json({
      success: true,
      message: "File rules created successfully",
      data: response,
    });
  } catch (error: any) {
    next(error);
  }
};

// ✅ GET ALL
export const getAllFileRules = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await FileRules.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "File rules fetched successfully",
      data: response,
    });
  } catch (error: any) {
    next(error);
  }
};

// ✅ GET BY ID
export const getFileRulesById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const response = await FileRules.findById(id);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "File rules not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "File rules fetched successfully",
      data: response,
    });
  } catch (error: any) {
    next(error);
  }
};

// ✅ UPDATE
export const updateFileRules = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const response = await FileRules.findByIdAndUpdate(
      id,
      {
        ...req.body,
      },
      { new: true }
    );

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "File rules not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "File rules updated successfully",
      data: response,
    });
  } catch (error: any) {
    next(error);
  }
};

// ✅ DELETE
export const deleteFileRules = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const response = await FileRules.findByIdAndDelete(id);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "File rules not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "File rules deleted successfully",
      data: response,
    });
  } catch (error: any) {
    next(error);
  }
};