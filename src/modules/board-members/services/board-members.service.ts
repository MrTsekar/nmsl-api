import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardMember } from '../entities/board-member.entity';
import { CreateBoardMemberDto } from '../dto/create-board-member.dto';
import { UpdateBoardMemberDto } from '../dto/update-board-member.dto';

@Injectable()
export class BoardMembersService {
  constructor(
    @InjectRepository(BoardMember)
    private readonly boardMembersRepository: Repository<BoardMember>,
  ) {}

  findAll(): Promise<BoardMember[]> {
    return this.boardMembersRepository.find({ order: { order: 'ASC' } });
  }

  findActive(): Promise<BoardMember[]> {
    return this.boardMembersRepository.find({
      where: { isActive: true },
      order: { order: 'ASC' },
    });
  }

  async findOne(id: string): Promise<BoardMember> {
    const member = await this.boardMembersRepository.findOne({ where: { id } });
    if (!member) throw new NotFoundException('Board member not found');
    return member;
  }

  create(dto: CreateBoardMemberDto): Promise<BoardMember> {
    const member = this.boardMembersRepository.create(dto);
    return this.boardMembersRepository.save(member);
  }

  async update(id: string, dto: UpdateBoardMemberDto): Promise<BoardMember> {
    const member = await this.findOne(id);
    Object.assign(member, dto);
    return this.boardMembersRepository.save(member);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const member = await this.findOne(id);
    await this.boardMembersRepository.remove(member);
    return { success: true };
  }

  async toggle(id: string): Promise<BoardMember> {
    const member = await this.findOne(id);
    member.isActive = !member.isActive;
    return this.boardMembersRepository.save(member);
  }
}
