import { Injectable, InternalServerErrorException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IsString, isUUID } from 'class-validator';
import { PaginationDto } from '../common/dtos/pagination.dto';

import { Product } from './entities/product.entity';
import { validate as uuid } from 'uuid';
import { ProductImage } from './entities/product-image.entity';


@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService'); //Sirve para lanzar errore mas especificos

  constructor(
    //Aquí hacemos la inyección de nuestro entiry product
    //El productRepository va manejar el repositorio de product
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    //Repositorio para manejar los datos de la tabla product image
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>

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
      //desestructuramos la data proveniente de createDto y usamos ...productDetails para guardar esa data
      //a esta deconstrucción agregamos las images pero como no vienen en el Dto, debemos hacer una nueva inyeccion con el repositorio para ProductImages
      const { images = [], ...productDetails } = createProductDto;

      const product = this.productRepository.create({
        ...productDetails,
        images: images.map( image => this.productImageRepository.create({ url: image }) ) //Map sirve para barrer un arreglo y retornar uno transformado, en este caso lo tranformamos creando una imagen de producto

        }); //En esta parte solo estamos creando la instancia del producto mas no lo inserta a la base de datos
      
        await this.productRepository.save( product ); //En esta linea insertamos los datos en la base

      return {...product, images};

    } catch( error ){
      this.handleDBExceptions(error);
    }

  }


  //FindAll Product
  async findAll( paginationDto: PaginationDto ) {

    const { limit = 10, offset = 0 } = paginationDto; //Deconstruimos la data y establecemos valores en caso de no recibir los datos

     const products = await this.productRepository.find({
      take: limit, //Toma el limite
      skip: offset, //Saltarse la cantidad que diga el offset para saltarse los datos que ya han sido mostrados
      //Relaciones
      relations: {
        images: true,
      }
    }); 
    
    return products.map( product => ({ //transformamos con map el arreglo products para que contenga la nueva información
      ...product,
      images: product.images.map ( imag => imag.url ) //transformamos con map el arreglo product para que ahora contenga la url de las imagenes
    }))
  }


  //FindOne Product
  async findOne(term: string) {
    //const product = await this.productRepository.findOneBy({id});
    let product: Product;

    if ( isUUID(term) ){ //Si el termino es un uuid
      product = await this.productRepository.findOneBy({ id: term }); //Buscamos el producto por su id
    } else { //Si el termino no es un uuid
      //product = await this.productRepository.findOneBy({ slug: term }); //Buscamos el producto por el slug
      const queryBuilder = this.productRepository.createQueryBuilder('prod'); //prod sería el alias de la tabla product
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(), //Pasamos el titulo a mayusculas y el titulo de la busqueda también para poder buscar sin distinción de mayus o minus
          slug: term.toLowerCase()
        })
        .leftJoinAndSelect('prod.images', 'prodImages') //prod.images sería la relacion entre la tabla prod y productImages, prodImages solo sería el alias de la tabla ya unida
        .getOne(); //Para solo obtener uno de los dos

        //' Select * from Products where slug = xx or title = xx '
    }

    //Si no se encontró el producto, lanzamos un error
      if ( !product ) throw new BadRequestException(`Product with id: ${term} not found`)

    return product;
  }

  //Metodo para aplanar la información que se quiere retornar
  async findOnePlain( term: string ) {
    const { images = [], ...rest } = await this.findOne( term );
    return {
      ...rest,
      images: images.map ( image => image.url )
    }
  }


  //Update Product
  async update(id: string, updateProductDto: UpdateProductDto) {

    const product = await this.productRepository.preload({ //El preload sirve para preparar los datos antes de ser actualizados
      id: id,
      ... updateProductDto, //Exparse los datos existentes en el Dto
      images: [],
    })
    if ( !product ) throw new NotFoundException(`Product with id: ${id} not found`) //Manejo de errores

    try{
      await this.productRepository.save( product ); //En esta parte guardamos los datos
      return product;
    }catch (error){
      await this.handleDBExceptions(error);
    }

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

