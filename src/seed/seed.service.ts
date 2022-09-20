import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { initialData } from './data/seed-data';



@Injectable()
export class SeedService {

  constructor(
    private readonly productsService: ProductsService
  ){
  }
  
  async runSeed(){
    await this.insertNewProducts();
    return 'Execute SEED !';
  }

  private async insertNewProducts(){
    await this.productsService.deleteAllProducts();

    const seedproducts = initialData.products;

    const insertPromises= [];
    seedproducts.forEach( product => {
      insertPromises.push( this.productsService.create( product ) );
    });

    await Promise.all( insertPromises );

    return true;
  }

}
