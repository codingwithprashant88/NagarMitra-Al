
import { NextResponse } from "next/server";

import connectDB from "@/app/lib/db";
import { getCitizenId } from "@/app/lib/auth";
import Report from "@/app/models/Report";
import User from "@/app/models/User";

export async function GET() {
  try {
    const userId = await getCitizenId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    await connectDB();

    const [user, counts] = await Promise.all([
      User.findById(userId).select("name").lean(),

      Report.aggregate([
        {
          $match: {
            userId: (await import("mongoose")).default.Types.ObjectId.createFromHexString(
              userId
            ),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            waiting: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["Reported", "Assigned"]] },
                  1,
                  0,
                ],
              },
            },
            progress: {
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
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Citizen account not found." },
        { status: 404 }
      );
    }

    const stats = counts[0] || {
      total: 0,
      waiting: 0,
      progress: 0,
      resolved: 0,
    };

    return NextResponse.json({
      success: true,
      user: { name: user.name },
      stats: {
        total: stats.total,
        waiting: stats.waiting,
        progress: stats.progress,
        resolved: stats.resolved,
      },
    });
  } catch (error) {
    console.error("GET /api/citizen/dashboard:", error);

    return NextResponse.json(
      { success: false, message: "Could not load dashboard." },
      { status: 500 }
    );
  }
}
