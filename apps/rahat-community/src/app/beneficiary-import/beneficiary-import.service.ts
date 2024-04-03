import { Injectable } from '@nestjs/common';
import { DB_MODELS } from '../../constants';
import { BeneficiariesService } from '../beneficiaries/beneficiaries.service';
import { BeneficiarySourceService } from '../beneficiary-sources/beneficiary-source.service';
import { SourceService } from '../sources/source.service';
import { fetchSchemaFields, injectCustomID } from './helpers';

@Injectable()
export class BeneficiaryImportService {
  constructor(
    private benefSourceService: BeneficiarySourceService,
    private sourceService: SourceService,
    private benefService: BeneficiariesService,
  ) {}

  async splitPrimaryAndExtraFields(data: any) {
    const fields = fetchSchemaFields(DB_MODELS.TBL_BENEFICIARY);
    const primaryFields = fields.map((f) => f.name);

    const modifiedData = data.map((item: any) => {
      const extras = {};
      Object.keys(item).forEach((key) => {
        if (!primaryFields.includes(key) && key !== 'rawData') {
          extras[key] = item[key]; // Move it to extras object
          delete item[key]; // Delete from original object
        }
      });
      // If extras has any key then add it to item
      if (Object.keys(extras).length > 0) {
        item.extras = extras;
      }
      return item;
    });
    return modifiedData;
  }

  async importBySourceUUID(uuid: string) {
    const source = await this.sourceService.findOne(uuid);
    if (!source) throw new Error('Source not found!');
    if (source.isImported) return 'Already imported!';
    const customUniqueField = source.uniqueField || '';
    const jsonData = source.fieldMapping as {
      data: object;
    };
    // 1. Fetch DB_Fields and validate required fields
    const mapped_fields = jsonData.data;
    const dbFields = fetchSchemaFields(DB_MODELS.TBL_BENEFICIARY);

    // 2. Only select fields matching with DB_Fields
    // const sanitized_fields = extractFieldsMatchingWithDBFields(
    //   dbFields,
    //   mapped_fields,
    // );
    // 3. Parse values against target field
    // const parsed_data = parseValuesByTargetTypes(sanitized_fields, dbFields);
    // 4. Inject unique key based on settings
    const splittedData = await this.splitPrimaryAndExtraFields(mapped_fields);
    const omitRawData = splittedData.map((item: any) => {
      delete item.rawData;
      return item;
    });
    console.log('omitRawData=>', omitRawData);
    const final_payload = injectCustomID(customUniqueField, omitRawData);
    let count = 0;

    // // 5. Save Benef and source
    for (let p of final_payload) {
      count++;
      const benef = await this.benefService.upsertByCustomID(p);
      if (benef) {
        await this.benefSourceService.create({
          beneficiaryId: benef.id,
          sourceId: source.id,
        });
      }
    }
    await this.sourceService.updateImportFlag(source.uuid, true);
    return {
      success: true,
      status: 200,
      message: `${count} out of ${final_payload.length} Beneficiaries updated!`,
    };
  }

  findAll() {
    return `This action returns all beneficiaryImport`;
  }

  findOne(id: number) {
    return `This action returns a #${id} beneficiaryImport`;
  }

  update(id: number) {
    return `This action updates a #${id} beneficiaryImport`;
  }

  remove(id: number) {
    return `This action removes a #${id} beneficiaryImport`;
  }
}
