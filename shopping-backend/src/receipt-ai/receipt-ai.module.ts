import { Module } from '@nestjs/common';
import { ShoppingItemsModule } from '../shopping-items/shopping-items.module';
import { ShoppingListsModule } from '../shopping-lists/shopping-lists.module';
import { ReceiptAiController } from './receipt-ai.controller';
import { ReceiptAiService } from './receipt-ai.service';

@Module({
  imports: [ShoppingListsModule, ShoppingItemsModule],
  controllers: [ReceiptAiController],
  providers: [ReceiptAiService],
})
export class ReceiptAiModule {}
