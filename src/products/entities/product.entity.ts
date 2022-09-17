import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity() //Es necesario este decorador para declarar esra clase como un entity lo cúal sería la representación de una tabla en la base de datos
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


    //images

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

    //@BeforeUpdate()



}


