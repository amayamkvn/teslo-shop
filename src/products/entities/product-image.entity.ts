import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Product } from './product.entity';


@Entity({ name: 'product_images' })
export class ProductImage {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    url: string;

    //Relación con la tabla de product
    @ManyToOne(
        () => Product,
        (product) => product.images,
        { onDelete: 'CASCADE' } //Esta instrucción sirve para eliminar las imagenes en cascada cual se elimina una, 
                                //para así eliminar todas las que esten relacionadas con un producto
    )
    product: Product

}