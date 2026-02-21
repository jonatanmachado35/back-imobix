import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET is required and must be set in environment variables' })
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters for security' })
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  CLOUDINARY_CLOUD_NAME?: string;

  @IsString()
  CLOUDINARY_API_KEY?: string;

  @IsString()
  CLOUDINARY_API_SECRET?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      return Object.values(error.constraints || {}).join(', ');
    }).join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return validatedConfig;
}
