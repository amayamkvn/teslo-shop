import { Optional } from "@nestjs/common";
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from './product-image.entity';

//Es necesario este decorador para declarar esra clase como un entity lo cúal sería la representación de una tabla en la base de datos
@Entity({ name: 'products'}) //Nombre de la tabla
export class Product {

    @PrimaryGeneratedColumn('uuid') //Genera la columna principal dónde estrá el id que será de tipo UUID
    id: string;

    //Segunda columna de la tabla la cual será el nombre o titulo del producto
    @Column('text',{
        unique: true, // Regla que me valida que dos productos no tengan el mismo nombre
    }) 
    title: string;

    @Column('float',{
        default: 0 //Definición de valores por defecto
    })
    price: number;

    @Column({
        type: 'text',
        nullable: true //Habilitar valores nulos
    })
    description:string;

    @Column('text', {
        unique: true
    })
    slug: string;

    @Column({
        type: 'int',
        default: 0
    })
    stock: number;

    @Column('text',{
        array: true //Definimos que este datp será un arreglo de strings
    })
    sizes: string[];

    @Column('text')
    gender: string;


    //tags
    @Column('text',{
        array: true, //Definimos que este datp será un arreglo de strings
        default: []
    })
    tags: string[];

    //Relación con la tabla productImages 
    @OneToMany(
        () => ProductImage,
        (productImage) => productImage.product,
        { 
            cascade: true, //Ayuda a realizar procesos para varios elementos consecutivamente, por ejemplo si elimino una imagene, se eliminarán todas las que pertenezcan a esa cascada
            eager: true //Sirve para que cada vez que usemos el metodo find va cargar automaticamente los datos de la tabla relacionada
        }  
    ) 
    images?: ProductImage[];



    @BeforeInsert()
    checkSlugInsert(){
        if( !this.slug ){ //Si el slug no existe
            this.slug = this.title
            .toLowerCase() //Convierte todo el string en minusculas
            .replaceAll(' ', '_') //Reemplaza los espacios por guión bajo
            .replaceAll("'", ''); //Quita los apostrofes

        } else { //Si el slug  existe
            this.slug = this.slug
            .toLowerCase() 
            .replaceAll(' ', '_') 
            .replaceAll("'", ''); 
        }

        // -- Manera mas corta de hacer lo mismo --
        // if( !this.slug ){ //Si el slug no existe
        //     this.slug = this.title
        // }

        // this.slug = this.slug
        //     .toLowerCase() 
        //     .replaceAll(' ', '_') 
        //     .replaceAll("'", ''); 

    }

    @BeforeUpdate()
    checkSlugUpdate(){
        this.slug = this.slug
            .toLowerCase() 
            .replaceAll(' ', '_') 
            .replaceAll("'", ''); 
    }

}


