import { db } from "@/configs/db";
import { User } from "@/configs/mongoSchema";
import { NextResponse } from "next/server";

export async function GET(req) {
  const reqUrl = req.url;
  const { searchParams } = new URL(reqUrl);
  const email = searchParams.get("email");
  
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  await db(); // Connect to MongoDB
  
  const user = await User.findOne({ email });

  return NextResponse.json({ user });
}