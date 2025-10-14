export enum UserRole {
  OPERATIONS = 'operations',
  SALES = 'sales',
  ACCOUNTANT = 'accountant',
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export enum RequestStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  QUOTED = 'QUOTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  RECEIVED_BY_ACCOUNTANT = 'RECEIVED_BY_ACCOUNTANT',
  VERIFIED_BY_OPS = 'VERIFIED_BY_OPS',
  CAPTURED = 'CAPTURED',
  REJECTED = 'REJECTED',
}
