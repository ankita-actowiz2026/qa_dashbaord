import { Request, Response, NextFunction } from "express";
import { reportService } from "../services/user.report.service";
import  {SummaryReportParams, SummaryReportQuery}   from "../interface/importedFile.interface";
 interface DownloadSummaryQuery {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
import  ApiError  from "../utils/api.error";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}
class ReportController {
  showSummary = async (
      req: Request<{}, {}, {}, SummaryReportQuery>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError("User not authenticated", 401);
      }
      console.log(req.user.role)
      const user_id = (req.user.role=="QA"?req.user.id:undefined);

      const user = await reportService.showSummary({
        user_id,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      })

      res.status(200).json({
        success: true,
        message: "",
        data: user
      })

    } catch (error) {
      next(error)
    }
}


    downloadSummary = async (req: Request<{ imported_file_id: string }, {}, {}, DownloadSummaryQuery>,res: Response,next: NextFunction): Promise<void> => {
      try {
        const { imported_file_id } = req.params;

         if (!process.env.API_URL) {
          throw new ApiError( "API URL is not configured", 500);
        }
        if (!imported_file_id) {
          throw new ApiError( "imported_file_id is required", 400);
        }

        const fileName = await reportService.downloadSummary({
          imported_file_id,
          sortBy: req.query.sortBy,
          sortOrder: req.query.sortOrder || "desc",
        });

        const baseUrl = process.env.API_URL;

        const pdfUrl = `${baseUrl}/uploads/${fileName}`;

        res.status(200).json({
          success: true,
          message: "PDF generated successfully",
          data: {
            pdfUrl,
            fileName,
          },
        });
      } catch (error) {
        next(error);
      }
    };

    
    downloadcleanData = async (req: Request<{ imported_file_id: string }, {}, {}, DownloadSummaryQuery>,res: Response,next: NextFunction): Promise<void> => {
      try {
        const { imported_file_id } = req.params;

        if (!process.env.API_URL) {
          throw new ApiError("API URL is not configured", 500);
        }

        if (!imported_file_id) {
          throw new ApiError("imported_file_id is required", 400);
        }

        const fileName = await reportService.downloadcleanData(imported_file_id);

        const baseUrl = process.env.API_URL;
        const dataUrl = `${baseUrl}/uploads/${fileName}`;

        res.status(200).json({
          success: true,
          message: "Clean data exported successfully",
          data: {
            dataUrl,
            fileName,
          },
        });
      } catch (error) {
        next(error);
      }
    };

}
export const reportController = new ReportController();
