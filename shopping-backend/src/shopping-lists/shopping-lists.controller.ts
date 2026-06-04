import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ShoppingListService } from './shopping-lists.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ShoppingListsController {
  constructor(private readonly service: ShoppingListService) {}

 
  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.service.create({
      id: body.id,
      name: body.name,
      budgetLimit: body.budgetLimit || 0,
      currency: body.currency || 'PLN',
      userId: req.user.userId, 
    });
  }

  @Get()
  getAll(@Request() req: any) {
    return this.service.findAllByUser(req.user.userId);
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
