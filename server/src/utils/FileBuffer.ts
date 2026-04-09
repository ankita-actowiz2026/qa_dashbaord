import fs from "fs";
import path from "path";

export class FileBuffer {
  private buffer: any[] = [];
  private bufferSize: number;
  private filePath: string;
  private isFlushing = false;
  private isFirstWrite = true;

  constructor(fileName: string, bufferSize = 1000) {
    this.bufferSize = bufferSize;

    const dir = path.resolve("error_logs");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const nameWithoutExt = path.parse(fileName).name;
    this.filePath = path.join(dir, `${nameWithoutExt}.json`);

    // ✅ initialize file with [
    fs.writeFileSync(this.filePath, "[\n");
  }

  add(error: any) {
    this.buffer.push(error);

    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  addBulk(errors: any[]) {
    this.buffer.push(...errors);

    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0 || this.isFlushing) return;

    this.isFlushing = true;

    const data = this.buffer;
    this.buffer = [];

    try {
      let lines = "";

      data.forEach((item, index) => {
        // Add comma if:
        // - not first write OR
        // - not first item in this batch
        if (!this.isFirstWrite || index > 0) {
          lines += ",\n";
        }

        lines += JSON.stringify(item);
      });

      await fs.promises.appendFile(this.filePath, lines);

      this.isFirstWrite = false;
    } catch (err) {
      console.error("File write error:", err);
    } finally {
      this.isFlushing = false;
    }
  }

  // ✅ IMPORTANT: call this at end
  async close() {
    await this.flush();
    await fs.promises.appendFile(this.filePath, "\n]");
  }
}
