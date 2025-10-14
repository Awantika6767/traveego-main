import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { TravelRequest } from './entities/travel-request.entity';
import { Quotation } from './entities/quotation.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { Activity } from './entities/activity.entity';
import { CatalogItem } from './entities/catalog-item.entity';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TravelRequest,
      Quotation,
      Invoice,
      Payment,
      Activity,
      CatalogItem,
      Notification,
    ]),
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
