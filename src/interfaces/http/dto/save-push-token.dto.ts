import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SavePushTokenDto {
  @ApiProperty({
    description: 'Token de push notification gerado pelo Expo no dispositivo',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsString()
  @Matches(/^ExponentPushToken\[.+\]$/, {
    message: 'pushToken must be a valid Expo push token (ExponentPushToken[...])',
  })
  pushToken: string;

  @ApiProperty({
    description: 'Plataforma do dispositivo',
    example: 'ios',
    enum: ['ios', 'android'],
    required: false,
  })
  @IsString()
  platform?: string;
}
