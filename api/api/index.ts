import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../dist/app.module';
import express from 'express';

const expressApp = express();
let cachedApp: Awaited<ReturnType<typeof NestFactory.create>> | undefined;

export default async function handler(req: express.Request, res: express.Response) {
  if (!cachedApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    app.enableCors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
    });
    app.useGlobalPipes(new ValidationPipe());
    cachedApp = await app.init();
  }
  expressApp(req, res);
}
