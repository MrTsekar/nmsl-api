import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardMember } from '../entities/board-member.entity';
import { CreateBoardMemberDto } from '../dto/create-board-member.dto';
import { UpdateBoardMemberDto } from '../dto/update-board-member.dto';
import { FileUploadService } from '../../file-upload/services/file-upload.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BoardMembersService {
  private readonly logger = new Logger(BoardMembersService.name);

  constructor(
    @InjectRepository(BoardMember)
    private readonly boardMembersRepository: Repository<BoardMember>,
    private readonly fileUploadService: FileUploadService,
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

  /**
   * Check if a string is a base64 encoded image
   */
  private isBase64Image(str: string): boolean {
    if (!str) return false;
    // Check for data URL format
    if (str.startsWith('data:image/')) {
      return true;
    }
    // Check if it's a raw base64 string (very long string without http/https)
    if (!str.startsWith('http') && str.length > 1000) {
      return true;
    }
    return false;
  }

  async create(dto: CreateBoardMemberDto): Promise<BoardMember> {
    try {
      this.logger.log(`Creating new board member: ${dto.name}`);
      
      // Handle base64 image - upload to Azure and get URL
      let imageUrl = dto.image;

      if (dto.image && this.isBase64Image(dto.image)) {
        this.logger.log('📦 Image is base64, uploading to Azure...');
        const identifier = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().substring(0, 8)}`;
        imageUrl = await this.fileUploadService.uploadBase64Image(
          dto.image,
          'board-members',
          `photo-${identifier}`
        );
        this.logger.log(`✅ Image uploaded: ${imageUrl}`);
      }

      const member = this.boardMembersRepository.create({
        ...dto,
        image: imageUrl,
      });
      
      const saved = await this.boardMembersRepository.save(member);
      this.logger.log(`✅ Board member created successfully: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create board member: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create board member: ${error.message}`);
    }
  }

  async update(id: string, dto: UpdateBoardMemberDto): Promise<BoardMember> {
    try {
      this.logger.log(`Updating board member: ${id}`);
      const member = await this.findOne(id);
      
      // Handle base64 image in updates
      let imageUrl = dto.image;

      if (dto.image && this.isBase64Image(dto.image)) {
        this.logger.log('📦 Updating image (base64), uploading to Azure...');
        const identifier = `${member.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().substring(0, 8)}`;
        imageUrl = await this.fileUploadService.uploadBase64Image(
          dto.image,
          'board-members',
          `photo-${identifier}`
        );
        this.logger.log(`✅ Image updated: ${imageUrl}`);
      }

      Object.assign(member, {
        ...dto,
        ...(imageUrl && { image: imageUrl }),
      });
      
      const updated = await this.boardMembersRepository.save(member);
      this.logger.log(`✅ Board member updated successfully: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update board member ${id}: ${error.message}`, error.stack);
      throw error;
    }
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
