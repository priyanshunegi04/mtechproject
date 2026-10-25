import mongoose, { Document, Model, Schema } from 'mongoose';
import { IndustryPartnerType } from './Course';

export interface IElectiveSequenceMap {
  'PE-I': string[];
  'PE-II': string[];
  'PE-III': string[];
  'PE-IV': string[];
}

export interface IBasket extends Document {
  basketId: string;
  basketNumber: number;
  name: string;
  collaboration: string;
  industryPartner: IndustryPartnerType;
  careerTracks: string[];
  keyPrerequisites: string[];
  electiveSequence: IElectiveSequenceMap;
  seatCapacity: number;
  enrolledCount: number;
  waitlistCount: number;
  cutoffCgpaLastYear: number;
  liveCutoffCgpa?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const basketSchema = new Schema<IBasket>(
  {
    basketId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    basketNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    collaboration: {
      type: String,
      default: 'TIET',
    },
    industryPartner: {
      type: String,
      enum: ['NVIDIA', 'Xebia', 'EC-Council', 'Future First', 'TIET'],
      default: 'TIET',
    },
    careerTracks: {
      type: [String],
      default: [],
    },
    keyPrerequisites: {
      type: [String],
      default: [],
    },
    electiveSequence: {
      'PE-I': { type: [String], default: [] },
      'PE-II': { type: [String], default: [] },
      'PE-III': { type: [String], default: [] },
      'PE-IV': { type: [String], default: [] },
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
      default: 7.2,
      min: 0,
      max: 10,
    },
    liveCutoffCgpa: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'baskets_catalog',
  }
);

basketSchema.index({ basketNumber: 1 });

export const Basket: Model<IBasket> =
  mongoose.models.Basket || mongoose.model<IBasket>('Basket', basketSchema);
export default Basket;

