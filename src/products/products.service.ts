import { Injectable, InternalServerErrorException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IsString, isUUID } from 'class-validator';
import { PaginationDto } from '../common/dtos/pagination.dto';

import { Product } from './entities/product.entity';
import { validate as uuid } from 'uuid';
import { ProductImage } from './entities/product-image.entity';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import { response } from 'express';


@Injectable()
export class ProductsService {

  private data = {

  }
  private readonly logger = new Logger('ProductsService'); //Sirve para lanzar errore mas especificos

  constructor(
    private httptService: HttpService,
    //Aquí hacemos la inyección de nuestro entiry product
    //El productRepository va manejar el repositorio de product
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    //Repositorio para manejar los datos de la tabla product image
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    //Necesario para implementar el query runner
    private readonly dataSource: DataSource,

  ){}

  getPei(params){
    return this.httptService
    .get(`http://localhost:3100/api/pei/${params.id_pei}`)
    .pipe(
      map((response) => response.data),
      map((data) => ({
        ...this.data[params.id_pei],
        nombre_pei: data.nombre_pei,
        id_pei: data.id_pei
      }))
    );
  }
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

    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ //El preload sirve para preparar los datos antes de ser actualizados
      id,
      ...toUpdate
      //... updateProductDto, //Exparse los datos existentes en el Dto
      //images: [],
    })
    if ( !product ) throw new NotFoundException(`Product with id: ${id} not found`) //Manejo de errores

    //Create query runner
    const queryRunner = await this.dataSource.createQueryRunner();
    await queryRunner.connect(); //Conectamos el queryRunner a la base de datos
    await queryRunner.startTransaction(); //Iniciamos la trasacción

    try{

      if( images ){ //Si existen imagenes anteriores haremos un delete de ellas
        await queryRunner.manager.delete( ProductImage, { product: {id: id} }) //Si no colocamos el criterio que en este caso es id, haríamos un delete all
      
        product.images = images.map( 
          image => this.productImageRepository.create({url: image})) //En este punto guardamos las nuevas imagenes más no estamos impactando la DB
      }

      await queryRunner.manager.save( product ); //
      //await this.productRepository.save( product ); //En esta parte guardamos los datos
      await queryRunner.commitTransaction(); //Con el commit hacemos efectiva la transaciión si no ha habido ningun error en este punto
      await queryRunner.release(); //Este comando sirve para finalizar la transaciión

      return this.findOnePlain( id ); //Reutilizo la función findOnePlane para volver a aplanar las imagenes
    }catch (error){

      await queryRunner.rollbackTransaction(); //El rollback lo que hace es deshacer todos los cambios en caso de que haya habido algún error
      await queryRunner.release();
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

  //Metodo para eliminar todos los productos y las imagenes relacionadas
  async deleteAllProducts(){
    const query = this.productRepository.createQueryBuilder('product');

    try{

      return await query
        .delete()
        .where({})
        .execute();

    } catch( error ){
      this.handleDBExceptions(error);
    }
  }


}

