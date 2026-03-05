import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export async function generateCleanDataXLSX(data: any[]): Promise<string> {

  const uploadsDir = path.join(process.cwd(), "uploads");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `clean_data_${Date.now()}.xlsx`;
  const filePath = path.join(uploadsDir, fileName);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Clean Data");

  if (!data.length) {
    worksheet.addRow(["No data found"]);
    await workbook.xlsx.writeFile(filePath);
    return fileName;
  }

  // 🔹 Extract headers from first row
  const headers = Object.keys(data[0].data);

  worksheet.columns = headers.map((header) => ({
    header: header,
    key: header,
    width: 20,
  }));

  // 🔹 Header styling
  const headerRow = worksheet.getRow(1);

  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: "center" };

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };

    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" },
    };
  });

  // 🔹 Add rows
  data.forEach((item) => {

    const row = worksheet.addRow(item.data);

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    });

  });

  // 🔹 Freeze header
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  await workbook.xlsx.writeFile(filePath);

  return fileName;
}