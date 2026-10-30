
import { NextResponse } from "next/server";

import connectDB from "@/app/lib/db";
import { getCitizenId } from "@/app/lib/auth";
import Report from "@/app/models/Report";

export async function GET(request, { params }) {
  try {
    const userId = await getCitizenId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    await connectDB();

    const report = await Report.findOne({
      reportId: id,
      userId,
    }).lean();

    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.reportId,
        type: report.type,
        title: report.title,
        place: report.place,
        note: report.note,
        photoUrl: report.photoUrl,
        severity: report.severity,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/reports/[id]:", error);

    return NextResponse.json(
      { success: false, message: "Could not fetch report." },
      { status: 500 }
    );
  }
}
