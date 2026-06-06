import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ReceiptAiService } from './receipt-ai.service';

@Controller('receipt-ai')
export class ReceiptAiController {
  constructor(private readonly receiptAiService: ReceiptAiService) {}

  @UseGuards(JwtAuthGuard)
  @Post('analyze')
  analyze(@Body() body: any) {
    return this.receiptAiService.analyze(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('import')
  import(@Request() req: any, @Body() body: any) {
    return this.receiptAiService.importToList(req.user.userId, body);
  }
}
