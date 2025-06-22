import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Validate AWS configuration
const envSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS Access Key ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS Secret Access Key is required'),
  AWS_REGION: z.string().min(1, 'AWS Region is required'),
});

const env = envSchema.parse(process.env);

interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

const awsConfig: AWSConfig = {
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION,
};

// Create SES client with retry configuration
const sesClient = new SESv2Client({
  ...awsConfig,
  maxAttempts: 3, // Number of retries
  retryMode: 'standard', // Use standard retry mode
});




// Export validated configuration
export const ses = {
  sesClient,
  SendEmailCommand,
};

