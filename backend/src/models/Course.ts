import mongoose, { Document, Model, Schema } from 'mongoose';

export type IndustryPartnerType = 'NVIDIA' | 'Xebia' | 'EC-Council' | 'Future First' | 'TIET';

export type CourseCategoryType =
  | 'CORE_PREREQUISITE'
  | 'CORE_SEM5'
  | 'PROFESSIONAL_ELECTIVE'
  | 'GENERIC_ELECTIVE';

export interface IEvaluationScheme {
  mstWeight: number;
  estWeight: number;
  sessionalWeight: number;
}

export interface ICourse extends Document {
  courseCode: string;
  title: string;
  category: CourseCategoryType;
  basketId: string;
  electiveSlot: string;
  semester: number;
  ltp: string;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
  credits: number;
  seatCapacity: number;
  enrolledCount: number;
  waitlistCount: number;
  cutoffCgpaLastYear: number;
  liveCutoffCgpa?: number | null;
  industryPartner: IndustryPartnerType;
  evaluationScheme: IEvaluationScheme;
  prerequisites: string[];
  labTechStack: string[];
  syllabusKeywords: string[];
  clos: string[];
  difficultyIndex: number;
  weeklySelfEffortHours: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const evaluationSchemeSchema = new Schema<IEvaluationScheme>(
  {
    mstWeight: { type: Number, default: 28 },
    estWeight: { type: Number, default: 42 },
    sessionalWeight: { type: Number, default: 30 },
  },
  { _id: false }
);

const courseSchema = new Schema<ICourse>(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['CORE_PREREQUISITE', 'CORE_SEM5', 'PROFESSIONAL_ELECTIVE', 'GENERIC_ELECTIVE'],
      required: true,
    },
    basketId: {
      type: String,
      default: 'CORE',
      index: true,
    },
    electiveSlot: {
      type: String,
      default: 'CORE',
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    ltp: {
      type: String,
      default: '2-0-2',
    },
    lectureHours: {
      type: Number,
      default: 2,
    },
    tutorialHours: {
      type: Number,
      default: 0,
    },
    practicalHours: {
      type: Number,
      default: 2,
    },
    credits: {
      type: Number,
      required: true,
      default: 3.0,
    },
    seatCapacity: {
      type: Number,
      default: 120,
      min: 10,
      max: 1000,
    },
    enrolledCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    waitlistCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    cutoffCgpaLastYear: {
      type: Number,
      default: 7.1,
      min: 0,
      max: 10,
    },
    liveCutoffCgpa: {
      type: Number,
      default: null,
    },
    industryPartner: {
      type: String,
      enum: ['NVIDIA', 'Xebia', 'EC-Council', 'Future First', 'TIET'],
      default: 'TIET',
    },
    evaluationScheme: {
      type: evaluationSchemeSchema,
      default: () => ({ mstWeight: 28, estWeight: 42, sessionalWeight: 30 }),
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    labTechStack: {
      type: [String],
      default: [],
    },
    syllabusKeywords: {
      type: [String],
      default: [],
    },
    clos: {
      type: [String],
      default: [],
    },
    difficultyIndex: {
      type: Number,
      default: 3.3,
      min: 1.0,
      max: 5.0,
    },
    weeklySelfEffortHours: {
      type: Number,
      default: 6.0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'courses_catalog',
  }
);

courseSchema.index({ category: 1, semester: 1, electiveSlot: 1 });
courseSchema.index({ basketId: 1, semester: 1 });

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);
export default Course;

