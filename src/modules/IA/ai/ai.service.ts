import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiService {

  async extractDocument(
    text: string,
    documentType: string,
  ) {

    const prompt = `
You are an ERP document extraction assistant.

Document type:
${documentType}

Extract all useful information.

Return ONLY valid JSON.

OCR TEXT:

${text}
`;

    const response =
      await axios.post(
        'http://localhost:11434/api/generate',
        {
          model: 'qwen3:8b',
          prompt,
          stream: false,
        },
      );

    try {

      return JSON.parse(
        response.data.response,
      );

    } catch {

      return {
        raw:
          response.data.response,
      };

    }

  }
async testOllama() {
  const response = await axios.post(
    'http://localhost:11434/api/generate',
    {
     model: 'qwen2.5:3b',
      prompt: 'Hello',
      stream: false,
    },
  );

  console.log(response.data);

  return response.data;
}
async generateInsights(
  extractedJson: any,
  documentType: string,
) {

const prompt = `
You are an expert ERP, Finance and Project Management analyst.

Your role is to analyze ERP documents extracted from OCR and provide business insights.

Document Type:
${documentType}

Extracted Data:
${JSON.stringify(extractedJson, null, 2)}

Instructions:

1. Analyze the extracted document.
2. Identify financial, operational, and business risks.
3. Generate useful recommendations for the client viewing the document.
4. Determine a risk percentage from 0 to 100.
5. Determine the priority:
   - LOW
   - MEDIUM
   - HIGH

Risk Percentage Rules:

- MUST ALWAYS be present.
- MUST be a NUMBER.
- MUST be between 0 and 100.
- NEVER return null.
- NEVER return a string.
- 0 = no risk.
- 100 = critical risk.

Examples:

LOW risk → 0-30
MEDIUM risk → 31-70
HIGH risk → 71-100

Additional Rules:

- Insights are intended for the client viewing the document, not its creator.
- Currency must be TND.
- Return ONLY valid JSON.
- No markdown.
- No code blocks.
- No explanations outside JSON.
- risks and recommendations must always be arrays.
- financial_analysis must always be an object.

Expected JSON:

{
  "summary": "Short business summary",
  "risks": [
    "risk 1",
    "risk 2"
  ],
  "risk_percentage": 25,
  "recommendations": [
    "recommendation 1",
    "recommendation 2"
  ],
  "financial_analysis": {
    "subtotal": 0,
    "tax": 0,
    "total": 0,
    "currency": "TND",
    "payment_risk": "LOW"
  },
  "priority": "LOW"
}
`;

  const response = await axios.post(
    'http://localhost:11434/api/generate',
    {
      model: 'qwen2.5:3b',
      prompt,
      stream: false,
    },
    {
      timeout: 300000,
    },
  );

  try {

    return JSON.parse(
      response.data.response,
    );

  } catch (error) {

    console.log(
      'OLLAMA RAW RESPONSE:',
      response.data.response,
    );

    return {
      summary:
        response.data.response,
      risks: [],
      recommendations: [],
      financial_analysis: {},
      priority: 'LOW',
    };

  }

}
calculateConfidence(
  extractedJson: any,
): number {

  let score = 0;

  // ========================
  // Document identifié
  // ========================

  if (
    extractedJson.document_type
  ) {
    score += 15;
  }

  // ========================
  // Référence
  // ========================

  if (
    extractedJson.document_number
  ) {
    score += 15;
  }

  // ========================
  // Date
  // ========================

  if (
    extractedJson.date
  ) {
    score += 15;
  }

  // ========================
  // Client / fournisseur
  // ========================

  if (
    extractedJson.client ||
    extractedJson.supplier
  ) {
    score += 15;
  }

  // ========================
  // Email
  // ========================

  if (
    extractedJson.client?.email ||
    extractedJson.supplier?.email
  ) {
    score += 10;
  }

  // ========================
  // Montants
  // ========================

  if (
    extractedJson.total ||
    extractedJson.subtotal
  ) {
    score += 10;
  }

  // ========================
  // Lignes / items
  // ========================

  if (
    extractedJson.items &&
    Array.isArray(
      extractedJson.items,
    ) &&
    extractedJson.items.length > 0
  ) {
    score += 10;
  }

  // ========================
  // Champs remplis
  // ========================

  const filledFields =
    Object.values(
      extractedJson,
    ).filter(
      (v) =>
        v !== null &&
        v !== undefined &&
        v !== '',
    ).length;

  score += Math.min(
    filledFields,
    10,
  );

  return Math.min(
    Math.round(score),
    100,
  );

}
async generateExecutiveReport(
  extractedJson: any,
  aiInsights: any,
  documentType: string,
) {

  const prompt = `
You are a senior ERP consultant.

Create a professional Executive Report for the client.

Document type:
${documentType}

Extracted Data:
${JSON.stringify(extractedJson)}

AI Insights:
${JSON.stringify(aiInsights)}

Rules:
- Write in professional business English.
- Maximum 250 words.
- Explain the document.
- Highlight important financial information if the docment is invoice.
- Mention risks if any.
- Mention recommendations.
- Do not use markdown.
- Return only plain text.
`;

  const response = await axios.post(
    'http://localhost:11434/api/generate',
    {
      model: 'qwen3:8b',
      prompt,
      stream: false,
    },
    {
      timeout: 300000,
    },
  );

  return response.data.response;
}
}