import { Global, Module } from '@nestjs/common';
import { PaginationService } from './paginate.service';

@Global()
@Module({
  providers: [
    {
      provide: PaginationService,
      useFactory: () => new PaginationService({ maxLimit: 1000 }),
    },
  ],
  exports: [PaginationService],
})
export class PaginationModule {}
