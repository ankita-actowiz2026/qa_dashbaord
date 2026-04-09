import { Request, Response, NextFunction } from "express";
import { ValidationRule } from "../models/validationRule.model";

// ✅ CREATE
export const createValidationRule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { feed_name, file_name, rules } = req.body;

    await ValidationRule.create({
      user_id: req?.user?.id,
      feed_name: feed_name,
      file_name: file_name,
      rules: rules,
    });
    const rule_data = await ValidationRule.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "File rules created successfully",
      data: rule_data,
    });
  } catch (error: any) {
    next(error);
  }
};

// ✅ GET ALL
export const getAllValidationRules = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await ValidationRule.find().sort({ createdAt: -1 });

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
export const getValidationRulesById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const response = await ValidationRule.findById(id);

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
export const updateValidationRule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const updated = await ValidationRule.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "File rules not found",
      });
    }
    const allRules = await ValidationRule.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "File rules updated successfully",
      data: allRules,
    });
  } catch (error: any) {
    next(error);
  }
};

// ✅ DELETE
export const deleteValidationRule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const response = await ValidationRule.findByIdAndDelete(id);

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
