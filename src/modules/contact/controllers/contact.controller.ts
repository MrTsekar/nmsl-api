import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContactService } from '../services/contact.service';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Contact')
@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get('contact')
  @ApiOperation({ summary: 'Get contact info (public)' })
  get() {
    return this.contactService.get();
  }

  @Patch('admin/contact')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update contact info (admin)' })
  update(@Body() dto: UpdateContactDto) {
    return this.contactService.update(dto);
  }
}
