import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { ServiceEntity } from 'src/modules/services/entities/service.entity';
import { ServiceTranslationEntity } from 'src/modules/services/entities/service-translation.entity';
import { SolutionEntity } from 'src/modules/solutions/entities/solution.entity';
import { SolutionTranslationEntity } from 'src/modules/solutions/entities/solution-translation.entity';
import { LanguageEntity } from 'src/modules/languages/entities/language.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const serviceRepository = queryRunner.manager.getRepository(ServiceEntity);
    const serviceTranslationRepository = queryRunner.manager.getRepository(ServiceTranslationEntity);
    const solutionRepository = queryRunner.manager.getRepository(SolutionEntity);
    const solutionTranslationRepository = queryRunner.manager.getRepository(SolutionTranslationEntity);
    const languageRepository = queryRunner.manager.getRepository(LanguageEntity);

    // Check if any services already exist
    const existingServices = await serviceRepository.count();
    const existingSolutions = await solutionRepository.count();

    if (existingServices > 0 || existingSolutions > 0) {
      console.error('❌ Services or solutions already exist in the database. Seeding aborted.');
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      await app.close();
      return;
    }

    // Get all available languages
    const languages = await languageRepository.find();

    if (languages.length === 0) {
      console.error('❌ No languages found. Please run the language seeder first.');
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      await app.close();
      return;
    }

    // Create sample services
    const services: Partial<ServiceEntity>[] = [
      {
        slug: 'web-development',
        icon: 'code',
        isPublished: true,
        isFeatured: true,
        order: 1,
      },
      {
        slug: 'mobile-development',
        icon: 'smartphone',
        isPublished: true,
        isFeatured: true,
        order: 2,
      },
      {
        slug: 'ui-ux-design',
        icon: 'palette',
        isPublished: true,
        isFeatured: false,
        order: 3,
      },
      {
        slug: 'cloud-solutions',
        icon: 'cloud',
        isPublished: true,
        isFeatured: true,
        order: 4,
      },
    ];

    const savedServices = await serviceRepository.save(services);
    console.log(`✅ Successfully seeded ${savedServices.length} services`);

    // Create sample solutions
    const solutions: Partial<SolutionEntity>[] = [
      {
        slug: 'e-commerce-platform',
        icon: 'shopping-cart',
        isPublished: true,
        isFeatured: true,
        order: 1,
      },
      {
        slug: 'crm-system',
        icon: 'users',
        isPublished: true,
        isFeatured: true,
        order: 2,
      },
      {
        slug: 'mobile-app',
        icon: 'smartphone',
        isPublished: true,
        isFeatured: false,
        order: 3,
      },
      {
        slug: 'data-analytics',
        icon: 'bar-chart',
        isPublished: true,
        isFeatured: true,
        order: 4,
      },
    ];

    const savedSolutions = await solutionRepository.save(solutions);
    console.log(`✅ Successfully seeded ${savedSolutions.length} solutions`);

    // Create service translations
    const serviceTranslations: Partial<ServiceTranslationEntity>[] = [];
    for (const service of savedServices) {
      for (const language of languages) {
        const translations = {
          web_development: {
            en: { name: 'Web Development', description: 'Custom web applications and websites' },
            ar: { name: 'تطوير الويب', description: 'تطبيقات الويب والمواقع الإلكترونية المخصصة' },
            fr: { name: 'Développement Web', description: 'Applications web et sites web personnalisés' },
            es: { name: 'Desarrollo Web', description: 'Aplicaciones web y sitios web personalizados' },
          },
          mobile_development: {
            en: { name: 'Mobile Development', description: 'Native and cross-platform mobile apps' },
            ar: { name: 'تطوير الهواتف المحمولة', description: 'تطبيقات الهواتف المحمولة الأصلية ومتعددة المنصات' },
            fr: { name: 'Développement Mobile', description: 'Applications mobiles natives et multiplateformes' },
            es: { name: 'Desarrollo Móvil', description: 'Aplicaciones móviles nativas y multiplataforma' },
          },
          ui_ux_design: {
            en: { name: 'UI/UX Design', description: 'User interface and experience design' },
            ar: { name: 'تصميم واجهة المستخدم', description: 'تصميم واجهة المستخدم وتجربة المستخدم' },
            fr: { name: 'Design UI/UX', description: "Conception d'interface et d'expérience utilisateur" },
            es: { name: 'Diseño UI/UX', description: 'Diseño de interfaz y experiencia de usuario' },
          },
          cloud_solutions: {
            en: { name: 'Cloud Solutions', description: 'Scalable cloud infrastructure and services' },
            ar: { name: 'حلول السحابة', description: 'البنية التحتية والخدمات السحابية القابلة للتوسع' },
            fr: { name: 'Solutions Cloud', description: 'Infrastructure et services cloud évolutifs' },
            es: { name: 'Soluciones en la Nube', description: 'Infraestructura y servicios en la nube escalables' },
          },
        };

        const serviceKey = service.slug.replace('-', '_') as keyof typeof translations;
        const langData =
          translations[serviceKey]?.[language.code as keyof (typeof translations)[typeof serviceKey]] ||
          translations[serviceKey]?.en;

        serviceTranslations.push({
          serviceId: service.id,
          languageCode: language.code,
          name: langData.name,
          description: langData.description,
          isDefault: language.isDefault,
        });
      }
    }

    await serviceTranslationRepository.save(serviceTranslations);
    console.log(`✅ Successfully seeded ${serviceTranslations.length} service translations`);

    // Create solution translations
    const solutionTranslations: Partial<SolutionTranslationEntity>[] = [];
    for (const solution of savedSolutions) {
      for (const language of languages) {
        const translations = {
          e_commerce_platform: {
            en: { name: 'E-commerce Platform', description: 'Complete online shopping solution' },
            ar: { name: 'منصة التجارة الإلكترونية', description: 'حل التسوق عبر الإنترنت الكامل' },
            fr: { name: 'Plateforme E-commerce', description: 'Solution complète de shopping en ligne' },
            es: { name: 'Plataforma de Comercio Electrónico', description: 'Solución completa de compras en línea' },
          },
          crm_system: {
            en: { name: 'CRM System', description: 'Customer relationship management solution' },
            ar: { name: 'نظام إدارة علاقات العملاء', description: 'حل إدارة علاقات العملاء' },
            fr: { name: 'Système CRM', description: 'Solution de gestion de la relation client' },
            es: { name: 'Sistema CRM', description: 'Solución de gestión de relaciones con clientes' },
          },
          mobile_app: {
            en: { name: 'Mobile App', description: 'Custom mobile application development' },
            ar: { name: 'تطبيق الهاتف المحمول', description: 'تطوير تطبيق الهاتف المحمول المخصص' },
            fr: { name: 'Application Mobile', description: "Développement d'application mobile personnalisée" },
            es: { name: 'Aplicación Móvil', description: 'Desarrollo de aplicación móvil personalizada' },
          },
          data_analytics: {
            en: { name: 'Data Analytics', description: 'Business intelligence and data insights' },
            ar: { name: 'تحليل البيانات', description: 'ذكاء الأعمال ورؤى البيانات' },
            fr: { name: 'Analyse de Données', description: "Intelligence d'affaires et insights de données" },
            es: { name: 'Análisis de Datos', description: 'Inteligencia empresarial e insights de datos' },
          },
        };

        const solutionKey = solution.slug.replace('-', '_') as keyof typeof translations;
        const langData =
          translations[solutionKey]?.[language.code as keyof (typeof translations)[typeof solutionKey]] ||
          translations[solutionKey]?.en;

        solutionTranslations.push({
          solutionId: solution.id,
          languageCode: language.code,
          name: langData.name,
          description: langData.description,
          isDefault: language.isDefault,
        });
      }
    }

    await solutionTranslationRepository.save(solutionTranslations);
    console.log(`✅ Successfully seeded ${solutionTranslations.length} solution translations`);

    await queryRunner.commitTransaction();
    console.log('✅ Transaction committed successfully');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error seeding services and solutions:', error);
    console.error('Transaction rolled back');
    throw error;
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

// Execute seeder
bootstrap()
  .then(() => {
    console.log('🎉 Services and solutions seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Services and solutions seeding failed:', error);
    process.exit(1);
  });
