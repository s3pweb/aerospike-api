import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorrelationIdMiddleware } from '@eropple/nestjs-correlation-id/dist';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tracking ID
  app.use(CorrelationIdMiddleware());
  app.enableCors();
  await app.listen(3000);
}

bootstrap();
