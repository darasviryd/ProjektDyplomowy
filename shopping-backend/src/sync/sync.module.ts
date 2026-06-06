
import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { ShoppingListsModule } from '../shopping-lists/shopping-lists.module';
import { ShoppingItemsModule } from '../shopping-items/shopping-items.module';

@Module({
  imports: [ShoppingListsModule, ShoppingItemsModule],
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}