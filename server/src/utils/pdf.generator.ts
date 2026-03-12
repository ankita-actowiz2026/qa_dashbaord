import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

interface SummaryData {
  user_name: string;
  email?: string;
  createdAt: Date;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_count: number;
  data_empty_count: number;
  datatype_error_count: number;
}

export async function generateSummaryPDF(data: SummaryData[]): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const uploadsDir = path.join(process.cwd(), "uploads");

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `summary_report_${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const row = data[0]; // summary report uses first record

      /* Title */

      doc.font("Helvetica-Bold").fontSize(20).text("Summary Report");

      doc.moveDown(1.5);

      /* Table layout */

      const tableX = 50;
      const labelWidth = 220;
      const valueWidth = 300;
      const rowHeight = 25;

      let y = doc.y;

      const rows = [
        ["Username", row.user_name],
        ["Email", row.email || "N/A"],
        ["Created Date", new Date(row.createdAt).toLocaleDateString()],
        ["Total Records", row.total_records],
        ["Valid Records", row.valid_records],
        ["Invalid Records", row.invalid_records],
        ["Duplicate Count", row.duplicate_count],
        ["Missing Required Count", row.data_empty_count],
        ["Datatype Error Count", row.datatype_error_count],
      ];

      rows.forEach(([label, value]) => {
        // left column
        doc.rect(tableX, y, labelWidth, rowHeight).stroke();

        doc
          .font("Helvetica")
          .fontSize(11)
          .text(label, tableX + 8, y + 7, {
            width: labelWidth - 10,
          });

        // right column
        doc.rect(tableX + labelWidth, y, valueWidth, rowHeight).stroke();

        doc.text(String(value), tableX + labelWidth + 8, y + 7, {
          width: valueWidth - 10,
        });

        y += rowHeight;
      });

      doc.end();

      stream.on("finish", () => resolve(fileName));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}
