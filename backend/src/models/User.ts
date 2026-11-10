import mongoose, { Document, Model, Schema } from 'mongoose';
import { InstitutionalRole } from '../types';

export interface ISgpaEntry {
  semester: number;
  sgpa: number;
  credits: number;
}

export interface IPreferenceWeights {
  alpha: number;
  beta: number;
  gamma: number;
  delta: number;
}

export interface IPrerequisiteOverride {
  targetCode: string;
  approvedByEmail: string;
  approvedByName: string;
  reason: string;
  approvedAt: Date;
}

export interface IQuizResponseItem {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  domain: string;
}

export interface IDomainScores {
  'Data Structures & Algorithms': number;
  'Math & Linear Algebra': number;
  'Systems & OS/Networks': number;
  'AI & Machine Learning': number;
  'Web & Databases': number;
  [key: string]: number;
}

export type SkillLevelType = 'Novice' | 'Intermediate' | 'Proficient' | 'Advanced';

export interface ISkillAssessment {
  lastTakenAt?: Date | null;
  totalScore: number;
  domainScores: IDomainScores;
  evaluatedSkillLevel: SkillLevelType;
  quizResponses: IQuizResponseItem[];
}

export interface IPersonalInfo {
  name?: string;
  email?: string;
  contactNumber?: string;
  batchYear?: number;
  currentSemester?: number;
  rollNumber?: string;
  employeeId?: string;
  department?: string;
}

export interface IAcademicData {
  cgpa?: number;
  coreGrades?: Map<string, number> | Record<string, number>;
}

export interface IAdvisorMenteeStatus {
  status: 'Pending' | 'Approved' | 'Revision Recommended';
  advisorNotes?: string;
  reviewedByEmail?: string;
  reviewedByName?: string;
  reviewedAt?: Date | null;
}

export type AllocationStatusType = 'pending' | 'allocated' | 'waitlisted';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  contactNumber?: string;
  department: string;
  designation?: string;
  primarySpecializationBasket?: string;
  role: InstitutionalRole;
  rollNumber?: string;
  employeeId?: string;
  branch: string;
  batchYear: number;
  currentSemester: number;
  cgpa: number;
  sgpaHistory: ISgpaEntry[];
  coreGrades: Map<string, number> | Record<string, number>;
  personalInfo?: IPersonalInfo;
  academicData?: IAcademicData;
  codingProfileScore: number;
  mathAptitudeScore: number;
  skills: string[];
  areasOfInterest: string[];
  skillAssessment?: ISkillAssessment;
  advisorReview?: IAdvisorMenteeStatus;
  targetCareerRoles: string[];
  statementOfPurpose: string;
  preferenceWeights: IPreferenceWeights;
  rankedBasketPreferences: string[];
  rankedGenericPreferences: string[];
  preferenceLockedAt?: Date | null;
  allocatedBasketId?: string | null;
  allocatedGenericCourseCode?: string | null;
  allocationStatus: AllocationStatusType;
  allocatedPreferenceRank?: number | null;
  waitlistRank?: number | null;
  prerequisiteOverrides: IPrerequisiteOverride[];
  personaKey?: string;
  refreshTokenHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const sgpaEntrySchema = new Schema<ISgpaEntry>(
  {
    semester: { type: Number, required: true, min: 1, max: 8 },
    sgpa: { type: Number, required: true, min: 0, max: 10 },
    credits: { type: Number, required: true, min: 0, max: 35 },
  },
  { _id: false }
);

const preferenceWeightsSchema = new Schema<IPreferenceWeights>(
  {
    alpha: { type: Number, default: 0.28, min: 0, max: 1 },
    beta: { type: Number, default: 0.24, min: 0, max: 1 },
    gamma: { type: Number, default: 0.28, min: 0, max: 1 },
    delta: { type: Number, default: 0.20, min: 0, max: 1 },
  },
  { _id: false }
);

const prerequisiteOverrideSchema = new Schema<IPrerequisiteOverride>(
  {
    targetCode: { type: String, required: true, trim: true },
    approvedByEmail: { type: String, required: true, trim: true },
    approvedByName: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    approvedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const quizResponseItemSchema = new Schema<IQuizResponseItem>(
  {
    questionId: { type: String, required: true },
    selectedOption: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    domain: { type: String, required: true },
  },
  { _id: false }
);

const skillAssessmentSchema = new Schema<ISkillAssessment>(
  {
    lastTakenAt: { type: Date, default: null },
    totalScore: { type: Number, default: 0, min: 0, max: 100 },
    domainScores: {
      type: Schema.Types.Mixed,
      default: () => ({
        'Data Structures & Algorithms': 0,
        'Math & Linear Algebra': 0,
        'Systems & OS/Networks': 0,
        'AI & Machine Learning': 0,
        'Web & Databases': 0,
      }),
    },
    evaluatedSkillLevel: {
      type: String,
      enum: ['Novice', 'Intermediate', 'Proficient', 'Advanced'],
      default: 'Novice',
    },
    quizResponses: {
      type: [quizResponseItemSchema],
      default: [],
    },
  },
  { _id: false }
);

const advisorMenteeStatusSchema = new Schema<IAdvisorMenteeStatus>(
  {
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Revision Recommended'],
      default: 'Pending',
    },
    advisorNotes: { type: String, default: '' },
    reviewedByEmail: { type: String, default: '' },
    reviewedByName: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator(v: string): boolean {
          return /^[a-zA-Z0-9._%+-]+@thapar\.edu$/i.test(v);
        },
        message: 'Institutional email must belong to the @thapar.edu domain',
      },
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    contactNumber: {
      type: String,
      default: '+91-9876543210',
      trim: true,
    },
    department: {
      type: String,
      default: 'CSED',
      trim: true,
    },
    designation: {
      type: String,
      default: 'Associate Professor',
      trim: true,
    },
    primarySpecializationBasket: {
      type: String,
      default: 'EF_BASKET_05',
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'faculty_advisor', 'dean_admin'],
      default: 'student',
      required: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true,
    },
    branch: {
      type: String,
      default: 'B.E. Computer Science & Engineering (COPC)',
      trim: true,
    },
    batchYear: {
      type: Number,
      default: 2024,
      min: 2018,
      max: 2032,
    },
    currentSemester: {
      type: Number,
      default: 4,
      min: 1,
      max: 8,
    },
    cgpa: {
      type: Number,
      default: 7.5,
      min: 0.0,
      max: 10.0,
    },
    sgpaHistory: {
      type: [sgpaEntrySchema],
      default: [],
    },
    coreGrades: {
      type: Map,
      of: Number,
      default: () =>
        new Map<string, number>([
          ['UES103', 8],
          ['UMA022', 8],
          ['UMA023', 8],
          ['UCS301', 8],
          ['UCS303', 8],
          ['UTA018', 8],
          ['UCS405', 8],
          ['UMA021', 8],
          ['UCS415', 8],
          ['UCS310', 8],
          ['UCS414', 8],
          ['UCS321', 8],
          ['UMA401', 8],
        ]),
    },
    personalInfo: {
      type: Schema.Types.Mixed,
      default: {},
    },
    academicData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    codingProfileScore: {
      type: Number,
      default: 76.0,
      min: 0,
      max: 100,
    },
    mathAptitudeScore: {
      type: Number,
      default: 75.0,
      min: 0,
      max: 100,
    },
    skills: {
      type: [String],
      default: ['C++', 'Python', 'Data Structures', 'SQL'],
    },
    areasOfInterest: {
      type: [String],
      default: ['Data Science', 'Artificial Intelligence', 'Web & Cloud'],
    },
    skillAssessment: {
      type: skillAssessmentSchema,
      default: () => ({
        lastTakenAt: null,
        totalScore: 0,
        domainScores: {
          'Data Structures & Algorithms': 0,
          'Math & Linear Algebra': 0,
          'Systems & OS/Networks': 0,
          'AI & Machine Learning': 0,
          'Web & Databases': 0,
        },
        evaluatedSkillLevel: 'Novice',
        quizResponses: [],
      }),
    },
    advisorReview: {
      type: advisorMenteeStatusSchema,
      default: () => ({
        status: 'Pending',
        advisorNotes: '',
        reviewedByEmail: '',
        reviewedByName: '',
        reviewedAt: null,
      }),
    },
    targetCareerRoles: {
      type: [String],
      default: ['Software Development Engineer'],
    },
    statementOfPurpose: {
      type: String,
      default: '',
      maxlength: 2500,
    },
    preferenceWeights: {
      type: preferenceWeightsSchema,
      default: () => ({ alpha: 0.28, beta: 0.24, gamma: 0.28, delta: 0.20 }),
    },
    rankedBasketPreferences: {
      type: [String],
      default: [],
      validate: {
        validator(arr: string[]): boolean {
          return arr.length <= 5;
        },
        message: 'rankedBasketPreferences can hold at most 5 ordered basket choices',
      },
    },
    rankedGenericPreferences: {
      type: [String],
      default: [],
      validate: {
        validator(arr: string[]): boolean {
          return arr.length <= 5;
        },
        message: 'rankedGenericPreferences can hold at most 5 ordered Generic Elective choices',
      },
    },
    preferenceLockedAt: {
      type: Date,
      default: null,
    },
    allocatedBasketId: {
      type: String,
      default: null,
    },
    allocatedGenericCourseCode: {
      type: String,
      default: null,
    },
    allocationStatus: {
      type: String,
      enum: ['pending', 'allocated', 'waitlisted'],
      default: 'pending',
    },
    allocatedPreferenceRank: {
      type: Number,
      default: null,
    },
    waitlistRank: {
      type: Number,
      default: null,
    },
    prerequisiteOverrides: {
      type: [prerequisiteOverrideSchema],
      default: [],
    },
    personaKey: {
      type: String,
      trim: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Compound index for fast merit-order seat allocation queries
userSchema.index({ batchYear: 1, currentSemester: 1, cgpa: -1 });
userSchema.index({ role: 1, allocationStatus: 1, cgpa: -1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
