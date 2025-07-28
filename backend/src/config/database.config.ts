import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: 'inceptiq.db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // Be careful with this in production
  logging: true,
};
