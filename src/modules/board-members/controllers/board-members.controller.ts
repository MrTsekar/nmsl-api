import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BoardMembersService } from '../services/board-members.service';
import { CreateBoardMemberDto } from '../dto/create-board-member.dto';
import { UpdateBoardMemberDto } from '../dto/update-board-member.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Board Members')
@Controller()
export class BoardMembersController {
  constructor(private readonly boardMembersService: BoardMembersService) {}

  // Public route — active members only
  @Get('board-members')
  @ApiOperation({ summary: 'Get active board members (public)' })
  findActive() {
    return this.boardMembersService.findActive();
  }

  // Admin routes
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
