
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/adminAuth";
import Admin from "@/app/models/Admin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    if (auth.admin.role !== "superadmin") {
      return NextResponse.json(
        {
          success: false,
          message: "Only a Super Admin can create admin accounts.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const employeeId =
      typeof body.employeeId === "string"
        ? body.employeeId.trim()
        : "";

    const password = body.password;
    const assignedTeam =
      typeof body.assignedTeam === "string"
        ? body.assignedTeam.trim()
        : "";

    const role = body.role || "supervisor";

    if (!email && !employeeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Email or employee ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be between 8 and 72 characters.",
        },
        { status: 400 }
      );
    }

    if (!["admin", "supervisor"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "You can create an admin or supervisor account only.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const conditions = [];

    if (email) conditions.push({ email });
    if (employeeId) conditions.push({ employeeId });

    const existing = await Admin.findOne({
      $or: conditions,
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Email or employee ID already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      ...(email ? { email } : {}),
      ...(employeeId ? { employeeId } : {}),
      passwordHash,
      assignedTeam,
      role,
      active: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: `${role} account created successfully.`,
        admin: {
          id: admin._id.toString(),
          email: admin.email || "",
          employeeId: admin.employeeId || "",
          assignedTeam: admin.assignedTeam,
          role: admin.role,
          active: admin.active,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Email or employee ID already exists.",
        },
        { status: 409 }
      );
    }

    console.error("CREATE ADMIN ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create admin account." },
      { status: 500 }
    );
  }
}
