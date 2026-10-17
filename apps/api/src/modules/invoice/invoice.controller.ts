// ============================================
// Net-On API — Invoice Controller
// ============================================

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoiceService } from './services/invoice.service';
import { CreateInvoiceDto, QueryInvoiceDto, MarkInvoicePaidDto } from './dto/invoice.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Invoices')
@ApiBearerAuth('JWT-auth')
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Create a new invoice' })
  async create(@Body() dto: CreateInvoiceDto) {
    const invoice = await this.invoiceService.create(dto);
    return { message: 'Invoice created successfully', data: invoice };
  }

  @Post('generate-bulk')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Generate invoices for expiring subscriptions' })
  async generateBulk() {
    const result = await this.invoiceService.generateBulk();
    return { message: `${result.generated} invoices generated`, data: result };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SUPPORT')
  @ApiOperation({ summary: 'List invoices with pagination and filters' })
  async findAll(@Query() query: QueryInvoiceDto) {
    return this.invoiceService.findAll(query);
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get invoice statistics' })
  async getStats() {
    const stats = await this.invoiceService.getStats();
    return { data: stats };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SUPPORT')
  @ApiOperation({ summary: 'Get invoice details by ID' })
  async findOne(@Param('id') id: string) {
    const invoice = await this.invoiceService.findOne(id);
    return { data: invoice };
  }

  @Post(':id/mark-paid')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Record payment against an invoice' })
  async markPaid(@Param('id') id: string, @Body() dto: MarkInvoicePaidDto) {
    const invoice = await this.invoiceService.markPaid(id, dto);
    return { message: 'Payment recorded successfully', data: invoice };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Cancel an invoice' })
  async cancel(@Param('id') id: string) {
    const invoice = await this.invoiceService.cancel(id);
    return { message: 'Invoice cancelled', data: invoice };
  }
}
