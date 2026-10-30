
import { NextResponse } from "next/server";

import connectDB from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/adminAuth";
import Admin from "@/app/models/Admin";
import Report from "@/app/models/Report";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    await connectDB();

    const admin = await Admin.findById(auth.admin._id)
      .select("email employeeId assignedTeam role active")
      .lean();

    if (!admin || admin.active === false) {
      return NextResponse.json(
        { success: false, message: "Admin account unavailable." },
        { status: 403 }
      );
    }

    // Current week: Monday 00:00 through the present.
    const now = new Date();
    const start = new Date(now);
    const dayOffset = (now.getDay() + 6) % 7;

    start.setDate(now.getDate() - dayOffset);
    start.setHours(0, 0, 0, 0);

    const [summaryRows, typeRows, weeklyRows] = await Promise.all([
      Report.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            open: {
              $sum: {
                $cond: [{ $ne: ["$status", "Resolved"] }, 1, 0],
              },
            },
            unassigned: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$status", "Resolved"] },
                      {
                        $or: [
                          { $eq: ["$assignedTeam", ""] },
                          { $eq: ["$assignedTeam", null] },
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            inProgress: {
              $sum: {
                $cond: [{ $eq: ["$status", "Progress"] }, 1, 0],
              },
            },
            resolved: {
              $sum: {
                $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0],
              },
            },
          },
        },
      ]),

      Report.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]),

      Report.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: now },
          },
        },
        {
          $group: {
            _id: {
              day: {
                $dayOfWeek: {
                  date: "$createdAt",
                  timezone: "Asia/Kolkata",
                },
              },
            },
            received: { $sum: 1 },
            resolved: {
              $sum: {
                $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const summary = summaryRows[0] || {
      total: 0,
      open: 0,
      unassigned: 0,
      inProgress: 0,
      resolved: 0,
    };

    const types = ["pothole", "road", "light", "garbage"];
    const byType = Object.fromEntries(types.map((type) => [type, 0]));

    for (const row of typeRows) {
      if (Object.hasOwn(byType, row._id)) {
        byType[row._id] = row.count;
      }
    }

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const received = Array(7).fill(0);
    const resolved = Array(7).fill(0);

    for (const row of weeklyRows) {
      // MongoDB $dayOfWeek: Sunday=1, Monday=2, ..., Saturday=7.
      const index = (row._id.day + 5) % 7;
      received[index] = row.received;
      resolved[index] = row.resolved;
    }

    return NextResponse.json({
      success: true,
      admin: {
        name: admin.employeeId || admin.email || "Admin",
        department:
          admin.role === "superadmin"
            ? "Super Admin"
            : admin.assignedTeam || admin.role || "Admin",
        role: admin.role,
      },
      summary,
      byType,
      weekly: { days, received, resolved },
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard statistics.",
      },
      { status: 500 }
    );
  }
}
