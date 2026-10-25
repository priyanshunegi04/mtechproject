import { Request } from 'express';
import mongoose from 'mongoose';
import { AuditLog } from '../models';
import { InstitutionalRole } from '../types';

export interface RecordAuditParams {
  actorId: string;
  actorEmail: string;
  actorRole: InstitutionalRole | 'system';
  action: string;
  req?: Request;
  metadata?: Record<string, unknown>;
}

export async function recordAuditLog(params: RecordAuditParams): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    return;
  }
  const ip =
    (params.req?.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    params.req?.ip ||
    '0.0.0.0';

  await AuditLog.create({
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    action: params.action,
    ipAddress: ip,
    metadata: params.metadata || {},
    timestamp: new Date(),
  });
}

