// ============================================
// Net-On API — Customer Number Generator Service
// ============================================
// Generates sequential NET-000001 customer numbers.
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CUSTOMER_NUMBER_PREFIX } from '@neton/shared';

@Injectable()
export class CustomerNumberService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate the next unique customer number (e.g. NET-000001, NET-000002).
   */
  async generateNext(): Promise<string> {
    const lastCustomer = await this.prisma.customer.findFirst({
      where: {
        customerNumber: {
          startsWith: `${CUSTOMER_NUMBER_PREFIX}-`,
        },
      },
      orderBy: {
        customerNumber: 'desc',
      },
      select: {
        customerNumber: true,
      },
    });

    if (!lastCustomer || !lastCustomer.customerNumber) {
      return `${CUSTOMER_NUMBER_PREFIX}-000001`;
    }

    const match = lastCustomer.customerNumber.match(/NET-(\d+)/);
    if (!match) {
      return `${CUSTOMER_NUMBER_PREFIX}-000001`;
    }

    const nextSeq = parseInt(match[1], 10) + 1;
    return `${CUSTOMER_NUMBER_PREFIX}-${String(nextSeq).padStart(6, '0')}`;
  }
}
