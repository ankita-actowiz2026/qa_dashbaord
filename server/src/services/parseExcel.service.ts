import ExcelJS from "exceljs";

export const parseExcelFile = async (filePath: string) => {
  let totalRows = 0;

  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath);

  for await (const worksheet of workbook) {
    for await (const row of worksheet) {
      totalRows++;

      const values = row.values as any[];

      // Example processing
      const rowData = values.slice(1);

      // Do validation / DB insert here
    }

    break; // only first sheet
  }

  return {
    total_rows: totalRows,
  };
};
