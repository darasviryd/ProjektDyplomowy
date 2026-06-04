import { Injectable } from '@nestjs/common';
import { ShoppingListService } from '../shopping-lists/shopping-lists.service';
import { ShoppingItemService } from '../shopping-items/shopping-items.service';

@Injectable()
export class SyncService {
  constructor(
    private readonly listsService: ShoppingListService,
    private readonly itemsService: ShoppingItemService,
  ) {}

  async syncData(userId: number, lists: any[], items: any[]) {
    const existingLists = await this.listsService.findAllByUser(userId);

    for (const list of lists || []) {
      const existing = existingLists.find(l => l.id === list.id);
      const data = {
        id: list.id,
        name: list.name,
        budgetLimit: Number(list.budgetLimit) || 0,
        currency: list.currency || 'PLN',
        updatedAt: new Date(list.updatedAt || Date.now()),
      };

      if (existing) {
        await this.listsService.update(existing.id, data);
      } else {
        await this.listsService.create({ ...data, user: { id: userId } as any });
      }
    }

    const syncedLists = await this.listsService.findAllByUser(userId);
    const userListIds = new Set(syncedLists.map(list => list.id));

    for (const item of items || []) {
      if (!userListIds.has(item.listId)) continue;

      const data = {
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        currency: item.currency || 'PLN',
        quantity: Number(item.quantity) || 1,
        description: item.description || '',
        url: item.url || '',
        imageUrl: item.imageUrl || '',
        priority: item.priority || 'normal',
        bought: !!item.bought,
        updatedAt: new Date(item.updatedAt || Date.now()),
      };
      const existing = await this.itemsService.findOne(item.id);

      if (existing) {
        await this.itemsService.update(existing.id, data);
      } else {
        await this.itemsService.create({ ...data, list: { id: item.listId } as any });
      }
    }

    const remoteLists = await this.listsService.findAllByUser(userId);
    const remoteItems = remoteLists.flatMap(list =>
      (list.items || []).map(item => ({
        ...item,
        listId: list.id,
      })),
    );

    return {
      lists: remoteLists.map(({ items: _items, ...list }) => list),
      items: remoteItems,
    };
  }
}
