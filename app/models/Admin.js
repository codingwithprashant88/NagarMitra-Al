import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    assignedTeam: {
      type: String,
      default: "",
      trim: true,
    },

    internalNote: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    active: {
      type: Boolean,
      default: true,
    },
    
    role: {
      type: String,
      enum: ["superadmin", "admin", "supervisor"],
      default: "supervisor",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Admin || mongoose.model("Admin", adminSchema);
