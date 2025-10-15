import type { Express } from 'express';
import {
  Controller, Post, Body, Get, Query, Param, Put, UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { ApiService } from './api.service';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import * as fs from 'fs';
import { join } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

const uploadMemory = multer.memoryStorage();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

@Controller('api')
export class ApiController {
  constructor(private readonly svc: ApiService) {}

  @Post('auth/login')
  async login(@Body() body: any) {
    const u = await this.svc.login(body.email, body.password);
    if (!u) throw new BadRequestException('Invalid credentials');
    return u;
  }

  // Requests
  @Post('requests')
  async createRequest(@Body() body: any) {
    return this.svc.createRequest(body);
  }

  @Get('requests')
  async getRequests(@Query('status') status: string, @Query('assigned_to') assigned_to: string) {
    return this.svc.getRequests(status, assigned_to);
  }

  @Get('requests/:id')
  async getRequest(@Param('id') id: string) {
    return this.svc.getRequest(id);
  }

  @Put('requests/:id')
  async updateRequest(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateRequest(id, body);
  }

  // Quotations
  @Post('quotations')
  async createQuotation(@Body() body: any) {
    return this.svc.createQuotation(body);
  }

  @Get('quotations')
  async getQuotations(@Query('request_id') request_id: string) {
    return this.svc.getQuotations(request_id);
  }

  @Get('quotations/:id')
  async getQuotation(@Param('id') id: string) {
    return this.svc.getQuotation(id);
  }

  @Put('quotations/:id')
  async updateQuotation(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateQuotation(id, body);
  }

  @Post('quotations/:id/publish')
  async publishQuotation(@Param('id') id: string, @Body() body: any) {
    return this.svc.publishQuotation(id, body);
  }

  @Post('quotations/:id/accept')
  async acceptQuotation(@Param('id') id: string, @Body() body: any) {
    return this.svc.acceptQuotation(id, body);
  }

  // Invoices
  @Get('invoices')
  async getInvoices(@Query('request_id') request_id: string) {
    return this.svc.getInvoices(request_id);
  }

  @Get('invoices/:id')
  async getInvoice(@Param('id') id: string) {
    return this.svc.getInvoice(id);
  }

  // Payments
  @Get('payments')
  async getPayments(@Query('status') status: string) {
    return this.svc.getPayments(status);
  }

  @Get('payments/:id')
  async getPayment(@Param('id') id: string) {
    return this.svc.getPayment(id);
  }

  @Put('payments/:id/mark-received')
  async markPaymentReceived(@Param('id') id: string, @Body() body: any) {
    return this.svc.markPaymentReceived(id, body);
  }

  @Put('payments/:id/verify')
  async verifyPayment(@Param('id') id: string, @Body() body: any) {
    return this.svc.verifyPayment(id, body);
  }

  // Activities
  @Get('activities')
  async getActivities(@Query('request_id') request_id: string) {
    return this.svc.getActivities(request_id);
  }

  @Post('activities')
  async createActivity(@Body() body: any) {
    return this.svc.createActivity(body);
  }

  // Catalog
  @Get('catalog')
  async getCatalog(@Query('type') type: string, @Query('destination') destination: string) {
    return this.svc.getCatalog(type, destination);
  }

  @Post('catalog')
  async createCatalog(@Body() body: any) {
    return this.svc.createCatalogItem(body);
  }

  // Notifications
  @Get('notifications')
  async getNotifications(@Query('user_id') user_id: string, @Query('unread_only') unread_only = 'false') {
    return this.svc.getNotifications(user_id, unread_only === 'true');
  }

  @Put('notifications/:id/read')
  async markNotificationRead(@Param('id') id: string) {
    return this.svc.markNotificationRead(id);
  }

  @Post('notifications')
  async createNotification(@Body() body: any) {
    return this.svc.createNotification(body);
  }

  // Upload
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: uploadMemory }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('file required');

    const ext = file.originalname && file.originalname.includes('.') ? file.originalname.split('.').pop() : '';
    const key = `${Date.now()}-${randomBytes(6).toString('hex')}${ext ? '.' + ext : ''}`;
    const bucket = process.env.AWS_BUCKET;
    if (!bucket) throw new BadRequestException('S3 bucket not configured (AWS_BUCKET)');

    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private'
    });
    await s3.send(cmd);

    const fileUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return { file_url: fileUrl, key };
  }

  // Dashboard
  @Get('dashboard/stats')
  async dashboard(@Query('role') role: string) {
    return this.svc.getDashboardStats(role);
  }

  // Seed
  @Post('seed')
  async seed() {
    return this.svc.seedData();
  }
}