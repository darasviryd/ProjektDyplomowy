import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingItem } from './shopping-item.entity';
import { ShoppingItemService } from './shopping-items.service';
import { ShoppingItemsController } from './shopping-items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShoppingItem])],
  providers: [ShoppingItemService],
  controllers: [ShoppingItemsController],
  exports: [ShoppingItemService],
})
export class ShoppingItemsModule {}