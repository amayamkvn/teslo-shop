import { Type } from "class-transformer";
import { IsOptional, IsPositive, Min } from "class-validator";


export class PaginationDto {

    @IsOptional()
    @IsPositive()
    @Type( () => Number )// enableImplicitConversions: true, Transforma la data a numerico
    limit?: number;

    @IsOptional()
    @Type( () => Number )// enableImplicitConversions: true, Transforma la data a numerico
    @Min(0)
    offset: number;




}