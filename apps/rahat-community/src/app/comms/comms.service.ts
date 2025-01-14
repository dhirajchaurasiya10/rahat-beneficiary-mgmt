import { Injectable, Logger } from '@nestjs/common';
import { SETTINGS_NAMES } from '@rahataid/community-tool-sdk';
import { getClient } from '@rumsan/connect/src/clients';
import { PrismaService } from '@rumsan/prisma';

export type CommsClient = ReturnType<typeof getClient>;

@Injectable()
export class CommsService {
  private client: CommsClient;
  private logger = new Logger(CommsService.name);

  constructor(private prisma: PrismaService) {}

  async fetchCommSettings() {
    const row: any = await this.prisma.setting.findUnique({
      where: {
        name: SETTINGS_NAMES.COMMUNICATIONS,
      },
    });
    if (!row) return null;
    return {
      APP_ID: row?.value?.APP_ID,
      URL: row?.value?.URL,
    };
  }

  async init() {
    const settings = await this.fetchCommSettings();
    console.log('settings=>', settings);
    if (!settings) {
      this.logger.error('Communication settings not found');
      return;
    }
    this.client = getClient({
      baseURL: settings.URL,
    });
    this.client.setAppId(settings.APP_ID);
  }

  async getClient() {
    if (!this.client) {
      await this.init();
      return this.client;
    }
    return this.client;
  }
}
