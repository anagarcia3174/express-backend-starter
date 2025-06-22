import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from '../utils/logger.util';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ACCESS_TOKEN_SECRET: z.string().min(1),
  REFRESH_TOKEN_SECRET: z.string().min(1),
  EMAIL_VERIFICATION_TOKEN_SECRET: z.string().min(1),
  RESET_PASSWORD_TOKEN_SECRET: z.string().min(1),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
});

const env = envSchema.parse(process.env);

interface Config {
  port: number;
  nodeEnv: string;
  accessTokenSecret: string;
  refreshTokenSecret: string;
  emailVerificationTokenSecret: string;
  resetPasswordTokenSecret: string;
  clientUrl: string;
}

export const config: Config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  accessTokenSecret: env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
  emailVerificationTokenSecret: env.EMAIL_VERIFICATION_TOKEN_SECRET,
  resetPasswordTokenSecret: env.RESET_PASSWORD_TOKEN_SECRET,
  clientUrl: env.CLIENT_URL,
};

