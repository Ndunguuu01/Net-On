import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './services/audit.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Audit')
@ApiBearerAuth('JWT-auth')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List audit logs with filters' })
  async findAll(@Query() query: any) {
    return this.auditService.findAll(query);
  }
}
