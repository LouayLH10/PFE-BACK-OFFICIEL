import { Injectable } from '@nestjs/common';

import axios from 'axios';
import FormData from 'form-data';
import OpenAI from 'openai';


@Injectable()
export class AiService {

  // ============================================================
  // 1. CONFIGURATION DU SERVICE IA
  // ============================================================

  private openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });


  // ============================================================
  // 2. EXTRACTION DES DONNÉES D'UN DOCUMENT ERP
  // ============================================================
  // Utilise Ollama + Qwen pour transformer le texte OCR
  // en données structurées JSON.
  // ============================================================

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

    const response = await axios.post(
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

      // Retourne la réponse brute si le modèle
      // ne retourne pas un JSON valide
      return {
        raw: response.data.response,
      };
    }
  }


  // ============================================================
  // 3. TEST DE LA CONNEXION AVEC OLLAMA
  // ============================================================
  // Permet de vérifier que le serveur Ollama
  // et le modèle sont accessibles.
  // ============================================================

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


  // ============================================================
  // 4. ANALYSE INTELLIGENTE DU DOCUMENT
  // ============================================================
  // Analyse les données extraites par OCR + IA
  // afin d'identifier :
  // - les risques
  // - les recommandations
  // - le niveau de priorité
  // - les informations financières
  // ============================================================

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

    } catch {

      // Valeurs par défaut si le modèle
      // retourne une réponse non JSON
      console.log(
        'OLLAMA RAW RESPONSE:',
        response.data.response,
      );

      return {
        summary: response.data.response,
        risks: [],
        recommendations: [],
        financial_analysis: {},
        priority: 'LOW',
      };
    }
  }


  // ============================================================
  // 5. CALCUL DU SCORE DE CONFIANCE OCR / IA
  // ============================================================
  // Évalue la qualité des données extraites
  // à partir des champs correctement identifiés.
  // ============================================================

  calculateConfidence(
    extractedJson: any,
  ): number {

    let score = 0;


    // ------------------------------------------------------------
    // 5.1 Document identifié
    // ------------------------------------------------------------

    if (
      extractedJson.document_type
    ) {
      score += 15;
    }


    // ------------------------------------------------------------
    // 5.2 Référence / numéro du document
    // ------------------------------------------------------------

    if (
      extractedJson.document_number
    ) {
      score += 15;
    }


    // ------------------------------------------------------------
    // 5.3 Date du document
    // ------------------------------------------------------------

    if (
      extractedJson.date
    ) {
      score += 15;
    }


    // ------------------------------------------------------------
    // 5.4 Client ou fournisseur
    // ------------------------------------------------------------

    if (
      extractedJson.client ||
      extractedJson.supplier
    ) {
      score += 15;
    }


    // ------------------------------------------------------------
    // 5.5 Adresse email
    // ------------------------------------------------------------

    if (
      extractedJson.client?.email ||
      extractedJson.supplier?.email
    ) {
      score += 10;
    }


    // ------------------------------------------------------------
    // 5.6 Montants financiers
    // ------------------------------------------------------------

    if (
      extractedJson.total ||
      extractedJson.subtotal
    ) {
      score += 10;
    }


    // ------------------------------------------------------------
    // 5.7 Lignes / produits
    // ------------------------------------------------------------

    if (
      extractedJson.items &&
      Array.isArray(
        extractedJson.items,
      ) &&
      extractedJson.items.length > 0
    ) {
      score += 10;
    }


    // ------------------------------------------------------------
    // 5.8 Nombre de champs remplis
    // ------------------------------------------------------------

    const filledFields =
      Object.values(
        extractedJson,
      ).filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          value !== '',
      ).length;

    score += Math.min(
      filledFields,
      10,
    );


    // ------------------------------------------------------------
    // 5.9 Limitation du score à 100
    // ------------------------------------------------------------

    return Math.min(
      Math.round(score),
      100,
    );
  }


  // ============================================================
  // 6. EXTRACTION DES PRODUITS DEPUIS UNE COMMANDE VOCALE
  // ============================================================
  // Analyse le texte provenant du Speech-to-Text
  // et identifie les produits et quantités demandés.
  // ============================================================

  async extractProducts(
    text: string,
    model = 'qwen2.5:3b',
  ) {

    console.log('text =', text);

    const prompt = `
You are an ERP Voice Assistant.

The customer is speaking to request a quotation or an invoice.

Your task is to extract the requested products.

Return ONLY valid JSON.

Schema:

{
  "language": "fr",
  "products": [
    {
      "name": "Product name",
      "quantity": 2
    }
  ]
}

Rules:

- Detect the language ("fr" or "en").
- Return ONLY valid JSON.
- Do not use markdown.
- Do not explain anything.

Quantity rules:

- Quantity must always be a number.
- If no quantity is mentioned, use 1.

Product extraction rules:

- Extract every requested product.
- Preserve the complete product designation.
- Preserve the brand name.
- Preserve the product family.
- Preserve the model when mentioned.
- Never simplify a product.
- Never replace a specific product with a generic one.
- Return product names in singular form.
- Remove only grammatical plurals.
- Correct obvious speech recognition (ASR) mistakes.
- Correct spelling mistakes.
- Correct pronunciation mistakes.
- Correct brand names to the closest well-known brand.
- If the intended product is obvious, normalize its spelling.
- Never invent products that were not mentioned.
- If the customer says only a generic product, keep it generic.

Examples:

Input:

I want 2 HP ProBook laptops, 5 wireless mice and 2 Dell monitors.

Output:

{
  "language":"en",
  "products":[
    {
      "name":"HP ProBook Laptop",
      "quantity":2
    },
    {
      "name":"Wireless Mouse",
      "quantity":5
    },
    {
      "name":"Dell Monitor",
      "quantity":2
    }
  ]
}

Input:

Je veux deux ordinateurs HP ProBook, cinq souris sans fil et deux écrans Dell.

Output:

{
  "language":"fr",
  "products":[
    {
      "name":"HP ProBook Laptop",
      "quantity":2
    },
    {
      "name":"Wireless Mouse",
      "quantity":5
    },
    {
      "name":"Dell Monitor",
      "quantity":2
    }
  ]
}

Input:

Je veux deux écrondelles.

Output:

{
  "language":"fr",
  "products":[
    {
      "name":"Dell Monitor",
      "quantity":2
    }
  ]
}

Input:

Je veux cinq souris sont filles.

Output:

{
  "language":"fr",
  "products":[
    {
      "name":"Wireless Mouse",
      "quantity":5
    }
  ]
}

Input:

I need three logitèque wireless mice.

Output:

{
  "language":"en",
  "products":[
    {
      "name":"Logitech Wireless Mouse",
      "quantity":3
    }
  ]
}

Customer request:

${text}
`;

    const response = await axios.post(
      'http://localhost:11434/api/generate',
      {
        model,
        prompt,
        stream: false,
      },
      {
        timeout: 300000,
      },
    );

    const result =
      response.data.response.trim();

    return JSON.parse(result);
  }


  // ============================================================
  // 7. GÉNÉRATION DU RAPPORT EXÉCUTIF
  // ============================================================
  // Génère un résumé professionnel destiné au client
  // à partir des données extraites et des insights IA.
  // ============================================================

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
- Highlight important financial information if the document is invoice.
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


  // ============================================================
  // 8. SPEECH-TO-TEXT
  // ============================================================
  // Envoie le fichier audio au service Python
  // qui réalise la transcription vocale.
  // ============================================================

  async speechToText(
    file: Express.Multer.File,
  ): Promise<string> {

    const formData = new FormData();

    formData.append(
      'audio',
      file.buffer,
      {
        filename: file.originalname,
        contentType: file.mimetype,
      },
    );

    const response = await axios.post(
      'http://127.0.0.1:5000/transcribe',
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
      },
    );

    return response.data.text;
  }
}