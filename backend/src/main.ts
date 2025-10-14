import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { json } from 'express';
import { join, resolve } from 'path';
import * as fs from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGINS || '*',
    credentials: true,
  });
  app.use(json({ limit: '10mb' }));

  // Define and ensure uploads directory exists
  const uploadDirRelative = process.env.UPLOAD_DIR || './uploads';
  const uploadDir = resolve(process.cwd(), uploadDirRelative);

  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created upload directory at: ${uploadDir}`);
  }

  // Serve static files from the uploads directory
  app.useStaticAssets(uploadDir, { prefix: '/uploads' });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server listening on http://localhost:${port}`);
}
bootstrap();
