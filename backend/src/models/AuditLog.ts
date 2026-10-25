import mongoose, { Document, Model, Schema } from 'mongoose';
import { InstitutionalRole } from '../types';

export interface IAuditLog extends Document {
  actorId: string;
  actorEmail: string;
  actorRole: InstitutionalRole | 'system';
  action: string;
  ipAddress: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
    },
    actorRole: {
      type: String,
      enum: ['student', 'faculty_advisor', 'dean_admin', 'system'],
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: '0.0.0.0',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 365, // 1-year enterprise compliance retention TTL index
    },
  },
  {
    timestamps: false,
    collection: 'audit_logs',
  }
);

auditLogSchema.index({ actorId: 1, action: 1, timestamp: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;

