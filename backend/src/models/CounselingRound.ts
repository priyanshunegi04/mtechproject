import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStudentAllocationEntry {
  studentId: string;
  rollNumber: string;
  studentName: string;
  email: string;
  cgpa: number;
  tieBreakerCoreGpa: number;
  allocatedBasketId: string | null;
  allocatedBasketName: string | null;
  allocatedGenericCourseCode: string | null;
  allocatedGenericTitle: string | null;
  basketPreferenceRank: number | null;
  genericPreferenceRank: number | null;
  allocationStatus: 'allocated' | 'waitlisted';
  waitlistRank: number | null;
}

export interface ICutoffTelemetry {
  code: string;
  name: string;
  seatCapacity: number;
  enrolledCount: number;
  waitlistCount: number;
  openingCgpa: number | null;
  closingCutoffCgpa: number | null;
}

export interface ICounselingRound extends Document {
  roundId: string;
  roundNumber: number;
  title: string;
  academicYear: string;
  branch: string;
  batchYear: number;
  targetSemester: number;
  status: 'draft' | 'open' | 'locked' | 'allocated' | 'published';
  opensAt: Date;
  closesAt: Date;
  executedAt?: Date | null;
  executedByEmail?: string | null;
  basketCutoffs: ICutoffTelemetry[];
  genericCutoffs: ICutoffTelemetry[];
  meritAllocationResults: IStudentAllocationEntry[];
  summaryStats: {
    totalEligibleStudents: number;
    totalLockedPreferences: number;
    totalAllocated: number;
    totalWaitlisted: number;
    firstChoiceBasketPct: number;
    topThreeBasketPct: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const cutoffTelemetrySchema = new Schema<ICutoffTelemetry>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    seatCapacity: { type: Number, required: true },
    enrolledCount: { type: Number, required: true },
    waitlistCount: { type: Number, required: true },
    openingCgpa: { type: Number, default: null },
    closingCutoffCgpa: { type: Number, default: null },
  },
  { _id: false }
);

const studentAllocationEntrySchema = new Schema<IStudentAllocationEntry>(
  {
    studentId: { type: String, required: true },
    rollNumber: { type: String, required: true },
    studentName: { type: String, required: true },
    email: { type: String, required: true },
    cgpa: { type: Number, required: true },
    tieBreakerCoreGpa: { type: Number, required: true },
    allocatedBasketId: { type: String, default: null },
    allocatedBasketName: { type: String, default: null },
    allocatedGenericCourseCode: { type: String, default: null },
    allocatedGenericTitle: { type: String, default: null },
    basketPreferenceRank: { type: Number, default: null },
    genericPreferenceRank: { type: Number, default: null },
    allocationStatus: {
      type: String,
      enum: ['allocated', 'waitlisted'],
      required: true,
    },
    waitlistRank: { type: Number, default: null },
  },
  { _id: false }
);

const counselingRoundSchema = new Schema<ICounselingRound>(
  {
    roundId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    roundNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    title: {
      type: String,
      required: true,
      default: 'TIET B.E. CSE 2026 — Semester V Elective Focus Basket & Generic Elective Counseling (Round 1)',
    },
    academicYear: {
      type: String,
      default: '2026-2027',
    },
    branch: {
      type: String,
      default: 'B.E. Computer Science & Engineering (COPC)',
    },
    batchYear: {
      type: Number,
      default: 2024,
    },
    targetSemester: {
      type: Number,
      default: 5,
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'locked', 'allocated', 'published'],
      default: 'open',
    },
    opensAt: {
      type: Date,
      required: true,
    },
    closesAt: {
      type: Date,
      required: true,
    },
    executedAt: {
      type: Date,
      default: null,
    },
    executedByEmail: {
      type: String,
      default: null,
    },
    basketCutoffs: {
      type: [cutoffTelemetrySchema],
      default: [],
    },
    genericCutoffs: {
      type: [cutoffTelemetrySchema],
      default: [],
    },
    meritAllocationResults: {
      type: [studentAllocationEntrySchema],
      default: [],
    },
    summaryStats: {
      totalEligibleStudents: { type: Number, default: 0 },
      totalLockedPreferences: { type: Number, default: 0 },
      totalAllocated: { type: Number, default: 0 },
      totalWaitlisted: { type: Number, default: 0 },
      firstChoiceBasketPct: { type: Number, default: 0 },
      topThreeBasketPct: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    collection: 'counseling_rounds',
  }
);

counselingRoundSchema.index({ academicYear: 1, targetSemester: 1, roundNumber: 1 });

export const CounselingRound: Model<ICounselingRound> =
  mongoose.models.CounselingRound ||
  mongoose.model<ICounselingRound>('CounselingRound', counselingRoundSchema);
export default CounselingRound;

