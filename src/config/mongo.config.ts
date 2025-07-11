import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    MONGO_URL: z.string().url(),
    MONGO_TEST_URL: z.string().url(),
});

const env = envSchema.parse(process.env);

interface MongoConfig {
    url: string;
    testUrl: string;
}

export const mongoConfig: MongoConfig = {
    url: env.MONGO_URL,
    testUrl: env.MONGO_TEST_URL,
}