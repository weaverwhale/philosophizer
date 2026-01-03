/**
 * Text extraction utilities for various file formats
 */

import { PDFParse } from 'pdf-parse';

/**
 * Cleans PDF text by removing common artifacts and normalizing whitespace
 * while preserving paragraph structure for proper chunking
 */
export function cleanPDFText(text: string): string {
  let cleaned = text;

  // Normalize line endings first
  cleaned = cleaned.replace(/\r\n/g, '\n');

  // Remove page numbers (various formats)
  cleaned = cleaned.replace(/\bPage\s+\d+\s+of\s+\d+\b/gi, '');
  cleaned = cleaned.replace(/\b\d+\s+of\s+\d+\b/g, '');
  cleaned = cleaned.replace(/^\s*\d+\s*$/gm, ''); // standalone numbers on lines

  // Remove common header/footer patterns
  cleaned = cleaned.replace(/^[-_=]+$/gm, ''); // lines of dashes/underscores
  cleaned = cleaned.replace(/^\s*\[.*?\]\s*$/gm, ''); // lines with just [text]

  // Fix hyphenated words split across lines (but preserve paragraph breaks)
  cleaned = cleaned.replace(/(\w+)-\s*\n(?!\n)(\w+)/g, '$1$2');

  // Normalize whitespace within lines (but preserve newlines)
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Remove empty lines created by header/footer removal, but preserve paragraph breaks
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');

  // Process lines: trim each line but preserve paragraph structure
  const lines = cleaned.split('\n');
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Keep empty lines (paragraph breaks) and non-empty lines
    if (trimmed === '' && i > 0 && i < lines.length - 1) {
      // Only keep empty line if it's between content (paragraph break)
      const prevLine = lines[i - 1]?.trim();
      const nextLine = lines[i + 1]?.trim();
      if (prevLine && nextLine) {
        processedLines.push('');
      }
    } else if (trimmed !== '') {
      processedLines.push(trimmed);
    }
  }

  cleaned = processedLines.join('\n');

  // Ensure we have double newlines between paragraphs
  // Single newlines within paragraphs should become spaces
  cleaned = cleaned.replace(/([^\n])\n([^\n])/g, '$1 $2');

  // Now normalize multiple newlines to exactly two (paragraph breaks)
  cleaned = cleaned.replace(/\n{2,}/g, '\n\n');

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
