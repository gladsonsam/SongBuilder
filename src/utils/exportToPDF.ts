import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Song } from '../types/song';

/**
 * Generate a PDF chord chart for a song.
 * Returns a Blob representing the PDF file.
 */
export async function exportToPDF(song: Song): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  // Two-column layout
  const gutter = 32;
  const colWidth = Math.floor((width - 2 * 50 - gutter) / 2);
  const colX = [50, 50 + colWidth + gutter];
  let col = 0; // 0 = left, 1 = right

  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  const lineHeight = 20;

  // Title
  page.drawText(song.title || 'Untitled Song', {
    x: colX[0],
    y,
    size: 20,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.3),
    maxWidth: colWidth,
  });
  y -= lineHeight + 5;

  // Artist
  if (song.artist) {
    page.drawText(`Artist: ${song.artist}`, {
      x: colX[0],
      y,
      size: 14,
      font,
      color: rgb(0.2, 0.2, 0.2),
      maxWidth: colWidth,
    });
    y -= lineHeight;
  }

  // Tags
  if (song.tags && song.tags.length > 0) {
    page.drawText(`Tags: ${song.tags.join(', ')}`, {
      x: colX[0],
      y,
      size: 12,
      font,
      color: rgb(0.3, 0.3, 0.3),
      maxWidth: colWidth,
    });
    y -= lineHeight;
  }

  y -= 10;

  // Helper to wrap text to fit column width
  function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const testLine = current ? current + ' ' + word : word;
      if (font.widthOfTextAtSize(testLine, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = testLine;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  // Sections
  for (const section of song.sections) {
    const lines = section.content.split('\n');
    // Estimate max possible height needed (conservative)
    const sectionHeight = lineHeight + lines.length * lineHeight * 2 + 8;
    if (y - sectionHeight < 80) {
      if (col === 0) {
        col = 1;
        y = height - 50;
      } else {
        page = pdfDoc.addPage();
        col = 0;
        y = height - 50;
      }
    }
    // Section title
    page.drawText(
      `${section.type.toUpperCase()}${section.number ? ' ' + section.number : ''}:`,
      {
        x: colX[col],
        y,
        size: 14,
        font: fontBold,
        color: rgb(0.1, 0.2, 0.5),
        maxWidth: colWidth,
      }
    );
    y -= lineHeight;

    // Chorded lines with wrapping
    for (let i = 0; i < lines.length; i++) {
      const lyricLine = lines[i];
      // Find chords for this line
      const chords = (section.chords || []).filter(ch => ch.line === i);
      // Wrap lyric line
      const wrappedLyrics = wrapText(lyricLine, font, 12, colWidth);
      // For chords, build a string with spaces at chord.position, but only for the first wrapped line
      if (chords.length > 0 && wrappedLyrics.length > 0) {
        let chordLine = '';
        let lastPos = 0;
        // For chord alignment, use the first wrapped lyric line
        for (const chord of chords) {
          // Estimate position in first wrapped line (by char index)
          const spaces = chord.position - lastPos;
          chordLine += ' '.repeat(Math.max(0, spaces)) + chord.text;
          lastPos = chord.position + chord.text.length;
        }
        page.drawText(chordLine, {
          x: colX[col],
          y,
          size: 11,
          font,
          color: rgb(0.1, 0.4, 0.1),
          maxWidth: colWidth,
        });
        y -= lineHeight - 6;
      }
      // Draw each wrapped lyric line
      for (let j = 0; j < wrappedLyrics.length; j++) {
        page.drawText(wrappedLyrics[j], {
          x: colX[col],
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0),
          maxWidth: colWidth,
        });
        y -= lineHeight;
      }
    }
    y -= 8;
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
