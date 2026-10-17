// ============================================
// Net-On API — Root Controller
// ============================================

import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller()
@Public()
export class AppController {
  @Get()
  @ApiExcludeEndpoint()
  getRoot(@Res() res: Response) {
    // If request accepts HTML, redirect to Swagger API docs
    // Otherwise return welcome JSON payload
    return res.json({
      name: 'Net-On API',
      version: '1.0.0',
      description: 'Net-On ISP Management Platform API',
      status: 'ONLINE',
      links: {
        documentation: '/api/docs',
        health: '/api/v1/health',
        webDashboard: 'http://localhost:3000/admin',
        customerPortal: 'http://localhost:3000/portal',
      },
    });
  }
}
