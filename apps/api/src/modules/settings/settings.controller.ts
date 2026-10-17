import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './services/settings.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all system settings' })
  async getAll(@Query('category') category?: string) {
    const settings = await this.settingsService.getAll(category);
    return { data: settings };
  }

  @Get('categories')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get setting categories' })
  async getCategories() {
    const categories = await this.settingsService.getCategories();
    return { data: categories };
  }

  @Get(':key')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get a setting by key' })
  async get(@Param('key') key: string) {
    const setting = await this.settingsService.get(key);
    return { data: setting };
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update settings' })
  async set(@Body() dto: { settings: Array<{ key: string; value: string }> }) {
    const result = await this.settingsService.setMultiple(dto.settings);
    return { message: 'Settings updated', data: result };
  }
}
