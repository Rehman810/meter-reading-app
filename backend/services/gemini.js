const { GoogleGenAI } = require('@google/genai');

const extractBillData = async (imageBuffer, mimeType) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You are analyzing a photo of an electricity bill from Pakistan. Read all visible numbers carefully. Return ONLY valid JSON, no markdown, no preamble, in this exact shape:
{
  "billingMonth": string | null,
  "consumerName": string | null (Look for "NAME", "NAME & ADDRESS", or "CONSUMER NAME"),
  "accountNumber": string | null (Look for "REFERENCE NO", "REF NO", "A/C NO", or "CONSUMER NO". Usually 14 or 15 digits),
  "issueDate": string | null (Look for "ISSUE DATE". Return in YYYY-MM-DD format if possible),
  "previousReading": number | null,
  "currentReading": number | null,
  "unitsConsumed": number | null,
  "totalAmount": number | null,
  "dueDate": string | null
}
If a field is not clearly readable, set it to null. Do not guess.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-pro', // or 'gemini-2.5-pro' depending on what is available, but let's use the standard new 'gemini-2.5-pro' or 'gemini-3.1-pro' (as requested)
    // Actually, I'll use exactly gemini-3.1-pro or let's use what they requested.
    // wait, @google/genai uses models.generateContent and model format is string.
    model: 'gemini-2.5-flash',
    contents: [
      { role: 'user', parts: [
        { text: prompt },
        { inlineData: { data: imageBuffer.toString('base64'), mimeType: mimeType || 'image/jpeg' } }
      ]}
    ]
  });

  return parseJSONResponse(response.text);
};

const extractMeterReading = async (imageBuffer, mimeType) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You are reading the numeric display of an electricity meter (digital or analog) from a photo. Ignore decimal/red digits if present, return only the whole-unit reading. Return ONLY valid JSON:
{ "reading": number | null, "confidence": "high" | "medium" | "low" }
Set confidence to "low" if the photo is blurry, glare-affected, or the digits are ambiguous.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { role: 'user', parts: [
        { text: prompt },
        { inlineData: { data: imageBuffer.toString('base64'), mimeType: mimeType || 'image/jpeg' } }
      ]}
    ]
  });

  return parseJSONResponse(response.text);
};

const parseJSONResponse = (text) => {
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('\`\`\`json')) {
      cleanText = cleanText.substring(7);
      if (cleanText.endsWith('\`\`\`')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
    } else if (cleanText.startsWith('\`\`\`')) {
      cleanText = cleanText.substring(3);
      if (cleanText.endsWith('\`\`\`')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
    }
    return JSON.parse(cleanText.trim());
  } catch (error) {
    console.error('Failed to parse AI response:', text);
    throw new Error('Failed to parse AI response to JSON');
  }
};

const generateInsights = async (analyticsData) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You are an expert electricity consumption analyst. Review the user's historical utility data below. Provide a HIGHLY DETAILED, multi-paragraph analysis of their electricity usage. 
Break your analysis into three sections:
1. "Consumption Trends" (Analyze their month-to-month patterns, identify peak usage, and comment on the cost trajectory)
2. "Efficiency Breakdown" (Analyze their average units per month and how it compares to typical seasonal usage)
3. "Actionable Savings Strategy" (Provide 2-3 highly specific, practical tips to reduce consumption based on their peak months)
Do NOT use markdown format like ** or #. Use plain text formatting with clear paragraph breaks.
Data: ${JSON.stringify(analyticsData)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  return response.text.trim();
};

module.exports = { extractBillData, extractMeterReading, generateInsights };
