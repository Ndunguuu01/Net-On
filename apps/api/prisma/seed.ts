// ============================================
// Net-On — Database Seed Script
// ============================================
// Creates realistic demo data for the entire system.
// Run with: npm run prisma:seed
// ============================================

import { PrismaClient, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// --- Helper ---
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function randomEl<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function padSeq(n: number, len = 6): string {
  return String(n).padStart(len, '0');
}

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

// ============================================
// Demo Data Definitions
// ============================================

const KENYAN_CUSTOMERS = [
  { firstName: 'James', lastName: 'Mwangi', phone: '0712345001', location: 'Westlands, Nairobi', email: 'james.mwangi@gmail.com' },
  { firstName: 'Mary', lastName: 'Wanjiku', phone: '0723456002', location: 'Kilimani, Nairobi', email: 'mary.wanjiku@gmail.com' },
  { firstName: 'Peter', lastName: 'Ochieng', phone: '0734567003', location: 'Lavington, Nairobi', email: 'peter.ochieng@yahoo.com' },
  { firstName: 'Grace', lastName: 'Njeri', phone: '0745678004', location: 'Karen, Nairobi', email: 'grace.njeri@outlook.com' },
  { firstName: 'David', lastName: 'Kamau', phone: '0756789005', location: 'Langata, Nairobi', email: null },
  { firstName: 'Sarah', lastName: 'Akinyi', phone: '0767890006', location: 'South B, Nairobi', email: 'sarah.akinyi@gmail.com' },
  { firstName: 'John', lastName: 'Kipchoge', phone: '0778901007', location: 'Kileleshwa, Nairobi', email: null },
  { firstName: 'Lucy', lastName: 'Muthoni', phone: '0789012008', location: 'Ruaka, Kiambu', email: 'lucy.muthoni@gmail.com' },
  { firstName: 'Daniel', lastName: 'Otieno', phone: '0790123009', location: 'Parklands, Nairobi', email: 'daniel.otieno@company.co.ke' },
  { firstName: 'Faith', lastName: 'Chebet', phone: '0711234010', location: 'Ngong, Kajiado', email: null },
  { firstName: 'Brian', lastName: 'Mutua', phone: '0722345011', location: 'Rongai, Kajiado', email: 'brian.mutua@gmail.com' },
  { firstName: 'Agnes', lastName: 'Wangari', phone: '0733456012', location: 'Kahawa West, Nairobi', email: 'agnes.wangari@gmail.com' },
  { firstName: 'Stephen', lastName: 'Kibet', phone: '0744567013', location: 'Juja, Kiambu', email: null },
  { firstName: 'Rose', lastName: 'Adhiambo', phone: '0755678014', location: 'Embakasi, Nairobi', email: 'rose.adhiambo@yahoo.com' },
  { firstName: 'Michael', lastName: 'Njoroge', phone: '0766789015', location: 'Thika, Kiambu', email: null },
  { firstName: 'Esther', lastName: 'Wambui', phone: '0777890016', location: 'Kitengela, Kajiado', email: 'esther.wambui@gmail.com' },
  { firstName: 'Patrick', lastName: 'Ouma', phone: '0788901017', location: 'Umoja, Nairobi', email: 'patrick.ouma@company.co.ke' },
  { firstName: 'Christine', lastName: 'Nyambura', phone: '0799012018', location: 'Githurai, Kiambu', email: null },
  { firstName: 'Kevin', lastName: 'Wekesa', phone: '0710123019', location: 'Donholm, Nairobi', email: 'kevin.wekesa@gmail.com' },
  { firstName: 'Mercy', lastName: 'Cherono', phone: '0721234020', location: 'Kasarani, Nairobi', email: 'mercy.cherono@outlook.com' },
];

const PACKAGE_DEFS = [
  {
    name: 'Home Basic 5M',
    description: 'Entry-level package for light browsing and social media',
    price: new Prisma.Decimal(1500),
    downloadSpeed: 5, uploadSpeed: 5, speedUnit: 'Mbps',
    billingCycle: 'MONTHLY', durationDays: 30, gracePeriodDays: 3,
  },
  {
    name: 'Home Fiber 10M',
    description: 'Standard home package for HD streaming and video calls',
    price: new Prisma.Decimal(2500),
    downloadSpeed: 10, uploadSpeed: 10, speedUnit: 'Mbps',
    billingCycle: 'MONTHLY', durationDays: 30, gracePeriodDays: 3,
  },
  {
    name: 'Home Ultra 20M',
    description: 'Premium home package for 4K streaming, gaming, and smart home',
    price: new Prisma.Decimal(4000),
    downloadSpeed: 20, uploadSpeed: 20, speedUnit: 'Mbps',
    billingCycle: 'MONTHLY', durationDays: 30, gracePeriodDays: 3,
  },
  {
    name: 'Business Pro 50M',
    description: 'High-speed dedicated business line with SLA and priority QoS',
    price: new Prisma.Decimal(6500),
    downloadSpeed: 50, uploadSpeed: 50, speedUnit: 'Mbps',
    billingCycle: 'MONTHLY', durationDays: 30, gracePeriodDays: 5,
  },
];

// ============================================
// Main Seed Function
// ============================================

async function main() {
  console.log('🌱 Seeding Net-On database...\n');

  // -----------------------------------------------
  // 1. Admin User
  // -----------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@neton.co.ke';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'System';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'Administrator';

  const adminHash = await hashPassword(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  await prisma.customer.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      customerNumber: 'NET-000001',
      firstName: adminFirstName,
      lastName: adminLastName,
      phone: '254700000000',
      email: adminEmail,
      status: 'ACTIVE',
    },
  });

  console.log(`  ✅ Admin user: ${adminEmail} (SUPER_ADMIN)`);

  // -----------------------------------------------
  // 2. System Settings
  // -----------------------------------------------
  const settings = [
    { key: 'company_name', value: 'Net-On', type: 'string', category: 'general', description: 'Company display name' },
    { key: 'currency', value: 'KES', type: 'string', category: 'billing', description: 'Default currency code' },
    { key: 'grace_period_days', value: '3', type: 'number', category: 'billing', description: 'Default grace period in days' },
    { key: 'invoice_due_days', value: '7', type: 'number', category: 'billing', description: 'Days before subscription expiry to generate invoice' },
    { key: 'reminder_days', value: '7,3,1', type: 'string', category: 'notifications', description: 'Comma-separated days before expiry to send reminders' },
    { key: 'mpesa_mode', value: 'mock', type: 'string', category: 'payments', description: 'M-Pesa mode: mock or live' },
    { key: 'mikrotik_mode', value: 'mock', type: 'string', category: 'network', description: 'MikroTik mode: mock or live' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log(`  ✅ ${settings.length} system settings`);

  // -----------------------------------------------
  // 3. Network Profiles
  // -----------------------------------------------
  const profileDefs = [
    { name: 'Profile 5M', downloadSpeed: 5, uploadSpeed: 5, speedUnit: 'Mbps', rateLimitString: '5M/5M' },
    { name: 'Profile 10M', downloadSpeed: 10, uploadSpeed: 10, speedUnit: 'Mbps', rateLimitString: '10M/10M' },
    { name: 'Profile 20M', downloadSpeed: 20, uploadSpeed: 20, speedUnit: 'Mbps', rateLimitString: '20M/20M' },
    { name: 'Profile 50M', downloadSpeed: 50, uploadSpeed: 50, speedUnit: 'Mbps', rateLimitString: '50M/50M' },
  ];

  const networkProfiles: Record<number, string> = {};
  for (const pd of profileDefs) {
    const np = await prisma.networkProfile.upsert({
      where: { name: pd.name },
      update: {},
      create: pd,
    });
    networkProfiles[pd.downloadSpeed] = np.id;
  }
  console.log(`  ✅ ${profileDefs.length} network profiles`);

  // -----------------------------------------------
  // 4. Internet Packages
  // -----------------------------------------------
  const packageIds: string[] = [];
  for (const pkg of PACKAGE_DEFS) {
    const existing = await prisma.internetPackage.findFirst({
      where: { name: pkg.name, status: { not: 'ARCHIVED' } },
    });
    if (existing) {
      packageIds.push(existing.id);
    } else {
      const created = await prisma.internetPackage.create({
        data: {
          name: pkg.name,
          description: pkg.description,
          price: pkg.price,
          billingCycle: pkg.billingCycle,
          durationDays: pkg.durationDays,
          downloadSpeed: pkg.downloadSpeed,
          uploadSpeed: pkg.uploadSpeed,
          speedUnit: pkg.speedUnit,
          gracePeriodDays: pkg.gracePeriodDays,
          networkProfileId: networkProfiles[pkg.downloadSpeed] || null,
          status: 'ACTIVE',
        },
      });
      packageIds.push(created.id);
    }
  }
  console.log(`  ✅ ${PACKAGE_DEFS.length} internet packages`);

  // -----------------------------------------------
  // 5. Router (Mock MikroTik)
  // -----------------------------------------------
  const routerPw = await hashPassword('mikrotik_mock_pw');
  const router = await prisma.router.upsert({
    where: { id: '00000000-0000-4000-a000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-a000-000000000001',
      name: 'Core Router — Nairobi POP',
      managementIp: '192.168.88.1',
      apiPort: 8728,
      apiUsername: 'admin',
      encryptedPassword: routerPw,
      location: 'Westlands Data Center, Nairobi',
      status: 'ONLINE',
      capabilities: { routerOs: '7.14', model: 'CCR2004-16G-2S+', cpu: 'ARM64', ram: '4GB' },
      lastHealthCheck: new Date(),
    },
  });
  console.log(`  ✅ 1 router: ${router.name}`);

  // -----------------------------------------------
  // 6. Customers + Users
  // -----------------------------------------------
  const customerIds: string[] = [];
  const defaultPwHash = await hashPassword('NetOn@2026');

  for (let i = 0; i < KENYAN_CUSTOMERS.length; i++) {
    const c = KENYAN_CUSTOMERS[i];
    const phone = '254' + c.phone.substring(1); // Format: 254XXXXXXXXX
    const email = c.email || `${phone}@customer.neton.internal`;
    const custNum = `NET-${padSeq(i + 2)}`; // NET-000001 is admin

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingCust = await prisma.customer.findUnique({ where: { userId: existingUser.id } });
      if (existingCust) { customerIds.push(existingCust.id); continue; }
    }

    const status = i < 15 ? 'ACTIVE' : i < 18 ? 'SUSPENDED' : 'ACTIVE';

    const user = await prisma.user.create({
      data: { email, passwordHash: defaultPwHash, role: 'CUSTOMER', isActive: status === 'ACTIVE' },
    });
    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        customerNumber: custNum,
        firstName: c.firstName,
        lastName: c.lastName,
        phone,
        email: c.email,
        address: `P.O. Box ${1000 + i * 7}-00100, Nairobi`,
        installationAddress: `${c.location}`,
        location: c.location,
        status,
        notes: i === 0 ? 'VIP customer — premium support' : undefined,
      },
    });
    customerIds.push(customer.id);
  }
  console.log(`  ✅ ${KENYAN_CUSTOMERS.length} customers with user accounts`);

  // -----------------------------------------------
  // 7. Subscriptions (varied statuses)
  // -----------------------------------------------
  const subscriptionIds: string[] = [];
  const subStatuses = [
    'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE',
    'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE',
    'ACTIVE', 'ACTIVE', 'EXPIRING', 'EXPIRING', 'EXPIRING',
    'EXPIRED', 'EXPIRED', 'GRACE_PERIOD', 'SUSPENDED', 'ACTIVE',
  ];

  for (let i = 0; i < customerIds.length; i++) {
    const status = subStatuses[i] || 'ACTIVE';
    const pkgIdx = i % packageIds.length;

    let startDate: Date, expiryDate: Date;
    switch (status) {
      case 'EXPIRED':
        startDate = daysAgo(60);
        expiryDate = daysAgo(30);
        break;
      case 'EXPIRING':
        startDate = daysAgo(25);
        expiryDate = daysFromNow(randomEl([2, 3, 5]));
        break;
      case 'GRACE_PERIOD':
        startDate = daysAgo(33);
        expiryDate = daysAgo(3);
        break;
      case 'SUSPENDED':
        startDate = daysAgo(45);
        expiryDate = daysAgo(15);
        break;
      default: // ACTIVE
        startDate = daysAgo(randomEl([5, 10, 15, 20, 25]));
        expiryDate = daysFromNow(randomEl([5, 10, 15, 20, 25]));
    }

    const sub = await prisma.subscription.create({
      data: {
        customerId: customerIds[i],
        packageId: packageIds[pkgIdx],
        startDate,
        expiryDate,
        status,
        autoRenew: status !== 'SUSPENDED',
        gracePeriodDays: PACKAGE_DEFS[pkgIdx].gracePeriodDays,
      },
    });
    subscriptionIds.push(sub.id);
  }
  console.log(`  ✅ ${subscriptionIds.length} subscriptions`);

  // -----------------------------------------------
  // 8. Invoices
  // -----------------------------------------------
  const invoiceIds: string[] = [];
  const year = new Date().getFullYear();
  const invoiceStatuses = [
    'PAID', 'PAID', 'PAID', 'PAID', 'PAID',
    'PAID', 'PAID', 'PAID', 'PAID', 'PAID',
    'PAID', 'PAID', 'PENDING', 'PENDING', 'PENDING',
    'OVERDUE', 'OVERDUE', 'PENDING', 'CANCELLED', 'PAID',
    // 5 extra historical invoices
    'PAID', 'PAID', 'PAID', 'PAID', 'PAID',
  ];

  for (let i = 0; i < 25; i++) {
    const custIdx = i % customerIds.length;
    const pkgIdx = custIdx % packageIds.length;
    const status = invoiceStatuses[i];
    const price = PACKAGE_DEFS[pkgIdx].price;

    const isPaid = status === 'PAID';
    const isOverdue = status === 'OVERDUE';
    const issueDate = daysAgo(isPaid ? randomEl([40, 35, 30, 25, 20]) : isOverdue ? 15 : 5);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 7);
    const billingStart = new Date(issueDate);
    const billingEnd = new Date(billingStart);
    billingEnd.setDate(billingEnd.getDate() + 30);

    const inv = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${year}-${padSeq(i + 1)}`,
        customerId: customerIds[custIdx],
        subscriptionId: i < subscriptionIds.length ? subscriptionIds[custIdx] : null,
        billingPeriodStart: billingStart,
        billingPeriodEnd: billingEnd,
        issueDate,
        dueDate,
        subtotal: price,
        discount: new Prisma.Decimal(0),
        tax: new Prisma.Decimal(0),
        total: price,
        amountPaid: isPaid ? price : new Prisma.Decimal(0),
        balance: isPaid ? new Prisma.Decimal(0) : price,
        status,
      },
    });
    invoiceIds.push(inv.id);

    // Create invoice line item
    await prisma.invoiceItem.create({
      data: {
        invoiceId: inv.id,
        description: `${PACKAGE_DEFS[pkgIdx].name} — Monthly subscription`,
        quantity: 1,
        unitPrice: price,
        total: price,
      },
    });
  }
  console.log(`  ✅ 25 invoices with line items`);

  // -----------------------------------------------
  // 9. Payments (M-Pesa + Manual)
  // -----------------------------------------------
  let paymentCount = 0;
  for (let i = 0; i < invoiceIds.length; i++) {
    if (invoiceStatuses[i] !== 'PAID') continue;
    const custIdx = i % customerIds.length;
    const pkgIdx = custIdx % packageIds.length;
    const price = PACKAGE_DEFS[pkgIdx].price;
    const isMpesa = Math.random() > 0.2;
    const txRef = isMpesa
      ? `SAG${randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase()}`
      : `MAN-${year}-${padSeq(paymentCount + 1)}`;

    await prisma.payment.create({
      data: {
        customerId: customerIds[custIdx],
        invoiceId: invoiceIds[i],
        amount: price,
        provider: isMpesa ? 'MPESA' : 'MANUAL',
        transactionReference: txRef,
        providerTransactionId: isMpesa ? `OGP${randomUUID().substring(0, 8).toUpperCase()}` : null,
        phoneNumber: isMpesa ? KENYAN_CUSTOMERS[custIdx]?.phone ? '254' + KENYAN_CUSTOMERS[custIdx].phone.substring(1) : null : null,
        status: 'SUCCESS',
        reconciliationStatus: 'RECONCILED',
        paidAt: daysAgo(randomEl([1, 2, 3, 5, 7, 10, 14, 20, 25, 30])),
        providerMetadata: isMpesa ? { resultCode: 0, resultDesc: 'The service request is processed successfully.' } : undefined,
      },
    });
    paymentCount++;
  }
  console.log(`  ✅ ${paymentCount} payments`);

  // -----------------------------------------------
  // 10. Network Accounts (PPP/Hotspot)
  // -----------------------------------------------
  const baseIp = [10, 0, 1];
  for (let i = 0; i < Math.min(15, customerIds.length); i++) {
    const custPhone = KENYAN_CUSTOMERS[i].phone;
    const username = `ppp-${custPhone.substring(custPhone.length - 4)}`;
    const pkgIdx = i % packageIds.length;

    const existing = await prisma.networkAccount.findUnique({ where: { customerId: customerIds[i] } });
    if (existing) continue;

    await prisma.networkAccount.create({
      data: {
        customerId: customerIds[i],
        username,
        passwordReference: `enc_${randomUUID().substring(0, 12)}`,
        authenticationMethod: i < 10 ? 'PPP_SECRET' : 'HOTSPOT_USER',
        routerId: router.id,
        networkProfileId: networkProfiles[PACKAGE_DEFS[pkgIdx].downloadSpeed] || null,
        ipAddress: `${baseIp.join('.')}.${10 + i}`,
        macAddress: `AA:BB:CC:DD:${padSeq(i, 2).substring(0, 2)}:${padSeq(i + 10, 2).substring(0, 2)}`,
        status: i < 12 ? 'ACTIVE' : i < 14 ? 'SUSPENDED' : 'PENDING',
        syncStatus: i < 12 ? 'SYNCED' : 'PENDING',
        lastSyncedAt: i < 12 ? daysAgo(randomEl([0, 1, 2])) : null,
      },
    });
  }
  console.log(`  ✅ 15 network accounts`);

  // -----------------------------------------------
  // 11. Notifications
  // -----------------------------------------------
  const notifTypes = [
    { type: 'INVOICE_GENERATED', channel: 'SMS', subject: null, message: 'Dear {name}, your invoice INV-2026-{n} for KSh {amount} has been generated. Pay via M-Pesa.' },
    { type: 'PAYMENT_RECEIVED', channel: 'SMS', subject: null, message: 'Payment of KSh {amount} received. Your internet service is active until {date}. Thank you!' },
    { type: 'SUBSCRIPTION_EXPIRING', channel: 'SMS', subject: null, message: 'Dear {name}, your internet subscription expires in {days} days. Renew now to avoid disconnection.' },
    { type: 'SUBSCRIPTION_EXPIRED', channel: 'EMAIL', subject: 'Subscription Expired', message: 'Your Net-On internet subscription has expired. Please renew to restore service.' },
    { type: 'INTERNET_SUSPENDED', channel: 'SMS', subject: null, message: 'Dear {name}, your internet service has been suspended due to non-payment. Pay KSh {amount} to restore.' },
    { type: 'CUSTOMER_REGISTERED', channel: 'SMS', subject: null, message: 'Welcome to Net-On! Your customer number is {custNum}. Login at portal.neton.co.ke.' },
    { type: 'INTERNET_RESTORED', channel: 'SMS', subject: null, message: 'Great news! Your internet service has been restored. Enjoy browsing!' },
    { type: 'INVOICE_GENERATED', channel: 'EMAIL', subject: 'New Invoice', message: 'Dear valued customer, your new invoice is ready for payment.' },
    { type: 'PAYMENT_RECEIVED', channel: 'IN_APP', subject: 'Payment Confirmed', message: 'Your payment has been confirmed and applied to your account.' },
    { type: 'SUBSCRIPTION_EXPIRING', channel: 'SMS', subject: null, message: 'Reminder: Your subscription expires tomorrow. Renew now!' },
  ];

  for (let i = 0; i < notifTypes.length; i++) {
    const n = notifTypes[i];
    const custIdx = i % customerIds.length;
    await prisma.notification.create({
      data: {
        customerId: customerIds[custIdx],
        channel: n.channel,
        type: n.type,
        subject: n.subject,
        message: n.message
          .replace('{name}', KENYAN_CUSTOMERS[custIdx].firstName)
          .replace('{n}', padSeq(i + 1))
          .replace('{amount}', String(PACKAGE_DEFS[custIdx % 4].price))
          .replace('{date}', daysFromNow(30).toLocaleDateString())
          .replace('{days}', '3')
          .replace('{custNum}', `NET-${padSeq(custIdx + 2)}`),
        status: i < 7 ? 'SENT' : 'PENDING',
        sentAt: i < 7 ? daysAgo(randomEl([1, 2, 3, 5, 7])) : null,
        metadata: { source: 'seed' },
      },
    });
  }
  console.log(`  ✅ ${notifTypes.length} notifications`);

  // -----------------------------------------------
  // 12. Support Tickets
  // -----------------------------------------------
  const tickets = [
    { subject: 'Internet speed lower than expected', description: 'My download speed is only 3Mbps but I subscribed to the 10Mbps plan. Please check.', category: 'TECHNICAL', priority: 'HIGH', status: 'OPEN' },
    { subject: 'Billing discrepancy on latest invoice', description: 'I was charged KSh 4,000 but my package costs KSh 2,500. Please investigate.', category: 'BILLING', priority: 'MEDIUM', status: 'IN_PROGRESS' },
    { subject: 'Unable to connect to the internet', description: 'My PPPoE connection drops every 30 minutes. Router model: RB750Gr3.', category: 'TECHNICAL', priority: 'URGENT', status: 'OPEN' },
    { subject: 'Request for package upgrade', description: 'I would like to upgrade from Home Basic to Home Ultra. Please advise on the process.', category: 'GENERAL', priority: 'LOW', status: 'RESOLVED' },
    { subject: 'M-Pesa payment not reflected', description: 'I made a payment of KSh 2,500 via M-Pesa (ref: SAG123456) but it has not been applied to my account.', category: 'BILLING', priority: 'HIGH', status: 'WAITING_ON_CUSTOMER' },
  ];

  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    await prisma.supportTicket.create({
      data: {
        customerId: customerIds[i],
        ticketNumber: `TKT-${padSeq(i + 1)}`,
        subject: t.subject,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        resolvedAt: t.status === 'RESOLVED' ? daysAgo(2) : null,
      },
    });
  }
  console.log(`  ✅ ${tickets.length} support tickets`);

  // -----------------------------------------------
  // 13. Audit Logs
  // -----------------------------------------------
  const auditActions = [
    { action: 'LOGIN', resource: 'USER', result: 'SUCCESS' },
    { action: 'CREATE', resource: 'CUSTOMER', result: 'SUCCESS' },
    { action: 'CREATE', resource: 'CUSTOMER', result: 'SUCCESS' },
    { action: 'PAYMENT', resource: 'PAYMENT', result: 'SUCCESS' },
    { action: 'UPDATE', resource: 'SUBSCRIPTION', result: 'SUCCESS' },
    { action: 'CREATE', resource: 'INVOICE', result: 'SUCCESS' },
    { action: 'NETWORK_SYNC', resource: 'NETWORK_ACCOUNT', result: 'SUCCESS' },
    { action: 'SUSPEND', resource: 'CUSTOMER', result: 'SUCCESS' },
    { action: 'REACTIVATE', resource: 'CUSTOMER', result: 'SUCCESS' },
    { action: 'LOGIN_FAILED', resource: 'USER', result: 'FAILURE' },
    { action: 'SETTINGS_CHANGE', resource: 'SYSTEM_SETTING', result: 'SUCCESS' },
    { action: 'CREATE', resource: 'SUPPORT_TICKET', result: 'SUCCESS' },
    { action: 'PAYMENT', resource: 'PAYMENT', result: 'SUCCESS' },
    { action: 'LOGIN', resource: 'USER', result: 'SUCCESS' },
    { action: 'DELETE', resource: 'INTERNET_PACKAGE', result: 'DENIED' },
  ];

  for (let i = 0; i < auditActions.length; i++) {
    const a = auditActions[i];
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: a.action,
        resource: a.resource,
        resourceId: i < customerIds.length ? customerIds[i] : null,
        ipAddress: '192.168.1.' + (100 + i),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
        result: a.result,
        metadata: { source: 'seed', index: i },
        createdAt: daysAgo(randomEl([0, 1, 2, 3, 4, 5, 7, 10, 14, 20])),
      },
    });
  }
  console.log(`  ✅ ${auditActions.length} audit log entries`);

  console.log('\n🎉 Seed completed! Database is fully populated.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
