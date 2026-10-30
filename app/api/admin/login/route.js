
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import connectDB from "@/app/lib/db";
import Admin from "@/app/models/Admin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();

    const identifier =
      typeof body.identifier === "string"
        ? body.identifier.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email/Employee ID and password are required.",
        },
        { status: 400 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing.");

      return NextResponse.json(
        { success: false, message: "Server configuration error." },
        { status: 500 }
      );
    }

    await connectDB();

    const isEmail = identifier.includes("@");

    const filter = isEmail
      ? { email: identifier.toLowerCase() }
      : { employeeId: identifier };

    const admin = await Admin.findOne(filter).select("+passwordHash");

    if (!admin || admin.active === false) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials or inactive account.",
        },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      admin.passwordHash
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials or inactive account.",
        },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        adminId: admin._id.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const response = NextResponse.json({
      success: true,
      message: "Admin login successful.",
      admin: {
        id: admin._id.toString(),
        email: admin.email || "",
        employeeId: admin.employeeId || "",
        assignedTeam: admin.assignedTeam || "",
        role: admin.role || "supervisor",
      },
    });

    response.cookies.set("civicfix-admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to login. Please try again.",
      },
      { status: 500 }
    );
  }
}
