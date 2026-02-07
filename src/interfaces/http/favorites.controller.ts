import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  AddFavoriteUseCase,
  RemoveFavoriteUseCase,
  ListFavoritesUseCase,
} from '../../application/use-cases/favorites/favorites.use-case';
import { Favorite } from '../../application/ports/favorite-repository';

class FavoriteResponseDto {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
}

@ApiTags('Favoritos')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(
    private readonly addFavoriteUseCase: AddFavoriteUseCase,
    private readonly removeFavoriteUseCase: RemoveFavoriteUseCase,
    private readonly listFavoritesUseCase: ListFavoritesUseCase,
  ) { }

  private toResponseDto(favorite: Favorite): FavoriteResponseDto {
    return {
      id: favorite.id,
      userId: favorite.userId,
      propertyId: favorite.propertyId,
      createdAt: favorite.createdAt.toISOString(),
    };
  }

  @Post(':propertyId')
  @ApiOperation({ summary: 'Adicionar imóvel aos favoritos' })
  @ApiResponse({ status: 201, type: FavoriteResponseDto })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  @ApiResponse({ status: 409, description: 'Já está nos favoritos' })
  async add(
    @Param('propertyId') propertyId: string,
    @Request() req: any,
  ): Promise<FavoriteResponseDto> {
    const favorite = await this.addFavoriteUseCase.execute({
      userId: req.user.userId,
      propertyId,
    });
    return this.toResponseDto(favorite);
  }

  @Delete(':propertyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover imóvel dos favoritos' })
  @ApiResponse({ status: 204, description: 'Removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Não está nos favoritos' })
  async remove(
    @Param('propertyId') propertyId: string,
    @Request() req: any,
  ): Promise<void> {
    await this.removeFavoriteUseCase.execute({
      userId: req.user.userId,
      propertyId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar meus favoritos' })
  @ApiResponse({ status: 200, type: [FavoriteResponseDto] })
  async list(@Request() req: any): Promise<FavoriteResponseDto[]> {
    const favorites = await this.listFavoritesUseCase.execute({
      userId: req.user.userId,
    });
    return favorites.map((f) => this.toResponseDto(f));
  }
}
