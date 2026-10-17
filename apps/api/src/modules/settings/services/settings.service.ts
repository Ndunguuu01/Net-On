// ============================================
// Net-On API — Settings Service
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAll(category?: string) {
    const where: any = {};
    if (category) where.category = category;

    return this.prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  async get(key: string) {
    return this.prisma.systemSetting.findUnique({ where: { key } });
  }

  async set(key: string, value: string, options?: { type?: string; category?: string; description?: string }) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        type: options?.type || 'string',
        category: options?.category || 'general',
        description: options?.description,
      },
    });
  }

  async setMultiple(settings: Array<{ key: string; value: string }>) {
    const results = [];
    for (const setting of settings) {
      const result = await this.set(setting.key, setting.value);
      results.push(result);
    }
    return results;
  }

  async getCategories() {
    const settings = await this.prisma.systemSetting.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return settings.map((s) => s.category);
  }
}
