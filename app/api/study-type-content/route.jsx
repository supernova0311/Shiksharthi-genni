import { db } from "@/configs/db";
import { StudyTypeContent } from "@/configs/mongoSchema";
import { 
  GenerateStudyTypeContentAiModel,
  GenerateQuizAiModel,
  GenerateQnAAiModel 
} from "@/configs/AiModel";
import { NextResponse } from "next/server";

// Retry function for API calls with exponential backoff
async function retryApiCall(apiCall, maxRetries = 3, baseDelay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      const isRateLimit = error.message.includes('503') || 
                         error.message.includes('overloaded') ||
                         error.message.includes('rate limit') ||
                         error.message.includes('Service Unavailable') ||
                         error.status === 503;
      
      if (isRateLimit && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // 2s, 4s, 8s
        console.log(`Rate limit detected. Retrying attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's the last attempt or not a rate limit error, throw the error
      throw error;
    }
  }
}

export async function POST(req) {
  try {
    const { chapters, courseId, type } = await req.json();
    
    const PROMPT =
      type === "Flashcard"
        ? "Generate the flashcard on topic: " +
          chapters +
          " in JSON format with front and back content, Maximum15"
        : type === "Quiz"
        ? "Generate Quiz on topic: " +
          chapters +
          " with questions and options along with the answer in JSON Format, (Max 10)"
        : type === "Question/Answer"
        ? "Generate a detailed Q&A on topic: " +
          chapters +
          " in JSON format with each question and a detailed answer, Maximum10"
        : type === "Notes/Chapters"
        ? "Generate detailed notes content for chapters: " +
          chapters +
          " in JSON format with structured content for each chapter"
        : "Unsupported type";

    await db(); // Connect to MongoDB

    // Generate content using AI directly with retry logic
    let aiResult;
    if (type === "Flashcard") {
      const result = await retryApiCall(() => GenerateStudyTypeContentAiModel.sendMessage(PROMPT));
      aiResult = JSON.parse(result.response.text());
    } else if (type === "Quiz") {
      const result = await retryApiCall(() => GenerateQuizAiModel.sendMessage(PROMPT));
      aiResult = JSON.parse(result.response.text());
    } else if (type === "Question/Answer") {
      const result = await retryApiCall(() => GenerateQnAAiModel.sendMessage(PROMPT));
      aiResult = JSON.parse(result.response.text());
    } else if (type === "Notes/Chapters") {
      const result = await retryApiCall(() => GenerateStudyTypeContentAiModel.sendMessage(PROMPT));
      aiResult = JSON.parse(result.response.text());
    } else {
      throw new Error(`Unsupported studyType: ${type}`);
    }

    // Save result to database
    const studyTypeContent = new StudyTypeContent({
      courseId: courseId,
      type: type,
      content: aiResult,
      status: "Ready",
    });

    const result = await studyTypeContent.save();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in study-type-content:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
