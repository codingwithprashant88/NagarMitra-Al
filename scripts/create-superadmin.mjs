import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../app/models/Admin.js";

const {
  MONGODB_URI,
  SUPERADMIN_EMAIL,
  SUPERADMIN_EMPLOYEE_ID,
  SUPERADMIN_PASSWORD,
} = process.env;

async function createSuperAdmin() {
  if (
    !MONGODB_URI ||
    !SUPERADMIN_EMAIL ||
    !SUPERADMIN_EMPLOYEE_ID ||
    !SUPERADMIN_PASSWORD
  ) {
    throw new Error("Required environment variables are missing.");
  }

  await mongoose.connect(MONGODB_URI);

  const email = SUPERADMIN_EMAIL.trim().toLowerCase();
  const employeeId = SUPERADMIN_EMPLOYEE_ID.trim();

  const existing = await Admin.findOne({
    $or: [{ email }, { employeeId }],
  });

  if (existing) {
    throw new Error(
      "An account with this email or employee ID already exists."
    );
  }

  const passwordHash = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);

  const admin = await Admin.create({
    email,
    employeeId,
    passwordHash,
    role: "superadmin",
    active: true,
  });

  console.log("Super Admin created:", admin.employeeId);
}

createSuperAdmin()
  .catch((error) => {
    console.error("Setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });