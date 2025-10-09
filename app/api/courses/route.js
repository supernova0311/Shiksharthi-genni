import { db } from "@/configs/db";
import { StudyMaterial } from "@/configs/mongoSchema";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { createdBy } = await req.json();

  await db(); // Connect to MongoDB
  
  const result = await StudyMaterial.find({ createdBy })
    .sort({ createdAt: -1 }); // Sort by creation date in descending order
    
  return NextResponse.json({ result: result });
}

export async function GET(req) {
  const reqUrl = req.url;
  const { searchParams } = new URL(reqUrl);
  const courseId = searchParams.get("courseId");
  
  await db(); // Connect to MongoDB
  
  const course = await StudyMaterial.findOne({ courseId });

  return NextResponse.json({ result: course });
}
