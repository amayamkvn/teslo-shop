import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';


@Module({
  imports: [
    ConfigModule.forRoot(), //Importanción de las variables de entorno
    TypeOrmModule.forRoot({ //Importanción de typeOrm utilizando las variables de .env
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT, //Se debe convertir a string porque originalmente es un número
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true, //Sirve para cargar automaticamente las entidades
      synchronize: true //Sincroniza los cambios en las entidades con la base de datos
    }), 
    
    ProductsModule, CommonModule, SeedModule
  
  ], 



})
export class AppModule {}
