import User from "../models/user.model";
import ImportedFile from "../models/importedFile.model";
import CleanDataModel from "../models/cleanData.model";
import IUser, { UserType } from "../interface/user.interface";
import ApiError from "../utils/api.error";
import mongoose from "mongoose";
import { generateSummaryPDF } from "../utils/pdf.generator";
import { generateCleanDataXLSX } from "../utils/xlsx.generator";

export class ReportService {
  async showSummary(query: {
    user_id: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const {
      user_id,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const skip = (page - 1) * limit;

    const matchStage: any = {};

    if (user_id) {
      matchStage.user_id = new mongoose.Types.ObjectId(user_id);
    }

    const sortOptions: any = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const [data, total] = await Promise.all([
      ImportedFile.aggregate([
        { $match: matchStage },

        // 🔹 Join users
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },

        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 🔹 Count records in CleanData
        {
          $lookup: {
            from: "cleandatas",
            let: { fileId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$importedfile_id", "$$fileId"],
                  },
                },
              },
              {
                $count: "clean_total",
              },
            ],
            as: "clean_data_stats",
          },
        },

        // 🔹 Extract count value
        {
          $addFields: {
            clean_data_total: {
              $ifNull: [
                { $arrayElemAt: ["$clean_data_stats.clean_total", 0] },
                0,
              ],
            },
          },
        },

        {
          $project: {
            user_id: 1,
            user_name: "$user.name",
            user_email: "$user.email",
            file_name: 1,
            total_records: 1,
            valid_records: 1,
            invalid_records: 1,
            duplicate_count: 1,
            data_empty_count: 1,
            datatype_error_count: 1,
            clean_data_total: 1, // 🔹 added field
            createdAt: 1,
          },
        },

        { $sort: sortOptions },
        { $skip: skip },
        { $limit: limit },
      ]),

      ImportedFile.aggregate([{ $match: matchStage }, { $count: "total" }]),
    ]);

    const totalCount = total.length > 0 ? total[0].total : 0;

    return {
      data,
      total: totalCount,
      page,
      limit,
    };
  }
  async downloadSummary(query: {
    imported_file_id: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const {
      imported_file_id,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    if (!mongoose.Types.ObjectId.isValid(imported_file_id)) {
      throw new ApiError("Invalid imported_file_id", 400);
    }

    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const data = await ImportedFile.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(imported_file_id),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          user_id: 1,
          user_name: "$user.name",
          user_email: "$user.email",
          file_name: 1,
          total_records: 1,
          valid_records: 1,
          invalid_records: 1,
          duplicate_count: 1,
          data_empty_count: 1,
          datatype_error_count: 1,
          createdAt: 1,
        },
      },
      { $sort: sortOptions },
    ]);
    console.log(data);
    if (!data.length) {
      throw new ApiError("No data found for the given user", 404);
    }

    return await generateSummaryPDF(data);
  }

  async downloadcleanData(imported_file_id: string) {
    if (!mongoose.Types.ObjectId.isValid(imported_file_id)) {
      throw new ApiError("Invalid imported_file_id", 400);
    }

    // Fetch all clean data for the imported file
    const data = await CleanDataModel.find({
      importedfile_id: new mongoose.Types.ObjectId(imported_file_id),
    })
      .lean()
      .exec();

    if (!data || data.length === 0) {
      throw new ApiError(
        "No clean data found for the given imported file",
        404,
      );
    }

    // Generate XLSX file
    const fileName = await generateCleanDataXLSX(data);
    return fileName;
  }
}
export const reportService = new ReportService();
