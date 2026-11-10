import mongoose, { Document, Model, Schema } from 'mongoose';
import { IUser, User } from './User';

export interface ITeacherProfile extends Document {
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  employeeId: string;
  contactNumber: string;
  department: string;
  designation: string;
  primarySpecializationBasket: string;
  assignedCourses: string[];
  createdAt: Date;
  updatedAt: Date;
}

const teacherProfileSchema = new Schema<ITeacherProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    employeeId: { type: String, required: true, trim: true, index: true },
    contactNumber: { type: String, default: '+91-9876543210', trim: true },
    department: { type: String, default: 'CSED', trim: true },
    designation: { type: String, default: 'Associate Professor', trim: true },
    primarySpecializationBasket: { type: String, default: 'EF_BASKET_05', trim: true },
    assignedCourses: { type: [String], default: [] },
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
