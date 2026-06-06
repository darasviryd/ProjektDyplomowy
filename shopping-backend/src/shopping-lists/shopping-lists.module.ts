import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingList } from './shopping-list.entity';
import { ShoppingListService } from './shopping-lists.service';
import { ShoppingListsController } from './shopping-lists.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShoppingList])],
  providers: [ShoppingListService],
  controllers: [ShoppingListsController],
  exports: [ShoppingListService],
})
export class ShoppingListsModule {}