// ============================================
// Net-On API — Audit Log Service
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    result?: string;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        result: data.result || 'SUCCESS',
        metadata: data.metadata || null,
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    userId?: string;
    search?: string;
  }) {
    const { page = 1, limit = 50, action, resource, userId, search } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { resourceId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
