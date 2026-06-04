import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingItem } from './shopping-item.entity';

@Injectable()
export class ShoppingItemService {
  constructor(
    @InjectRepository(ShoppingItem)
    private repo: Repository<ShoppingItem>,
  ) {}

  create(data: Partial<ShoppingItem>) {
    return this.repo.save(this.repo.create(data));
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['list'] });
  }

  update(id: string, data: Partial<ShoppingItem>) {
    return this.repo.update(id, data);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }

  findAllByList(listId: string) {
    return this.repo.find({ where: { list: { id: listId } } });
  }
}
