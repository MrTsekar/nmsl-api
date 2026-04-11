import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BoardMembersService } from '../services/board-members.service';
import { CreateBoardMemberDto } from '../dto/create-board-member.dto';
import { UpdateBoardMemberDto } from '../dto/update-board-member.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { FileUploadService } from '../../file-upload/services/file-upload.service';

@ApiTags('Board Members')
@Controller()
export class BoardMembersController {
  constructor(
    private readonly boardMembersService: BoardMembersService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  // Public route — active members only
  @Get('board-members')
  @ApiOperation({ summary: 'Get active board members (public)' })
  findActive() {
    return this.boardMembersService.findActive();
  }

  // Admin routes
  @Get('admin/board-members/upload-url')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get upload URL for board member photo (direct Azure upload)' })
  @ApiQuery({ name: 'filename', required: true, example: 'photo.jpg' })
  @ApiQuery({ name: 'contentType', required: false, example: 'image/jpeg' })
  async getUploadUrl(
    @Query('filename') filename: string,
    @Query('contentType') contentType?: string,
  ) {
    return this.fileUploadService.generateUploadUrl('board-members', filename, contentType);
  }

  @Get('admin/board-members')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all board members (admin)' })
  findAll() {
    return this.boardMembersService.findAll();
  }

  @Post('admin/board-members')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a board member' })
  create(@Body() dto: CreateBoardMemberDto) {
    return this.boardMembersService.create(dto);
  }

  @Patch('admin/board-members/:id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a board member' })
  update(@Param('id') id: string, @Body() dto: UpdateBoardMemberDto) {
    return this.boardMembersService.update(id, dto);
  }

  @Delete('admin/board-members/:id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a board member' })
  remove(@Param('id') id: string) {
    return this.boardMembersService.remove(id);
  }

  @Patch('admin/board-members/:id/toggle')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle board member active status' })
  toggle(@Param('id') id: string) {
    return this.boardMembersService.toggle(id);
  }
}
