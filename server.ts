import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // AI OCR Endpoint for Handwritten Receipts
  app.post("/api/ocr-receipt", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ success: false, error: "Missing imageBase64 data" });
      }

      let mimeType = "image/jpeg";
      let pureBase64 = imageBase64;
      if (imageBase64.includes(";base64,")) {
        const parts = imageBase64.split(";base64,");
        mimeType = parts[0].replace("data:", "");
        pureBase64 = parts[1];
      }

      const imagePart = {
        inlineData: {
          mimeType,
          data: pureBase64,
        },
      };

      const promptText = `Analyze this image of a handwritten or printed AAER money receipt voucher.
Extract all written or printed text fields into structured JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [imagePart, { text: promptText }],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Payer name" },
              amount: { type: Type.NUMBER, description: "Numerical amount paid in BDT" },
              membershipNature: {
                type: Type.STRING,
                description: "Membership category (e.g. Life Member, Annual Member, Executive Fee, Donation, Special Fund, General Collection)",
              },
              paymentMethod: {
                type: Type.STRING,
                description: "Payment method: cash, bkash, nagad, bank, cheque",
              },
              paymentRef: {
                type: Type.STRING,
                description: "Transaction ID or cheque reference",
              },
              organization: {
                type: Type.STRING,
                description: "Organization, designation, or phone number",
              },
              remarks: {
                type: Type.STRING,
                description: "Any extra notes on voucher",
              },
            },
            required: ["name", "amount", "membershipNature", "paymentMethod"],
          },
        },
      });

      const parsedJson = JSON.parse(response.text || "{}");
      return res.status(200).json({
        success: true,
        data: parsedJson,
      });
    } catch (err: any) {
      console.error("Gemini OCR error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to process OCR scanning",
      });
    }
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
