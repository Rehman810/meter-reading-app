import Tesseract from 'tesseract.js';
import path from 'path';

export class CaptchaSolver {
  /**
   * Solves a captcha image using Tesseract OCR
   * @param imageBuffer The image buffer of the captcha
   * @returns Extracted text
   */
  static async solveCaptcha(imageBuffer: Buffer): Promise<string> {
    try {
      const result = await Tesseract.recognize(
        imageBuffer,
        'eng',
        {
          logger: m => console.log(m)
        }
      );
      
      const text = result.data.text.replace(/[^A-Za-z0-9]/g, ''); // Clean up spaces and special chars
      return text;
    } catch (error) {
      console.error('Error solving captcha with Tesseract:', error);
      throw error;
    }
  }
}
