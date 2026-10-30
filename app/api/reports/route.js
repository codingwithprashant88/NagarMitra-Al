import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import connectDB from "@/app/lib/db";
import { getCitizenId } from "@/app/lib/auth";
import { uploadPhoto } from "@/app/lib/uploadPhoto";
import Report from "@/app/models/Report";

export const runtime = "nodejs";

const TYPES = {
  pothole: "Pothole",
  road: "Road damage",
  light: "Streetlight",
  garbage: "Garbage",
};

const VALID_AI_TYPES = [...Object.keys(TYPES), "other"];
const VALID_SEVERITIES = ["High", "Medium", "Low"];

function parseAIAnalysis(value) {
  if (!value || typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const issueType = String(parsed.issueType || "").toLowerCase();
    const severity = parsed.severity;
    const confidence = Number(parsed.confidence);

    if (
      !VALID_AI_TYPES.includes(issueType) ||
      !VALID_SEVERITIES.includes(severity) ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 1 ||
      typeof parsed.title !== "string" ||
      typeof parsed.description !== "string"
    ) {
      return null;
    }

    return {
      issueType,
      title: parsed.title.trim().slice(0, 120) || "Civic issue",
      description: parsed.description.trim().slice(0, 1000),
      severity,
      confidence,
    };
  } catch {
    return null;
  }
}

function formatReport(report) {
  return {
    id: report.reportId,
    type: report.type,
    title: report.title,
    place: report.place,
    note: report.note,
    photoUrl: report.photoUrl,
    severity: report.severity,
    aiAnalysis: report.aiAnalysis || null,
    status: report.status,
    createdAt: report.createdAt,
  };
}

export async function GET(request) {
  try {
    const userId = await getCitizenId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();

    const filter = { userId };

    if (status && status !== "All") {
      if (!["Reported", "Assigned", "Progress", "Resolved"].includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status." },
          { status: 400 },
        );
      }

      filter.status = status;
    }

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { place: { $regex: escaped, $options: "i" } },
        { reportId: { $regex: escaped, $options: "i" } },
      ];
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      reports: reports.map(formatReport),
    });
  } catch (error) {
    console.error("GET /api/reports:", error);

    return NextResponse.json(
      { success: false, message: "Could not fetch reports." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  let uploadedPublicId = null;

  try {
    const userId = await getCitizenId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 },
      );
    }

    const formData = await request.formData();

    const type = formData.get("type");
    const place = formData.get("place")?.toString().trim();
    const note = formData.get("note")?.toString().trim() || "";
    const photo = formData.get("photo");

    // AI result comes from the client, so validate it before saving.
    const aiAnalysis = parseAIAnalysis(formData.get("aiAnalysis"));

    if (typeof type !== "string" || !TYPES[type]) {
      return NextResponse.json(
        { success: false, message: "Invalid issue type." },
        { status: 400 },
      );
    }

    if (!place || place.length < 3 || place.length > 300) {
      return NextResponse.json(
        { success: false, message: "Enter a valid location." },
        { status: 400 },
      );
    }

    if (note.length > 2000) {
      return NextResponse.json(
        { success: false, message: "Details are too long." },
        { status: 400 },
      );
    }

    if (
      !photo ||
      typeof photo === "string" ||
      typeof photo.arrayBuffer !== "function"
    ) {
      return NextResponse.json(
        { success: false, message: "Please attach a photo." },
        { status: 400 },
      );
    }

    if (!photo.type?.startsWith("image/") || photo.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Use an image up to 5 MB." },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPEG, PNG or WebP images are allowed.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const buffer = Buffer.from(await photo.arrayBuffer());
    const uploaded = await uploadPhoto(buffer);
    uploadedPublicId = uploaded.public_id;

    // Save AI severity if valid; otherwise retain Pending.
    const severity = aiAnalysis?.severity || "Pending";

    // Keep the selected issue type as the report's main type.
    // If AI detects "other", use the user's selected type.
    const title = aiAnalysis?.title || `${TYPES[type]} reported`;

    const report = await Report.create({
      reportId: `CF-${Date.now().toString().slice(-6)}-${randomBytes(2)
        .toString("hex")
        .toUpperCase()}`,
      userId,
      type,
      title,
      place,
      note,
      photoUrl: uploaded.secure_url,
      photoPublicId: uploaded.public_id,
      severity,
      aiAnalysis,
      status: "Reported",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Report submitted successfully.",
        report: formatReport(report),
      },
      { status: 201 },
    );
  } catch (error) {
    if (uploadedPublicId) {
      try {
        const { default: cloudinary } = await import("@/app/lib/cloudinary");
        await cloudinary.uploader.destroy(uploadedPublicId);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError);
      }
    }

    console.error("POST /api/reports:", error);

    return NextResponse.json(
      { success: false, message: "Could not submit report." },
      { status: 500 },
    );
  }
}
