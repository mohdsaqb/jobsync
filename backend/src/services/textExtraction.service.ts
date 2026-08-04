import fs from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";

const MIN_TEXT_LENGTH = 30;

export class TextExtractionError extends Error {}

async function extractFromPdf(filePath: string): Promise<string> {
  const data = new Uint8Array(await fs.readFile(filePath));
  const doc = await getDocument({ data, useSystemFonts: true }).promise;

  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }

  return pageTexts.join("\n").trim();
}

async function extractFromImage(filePath: string): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(filePath);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}

/**
 * Extracts resume text from an uploaded file.
 * PDFs are read via their embedded text layer; images go through OCR.
 * Scanned PDFs with no text layer are not rasterized (kept simple) —
 * the caller should ask the user to upload an image instead.
 */
export async function extractResumeText(filePath: string, mimetype: string): Promise<string> {
  let text: string;

  if (mimetype === "application/pdf") {
    text = await extractFromPdf(filePath);
  } else if (mimetype === "image/png" || mimetype === "image/jpeg") {
    text = await extractFromImage(filePath);
  } else {
    throw new TextExtractionError(`Unsupported file type: ${mimetype}`);
  }

  if (text.length < MIN_TEXT_LENGTH) {
    throw new TextExtractionError(
      "Could not extract enough text from this file. If it's a scanned PDF, try uploading it as an image (PNG/JPG) instead.",
    );
  }

  return text;
}
