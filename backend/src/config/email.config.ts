export interface EmailConfig {
  service: string;
  user: string;
  password: string;
  from: string;
  frontendUrl: string;
}

export const emailConfig: EmailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  user: process.env.EMAIL_USER || '',
  password: process.env.EMAIL_PASSWORD || '',
  from: process.env.EMAIL_FROM || '"InceptIQ" <noreply@inceptiq.com>',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
};
