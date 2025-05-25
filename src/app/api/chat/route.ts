import { NextRequest, NextResponse } from "next/server";
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const endpoint = process.env.AZURE_INFERENCE_SDK_ENDPOINT || "https://rotbot-resource.services.ai.azure.com/models";
const modelName = process.env.AZURE_DEPLOYMENT_NAME || "rotbot4o";
const apiKey = process.env.AZURE_INFERENCE_SDK_KEY || "29HnU4CIt8KfJO0xS4qpVETP3RaSulIjDpypC7Fr32MvYGdiVrihJQQJ99BEACHYHv6XJ3w3AAAAACOGKngm";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const client = new ModelClient(endpoint, new AzureKeyCredential(apiKey));

  // Define the request body for Azure
  const requestBodyForAzure = {
    messages,
    max_tokens: 8192,     // Your specified value
    temperature: 0.75,     // Your specified value
    top_p: 0.95,           // Your specified value
    presence_penalty: 0,   // Your specified value
    frequency_penalty: 0,  // Your specified value
    model: modelName,
  };

  // DETAILED LOGGING SECTION
  console.log("----------------------------------------------------");
  console.log("Sending to Azure - FULL REQUEST BODY:");
  // Using JSON.stringify to pretty-print the object for better readability in logs
  console.log(JSON.stringify(requestBodyForAzure, null, 2));
  console.log("---");
  console.log("Breakdown of Key Details Sent:");
  console.log("Model Name (from constant):", modelName);
  console.log("Model Name (from env via constant):", process.env.AZURE_DEPLOYMENT_NAME);
  console.log("Endpoint (from constant):", endpoint);
  console.log("Endpoint (from env via constant):", process.env.AZURE_INFERENCE_SDK_ENDPOINT);
  console.log("API Key (first 5 chars, from constant):", apiKey ? apiKey.substring(0, 5) + "..." : "Not Set");
  console.log("Number of messages in payload:", messages ? messages.length : 0);
  if (messages && messages.length > 0) {
    console.log("System Prompt Sent (first message content):");
    console.log(JSON.stringify(messages[0], null, 2)); // Logs the first message, assumed to be system prompt
  }
  console.log("Parameters Sent:");
  console.log("  max_tokens:", requestBodyForAzure.max_tokens);
  console.log("  temperature:", requestBodyForAzure.temperature);
  console.log("  top_p:", requestBodyForAzure.top_p);
  console.log("  presence_penalty:", requestBodyForAzure.presence_penalty);
  console.log("  frequency_penalty:", requestBodyForAzure.frequency_penalty);
  console.log("----------------------------------------------------");
  // END OF DETAILED LOGGING SECTION

  const response = await client.path("/chat/completions").post({
    body: requestBodyForAzure, // Use the defined request body
  });

  if (response.status !== "200") {
    console.error("----------------------------------------------------");
    console.error("Azure API Error - Status:", response.status);
    console.error("Azure API Error - Body:", JSON.stringify(response.body?.error || response.body, null, 2));
    console.error("----------------------------------------------------");
    return NextResponse.json({ error: response.body.error || "Unknown error from Azure API" }, { status: parseInt(response.status, 10) || 500 });
  }

  return NextResponse.json({ content: response.body.choices[0].message.content });
}
