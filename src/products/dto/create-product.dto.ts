import { IsArray, IsIn, IsInt, IsNumber, IsOptional, 
         IsPositive, IsString, MinLength 
       } from "class-validator";

export class CreateProductDto {

    @IsString()
    @MinLength(1)
    title: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    price?: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    slug?: string;
    
    @IsInt()
    @IsPositive()
    @IsOptional()
    stock?: number;

    @IsString({ each: true}) //Para que cada dato del arreglo tenga que cumplir con esta regla
    @IsArray()
    sizes: string[];

    @IsIn(['men','women','kid','unisex']) //IsIn Sirve para validar que el dato gender esté dentro de un arreglo en especifico
    gender: string;

    @IsString({ each: true}) //Para que cada dato del arreglo tenga que cumplir con esta regla
    @IsArray()
    @IsOptional()
    tags?: string[];

    @IsString({ each: true}) //Para que cada dato del arreglo tenga que cumplir con esta regla
    @IsArray()
    @IsOptional()
    images?: string[];
    


}
