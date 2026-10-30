import mongoose from "mongoose";

const aiAnalysisSchema = new mongoose.Schema(
  {
    issueType: {
      type: String,
      enum: ["pothole", "road", "light", "garbage", "other"],
      required: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "Civic issue",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    severity: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    assignedTeam: {
      type: String,
      default: "",
      trim: true,
    },
    ward: {
      type: String,
      default: "",
      trim: true,
    },
    internalNote: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    duplicateCount: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false },
);

const reportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["pothole", "road", "light", "garbage"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    place: {
      type: String,
      required: true,
      trim: true,
    },

    note: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    photoUrl: {
      type: String,
      required: true,
    },

    photoPublicId: {
      type: String,
      default: "",
    },

    severity: {
      type: String,
      enum: ["Pending", "Low", "Medium", "High"],
      default: "Pending",
    },

    // AI-generated image analysis
    aiAnalysis: {
      type: aiAnalysisSchema,
      default: null,
    },

    status: {
      type: String,
      enum: ["Reported", "Assigned", "Progress", "Resolved"],
      default: "Reported",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

reportSchema.index({ userId: 1, createdAt: -1 });

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);

export default Report;
