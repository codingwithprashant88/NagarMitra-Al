
import { NextResponse } from "next/server";

import connectDB from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/adminAuth";
import Report from "@/app/models/Report";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "All";

    const allowedStatuses = [
      "Reported",
      "Assigned",
      "Progress",
      "Resolved",
    ];

    const filter = {};

    if (status !== "All") {
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status filter" },
          { status: 400 }
        );
      }

      filter.status = status;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");

      filter.$or = [
        { reportId: regex },
        { title: regex },
        { type: regex },
        { place: regex },
      ];
    }

    const reports = await Report.find(filter)
      .select(
        "reportId userId type title place note photoUrl severity status aiAnalysis createdAt updatedAt"
      )
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const now = Date.now();

    const complaints = reports.map((report) => ({
      id: report.reportId || String(report._id),
      mongoId: String(report._id),
      type: report.type,
      title: report.title,
      place: report.place || "Location unavailable",
      ward: report.aiAnalysis?.ward || "—",
      by: report.userId?.name || "Citizen",
      age: Math.max(
        0,
        Math.floor(
          (now - new Date(report.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      ),
      severity: report.severity || "Pending",
      status: report.status || "Reported",
      team: report.aiAnalysis?.assignedTeam || "",
      dup: report.aiAnalysis?.duplicateCount || 1,
      note: report.aiAnalysis?.internalNote || "",
      citizenNote: report.note || "",
      photoUrl: report.photoUrl || "",
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("ADMIN COMPLAINTS GET ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load complaints" },
      { status: 500 }
    );
  }
}
