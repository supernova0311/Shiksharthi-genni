import { db } from "@/configs/db";
import {
  ChapterNotes,
  StudyTypeContent,
} from "@/configs/mongoSchema";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { courseId, studyType } = await req.json();

  await db(); // Connect to MongoDB

  if (studyType == "ALL") {
    const notes = await ChapterNotes.find({ courseId });
    const contentList = await StudyTypeContent.find({ courseId });

    const result = {
      notes: notes,
      flashcard: contentList?.filter((item) => item.type == "Flashcard"),
      quiz: contentList?.filter((item) => item.type == "Quiz"),
      qa: contentList?.filter((item) => item.type == "Question/Answer"),
    };
    return NextResponse.json(result);
  } else if (studyType == "notes") {
    const notes = await ChapterNotes.find({ courseId });
    return NextResponse.json({ notes });
  } else {
    const result = await StudyTypeContent.findOne({ 
      courseId: courseId,
      type: studyType 
    });

    return NextResponse.json(result ?? []);
  }
}
