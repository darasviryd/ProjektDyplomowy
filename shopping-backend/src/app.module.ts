import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ShoppingListsModule } from './shopping-lists/shopping-lists.module';
import { ShoppingItemsModule } from './shopping-items/shopping-items.module';
import { SyncModule } from './sync/sync.module';
import { ReceiptAiModule } from './receipt-ai/receipt-ai.module';

import { User } from './users/user.entity';
import { ShoppingList } from './shopping-lists/shopping-list.entity';
import { ShoppingItem } from './shopping-items/shopping-item.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [User, ShoppingList, ShoppingItem],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    ShoppingListsModule,
    ShoppingItemsModule,
    SyncModule,
    ReceiptAiModule,
  ],
})
export class AppModule {}
