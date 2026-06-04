import { Controller, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShoppingItemService } from './shopping-items.service';

@Controller('items')
export class ShoppingItemsController {
  constructor(private service: ShoppingItemService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
