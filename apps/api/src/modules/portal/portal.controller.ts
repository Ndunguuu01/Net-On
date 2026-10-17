// ============================================
// Net-On API — Portal Controller
// ============================================
// Customer-facing endpoints for the self-service
// portal. All data is scoped to the logged-in
// customer via the JWT token.
// ============================================

import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PortalService } from './portal.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Portal')
@ApiBearerAuth('JWT-auth')
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('dashboard')
  @Roles('CUSTOMER', 'SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get customer portal dashboard' })
  async getDashboard(@CurrentUser('id') userId: string) {
    const data = await this.portalService.getDashboard(userId);
    return { data };
  }

  @Get('subscription')
  @Roles('CUSTOMER', 'SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get customer subscription details' })
  async getSubscription(@CurrentUser('id') userId: string) {
    const data = await this.portalService.getSubscription(userId);
    return { data };
  }

  @Get('invoices')
  @Roles('CUSTOMER', 'SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get customer invoices' })
  async getInvoices(@CurrentUser('id') userId: string, @Query() query: any) {
    return this.portalService.getInvoices(userId, query);
  }

  @Get('invoices/:id')
  @Roles('CUSTOMER', 'SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get customer invoice detail' })
  async getInvoiceDetail(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const data = await this.portalService.getInvoiceDetail(userId, id);
    return { data };
  }

  @Get('payments')
  @Roles('CUSTOMER', 'SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get customer payment history' })
  async getPayments(@CurrentUser('id') userId: string, @Query() query: any) {
    return this.portalService.getPayments(userId, query);
  }

  @Post('pay')
  @Roles('CUSTOMER', 'SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Initiate M-Pesa STK Push self-checkout' })
  async initiatePayment(
    @CurrentUser('id') userId: string,
    @Body() dto: { invoiceId?: string; amount?: number; phone?: string },
  ) {
    const data = await this.portalService.initiatePayment(userId, dto);
    return { data };
  }

  @Get('support')
  @Roles('CUSTOMER', 'SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get customer support tickets' })
  async getTickets(@CurrentUser('id') userId: string) {
    const data = await this.portalService.getTickets(userId);
    return { data };
  }

  @Post('support')
  @Roles('CUSTOMER', 'SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Submit a support ticket from portal' })
  async createTicket(
    @CurrentUser('id') userId: string,
    @Body() dto: { subject: string; description: string; category?: string; priority?: string },
  ) {
    const data = await this.portalService.createTicket(userId, dto);
    return { message: 'Ticket submitted', data };
  }

  @Get('profile')
  @Roles('CUSTOMER', 'SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get customer profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    const data = await this.portalService.getProfile(userId);
    return { data };
  }
}
