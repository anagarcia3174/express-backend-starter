import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    EMAIL_FROM: z.string().email(),
    VERIFICATION_LINK: z.string().url(),
    RESET_LINK: z.string().url(),
});

const env = envSchema.parse(process.env);

interface EmailConfig {
    from: string;
    verificationLink: string;
    resetLink: string;
}

export const emailConfig: EmailConfig = {
    from: env.EMAIL_FROM,
    verificationLink: env.VERIFICATION_LINK,
    resetLink: env.RESET_LINK,
}