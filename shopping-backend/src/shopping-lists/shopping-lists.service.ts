import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingList } from './shopping-list.entity';

@Injectable()
export class ShoppingListService {
  constructor(
    @InjectRepository(ShoppingList)
    private repo: Repository<ShoppingList>,
  ) {}

  create(data: Partial<ShoppingList>) {
    return this.repo.save(this.repo.create(data));
  }

  findAllByUser(userId: number) {
    return this.repo.find({
      where: { user: { id: userId } },
      relations: ['items'],
    });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['items'] });
  }

  async update(id: string, data: Partial<ShoppingList>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
