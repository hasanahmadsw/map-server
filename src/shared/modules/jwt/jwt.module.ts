import { Global, Module } from '@nestjs/common';
import { AppJwtService } from './jwt.service';

@Global()
@Module({
  exports: [AppJwtService],
  providers: [AppJwtService],
})
export class AppJwtModule {}
