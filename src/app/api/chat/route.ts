import { NextRequest, NextResponse } from "next/server";
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const endpoint = process.env.AZURE_INFERENCE_SDK_ENDPOINT || "https://rotbot-resource.cognitiveservices.azure.com/openai/deployments/rotbot4o/chat/completions?api-version=2025-01-01-preview";
const modelName = process.env.AZURE_DEPLOYMENT_NAME || "rotbot4o";
const apiKey = process.env.AZURE_INFERENCE_SDK_KEY || "29HnU4CIt8KfJO0xS4qpVETP3RaSulIjDpypC7Fr32MvYGdiVrihJQQJ99BEACHYHv6XJ3w3AAAAACOGKngm";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const client = new ModelClient(endpoint, new AzureKeyCredential(apiKey));

  const response = await client.path("/chat/completions").post({
    body: {
      messages,
      max_tokens: 1000,
      temperature: 0.8,
      top_p: 0.1,
      presence_penalty: 0,
      frequency_penalty: 0,
      model: modelName,
    },
  });

  if (response.status !== "200") {
    return NextResponse.json({ error: response.body.error }, { status: 500 });
  }
  return NextResponse.json({ content: response.body.choices[0].message.content });
}
