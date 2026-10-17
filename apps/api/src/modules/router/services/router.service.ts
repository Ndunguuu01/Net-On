// ============================================
// Net-On API — Router Service
// ============================================

import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { MikrotikService } from './mikrotik.service';
import { CreateRouterDto, UpdateRouterDto, QueryRouterDto } from '../dto/router.dto';
import { EncryptionService } from '../../../common/services/encryption.service';

@Injectable()
export class RouterService {
  private readonly logger = new Logger(RouterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mikrotikService: MikrotikService,
    private readonly encryption: EncryptionService,
  ) {}

  async create(dto: CreateRouterDto) {
    const encryptedPassword = this.encryption.encrypt(dto.apiPassword);

    const router = await this.prisma.router.create({
      data: {
        name: dto.name,
        managementIp: dto.managementIp,
        apiPort: dto.apiPort || 8728,
        apiUsername: dto.apiUsername,
        encryptedPassword,
        location: dto.location,
        status: 'ONLINE',
      },
    });

    this.logger.log(`Router "${dto.name}" added at ${dto.managementIp} (credentials encrypted)`);
    return router;
  }

  async findAll(query: QueryRouterDto) {
    const where: any = {};
    if (query.status) where.status = query.status;

    const routers = await this.prisma.router.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { networkAccounts: true } },
      },
    });

    return routers;
  }

  async findOne(id: string) {
    const router = await this.prisma.router.findUnique({
      where: { id },
      include: {
        networkAccounts: {
          select: { id: true, username: true, status: true, ipAddress: true },
          take: 50,
        },
        _count: { select: { networkAccounts: true, syncJobs: true } },
      },
    });
    if (!router) throw new NotFoundException(`Router ${id} not found`);
    return router;
  }

  async update(id: string, dto: UpdateRouterDto) {
    const router = await this.prisma.router.findUnique({ where: { id } });
    if (!router) throw new NotFoundException(`Router ${id} not found`);

    const data: any = { ...dto };
    if (dto.apiPassword) {
      data.encryptedPassword = this.encryption.encrypt(dto.apiPassword);
      delete data.apiPassword;
    }

    return this.prisma.router.update({ where: { id }, data });
  }

  async checkHealth(id: string) {
    const router = await this.prisma.router.findUnique({ where: { id } });
    if (!router) throw new NotFoundException(`Router ${id} not found`);

    const rawPassword = this.encryption.decrypt(router.encryptedPassword);

    const health = await this.mikrotikService.checkHealth(
      router.managementIp,
      router.apiPort,
      router.apiUsername,
      rawPassword,
    );

    await this.prisma.router.update({
      where: { id },
      data: {
        status: health.online ? 'ONLINE' : 'OFFLINE',
        lastHealthCheck: new Date(),
        capabilities: health as any,
      },
    });

    return health;
  }

  async getActiveSessions(id: string) {
    const router = await this.prisma.router.findUnique({ where: { id } });
    if (!router) throw new NotFoundException(`Router ${id} not found`);

    const rawPassword = this.encryption.decrypt(router.encryptedPassword);

    return this.mikrotikService.getActiveSessions({
      managementIp: router.managementIp,
      apiPort: router.apiPort,
      apiUsername: router.apiUsername,
      encryptedPassword: rawPassword,
    });
  }

  async remove(id: string) {
    const router = await this.prisma.router.findUnique({ where: { id } });
    if (!router) throw new NotFoundException(`Router ${id} not found`);

    await this.prisma.router.delete({ where: { id } });
    return { message: 'Router removed successfully' };
  }
}
