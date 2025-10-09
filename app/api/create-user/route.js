import { db } from "@/configs/db";
import { User } from "@/configs/mongoSchema";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { user } = await req.json();

    await db(); // Connect to MongoDB
    
    // Check if the user already exists
    const existingUser = await User.findOne({
      email: user?.email
    });

    if (!existingUser) {
      // If not, create a new user
      const newUser = new User({
        userName: user?.userName || "",
        email: user?.email || "",
        isMember: false,
        customerId: null,
      });

      const userResp = await newUser.save();
      console.log("New user created:", userResp);
      return NextResponse.json({ result: userResp });
    }

    console.log("Existing user found:", existingUser);
    return NextResponse.json({ result: existingUser });
  } catch (error) {
    console.error("Error in create-user:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
