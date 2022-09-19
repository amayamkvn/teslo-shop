import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Product } from './product.entity';


@Entity()
export class ProductImage {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    url: string;

    //Relación con la tabla de product
    @ManyToOne(
        () => Product,
        (product) => product.images,
        
    )
    product: Product

}