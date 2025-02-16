import { BeneficiaryEvents } from '@rahataid/community-tool-sdk';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_TEMPLATES, EVENTS } from '../../constants';
import { BeneficiaryStatService } from '../beneficiaries/beneficiaryStats.service';
import { BeneficiaryImportService } from '../beneficiary-import/beneficiary-import.service';
import { TargetService } from '../targets/target.service';
import { SourceCreatedDto } from './listeners.dto';
import { EmailService } from './mail.service';
import {
  CreateBeneficiaryGroupDto,
  ExportTargetBeneficiaryDto,
} from '@rahataid/community-tool-extensions';
import { BeneficiaryGroupService } from '../beneficiary-groups/beneficiary-group.service';
@Injectable()
export class ListenerService {
  constructor(
    private targetService: TargetService,
    private benefImport: BeneficiaryImportService,
    private emailService: EmailService,
    private benefGroupService: BeneficiaryGroupService,
    private readonly benStats: BeneficiaryStatService,
  ) {}
  @OnEvent(EVENTS.CREATE_TARGET_RESULT)
  async createTargetResult(data: any) {
    return await this.targetService.saveTargetResult(data);
  }

  @OnEvent(EVENTS.OTP_CREATED)
  async sendOTPEmail(data: any) {
    const payload = {
      name: data.name,
      otp: data.otp,
      to: data.address,
      subject: 'Rahat OTP',
      template: EMAIL_TEMPLATES.LOGIN,
    };
    console.log('EMAIL Payload==>', payload);
    return this.emailService.sendEmail(
      data.address,
      'OTP for login',
      'OTP for login',
      `<h1>OTP for login</h1><p>${data.otp}</p>`,
    );
    // const sent = await this.mailService.sendOTPMail(payload);
    // console.log('Email Sent==>', sent);
  }

  @OnEvent(EVENTS.CLEANUP_TARGET_QUERY)
  async cleanupTargetQuery() {
    return this.targetService.cleanTargetQueryAndResults();
  }

  @OnEvent(EVENTS.BENEF_SOURCE_CREATED)
  async importBeneficiaries(data: SourceCreatedDto) {
    return this.benefImport.importBySourceUUID(data.sourceUUID);
  }

  @OnEvent(EVENTS.BENEF_EXPORT)
  async exportBeneficiaries(data: ExportTargetBeneficiaryDto) {
    return this.targetService.processExportTarget(data);
  }

  @OnEvent(EVENTS.CREATE_BENEF_GROUP)
  async createBenefGroup(data: CreateBeneficiaryGroupDto) {
    return this.benefGroupService.createBeneficiaryGroup(data);
  }
  @OnEvent(BeneficiaryEvents.BENEFICIARY_CREATED)
  @OnEvent(BeneficiaryEvents.BENEFICIARY_UPDATED)
  @OnEvent(BeneficiaryEvents.BENEFICIARY_REMOVED)
  async onBeneficiaryChanged() {
    console.log('listener called');
    // await this.benStats.saveAllStats();
  }
}
