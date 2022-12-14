import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';
import { fileFilter } from './helpers/fileFilter.helper';
import { fileNamer } from './helpers/fileNamer.helper';


@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('product')
  @UseInterceptors( FileInterceptor('file', {
      fileFilter: fileFilter,
      //limits: { fileSize: 1000},
      storage: diskStorage({
        destination: './static/uploads',
        filename: fileNamer
      })
    }))

  uploadFile( 
    @UploadedFile() file: Express.Multer.File, 
  ){
    if( !file ){
      throw new BadRequestException(`El archivo debe ser pdf`);
    }

    return { fileName: file.originalname };

  }

}
