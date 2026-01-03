/**
 * Text extraction utilities for various file formats
 */

import { PDFParse } from 'pdf-parse';

/**
 * Cleans PDF text by removing common artifacts and normalizing whitespace
 */
export function cleanPDFText(text: string): string {
  let cleaned = text;

  // Remove page numbers (various formats)
  cleaned = cleaned.replace(/\bPage\s+\d+\s+of\s+\d+\b/gi, '');
  cleaned = cleaned.replace(/\b\d+\s+of\s+\d+\b/g, '');
  cleaned = cleaned.replace(/^\s*\d+\s*$/gm, ''); // standalone numbers on lines

  // Remove common header/footer patterns
  cleaned = cleaned.replace(/^[-_=]+$/gm, ''); // lines of dashes/underscores
  cleaned = cleaned.replace(/^\s*\[.*?\]\s*$/gm, ''); // lines with just [text]

  // Fix hyphenated words split across lines
  cleaned = cleaned.replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2');

  // Normalize whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' '); // multiple spaces/tabs to single space
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // max 2 consecutive newlines
  cleaned = cleaned.replace(/\r\n/g, '\n'); // normalize line endings

  // Remove leading/trailing whitespace from lines
  cleaned = cleaned
    .split('\n')
    .map(line => line.trim())
    .join('\n');

  // Remove excessive spaces around punctuation
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1');
  cleaned = cleaned.replace(/([.,;:!?])\s+/g, '$1 ');

  return cleaned.trim();
}

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  const arrayBuffer = await file.arrayBuffer();
  // Convert to Buffer for pdf-parse compatibility
  const buffer = Buffer.from(arrayBuffer);

  // Create PDFParse instance and extract text
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  // Clean the extracted text
  return cleanPDFText(result.text);
}

/**
 * Extract text from a file based on its extension
 */
export async function extractTextFromFile(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  const ext = filePath.toLowerCase().split('.').pop();

  if (ext === 'pdf') {
    return await extractTextFromPDF(filePath);
  } else {
    // For text files, read directly
    const text = await file.text();
    // Still apply basic cleaning
    return cleanPDFText(text);
  }
}
