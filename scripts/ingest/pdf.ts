import fs from "node:fs/promises";
import path from "node:path";
import {PDFParse} from "pdf-parse";

export type PdfPage = {
  pageNumber: number;
  text: string;
};

export function cleanPdfText(text:string):string{
    return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPdfText(
  filePath: string,
): Promise<PdfPage[]> {
  const absolutePath = path.join(filePath);
  const buffer = await fs.readFile(absolutePath);
  const parser=new PDFParse({data:buffer});
  try{
    const result = await parser.getText({
        lineEnforce: true,
        pageJoiner: "\n",
    });
    return result.pages.map((page) => ({
          pageNumber: page.num,
          text: cleanPdfText(page.text),
        })).filter((page) => page.text.length > 0);
  }finally{
    await parser.destroy()
  }
}