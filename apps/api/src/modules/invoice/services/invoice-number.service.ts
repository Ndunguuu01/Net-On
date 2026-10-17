// ============================================
// Net-On API — Invoice Number Service
// ============================================
// Generates sequential invoice numbers in the
// format INV-YYYYMM-XXXX (e.g., INV-202608-0001)
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class InvoiceNumberService {
  private readonly logger = new Logger(InvoiceNumberService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate the next sequential invoice number for the current month.
   */
  async generateNext(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `INV-${yearMonth}-`;

    // Find the latest invoice number for this month
    const latest = await this.prisma.invoice.findFirst({
      where: {
        invoiceNumber: { startsWith: prefix },
      },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    let nextSeq = 1;
    if (latest) {
      const lastSeq = parseInt(latest.invoiceNumber.replace(prefix, ''), 10);
      nextSeq = lastSeq + 1;
    }

    const invoiceNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    this.logger.debug(`Generated invoice number: ${invoiceNumber}`);
    return invoiceNumber;
  }
}
