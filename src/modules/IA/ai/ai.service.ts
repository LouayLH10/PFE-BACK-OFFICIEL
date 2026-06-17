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
You are an ERP business analyst.

Document type:
${documentType}

Data:
${JSON.stringify(extractedJson)}

Return ONLY VALID JSON.

{
  "summary":"",
  "risks":[],
  "recommendations":[],
  "financial_analysis":{},
  "priority":"LOW"
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
      timeout: 120000,
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
}