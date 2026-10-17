// ============================================
// Net-On API — Customer Controller
// ============================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerService } from './services/customer.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  QueryCustomerDto,
  SuspendCustomerDto,
} from './dto/customer.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  /**
   * Create a new customer.
   */
  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Create a new customer profile' })
  async create(@Body() dto: CreateCustomerDto) {
    const customer = await this.customerService.create(dto);
    return {
      message: 'Customer created successfully',
      data: customer,
    };
  }

  /**
   * List customers with search, status filter, and pagination.
   */
  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'TECHNICIAN', 'SUPPORT')
  @ApiOperation({ summary: 'List customers with pagination and search' })
  async findAll(@Query() query: QueryCustomerDto) {
    return this.customerService.findAll(query);
  }

  /**
   * Get single customer by ID.
   */
  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'TECHNICIAN', 'SUPPORT')
  @ApiOperation({ summary: 'Get customer details by ID' })
  async findOne(@Param('id') id: string) {
    const customer = await this.customerService.findOne(id);
    return { data: customer };
  }

  /**
   * Update customer profile.
   */
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Update customer details' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    const customer = await this.customerService.update(id, dto);
    return {
      message: 'Customer updated successfully',
      data: customer,
    };
  }

  /**
   * Suspend customer.
   */
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SUPPORT')
  @ApiOperation({ summary: 'Suspend customer account' })
  async suspend(@Param('id') id: string, @Body() dto: SuspendCustomerDto) {
    const customer = await this.customerService.suspend(id, dto);
    return {
      message: 'Customer suspended successfully',
      data: customer,
    };
  }

  /**
   * Reactivate suspended customer.
   */
  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SUPPORT')
  @ApiOperation({ summary: 'Reactivate suspended customer' })
  async reactivate(@Param('id') id: string) {
    const customer = await this.customerService.reactivate(id);
    return {
      message: 'Customer reactivated successfully',
      data: customer,
    };
  }

  /**
   * Soft delete / archive customer.
   */
  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Archive customer' })
  async remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }
}
