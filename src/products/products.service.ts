import { Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { Product } from './entities/product.entity';
import { IsString } from 'class-validator';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService'); //Sirve para lanzar errore mas especificos

  constructor(
    //Aquí hacemos la inyección de nuestro entiry product
    //El productRepository va manejar el repositorio de product
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>

  ){}

  //Create new peoduct
  async create(createProductDto: CreateProductDto) {

    // if( !createProductDto.slug ){ //Si el slug no existe
    //   createProductDto.slug = createProductDto.title
    //   .toLowerCase() //Convierte todo el string en minusculas
    //   .replaceAll(' ', '_') //Reemplaza los espacios por guión bajo
    //   .replaceAll("'", ''); //Quita los apostrofes

    // } else { //Si el slug si existe entonces ...
    //   createProductDto.slug = createProductDto.slug
    //   .toLowerCase() 
    //   .replaceAll(' ', '_') 
    //   .replaceAll("'", '');
    // }

    try{
      const product = this.productRepository.create(createProductDto); //En esta parte solo estamos creando la instancia del producto mas no lo inserta a la base de datos
      await this.productRepository.save( product ); //En esta linea insertamos los datos en la base

      return product;

    } catch( error ){
      this.handleDBExceptions(error);
    }

  }

  async findAll() {
    return await this.productRepository.find({}); //Devolvemos todos los datos
  }

  async findOne(id: string) {
    //Busqueda por 'Id
    const product = await this.productRepository.findOneBy({id});
      if ( !product ) throw new BadRequestException(`Product with id: ${id} not found`)

    return product;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  //Delete product
  async remove(id: string) {

    const product = await this.findOne( id );
    await this.productRepository.remove( product );

  }


  //Modulo para el manejo de errores en toda la clase
  private handleDBExceptions( error: any){ 
    console.log(error);
    if( error.code === '23505'){ //Decisión para retorna un msj en caso de encontrar el error con ese codigo
      throw new BadRequestException(error.detail)
    }
    this.logger.error(error); //Manejo de errores en cosola
    throw new InternalServerErrorException('Unexpected error, check server logs in console');
  }




}

