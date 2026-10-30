
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import connectDB from "@/app/lib/db";
import Admin from "@/app/models/Admin";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("civicfix-admin-session")?.value;

  if (!token) {
    return {
      error: "Unauthorized",
      status: 401,
    };
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return {
      error: "Invalid or expired admin session",
      status: 401,
    };
  }

  if (!decoded.adminId) {
    return {
      error: "Invalid admin session",
      status: 401,
    };
  }

  await connectDB();

  const admin = await Admin.findById(decoded.adminId)
    .select("name email department role active")
    .lean();

  if (!admin || admin.active === false) {
    return {
      error: "Admin account is inactive or unavailable",
      status: 403,
    };
  }

  if (!["admin", "superadmin"].includes(admin.role)) {
    return {
      error: "Admin access required",
      status: 403,
    };
  }

  return { admin };
}
