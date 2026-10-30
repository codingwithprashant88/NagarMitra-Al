
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import mongoose from "mongoose";

export async function getCitizenId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      typeof decoded === "string" ||
      !decoded.userId ||
      !mongoose.Types.ObjectId.isValid(decoded.userId)
    ) {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}
