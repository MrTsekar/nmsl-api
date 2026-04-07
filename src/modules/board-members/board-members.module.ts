import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardMember } from './entities/board-member.entity';
import { BoardMembersService } from './services/board-members.service';
import { BoardMembersController } from './controllers/board-members.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BoardMember])],
  controllers: [BoardMembersController],
  providers: [BoardMembersService],
  exports: [BoardMembersService],
})
export class BoardMembersModule {}
