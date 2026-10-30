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
        { status: 500 },
      );
    }

    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (
      !email ||
      typeof password !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email and password" },
        { status: 400 },
      );
    }

    await connectDB();

    // Password is excluded by default in the User model.

    const identifier = body.email?.trim().toLowerCase() || "";

    if (!identifier || typeof password !== "string" || !password) {
      return NextResponse.json(
        { success: false, message: "Email/mobile and password are required" },
        { status: 400 },
      );
    }

    await connectDB();

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^[6-9]\d{9}$/.test(identifier);

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid email or 10-digit mobile number",
        },
        { status: 400 },
      );
    }

    const user = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier },
    ).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email/mobile or password" },
        { status: 401 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, message: "Invalid email/mobile or password" },
        { status: 401 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "This account is inactive" },
        { status: 403 },
      );
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to log in" },
      { status: 500 },
    );
  }
}
