
import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/adminAuth";
import Report from "@/app/models/Report";

export const runtime = "nodejs";

const ALLOWED_STATUSES = [
  "Reported",
  "Assigned",
  "Progress",
  "Resolved",
];

const ALLOWED_TEAMS = [
  "Roads Team A",
  "Roads Team B",
  "Lighting Crew 1",
  "Lighting Crew 2",
  "Sanitation Unit 1",
  "Sanitation Unit 2",
];

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid complaint ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, team, note } = body;

    if (
      status !== undefined &&
      !ALLOWED_STATUSES.includes(status)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid complaint status" },
        { status: 400 }
      );
    }

    if (
      team !== undefined &&
      (
        typeof team !== "string" ||
        (team !== "" && !ALLOWED_TEAMS.includes(team))
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid team" },
        { status: 400 }
      );
    }

    if (
      note !== undefined &&
      (typeof note !== "string" || note.length > 2000)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid internal note" },
        { status: 400 }
      );
    }

    await connectDB();

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { reportId: id }] }
      : { reportId: id };

    const report = await Report.findOne(query);

    if (!report) {
      return NextResponse.json(
        { success: false, message: "Complaint not found" },
        { status: 404 }
      );
    }

    const existing = report.aiAnalysis?.toObject
      ? report.aiAnalysis.toObject()
      : report.aiAnalysis || {};

    report.aiAnalysis = {
      issueType: existing.issueType || report.type,
      title: existing.title || report.title,
      description: existing.description || report.note || "",
      severity: ["High", "Medium", "Low"].includes(existing.severity)
        ? existing.severity
        : ["High", "Medium", "Low"].includes(report.severity)
          ? report.severity
          : "Medium",
      confidence: existing.confidence ?? 0,
      assignedTeam: existing.assignedTeam || "",
      ward: existing.ward || "",
      internalNote: existing.internalNote || "",
      duplicateCount: existing.duplicateCount || 1,
    };

    if (team !== undefined) {
      report.aiAnalysis.assignedTeam = team.trim();
    }

    if (note !== undefined) {
      report.aiAnalysis.internalNote = note.trim();
    }

    if (status !== undefined) {
      report.status = status;
    } else if (team && report.status === "Reported") {
      report.status = "Assigned";
    }

    await report.save();

    return NextResponse.json({
      success: true,
      message: "Complaint updated successfully",
      complaint: {
        id: report.reportId,
        mongoId: report._id.toString(),
        status: report.status,
        team: report.aiAnalysis.assignedTeam || "",
        note: report.aiAnalysis.internalNote || "",
      },
    });
  } catch (error) {
    console.error("ADMIN COMPLAINT PATCH ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update complaint" },
      { status: 500 }
    );
  }
}
