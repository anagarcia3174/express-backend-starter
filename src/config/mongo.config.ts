import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MONGO_URL: z.string().url(),
    MONGO_TEST_URL: z.string().url(),
});

const env = envSchema.parse(process.env);

interface MongoConfig {
    url: string;
}

export const mongoConfig: MongoConfig = {
    url: env.NODE_ENV === 'test'
    ? env.MONGO_TEST_URL
    : env.MONGO_URL,
}