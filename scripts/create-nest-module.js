#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class NestJSModuleGenerator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  // Utility functions for string manipulation
  toCamelCase(str) {
    return (
      str.charAt(0).toLowerCase() +
      str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    );
  }

  toPascalCase(str) {
    return str.charAt(0).toUpperCase() + this.toCamelCase(str).slice(1);
  }

  toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/[_\s]+/g, '-');
  }

  // Enhanced pluralization/singularization logic
  pluralize(word) {
    const irregularPlurals = {
      person: 'people',
      man: 'men',
      woman: 'women',
      child: 'children',
      foot: 'feet',
      tooth: 'teeth',
      mouse: 'mice',
      goose: 'geese',
    };

    const lowerWord = word.toLowerCase();

    if (irregularPlurals[lowerWord]) {
      return irregularPlurals[lowerWord];
    }

    // Check if already plural
    if (this.isPlural(word)) {
      return word;
    }

    // Standard pluralization rules
    if (lowerWord.endsWith('y') && !'aeiou'.includes(lowerWord[lowerWord.length - 2])) {
      return word.slice(0, -1) + 'ies';
    }
    if (
      lowerWord.endsWith('s') ||
      lowerWord.endsWith('sh') ||
      lowerWord.endsWith('ch') ||
      lowerWord.endsWith('x') ||
      lowerWord.endsWith('z')
    ) {
      return word + 'es';
    }
    if (lowerWord.endsWith('f')) {
      return word.slice(0, -1) + 'ves';
    }
    if (lowerWord.endsWith('fe')) {
      return word.slice(0, -2) + 'ves';
    }
    if (lowerWord.endsWith('o') && !'aeiou'.includes(lowerWord[lowerWord.length - 2])) {
      return word + 'es';
    }

    return word + 's';
  }

  singularize(word) {
    const irregularSingulars = {
      people: 'person',
      men: 'man',
      women: 'woman',
      children: 'child',
      feet: 'foot',
      teeth: 'tooth',
      mice: 'mouse',
      geese: 'goose',
    };

    const lowerWord = word.toLowerCase();

    if (irregularSingulars[lowerWord]) {
      return irregularSingulars[lowerWord];
    }

    // Check if already singular
    if (!this.isPlural(word)) {
      return word;
    }

    // Standard singularization rules
    if (lowerWord.endsWith('ies')) {
      return word.slice(0, -3) + 'y';
    }
    if (lowerWord.endsWith('ves')) {
      if (word.slice(-4, -3) === 'i') {
        return word.slice(0, -3) + 'fe';
      }
      return word.slice(0, -3) + 'f';
    }
    if (
      lowerWord.endsWith('ses') ||
      lowerWord.endsWith('shes') ||
      lowerWord.endsWith('ches') ||
      lowerWord.endsWith('xes') ||
      lowerWord.endsWith('zes')
    ) {
      return word.slice(0, -2);
    }
    if (lowerWord.endsWith('oes') && !'aeiou'.includes(lowerWord[lowerWord.length - 4])) {
      return word.slice(0, -2);
    }
    if (lowerWord.endsWith('s') && !lowerWord.endsWith('ss')) {
      return word.slice(0, -1);
    }

    return word;
  }

  isPlural(word) {
    const lowerWord = word.toLowerCase();
    const alwaysPlural = ['data', 'information', 'news', 'series', 'species'];
    const irregularPlurals = [
      'people',
      'men',
      'women',
      'children',
      'feet',
      'teeth',
      'mice',
      'geese',
    ];

    if (alwaysPlural.includes(lowerWord) || irregularPlurals.includes(lowerWord)) {
      return true;
    }

    return (
      lowerWord.endsWith('s') ||
      lowerWord.endsWith('ies') ||
      lowerWord.endsWith('ves') ||
      lowerWord.endsWith('ses') ||
      lowerWord.endsWith('shes') ||
      lowerWord.endsWith('ches') ||
      lowerWord.endsWith('xes') ||
      lowerWord.endsWith('zes') ||
      lowerWord.endsWith('oes')
    );
  }

  // Prompt user for input
  async promptUser(question, defaultValue = '') {
    return new Promise((resolve) => {
      const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  // Directory and file operations
  async createDirectory(dirPath, force = false) {
    if (fs.existsSync(dirPath)) {
      if (force) {
        console.log(
          `⚠️  Directory '${dirPath}' already exists. Overwriting due to --force flag.`,
        );
        fs.rmSync(dirPath, { recursive: true, force: true });
      } else {
        throw new Error(
          `Directory '${dirPath}' already exists. Use --force to overwrite.`,
        );
      }
    }

    fs.mkdirSync(dirPath, { recursive: true });
  }

  async createDirectoryStructure(rootPath, force = false) {
    // Create root folder
    await this.createDirectory(rootPath, force);

    // Create main subfolders
    const mainFolders = ['dtos', 'controllers', 'entities', 'services'];
    mainFolders.forEach((folder) => {
      fs.mkdirSync(path.join(rootPath, folder), { recursive: true });
    });

    // Create DTOs subfolders
    const dtoFolders = ['request', 'response', 'query'];
    dtoFolders.forEach((folder) => {
      fs.mkdirSync(path.join(rootPath, 'dtos', folder), { recursive: true });
    });
  }

  // Template generation
  generateFileContent(template, replacements) {
    let content = template;
    Object.keys(replacements).forEach((key) => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      content = content.replace(regex, replacements[key]);
    });
    return content;
  }

  getTemplates() {
    return {
      CreateDto: `import { IsString, IsNotEmpty, Length } from 'class-validator';

export class Create\${EntityName}Dto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;
}`,

      UpdateDto: `import { PartialType } from '@nestjs/mapped-types';
import { Create\${EntityName}Dto } from './create-\${fileName}.dto';

export class Update\${EntityName}Dto extends PartialType(Create\${EntityName}Dto) {}`,

      ResponseDto: `import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class \${EntityName}ResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}`,

      FilterDto: `import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class \${EntityName}FilterDto extends PaginationDto {
  search?: string;
}`,

      Entity: `import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';

@Entity('\${tableName}')
export class \${EntityName}Entity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}`,

      Controller: `import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { \${FeatureName}Service } from '../services/\${featureName}.service';
import { Create\${EntityName}Dto } from '../dtos/request/create-\${fileName}.dto';
import { Update\${EntityName}Dto } from '../dtos/request/update-\${fileName}.dto';
import { \${EntityName}ResponseDto } from '../dtos/response/\${fileName}-response.dto';
import { \${EntityName}FilterDto } from '../dtos/query/\${fileName}-filter.dto';
import { PositiveIntPipe } from 'src/common/pipes/positive-int.pipe';
import { PaginationResponseDto } from 'src/common/pagination/dto/pagination-response.dto';
import { SerializeResponse } from 'src/common/decorators/serialize-response.decorator';

@Controller('\${featureName}')
export class \${FeatureName}Controller {
  constructor(private readonly \${featureNameCamel}Service: \${FeatureName}Service) {}

  @Post()
  @SerializeResponse(\${EntityName}ResponseDto)
  create(@Body() create\${EntityName}Dto: Create\${EntityName}Dto): Promise<\${EntityName}ResponseDto> {
    return this.\${featureNameCamel}Service.create(create\${EntityName}Dto);
  }

  @Get()
  findAll(@Query() filter\${EntityName}Dto: \${EntityName}FilterDto): Promise<PaginationResponseDto<\${EntityName}ResponseDto>> {
    return this.\${featureNameCamel}Service.findAll(filter\${EntityName}Dto);
  }

  @Get(':id')
  @SerializeResponse(\${EntityName}ResponseDto)
  findOne(@Param('id', PositiveIntPipe) id: number): Promise<\${EntityName}ResponseDto> {
    return this.\${featureNameCamel}Service.findOne(id);
  }

  @Patch(':id')
  @SerializeResponse(\${EntityName}ResponseDto)
  update(
    @Param('id', PositiveIntPipe) id: number,
    @Body() update\${EntityName}Dto: Update\${EntityName}Dto,
  ): Promise<\${EntityName}ResponseDto> {
    return this.\${featureNameCamel}Service.update(id, update\${EntityName}Dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', PositiveIntPipe) id: number): Promise<void> {
    this.\${featureNameCamel}Service.delete(id);
  }
}`,

      Service: `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Create\${EntityName}Dto } from '../dtos/request/create-\${fileName}.dto';
import { Update\${EntityName}Dto } from '../dtos/request/update-\${fileName}.dto';
import { \${EntityName}ResponseDto } from '../dtos/response/\${fileName}-response.dto';
import { \${EntityName}FilterDto } from '../dtos/query/\${fileName}-filter.dto';
import { \${EntityName}Entity } from '../entities/\${fileName}.entity';
import { paginate } from 'src/common/pagination/paginate.service';
import { PaginationResponseDto } from 'src/common/pagination/dto/pagination-response.dto';

@Injectable()
export class \${FeatureName}Service {
  constructor(
    @InjectRepository(\${EntityName}Entity)
    private readonly \${entityNameCamel}Repository: Repository<\${EntityName}Entity>,
  ) {}

  async create(create\${EntityName}Dto: Create\${EntityName}Dto): Promise<\${EntityName}Entity> {
    const \${entityNameCamel} = this.\${entityNameCamel}Repository.create(create\${EntityName}Dto);
    const saved\${EntityName} = await this.\${entityNameCamel}Repository.save(\${entityNameCamel});
    return saved\${EntityName};
  }

  async findAll(filter\${EntityName}Dto: \${EntityName}FilterDto): Promise<PaginationResponseDto<\${EntityName}ResponseDto>> {
    const queryBuilder = this.\${entityNameCamel}Repository.createQueryBuilder('\${entityNameCamel}');

    if (filter\${EntityName}Dto.search) {
      queryBuilder.andWhere('\${entityNameCamel}.name LIKE :name', { 
        name: \`%\${filter\${EntityName}Dto.search}%\`
      });
    }

    return paginate(queryBuilder, filter\${EntityName}Dto, \${EntityName}ResponseDto);
  }

  async findOne(id: number): Promise<\${EntityName}ResponseDto> {
    const \${entityNameCamel} = await this.\${entityNameCamel}Repository.findOne({ where: { id } });

    if (!\${entityNameCamel}) {
      throw new NotFoundException('\${EntityName} not found');
    }

    return \${entityNameCamel};
  }

  async update(id: number, update\${EntityName}Dto: Update\${EntityName}Dto): Promise<\${EntityName}Entity> {
    const \${entityNameCamel} = await this.\${entityNameCamel}Repository.findOne({ where: { id } });
    
    if (!\${entityNameCamel}) {
      throw new NotFoundException('\${EntityName} not found');
    }
    
    const updated\${EntityName} = this.\${entityNameCamel}Repository.merge(\${entityNameCamel}, update\${EntityName}Dto);
    const saved\${EntityName} = await this.\${entityNameCamel}Repository.save(updated\${EntityName});
    return saved\${EntityName};
  }

  async delete(id: number): Promise<void> {
    const result = await this.\${entityNameCamel}Repository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('\${EntityName} not found');
    }
  }
}`,

      Module: `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { \${FeatureName}Controller } from './controllers/\${featureName}.controller';
import { \${FeatureName}Service } from './services/\${featureName}.service';
import { \${EntityName}Entity } from './entities/\${fileName}.entity';

@Module({
  imports: [TypeOrmModule.forFeature([\${EntityName}Entity])],
  controllers: [\${FeatureName}Controller],
  providers: [\${FeatureName}Service],
  exports: [\${FeatureName}Service],
})
export class \${FeatureName}Module {}`,
    };
  }

  async generateModule() {
    console.log('🚀 NestJS Module Generator\n');

    try {
      // Get user inputs
      const featureName = await this.promptUser(
        'Enter feature name (plural, e.g., users, products)',
      );
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      const singularInput = await this.promptUser(
        'Enter singular name (optional, will be auto-generated if empty)',
      );

      const forceInput = await this.promptUser(
        'Force overwrite existing files? (y/N)',
        'n',
      );
      const force =
        forceInput.toLowerCase() === 'y' || forceInput.toLowerCase() === 'yes';

      const basePath = await this.promptUser('Base path', 'src/modules');

      // Process names
      const featureNameNormalized = this.toKebabCase(featureName.toLowerCase());
      const singularName = singularInput || this.singularize(featureNameNormalized);
      const fileName = this.toKebabCase(singularName);

      // Generate all name variations
      const names = {
        // Feature names (plural)
        featureName: featureNameNormalized,
        FeatureName: this.toPascalCase(featureNameNormalized),
        featureNameCamel: this.toCamelCase(featureNameNormalized),

        // Entity names (singular)
        fileName: fileName,
        EntityName: this.toPascalCase(singularName),
        entityNameCamel: this.toCamelCase(singularName),

        // Table name (plural, snake_case)
        tableName: featureNameNormalized.replace(/-/g, '_'),
      };

      console.log('\n📋 Generated Names:');
      console.log(`   Feature (plural): ${names.featureName}`);
      console.log(`   Entity (singular): ${names.fileName}`);
      console.log(`   Table name: ${names.tableName}`);

      const modulePath = path.join(basePath, names.featureName);

      console.log(`\n📁 Creating module at: ${modulePath}`);

      // Create directory structure
      await this.createDirectoryStructure(modulePath, force);

      // Generate files
      const templates = this.getTemplates();
      const files = [
        {
          path: path.join(
            modulePath,
            'dtos',
            'request',
            `create-${names.fileName}.dto.ts`,
          ),
          template: templates.CreateDto,
        },
        {
          path: path.join(
            modulePath,
            'dtos',
            'request',
            `update-${names.fileName}.dto.ts`,
          ),
          template: templates.UpdateDto,
        },
        {
          path: path.join(
            modulePath,
            'dtos',
            'response',
            `${names.fileName}-response.dto.ts`,
          ),
          template: templates.ResponseDto,
        },
        {
          path: path.join(modulePath, 'dtos', 'query', `${names.fileName}-filter.dto.ts`),
          template: templates.FilterDto,
        },
        {
          path: path.join(modulePath, 'entities', `${names.fileName}.entity.ts`),
          template: templates.Entity,
        },
        {
          path: path.join(
            modulePath,
            'controllers',
            `${names.featureName}.controller.ts`,
          ),
          template: templates.Controller,
        },
        {
          path: path.join(modulePath, 'services', `${names.featureName}.service.ts`),
          template: templates.Service,
        },
        {
          path: path.join(modulePath, `${names.featureName}.module.ts`),
          template: templates.Module,
        },
      ];

      // Generate and write files
      files.forEach((file) => {
        const content = this.generateFileContent(file.template, names);
        fs.writeFileSync(file.path, content, 'utf8');
        console.log(`✅ Created: ${file.path}`);
      });

      // Create index file for DTOs
      const dtosIndexContent = `// Request DTOs
export * from './request/create-${names.fileName}.dto';
export * from './request/update-${names.fileName}.dto';

// Response DTOs
export * from './response/${names.fileName}-response.dto';

// Query DTOs
export * from './query/${names.fileName}-filter.dto';`;

      const dtosIndexPath = path.join(modulePath, 'dtos', 'index.ts');
      fs.writeFileSync(dtosIndexPath, dtosIndexContent, 'utf8');
      console.log(`✅ Created: ${dtosIndexPath}`);

      // Success message
      console.log(
        `\n🎉 SUCCESS! NestJS module '${names.FeatureName}' created successfully!`,
      );
      console.log(`📍 Location: ${modulePath}`);
      console.log(`\n📝 Next Steps:`);
      console.log(`   1. Add the module to your app.module.ts imports`);
      console.log(`   2. Configure your database connection for the entity`);
      console.log(`   3. Update the DTO validation rules as needed`);
      console.log(`   4. Implement any additional business logic in the service`);
      console.log(`\n💡 Import Example:`);
      console.log(
        `   import { ${names.FeatureName}Module } from './modules/${names.featureName}/${names.featureName}.module';`,
      );
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Run the generator
if (require.main === module) {
  const generator = new NestJSModuleGenerator();
  generator.generateModule();
}

module.exports = NestJSModuleGenerator;
