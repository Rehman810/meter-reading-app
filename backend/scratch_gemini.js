require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const test = async () => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    });
    console.log('Success:', response.text);
  } catch (err) {
    console.error('API Error:', err.message);
  }
};
test();
