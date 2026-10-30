
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import connectDB from "@/app/lib/db";
import User from "@/app/models/User";

export async function POST(request) {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: "Server authentication is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const phone = body.phone?.trim() || "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { success: false, message: "Name must be 2–100 characters" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { success: false, message: "Password must be 8–72 characters" },
        { status: 400 }
      );
    }

    if (phone.length > 20) {
      return NextResponse.json(
        { success: false, message: "Phone number is too long" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Never accept role from the public signup request.
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "citizen",
    });

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    console.error("Signup error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create account" },
      { status: 500 }
    );
  }
}
