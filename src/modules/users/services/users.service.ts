import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(query: {
    role?: UserRole;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { role, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (search) where.name = ILike(`%${search}%`);

    const [users, total] = await this.usersRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByResetToken(token: string): Promise<User> {
    return this.usersRepository.findOne({ where: { resetPasswordToken: token } });
  }

  async create(data: Partial<User>): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered');
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async updateRaw(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, data);
    return this.usersRepository.save(user);
  }

  async toggleStatus(id: string): Promise<User> {
    const user = await this.findById(id);
    user.isActive = !user.isActive;
    return this.usersRepository.save(user);
  }

  async findDoctors(query: {
    specialty?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    const { specialty, location, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { role: UserRole.DOCTOR };
    if (specialty) where.specialty = specialty;
    if (location) where.location = ILike(`%${location}%`);

    const [doctors, total] = await this.usersRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      doctors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async countByRole(role: UserRole): Promise<number> {
    return this.usersRepository.count({ where: { role } });
  }

  async findPortalUsers(query: { role?: string; location?: string }): Promise<User[]> {
    const where: any = {};
    if (query.role) {
      where.role = query.role;
    } else {
      where.role = In([UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER]);
    }
    if (query.location) where.location = ILike(`%${query.location}%`);
    return this.usersRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findAdmins(): Promise<{ admins: User[]; total: number }> {
    const admins = await this.usersRepository.find({
      where: { role: In([UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER]) },
      order: { createdAt: 'DESC' },
    });
    return { admins, total: admins.length };
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }
}
