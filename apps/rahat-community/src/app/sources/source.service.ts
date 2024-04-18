import { Injectable } from '@nestjs/common';

import {
  CreateSourceDto,
  UpdateSourceDto,
} from '@rahataid/community-tool-extensions';
import { InjectQueue } from '@nestjs/bull';
import { PrismaService } from '@rumsan/prisma';
import { Queue } from 'bull';
import {
  IMPORT_ACTION,
  JOBS,
  QUEUE,
  QUEUE_RETRY_OPTIONS,
} from '../../constants';
import { validateSchemaFields } from '../beneficiary-import/helpers';
import { paginate } from '../utils/paginate';
import { FieldDefinitionsService } from '../field-definitions/field-definitions.service';
import { uuid } from 'uuidv4';
import { parse } from 'path';
import { parseIsoDateToString } from '../utils';

@Injectable()
export class SourceService {
  constructor(
    @InjectQueue(QUEUE.BENEFICIARY.IMPORT) private queueClient: Queue,
    private prisma: PrismaService,
    private readonly fdService: FieldDefinitionsService,
  ) {}

  async getMappingsByImportId(importId: string) {
    const res: any = await this.prisma.source.findUnique({
      where: { importId },
    });
    if (!res) return null;
    return res;
  }

  async listExtraFields() {
    const fd = await this.fdService.listActive();
    if (!fd.length) return [];

    return fd.map((item: any) => {
      return {
        name: item.name,
        type: item.fieldType,
        fieldPopulate: item.fieldPopulate,
      };
    });
  }

  async getDuplicateCountByUnqueId(customUniqueField: string, payload: []) {
    let count = 0;
    for (let p of payload) {
      const keyExist = Object.hasOwnProperty.call(p, customUniqueField);
      if (keyExist) {
        const res = await this.prisma.beneficiary.findUnique({
          where: { customId: p[customUniqueField] },
        });
        if (res) count++;
      }
    }
    return count;
  }

  async ValidateBeneficiaryImort(
    customUniqueField: string,
    data: any,
    extraFields: any,
  ) {
    const { allValidationErrors, processedData } = await validateSchemaFields(
      customUniqueField,
      data,
      extraFields,
    );

    const result = await this.checkDuplicateBeneficiary(
      processedData,
      customUniqueField,
    );
    const duplicates = result.filter((f) => f.isDuplicate);
    const dateParsedDuplicates = duplicates.map((d) => {
      let item = { ...d };
      if (item.birthDate) {
        item.birthDate = parseIsoDateToString(item.birthDate);
      }
      return item;
    });
    const finalResult = result.filter((f) => !f.exportOnly);
    return {
      invalidFields: allValidationErrors,
      result: finalResult,
      duplicates: dateParsedDuplicates,
    };
  }

  async create(dto: CreateSourceDto) {
    const { action, ...rest } = dto;
    const { data } = dto.fieldMapping;
    const extraFields = await this.listExtraFields();
    const payloadWithUUID = data.map((d) => {
      return { ...d, uuid: uuid() };
    });

    const customUniqueField = rest.uniqueField || '';

    if (action === IMPORT_ACTION.VALIDATE)
      return this.ValidateBeneficiaryImort(
        customUniqueField,
        payloadWithUUID,
        extraFields,
      );

    if (action === IMPORT_ACTION.IMPORT) {
      const { allValidationErrors } = await validateSchemaFields(
        customUniqueField,
        payloadWithUUID,
        extraFields,
      );

      console.log('allImportErrors', allValidationErrors);
      if (allValidationErrors.length)
        throw new Error('Invalid data submitted!');
      const row = await this.prisma.source.upsert({
        where: { importId: rest.importId },
        update: { ...rest, isImported: false },
        create: rest,
      });
      this.queueClient.add(
        JOBS.BENEFICIARY.IMPORT,
        { sourceUUID: row.uuid },
        QUEUE_RETRY_OPTIONS,
      );
      return { message: 'Source created and added to queue' };
    }
  }

  async checkDuplicateBeneficiary(data: any, customUniqueField: string) {
    const result = [];
    for (let p of data) {
      p.isDuplicate = false;
      const keyExist = Object.hasOwnProperty.call(p, customUniqueField);

      if (keyExist && p[customUniqueField]) {
        const res = await this.prisma.beneficiary.findUnique({
          where: { customId: p[customUniqueField].toString() },
        });
        if (res) {
          p.isDuplicate = true;
          result.push({ ...res, isDuplicate: true, exportOnly: true });
        }
      }
      result.push(p);
    }
    return result;
  }

  findAll(query: any) {
    const select = {
      fieldMapping: true,
      uuid: true,
      id: true,
      name: true,
      createdAt: true,
    };

    return paginate(
      this.prisma.source,
      { select },
      {
        page: query?.page,
        perPage: query?.perPage,
      },
    );
  }

  findOne(uuid: string) {
    return this.prisma.source.findUnique({ where: { uuid } });
  }

  update(uuid: string, dto: UpdateSourceDto) {
    return this.prisma.source.update({
      where: { uuid },
      data: dto,
    });
  }

  updateImportFlag(uuid: string, flag: boolean) {
    return this.prisma.source.update({
      where: { uuid },
      data: { isImported: flag },
    });
  }

  remove(uuid: string) {
    return this.prisma.source.delete({
      where: {
        uuid,
      },
    });
  }
}
