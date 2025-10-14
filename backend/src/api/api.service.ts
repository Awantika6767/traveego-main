import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TravelRequest } from './entities/travel-request.entity';
import { Quotation } from './entities/quotation.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { Activity } from './entities/activity.entity';
import { CatalogItem } from './entities/catalog-item.entity';
import { Notification } from './entities/notification.entity';
import { RequestStatus, QuotationStatus, PaymentStatus } from './enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ApiService {
  // mock users like your FastAPI app
  MOCK_USERS = {
    'ops@travel.com': { password: 'ops123', role: 'operations', name: 'Operations Manager', id: 'ops-001' },
    'sales@travel.com': { password: 'sales123', role: 'sales', name: 'Sales Executive', id: 'sales-001' },
    'accountant@travel.com': { password: 'acc123', role: 'accountant', name: 'Accountant', id: 'acc-001' },
    'customer@travel.com': { password: 'customer123', role: 'customer', name: 'John Customer', id: 'customer-001' },
  };

  constructor(
    @InjectRepository(TravelRequest) private reqRepo: Repository<TravelRequest>,
    @InjectRepository(Quotation) private quoteRepo: Repository<Quotation>,
    @InjectRepository(Invoice) private invRepo: Repository<Invoice>,
    @InjectRepository(Payment) private payRepo: Repository<Payment>,
    @InjectRepository(Activity) private actRepo: Repository<Activity>,
    @InjectRepository(CatalogItem) private catRepo: Repository<CatalogItem>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  // Auth
  async login(email: string, password: string) {
    const u = this.MOCK_USERS[email];
    if (u && u.password === password) {
      return {
        success: true,
        user: { id: u.id, email, name: u.name, role: u.role },
        token: `mock-token-${u.id}`,
      };
    }
    return null;
  }

  // Requests
  async createRequest(payload: Partial<TravelRequest>) {
    const now = new Date().toISOString();
    const request = this.reqRepo.create({
      ...payload,
      created_at: now,
      updated_at: now,
    } as TravelRequest);
    const saved = await this.reqRepo.save(request);

    const activity = this.actRepo.create({
      request_id: saved.id,
      actor_id: saved.created_by,
      actor_name: saved.assigned_salesperson_name || 'System',
      actor_role: 'sales',
      action: 'created',
      notes: `Request created for ${saved.client_name}`,
      created_at: now,
    });
    await this.actRepo.save(activity);
    return saved;
  }

  async getRequests(status?: string, assigned_to?: string) {
    const q: any = {};
    if (status) q.status = status;
    if (assigned_to) q.assigned_salesperson_id = assigned_to;
    return this.reqRepo.find({ where: q });
  }

  async getRequest(id: string) {
    return this.reqRepo.findOneBy({ id });
  }

  async updateRequest(id: string, payload: Partial<TravelRequest>) {
    payload.updated_at = new Date().toISOString();
    await this.reqRepo.update({ id }, payload as any);
    return this.getRequest(id);
  }

  // Quotations
  async createQuotation(payload: Partial<Quotation>) {
    const now = new Date().toISOString();
    const q = this.quoteRepo.create({ ...payload, created_at: now, updated_at: now } as Quotation);
    const saved = await this.quoteRepo.save(q);

    // update request status
    await this.reqRepo.update({ id: payload.request_id }, { status: RequestStatus.QUOTED, updated_at: now } as any);

    return saved;
  }

  async getQuotations(request_id?: string) {
    const where: any = {};
    if (request_id) where.request_id = request_id;
    return this.quoteRepo.find({ where });
  }

  async getQuotation(id: string) {
    return this.quoteRepo.findOneBy({ id });
  }

  async updateQuotation(id: string, payload: Partial<Quotation>) {
    payload.updated_at = new Date().toISOString();
    await this.quoteRepo.update({ id }, payload as any);
    return this.getQuotation(id);
  }

  async publishQuotation(id: string, data: any) {
    const now = new Date().toISOString();
    const expiry_date = data.expiry_date;
    const update = { status: QuotationStatus.SENT, expiry_date, published_at: now, updated_at: now } as any;
    await this.quoteRepo.update({ id }, update);

    const q = await this.getQuotation(id);
    const activity = this.actRepo.create({
      request_id: q.request_id,
      actor_id: data.actor_id || 'ops-001',
      actor_name: data.actor_name || 'Operations',
      actor_role: 'operations',
      action: 'published',
      notes: `Proforma published. ${data.notes || ''}`,
      created_at: now,
    });
    await this.actRepo.save(activity);
    return { success: true, message: 'Quotation published' };
  }

  async acceptQuotation(id: string, data: any) {
    const q = await this.getQuotation(id);
    if (!q) throw new BadRequestException('Quotation not found');

    await this.quoteRepo.update({ id }, { status: QuotationStatus.ACCEPTED, updated_at: new Date().toISOString() } as any);
    await this.reqRepo.update({ id: q.request_id }, { status: RequestStatus.ACCEPTED, updated_at: new Date().toISOString() } as any);

    const request = await this.reqRepo.findOneBy({ id: q.request_id });

    const invoice = this.invRepo.create({
      invoice_number: `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${uuidv4().slice(0,8).toUpperCase()}`,
      quotation_id: id,
      request_id: q.request_id,
      client_name: request.client_name,
      client_email: request.client_email,
      total_amount: q.grand_total,
      advance_amount: q.advance_amount,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      gst_number: 'GST123456789',
      bank_details: {
        account_name: 'Travel Company Pvt Ltd',
        account_number: '1234567890',
        ifsc: 'BANK0001234',
        bank_name: 'Example Bank',
      },
      upi_id: 'travelcompany@upi',
    } as any);

    const savedInv: any = await this.invRepo.save(invoice);

    const payment = this.payRepo.create({
      invoice_id: savedInv.id,
      amount: savedInv.advance_amount,
      method: 'pending',
      status: PaymentStatus.PENDING,
      created_at: new Date().toISOString(),
    } as any);
    await this.payRepo.save(payment);

    const activity = this.actRepo.create({
      request_id: q.request_id,
      actor_id: data.actor_id || 'customer-001',
      actor_name: data.actor_name || 'Customer',
      actor_role: 'customer',
      action: 'accepted',
      notes: 'Quotation accepted by customer',
      created_at: new Date().toISOString(),
    } as any);
    await this.actRepo.save(activity);

    return { success: true, invoice_id: savedInv.id };
  }

  // Invoices & Payments
  async getInvoices(request_id?: string) {
    const where: any = {};
    if (request_id) where.request_id = request_id;
    return this.invRepo.find({ where });
  }

  async getInvoice(id: string) {
    return this.invRepo.findOneBy({ id });
  }

  async getPayments(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.payRepo.find({ where });
  }

  async getPayment(id: string) {
    return this.payRepo.findOneBy({ id });
  }

  async markPaymentReceived(id: string, data: any) {
    await this.payRepo.update({ id }, {
      status: PaymentStatus.RECEIVED_BY_ACCOUNTANT,
      received_at: new Date().toISOString(),
      accountant_notes: data.notes || '',
      proof_url: data.proof_url || '',
    } as any);
    return { success: true };
  }

  async verifyPayment(id: string, data: any) {
    const status = data.verified ? PaymentStatus.VERIFIED_BY_OPS : PaymentStatus.REJECTED;
    await this.payRepo.update({ id }, {
      status,
      verified_at: new Date().toISOString(),
      ops_notes: data.notes || '',
    } as any);
    return { success: true };
  }

  // Activities
  async getActivities(request_id?: string) {
    const where: any = {};
    if (request_id) where.request_id = request_id;
    return this.actRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async createActivity(payload: Partial<Activity>) {
    const now = new Date().toISOString();
    const a = this.actRepo.create({ ...payload, created_at: now } as any);
    return this.actRepo.save(a);
  }

  // Catalog
  async getCatalog(type?: string, destination?: string) {
    const where: any = {};
    if (type) where.type = type;
    if (destination) where.destination = destination;
    return this.catRepo.find({ where });
  }

  async createCatalogItem(payload: Partial<CatalogItem>) {
    const now = new Date().toISOString();
    const item = this.catRepo.create({ ...payload, created_at: now } as any);
    return this.catRepo.save(item);
  }

  // Notifications
  async getNotifications(user_id: string, unread_only = false) {
    const where: any = { user_id };
    if (unread_only) where.is_read = false;
    return this.notifRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async markNotificationRead(id: string) {
    await this.notifRepo.update({ id }, { is_read: true } as any);
    return { success: true };
  }

  async createNotification(payload: Partial<Notification>) {
    const now = new Date().toISOString();
    const n = this.notifRepo.create({ ...payload, created_at: now } as any);
    return this.notifRepo.save(n);
  }

  // Dashboard
  async getDashboardStats(role: string) {
    const stats: any = {};
    if (role === 'operations') {
      const twoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      // Note: TypeORM does not support 'expiry_date <= :twoDays' easily with simple count in this demo; users may customize queries.
      stats.expiring_quotes = await this.quoteRepo.count();
      stats.pending_payments = await this.payRepo.count({ where: [{ status: PaymentStatus.PENDING }, { status: PaymentStatus.RECEIVED_BY_ACCOUNTANT }] });
      stats.active_requests = await this.reqRepo.count({ where: { status: RequestStatus.PENDING } as any });
      stats.total_revenue = 0;
    } else if (role === 'sales') {
      stats.my_requests = await this.reqRepo.count({ where: { assigned_salesperson_id: 'sales-001' } as any });
      stats.pending_quotes = await this.quoteRepo.count({ where: { status: QuotationStatus.SENT } as any });
      stats.accepted_quotes = await this.quoteRepo.count({ where: { status: QuotationStatus.ACCEPTED } as any });
    } else if (role === 'accountant') {
      stats.pending_verification = await this.payRepo.count({ where: { status: PaymentStatus.RECEIVED_BY_ACCOUNTANT } as any });
      stats.pending_payments = await this.payRepo.count({ where: { status: PaymentStatus.PENDING } as any });
      stats.verified_payments = await this.payRepo.count({ where: { status: PaymentStatus.VERIFIED_BY_OPS } as any });
    }
    return stats;
  }

  // Seed
  async seedData() {
    await this.catRepo.clear();
    await this.reqRepo.clear();
    await this.quoteRepo.clear();
    await this.actRepo.clear();

    const now = new Date().toISOString();
    const catalogItems = [
      { name: 'Luxury Hotel - Manali', type: 'hotel', destination: 'Manali', supplier: 'Hotel Paradise', default_price: 5000 },
      { name: 'Budget Hotel - Manali', type: 'hotel', destination: 'Manali', supplier: 'Hotel Comfort', default_price: 2000 },
      { name: 'Luxury Hotel - Goa', type: 'hotel', destination: 'Goa', supplier: 'Beach Resort', default_price: 8000 },
      { name: 'Private Cab - SUV', type: 'transport', destination: 'All', supplier: 'Quick Cabs', default_price: 3000 },
      { name: 'Private Cab - Sedan', type: 'transport', destination: 'All', supplier: 'Quick Cabs', default_price: 2000 },
      { name: 'Paragliding', type: 'activity', destination: 'Manali', supplier: 'Adventure Co', default_price: 2500 },
    ];
    for (const c of catalogItems) {
      await this.catRepo.save(this.catRepo.create({ ...c, created_at: now } as any));
    }

    const req1 = this.reqRepo.create({
      client_name: 'Rajesh Kumar',
      client_email: 'rajesh@example.com',
      client_phone: '+919876543210',
      title: 'Family Trip to Manali',
      people_count: 4,
      budget_min: 50000,
      budget_max: 80000,
      travel_vibe: ['hill', 'adventure'],
      preferred_dates: '15-20 Dec 2025',
      destination: 'Manali',
      status: RequestStatus.PENDING,
      assigned_salesperson_id: 'sales-001',
      assigned_salesperson_name: 'Sales Executive',
      created_by: 'sales-001',
      created_at: now,
      updated_at: now,
      next_follow_up: new Date(Date.now() + 24*60*60*1000).toISOString(),
    } as any);

    const req2 = this.reqRepo.create({
      client_name: 'Priya Sharma',
      client_email: 'priya@example.com',
      client_phone: '+919876543211',
      title: 'Honeymoon Package - Goa',
      people_count: 2,
      budget_min: 60000,
      budget_max: 100000,
      travel_vibe: ['beach', 'romantic'],
      preferred_dates: '10-17 Jan 2026',
      destination: 'Goa',
      status: RequestStatus.QUOTED,
      assigned_salesperson_id: 'sales-001',
      assigned_salesperson_name: 'Sales Executive',
      created_by: 'sales-001',
      created_at: now,
      updated_at: now,
    } as any);

    const saved1: any = await this.reqRepo.save(req1);
    const saved2: any = await this.reqRepo.save(req2);

    await this.actRepo.save(this.actRepo.create({
      request_id: saved1.id,
      actor_id: 'sales-001',
      actor_name: 'Sales Executive',
      actor_role: 'sales',
      action: 'created',
      notes: `Request created for ${saved1.client_name}`,
      created_at: now,
    } as any));

    await this.actRepo.save(this.actRepo.create({
      request_id: saved2.id,
      actor_id: 'sales-001',
      actor_name: 'Sales Executive',
      actor_role: 'sales',
      action: 'created',
      notes: `Request created for ${saved2.client_name}`,
      created_at: now,
    } as any));

    const optionA = {
      id: uuidv4(),
      name: 'Option A - Premium Package',
      line_items: [
        { type: 'hotel', name: 'Luxury Hotel - Goa', supplier: 'Beach Resort', unit_price: 8000, quantity: 7, tax_percent: 18 },
        { type: 'transport', name: 'Private Cab - Sedan', supplier: 'Quick Cabs', unit_price: 2000, quantity: 1, tax_percent: 18 },
        { type: 'activity', name: 'Scuba Diving', supplier: 'Deep Blue', unit_price: 4500, quantity: 2, tax_percent: 18 },
        { type: 'meal', name: 'Breakfast Buffet', supplier: 'Various', unit_price: 500, quantity: 14, tax_percent: 18 },
      ],
      subtotal: 0,
      tax_amount: 0,
      total: 0,
      is_recommended: true,
    };

    optionA.subtotal = optionA.line_items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
    optionA.tax_amount = optionA.line_items.reduce((s, it) => s + it.unit_price * it.quantity * it.tax_percent / 100, 0);
    optionA.total = optionA.line_items.reduce((s, it) => s + (it.unit_price * it.quantity * (1 + it.tax_percent/100)), 0);

    const version = {
      id: uuidv4(),
      version_number: 1,
      options: [optionA],
      created_by: 'ops-001',
      created_by_name: 'Operations Manager',
      created_at: now,
      change_notes: 'Initial quotation',
      is_current: true,
    };

    const quotation = this.quoteRepo.create({
      request_id: saved2.id,
      versions: [version],
      status: QuotationStatus.SENT,
      expiry_date: new Date(Date.now() + 5 * 24*60*60*1000).toISOString(),
      published_at: now,
      advance_percent: 30.0,
      advance_amount: optionA.total * 0.3,
      grand_total: optionA.total,
      created_at: now,
      updated_at: now,
    } as any);

    const savedQuote: any = await this.quoteRepo.save(quotation);

    await this.actRepo.save(this.actRepo.create({
      request_id: saved2.id,
      actor_id: 'ops-001',
      actor_name: 'Operations Manager',
      actor_role: 'operations',
      action: 'published',
      notes: 'Proforma published and sent to customer',
      created_at: now,
    } as any));

    return { success: true, message: 'Mock data seeded successfully' };
  }
}
