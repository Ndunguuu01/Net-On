import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentService } from './services/payment.service';
import { StkPushDto, ManualPaymentDto, QueryPaymentDto } from './dto/payment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('stk-push')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Initiate M-Pesa STK Push payment' })
  async stkPush(@Body() dto: StkPushDto) {
    const result = await this.paymentService.initiateSTKPush(dto);
    return { message: 'STK Push initiated', data: result };
  }

  @Post('manual')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Record a manual payment' })
  async recordManual(@Body() dto: ManualPaymentDto) {
    const payment = await this.paymentService.recordManual(dto);
    return { message: 'Payment recorded successfully', data: payment };
  }

  @Post('mpesa/callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'M-Pesa STK Push callback (Safaricom calls this)' })
  async mpesaCallback(
    @Body() body: any,
    @Req() req: Request,
    @Query('token') queryToken?: string,
  ) {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    await this.paymentService.handleMpesaCallback(body, queryToken, clientIp);
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SUPPORT')
  @ApiOperation({ summary: 'List payments with pagination and filters' })
  async findAll(@Query() query: QueryPaymentDto) {
    return this.paymentService.findAll(query);
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get payment statistics' })
  async getStats() {
    const stats = await this.paymentService.getStats();
    return { data: stats };
  }
}
