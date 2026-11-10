import mongoose, { Document, Model, Schema } from 'mongoose';
import { IUser, User } from './User';

export interface ITeacherProfile extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'faculty_advisor' | 'dean_admin';
  contactNumber: string;
  employeeId: string;
  designation: string;
  department: string;
  officeRoom: string;
  primarySpecializationBasket: string;
  assignedBasketId: number;
  assignedBasketName: string;
  specializationArea: string;
  assignedCourses: string[];
  assignedMentees: mongoose.Types.ObjectId[];
  personaKey?: string;
  refreshTokenHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const teacherProfileSchema = new Schema<ITeacherProfile>(
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
    role: {
      type: String,
      enum: ['faculty_advisor', 'dean_admin'],
      default: 'faculty_advisor',
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
      default: '+91-9876543210',
      trim: true,
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    designation: {
      type: String,
      required: true,
      default: 'Associate Professor',
      trim: true,
    },
    department: {
      type: String,
      default: 'CSED',
      trim: true,
    },
    officeRoom: {
      type: String,
      default: 'CSED Block-B Room 304',
      trim: true,
    },
    primarySpecializationBasket: {
      type: String,
      default: 'EF_BASKET_05',
      trim: true,
    },
    assignedBasketId: {
      type: Number,
      default: 5,
      min: 1,
      max: 12,
    },
    assignedBasketName: {
      type: String,
      default: 'Artificial Intelligence and Machine Learning (AIML)',
      trim: true,
    },
    specializationArea: {
      type: String,
      default: 'Artificial Intelligence & Machine Learning',
      trim: true,
    },
    assignedCourses: {
      type: [String],
      default: [],
    },
    assignedMentees: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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
    collection: 'teacher_profiles',
  }
);

export const TeacherProfile: Model<ITeacherProfile> =
  mongoose.models.TeacherProfile ||
  mongoose.model<ITeacherProfile>('TeacherProfile', teacherProfileSchema);

export { IUser, User };
export default TeacherProfile;
