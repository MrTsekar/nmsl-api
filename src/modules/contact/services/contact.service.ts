import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactInfo } from '../entities/contact-info.entity';
import { UpdateContactDto } from '../dto/update-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactInfo)
    private readonly contactRepository: Repository<ContactInfo>,
  ) {}

  async get(): Promise<ContactInfo> {
    const contacts = await this.contactRepository.find({ take: 1 });
    if (contacts.length > 0) return contacts[0];
    const contact = this.contactRepository.create({});
    return this.contactRepository.save(contact);
  }

  async update(dto: UpdateContactDto): Promise<ContactInfo> {
    const contact = await this.get();
    Object.assign(contact, dto);
    return this.contactRepository.save(contact);
  }
}
