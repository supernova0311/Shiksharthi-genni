import { courseOutlineAIModel, generateNotesAiModel } from "@/configs/AiModel";
import { db } from "@/configs/db";
import { StudyMaterial, ChapterNotes } from "@/configs/mongoSchema";
import { NextResponse } from "next/server";

// Retry function for API calls with exponential backoff
async function retryApiCall(apiCall, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      const isRateLimit = error.message.includes('503') || 
                         error.message.includes('overloaded') ||
                         error.message.includes('rate limit');
      
      if (isRateLimit && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Attempt ${attempt} failed due to rate limit. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
// export async function POST(req) {
//   try {
//     const { courseId, topic, courseType, difficultyLevel, createdBy } =
//       await req.json();
//     const PROMPT = `
//         generate a study material for '${topic}' for '${courseType}'
//         and level of Difficulty will be '${difficultyLevel}'
//         with course title, summary of course, List of chapters along with the summary and Emoji icon for each chapter,
//         Topic list in each chapter in JSON format
//       `;
//     // Generate course layout using AI
//     const aiResp = await courseOutlineAIModel.sendMessage(PROMPT);
//     const aiResult = JSON.parse(aiResp.response.text());
//     // Save result along with user input
//     const dbResult = await db
//       .insert(STUDY_MATERIAL_TABLE)
//       .values({
//         courseId: courseId,
//         courseType: courseType,
//         difficultyLevel: difficultyLevel,
//         topic: topic,
//         createdBy: createdBy,
//         courseLayout: aiResult,
//       })
//       .returning({ resp: STUDY_MATERIAL_TABLE });

//     //Trriger Inngest function to generate chapter notes
//     const result = await inngest.send({
//       name: "notes.generate",
//       data: {
//         course: dbResult[0].resp,
//       },
//     });
//     console.log(result);

//     return NextResponse.json({ result: dbResult[0] });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

export async function POST(req) {
  try {
    const requestBody = await req.json();
    console.log("Received request body:", requestBody);
    
    const { courseId, topic, courseType, difficultyLevel, createdBy } = requestBody;

    console.log("Parsed fields:", {
      courseId,
      topic,
      courseType,
      difficultyLevel,
      createdBy
    });

    if (!courseId || !topic || !courseType || !difficultyLevel || !createdBy) {
      console.log("Missing fields validation failed");
      return NextResponse.json(
        { 
          error: "Missing required fields",
          received: { courseId, topic, courseType, difficultyLevel, createdBy }
        },
        { status: 400 }
      );
    }

    const PROMPT = `
        generate a study material for '${topic}' for '${courseType}' 
        and level of Difficulty will be '${difficultyLevel}' 
        with course title, summary of course, List of chapters along with the summary and Emoji icon for each chapter, 
        Topic list in each chapter in JSON format
      `;

    // Generate course layout using AI
    console.log("Calling Gemini AI with prompt:", PROMPT.substring(0, 100) + "...");
    
    let aiResp, aiResult;
    try {
      aiResp = await retryApiCall(() => courseOutlineAIModel.sendMessage(PROMPT));
      console.log("AI Response received successfully");
      aiResult = JSON.parse(aiResp.response.text());
      console.log("AI Result parsed successfully");
    } catch (aiError) {
      console.error("Gemini AI Error:", aiError);
      throw new Error(`AI generation failed: ${aiError.message}`);
    }

    await db(); // Connect to MongoDB
    
    // Save result along with user input
    const studyMaterial = new StudyMaterial({
      courseId: courseId,
      courseType: courseType,
      difficultyLevel: difficultyLevel,
      topic: topic,
      createdBy: createdBy,
      courseLayout: aiResult,
    });

    const dbResult = await studyMaterial.save();

    console.log("Course created:", dbResult);

    // Generate chapter notes directly
    try {
      if (aiResult.chapters && Array.isArray(aiResult.chapters)) {
        // Process chapters sequentially with delay to avoid rate limits
        for (let index = 0; index < aiResult.chapters.length; index++) {
          const chapter = aiResult.chapters[index];
          
          const PROMPT = `Generate exam material detail content for each chapter. 
          Make sure to include all topic points in the content, make sure to give content in HTML format 
          (DO not add HTML, Head, Body, title tag), The Chapters: ${JSON.stringify(chapter)}`;

          const result = await retryApiCall(() => generateNotesAiModel.sendMessage(PROMPT));
          const aiResp = await result.response.text();

          // Insert notes into ChapterNotes collection
          const chapterNote = new ChapterNotes({
            chapterId: index + 1,
            courseId: courseId,
            notes: aiResp,
          });
          
          await chapterNote.save();
          
          // Add delay between requests to avoid rate limits (except for last chapter)
          if (index < aiResult.chapters.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          }
        }

        // Update course status to ready
        await StudyMaterial.findByIdAndUpdate(dbResult._id, { status: "Ready" });
      }
    } catch (error) {
      console.error("Error generating chapter notes:", error);
      await StudyMaterial.findByIdAndUpdate(dbResult._id, { status: "Error" });
    }

    return NextResponse.json({ result: dbResult });
  } catch (error) {
    console.error("Error in generate-course-outline:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
