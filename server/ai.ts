import OpenAI from 'openai';
import type { ChatMessage, ProjectState, AIModel } from '../shared/types';

// Generate AI response using OpenAI API
async function generateOpenAIResponse(
  message: string,
  conversation: ChatMessage[],
  apiKey: string,
  projectState: ProjectState
): Promise<string> {
  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey });
  
  // Format conversation history for OpenAI
  const messages = [
    {
      role: "system",
      content: getSystemPrompt(projectState)
    },
    ...conversation.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    {
      role: "user",
      content: message
    }
  ];
  
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any, // Type assertion to satisfy OpenAI API
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return `Error generating response: ${error.message || "Unknown error"}`;
  }
}

// Generate AI response using Gemini API (placeholder - would need proper Gemini API implementation)
async function generateGeminiResponse(
  message: string,
  conversation: ChatMessage[],
  apiKey: string,
  projectState: ProjectState
): Promise<string> {
  // This would be implemented with the Google Generative AI SDK
  // For MVP, we're using a simplified placeholder as the Gemini API integration
  // would follow a similar pattern to OpenAI but with Gemini-specific API calls
  
  console.warn("Gemini API implementation is a placeholder in this MVP");
  return "Gemini API integration is not fully implemented in this MVP. Please use OpenAI for now.";
}

// Generate AI response based on selected model
export async function generateAIResponse(
  message: string,
  conversation: ChatMessage[],
  model: AIModel,
  apiKey: string,
  projectState: ProjectState
): Promise<string> {
  if (model === "openai") {
    return generateOpenAIResponse(message, conversation, apiKey, projectState);
  } else if (model === "gemini") {
    return generateGeminiResponse(message, conversation, apiKey, projectState);
  } else {
    throw new Error(`Unsupported AI model: ${model}`);
  }
}

// Create system prompt for the AI based on project context
function getSystemPrompt(projectState: ProjectState): string {
  let systemPrompt = "You are an AI coding assistant for the DeepCode application. ";
  
  if (projectState.projectPath) {
    systemPrompt += `You are currently helping with a project located at ${projectState.projectPath}. `;
  }
  
  if (projectState.codebaseIndex) {
    systemPrompt += "You have the following information about the codebase: \n\n";
    systemPrompt += `${projectState.codebaseIndex.summary}\n\n`;
    
    systemPrompt += "Key Components:\n";
    projectState.codebaseIndex.keyComponents.forEach(comp => {
      systemPrompt += `- ${comp.name} (${comp.path}): ${comp.description}\n`;
    });
    
    systemPrompt += "\nCore Functionality:\n";
    projectState.codebaseIndex.coreFunctionality.forEach(func => {
      systemPrompt += `- ${func.name} (${func.path}): ${func.description}\n`;
    });
  } else {
    systemPrompt += "The user hasn't analyzed their codebase yet. ";
  }
  
  systemPrompt += "\nProvide clear, accurate coding advice. When asked about code, explain its purpose and potential improvements. If you're uncertain, acknowledge it rather than guessing.";
  
  return systemPrompt;
}
