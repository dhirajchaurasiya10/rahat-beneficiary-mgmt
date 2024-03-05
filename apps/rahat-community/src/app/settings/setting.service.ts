import { Injectable } from '@nestjs/common';
import { SettingsService } from '@rumsan/settings';
import { setSettings } from './setting.config';

@Injectable()
export class AppSettingService {
  constructor(private settingService: SettingsService) {
    this.refreshSettings();
  }

  async refreshSettings() {
    const response = await this.settingService.listPublic();
    setSettings(response);
  }
}
