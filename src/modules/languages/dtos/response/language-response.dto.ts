import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class LanguageResponseDto {
  @Expose()
  id: number;

  @Expose()
  code: string;

  @Expose()
  nativeName: string;

  @Expose()
  name: string;

  @Expose()
  isDefault: boolean;

  @Expose()
  updatedAt: Date;

  @Expose()
  createdAt: Date;
}