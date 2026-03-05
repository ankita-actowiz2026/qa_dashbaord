import express from "express";
import { reportController } from '../controllers/user.report.controller'
import { SummaryReportParams, SummaryReportQuery } from '../interface/importedFile.interface';

const reportRouter = express.Router()
import authentication from "../middleware/auth.middleware"
reportRouter.get('/', authentication, reportController.showSummary)
reportRouter.get('/:user_id', authentication, reportController.showSummary)
reportRouter.get('/download_summary/:imported_file_id', authentication, reportController.downloadSummary)
reportRouter.get('/download_clean_data/:imported_file_id', authentication, reportController.downloadcleanData)

export default reportRouter;