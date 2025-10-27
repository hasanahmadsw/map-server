import { IsArray, IsString } from 'class-validator';
import { IsLanguageCodeArray } from 'src/common/decorators/is-language-code-array.decorator';

export class AutoTranslateDto {
  @IsLanguageCodeArray()
  translateTo: string[];
}
