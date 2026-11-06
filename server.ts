import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Database helper
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// In-memory rate limiting map for security against bots and spam
const ipRateLimits = new Map<string, number[]>();
function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (ipRateLimits.get(ip) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    return false;
  }
  timestamps.push(now);
  ipRateLimits.set(ip, timestamps);
  return true;
}

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (!parsed.employees) parsed.employees = [];
      if (!parsed.waiterCalls) parsed.waiterCalls = [];
      if (Array.isArray(parsed.menu)) {
        parsed.menu.forEach((m: any) => {
          if (m.available === undefined) m.available = true;
        });
      }
      if (Array.isArray(parsed.promos)) {
        parsed.promos.forEach((p: any) => {
          if (p.active === undefined) p.active = true;
        });
      }
      if (Array.isArray(parsed.orders)) {
        parsed.orders.forEach((o: any) => {
          if ((o.type === 'delivery' || o.type === 'takeaway') && !o.verificationCode) {
            o.verificationCode = '4921';
          }
          if (o.failedCodeAttempts === undefined) o.failedCodeAttempts = 0;
          if (o.isFraudBlocked === undefined) o.isFraudBlocked = false;
        });
      }
      if (!parsed.settings) {
        parsed.settings = {
          restaurantName: 'Brasa & Lúpulo',
          tagline: 'Smash Burgers • Horno de Barro • Birra Artesanal',
          address: '18 de Julio 245 esq. 25 de Mayo, Tacuarembó, Uruguay',
          phone: '+598 99 887 766',
          whatsapp: '59899887766',
          openingHours: 'Miércoles a Domingos 19:30 a 01:30 hs',
          happyHour: '19:30 a 21:30 hs ($150 la pinta)',
          deliveryFee: 60,
          isOpen: true,
          minOrderAmount: 200,
          requirePhoneValidation: true,
          maxFailedCodeAttempts: 3,
          featuredAnnouncement: 'Horno de barro encendido a 420°C • 8 Canillas artesanales tiradas bajo cero'
        };
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  return {
    taps: [],
    menu: [],
    promos: [],
    reviews: [],
    orders: [],
    waiterCalls: [],
    reservations: [],
    employees: [],
    settings: {
      restaurantName: 'Brasa & Lúpulo',
      tagline: 'Smash Burgers • Horno de Barro • Birra Artesanal',
      address: '18 de Julio 245 esq. 25 de Mayo, Tacuarembó, Uruguay',
      phone: '+598 99 887 766',
      whatsapp: '59899887766',
      openingHours: 'Miércoles a Domingos 19:30 a 01:30 hs',
      happyHour: '19:30 a 21:30 hs ($150 la pinta)',
      deliveryFee: 60,
      isOpen: true,
      minOrderAmount: 200,
      requirePhoneValidation: true,
      maxFailedCodeAttempts: 3,
      featuredAnnouncement: 'Horno de barro encendido a 420°C • 8 Canillas artesanales tiradas bajo cero'
    }
  };
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

function computeEmployeeStats(emp: any, orders: any[]) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStr = now.toISOString().slice(0, 7);

  const deliveredOrders = (orders || []).filter(
    (o: any) => o.assignedTo === emp.id && o.status === 'delivered'
  );

  const deliveriesToday = deliveredOrders.filter(
    (o: any) => (o.deliveredAt || o.createdAt || '').slice(0, 10) === todayStr
  ).length;

  const deliveriesWeek = deliveredOrders.filter((o: any) => {
    const d = new Date(o.deliveredAt || o.createdAt || '');
    return d >= sevenDaysAgo;
  }).length;

  const deliveriesMonth = deliveredOrders.filter(
    (o: any) => (o.deliveredAt || o.createdAt || '').slice(0, 7) === monthStr
  ).length;

  const deliveriesTotal = deliveredOrders.length;
  const rate = emp.commissionPerDelivery || 60;
  const earningsToday = deliveriesToday * rate;
  const earningsWeek = deliveriesWeek * rate;
  const earningsMonth = deliveriesMonth * rate;
  const earningsTotal = deliveriesTotal * rate;

  return {
    ...emp,
    deliveriesToday,
    deliveriesWeek,
    deliveriesMonth,
    deliveriesTotal,
    earningsToday,
    earningsWeek,
    earningsMonth,
    earningsTotal
  };
}

// Deduct keg percentage when an order contains tap beers
function deductKegsFromOrderItems(db: any, items: any[]) {
  if (!Array.isArray(db.taps) || !Array.isArray(items)) return;
  items.forEach((item: any) => {
    const qty = Number(item.quantity) || 1;
    const itemId = String(item.id || '').toLowerCase();
    const itemName = String(item.name || '').toLowerCase();

    db.taps.forEach((tap: any) => {
      const tapId = String(tap.id || '').toLowerCase();
      const tapName = String(tap.name || '').toLowerCase();
      if (
        (tapId && itemId.includes(tapId)) ||
        (tapName && itemName.includes(tapName))
      ) {
        const isGrowler = itemId.includes('growler') || itemName.includes('growler');
        const deductionPerUnit = isGrowler ? 5 : 2;
        tap.kegPercentage = Math.max(0, (tap.kegPercentage || 0) - deductionPerUnit * qty);
        if (tap.kegPercentage <= 25 && tap.status === 'activa') {
          tap.status = 'ultimas_pintas';
        }
      }
    });
  });
}

// Google GenAI helper for AI Sommelier
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Ensure default Master Admin account ("Calix" / "calixdev") exists in db.json
function ensureDefaultAdmin() {
  const db = readDb();
  if (!db.employees) db.employees = [];
  const adminExists = db.employees.find((e: any) => e.username.toLowerCase() === 'calix');
  if (!adminExists) {
    db.employees.unshift({
      id: 'emp-calix',
      name: 'Calix (Administrador General)',
      username: 'Calix',
      password: 'calixdev',
      role: 'admin',
      status: 'active',
      commissionPerDelivery: 60,
      phone: '+598 99 887 766',
      createdAt: new Date().toISOString()
    });
    writeDb(db);
  } else if (adminExists.status !== 'active') {
    adminExists.status = 'active';
    adminExists.role = 'admin';
    writeDb(db);
  }
}
ensureDefaultAdmin();

// --- 1. AUTHENTICATION & STAFF MANAGEMENT ---

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Ingresa tu usuario y contraseña' });
  }

  const db = readDb();
  const user = db.employees.find(
    (e: any) => e.username.toLowerCase() === String(username).trim().toLowerCase()
  );

  if (!user || user.password !== String(password).trim()) {
    return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu usuario y contraseña.' });
  }

  const isActive = user.status === 'active' || user.status === 'approved' || user.role === 'admin';
  if (!isActive) {
    return res.status(403).json({
      error: 'Tu cuenta se encuentra pendiente de autorización por la gerencia. Una vez aprobada podrás iniciar sesión.',
      status: user.status || 'pending'
    });
  }

  const enriched = computeEmployeeStats(user, db.orders || []);
  const { password: _, ...safeUser } = enriched;
  res.json({ success: true, user: safeUser });
});

app.post('/api/auth/verify-admin-key', (req, res) => {
  const { key } = req.body;
  const db = readDb();
  const masterAdmin = (db.employees || []).find(
    (e: any) => e.username.toLowerCase() === 'calix' || e.role === 'admin'
  );
  const expectedKey = masterAdmin?.password || 'calixdev';

  if (!key || String(key).trim() !== expectedKey) {
    return res.status(401).json({
      error: 'Clave de autorización administrativa inválida.'
    });
  }

  res.json({ success: true });
});

app.post('/api/auth/register', (req, res) => {
  const { name, username, password, phone } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const db = readDb();
  const exists = db.employees.find(
    (e: any) => e.username.toLowerCase() === String(username).trim().toLowerCase()
  );

  if (exists) {
    return res.status(409).json({ error: 'Ese nombre de usuario ya está registrado en el sistema' });
  }

  const newEmp = {
    id: `emp-${Date.now().toString().slice(-6)}`,
    name: String(name).trim(),
    username: String(username).trim(),
    password: String(password).trim(),
    role: 'staff',
    status: 'pending',
    commissionPerDelivery: 60,
    phone: phone ? String(phone).trim() : '',
    createdAt: new Date().toISOString()
  };

  db.employees.push(newEmp);
  writeDb(db);

  res.status(201).json({
    success: true,
    message: 'Solicitud de alta registrada en estado PENDIENTE. La gerencia revisará tus datos para autorizar el acceso.',
    user: { id: newEmp.id, name: newEmp.name, username: newEmp.username, role: newEmp.role, status: newEmp.status }
  });
});

// Staff list with deliveries & payroll stats
app.get('/api/staff/employees', (req, res) => {
  const db = readDb();
  const enrichedEmployees = (db.employees || []).map((emp: any) =>
    computeEmployeeStats(emp, db.orders || [])
  );
  res.json({ success: true, employees: enrichedEmployees });
});

// Admin can also create an already-active employee directly
app.post('/api/staff/employees', (req, res) => {
  const { name, username, password, phone, commissionPerDelivery = 60, role = 'staff', status = 'active' } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Nombre, usuario y contraseña son obligatorios' });
  }

  const db = readDb();
  const exists = db.employees.find(
    (e: any) => e.username.toLowerCase() === String(username).trim().toLowerCase()
  );
  if (exists) {
    return res.status(409).json({ error: 'El nombre de usuario ya existe' });
  }

  const newEmp = {
    id: `emp-${Date.now().toString().slice(-6)}`,
    name: String(name).trim(),
    username: String(username).trim(),
    password: String(password).trim(),
    role: role === 'admin' ? 'admin' : 'staff',
    status: status || 'active',
    commissionPerDelivery: Number(commissionPerDelivery) || 60,
    phone: phone ? String(phone).trim() : '',
    createdAt: new Date().toISOString()
  };

  db.employees.push(newEmp);
  writeDb(db);
  res.status(201).json({ success: true, employee: computeEmployeeStats(newEmp, db.orders || []) });
});

app.patch('/api/staff/employees/:id', (req, res) => {
  const db = readDb();
  const emp = db.employees.find((e: any) => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Empleado no encontrado' });
  }

  const { status, commissionPerDelivery, name, username, password, phone, role } = req.body;
  if (status) emp.status = status;
  if (commissionPerDelivery !== undefined) emp.commissionPerDelivery = parseFloat(commissionPerDelivery);
  if (name) emp.name = String(name).trim();
  if (username && emp.username.toLowerCase() !== 'calix') emp.username = String(username).trim();
  if (password && String(password).trim().length > 0) emp.password = String(password).trim();
  if (phone !== undefined) emp.phone = String(phone).trim();
  if (role && emp.username.toLowerCase() !== 'calix') emp.role = role;

  writeDb(db);
  const enriched = computeEmployeeStats(emp, db.orders || []);
  res.json({ success: true, employee: enriched, message: 'Datos del empleado actualizados con éxito' });
});

app.delete('/api/staff/employees/:id', (req, res) => {
  const db = readDb();
  const idx = db.employees.findIndex((e: any) => e.id === req.params.id);
  if (idx < 0) {
    return res.status(404).json({ error: 'Empleado no encontrado' });
  }

  if (db.employees[idx].username.toLowerCase() === 'calix') {
    return res.status(403).json({ error: 'No se puede eliminar la cuenta maestra de Administrador' });
  }

  db.employees.splice(idx, 1);
  writeDb(db);
  res.json({ success: true, message: 'Empleado eliminado del directorio' });
});

// --- 2. ORDERS & EXCLUSIVE MUTEX LOCKING & 4-DIGIT PIN VERIFICATION ---

app.get('/api/orders', (req, res) => {
  const db = readDb();
  res.json({ success: true, orders: db.orders || [] });
});

app.get('/api/orders/:id', (req, res) => {
  const db = readDb();
  const order = db.orders.find((o: any) => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }
  res.json({ success: true, order });
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  const db = readDb();
  res.json({ success: true, settings: db.settings });
});

app.put('/api/settings', (req, res) => {
  const db = readDb();
  db.settings = { ...db.settings, ...req.body };
  writeDb(db);
  res.json({ success: true, settings: db.settings, message: 'Configuración actualizada exitosamente' });
});

app.post('/api/orders', (req, res) => {
  const db = readDb();
  const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();

  // Rate-limiting check to prevent order flooding / bots
  if (!checkRateLimit(clientIp, 8, 5 * 60 * 1000)) {
    return res.status(429).json({
      error: 'Has enviado demasiados pedidos en poco tiempo. Por seguridad contra spam, espera unos minutos.'
    });
  }

  // Check if restaurant is accepting orders
  if (db.settings && db.settings.isOpen === false) {
    return res.status(403).json({
      error: 'En este momento la cocina de Brasa & Lúpulo se encuentra en pausa. Horario de atención: ' + (db.settings.openingHours || '19:30 a 01:30 hs')
    });
  }

  const { type = 'delivery', tableNumber, customer, items, paymentMethod = 'Efectivo', notes } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'El pedido debe contener al menos un producto' });
  }

  // Customer validation
  if (!customer || !customer.name || customer.name.trim().length < 2) {
    return res.status(400).json({ error: 'Por favor ingresa un nombre válido para el pedido' });
  }

  const cleanPhone = (customer.phone || '').replace(/\D/g, '');
  if ((type === 'delivery' || type === 'takeaway') && cleanPhone.length < 8) {
    return res.status(400).json({
      error: 'Por favor ingresa un número de teléfono / WhatsApp válido (mínimo 8 dígitos).'
    });
  }

  if (type === 'delivery' && (!customer.address || customer.address.trim().length < 4)) {
    return res.status(400).json({ error: 'Por favor ingresa la dirección de entrega completa en Tacuarembó.' });
  }

  const subtotal = items.reduce((acc: number, item: any) => acc + (item.price * (item.quantity || 1)), 0);

  // Minimum order validation
  const minAmount = db.settings?.minOrderAmount || 0;
  if (type === 'delivery' && subtotal < minAmount) {
    return res.status(400).json({
      error: `El pedido mínimo para delivery es de $${minAmount} $U (Subtotal actual: $${subtotal} $U)`
    });
  }

  const deliveryFee = type === 'delivery' ? (db.settings?.deliveryFee ?? 60) : 0;
  const total = subtotal + deliveryFee;

  // Generate 4-digit secret verification PIN for delivery & takeaway orders (not needed for dine-in table orders)
  const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const orderNum = Math.floor(1000 + Math.random() * 9000);

  const newOrder = {
    id: `ORD-${orderNum}`,
    orderNumber: `#${orderNum}`,
    type,
    tableNumber: type === 'table' ? (tableNumber || 1) : undefined,
    verificationCode: type === 'table' ? undefined : verificationCode,
    assignedTo: null,
    assignedToName: null,
    claimedAt: null,
    deliveredAt: null,
    deliveryCommission: db.settings?.deliveryFee ?? 60,
    failedCodeAttempts: 0,
    isFraudBlocked: false,
    fraudReason: '',
    customer: {
      name: customer.name.trim(),
      phone: customer.phone ? customer.phone.trim() : '+598 99 000 000',
      address: type === 'delivery' ? customer.address.trim() : type === 'table' ? `Mesa #${tableNumber || 1}` : 'Retiro en Local',
      notes: notes || customer.notes || ''
    },
    items,
    subtotal,
    deliveryFee,
    total,
    status: 'received',
    paymentMethod,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    estimatedMinutes: type === 'table' ? 15 : 30,
    clientIp
  };

  // Automatically deduct beer keg levels if any tap beers were ordered
  deductKegsFromOrderItems(db, items);

  db.orders.unshift(newOrder);
  writeDb(db);

  res.status(201).json({
    success: true,
    order: newOrder,
    message: '¡Pedido registrado en tiempo real en la cocina de Brasa & Lúpulo!'
  });
});

// Atomic Mutex Lock: claim order by delivery driver or waiter
app.post('/api/orders/:id/claim', (req, res) => {
  const { employeeId, employeeName } = req.body;
  if (!employeeId || !employeeName) {
    return res.status(400).json({ error: 'Se requiere identificación de empleado' });
  }

  const db = readDb();
  const order = db.orders.find((o: any) => o.id === req.params.id || o.orderNumber === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  if (order.isFraudBlocked) {
    return res.status(403).json({
      error: 'Este pedido está BLOQUEADO por alerta de seguridad. Solo Administración puede desbloquearlo.',
      isFraudBlocked: true
    });
  }

  // Mutex Concurrency Check: reject if already claimed by another employee
  if (order.assignedTo && order.assignedTo !== employeeId) {
    return res.status(409).json({
      error: `Este pedido ya fue tomado y bloqueado por ${order.assignedToName || 'otro compañero'}.`,
      alreadyClaimed: true,
      assignedTo: order.assignedTo,
      assignedToName: order.assignedToName
    });
  }

  // Lock order to employee
  order.assignedTo = employeeId;
  order.assignedToName = employeeName;
  order.claimedAt = new Date().toISOString();

  // Attach employee's individual commission rate
  const emp = (db.employees || []).find((e: any) => e.id === employeeId);
  if (emp && emp.commissionPerDelivery !== undefined) {
    order.deliveryCommission = emp.commissionPerDelivery;
  }

  if (order.status === 'received' || order.status === 'ready') {
    order.status = order.type === 'delivery' ? 'in_transit' : 'kitchen';
  }

  writeDb(db);
  res.json({
    success: true,
    order,
    message: `¡Pedido ${order.orderNumber} asignado y bloqueado exclusivamente para ti!`
  });
});

// Deliver order with 4-digit PIN verification for Delivery & Takeaway (Table requires no PIN)
app.post('/api/orders/:id/deliver', (req, res) => {
  const { code, employeeId } = req.body;
  const db = readDb();
  const order = db.orders.find((o: any) => o.id === req.params.id || o.orderNumber === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  if (order.isFraudBlocked) {
    return res.status(403).json({
      error: 'PEDIDO BLOQUEADO: Se superó el límite de intentos de PIN. Solicita desbloqueo en Administración.',
      isFraudBlocked: true
    });
  }

  // Validate ownership: only assigned employee or admin can finalize delivery
  if (employeeId && order.assignedTo && order.assignedTo !== employeeId) {
    const caller = (db.employees || []).find((e: any) => e.id === employeeId);
    if (!caller || caller.role !== 'admin') {
      return res.status(403).json({
        error: `Acción no autorizada: Este pedido está bloqueado por ${order.assignedToName}.`
      });
    }
  }

  // PIN Verification required for Delivery and Takeaway orders (Table orders do not require PIN)
  if (order.type === 'delivery' || order.type === 'takeaway') {
    const expectedCode = String(order.verificationCode || '4921').trim();
    const submittedCode = String(code || '').trim();

    if (!submittedCode || submittedCode !== expectedCode) {
      order.failedCodeAttempts = (order.failedCodeAttempts || 0) + 1;
      const maxAttempts = db.settings?.maxFailedCodeAttempts || 3;

      if (order.failedCodeAttempts >= maxAttempts) {
        order.isFraudBlocked = true;
        order.status = 'fraud_alert';
        order.fraudReason = `Alerta de Seguridad: Se superaron los ${maxAttempts} intentos de PIN fallidos.`;
        writeDb(db);

        return res.status(403).json({
          error: `ALERTA DE SEGURIDAD: Superaste los ${maxAttempts} intentos permitidos. El pedido ha sido BLOQUEADO por seguridad.`,
          isFraudBlocked: true,
          failedCodeAttempts: order.failedCodeAttempts
        });
      }

      writeDb(db);
      const remaining = maxAttempts - order.failedCodeAttempts;
      return res.status(400).json({
        error: `PIN incorrecto. Solicita al cliente el código PIN de 4 dígitos de su seguimiento. Intentos restantes: ${remaining}.`,
        remainingAttempts: remaining
      });
    }
  }

  // Delivery verified & finalized
  order.status = 'delivered';
  order.deliveredAt = new Date().toISOString();
  order.failedCodeAttempts = 0;
  if (employeeId && !order.assignedTo) {
    order.assignedTo = employeeId;
    const emp = (db.employees || []).find((e: any) => e.id === employeeId);
    if (emp) {
      order.assignedToName = emp.name;
      order.deliveryCommission = emp.commissionPerDelivery || 60;
    }
  }

  writeDb(db);
  res.json({
    success: true,
    order,
    message: '¡Entrega verificada y acreditada en tu liquidación del día!'
  });
});

// Admin unblock order flagged by fraud alert
app.post('/api/orders/:id/unblock-fraud', (req, res) => {
  const db = readDb();
  const order = db.orders.find((o: any) => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  order.isFraudBlocked = false;
  order.failedCodeAttempts = 0;
  order.fraudReason = '';
  order.status = order.type === 'delivery' ? 'in_transit' : 'kitchen';

  writeDb(db);
  res.json({ success: true, order, message: 'Pedido desbloqueado por Administración' });
});

app.patch('/api/orders/:id/status', (req, res) => {
  const db = readDb();
  const { status, assignedTo, assignedToName } = req.body;
  const order = db.orders.find((o: any) => o.id === req.params.id || o.orderNumber === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  if (status) order.status = status;
  if (assignedTo !== undefined) order.assignedTo = assignedTo;
  if (assignedToName !== undefined) order.assignedToName = assignedToName;
  if (status === 'delivered' && !order.deliveredAt) {
    order.deliveredAt = new Date().toISOString();
  }

  writeDb(db);
  res.json({ success: true, order, message: `Estado actualizado a: ${status}` });
});

// --- 3. MENU CMS (ADMIN) ---

app.get('/api/menu', (req, res) => {
  const db = readDb();
  res.json({ success: true, items: db.menu || [] });
});

app.post('/api/menu', (req, res) => {
  const db = readDb();
  const { name, category, price, description, image, badge, available, isPopular, isSpicy, isVeggie, isGlutenFree, cookingTime, ingredients, pairingSuggestion } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Nombre, precio y categoría son obligatorios' });
  }

  const newItem = {
    id: `item-${Date.now()}`,
    name: name.trim(),
    category,
    price: parseFloat(price),
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    badge: badge || '',
    available: available !== undefined ? Boolean(available) : true,
    cookingTime: cookingTime || '12-15 min',
    isPopular: Boolean(isPopular),
    isSpicy: Boolean(isSpicy),
    isVeggie: Boolean(isVeggie),
    isGlutenFree: Boolean(isGlutenFree),
    ingredients: Array.isArray(ingredients) ? ingredients : (ingredients || '').split(',').map((s: string) => s.trim()).filter(Boolean),
    pairingSuggestion: pairingSuggestion || ''
  };

  db.menu.push(newItem);
  writeDb(db);
  res.status(201).json({ success: true, item: newItem, message: 'Plato añadido a la carta' });
});

app.put('/api/menu/:id', (req, res) => {
  const db = readDb();
  const item = db.menu.find((i: any) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Plato no encontrado' });
  }

  const { name, category, price, description, image, badge, available, cookingTime, isPopular, isSpicy, isVeggie, isGlutenFree, ingredients, pairingSuggestion } = req.body;
  if (name) item.name = name.trim();
  if (category) item.category = category;
  if (price !== undefined) item.price = parseFloat(price);
  if (description !== undefined) item.description = description;
  if (image) item.image = image;
  if (badge !== undefined) item.badge = badge;
  if (available !== undefined) item.available = Boolean(available);
  if (cookingTime !== undefined) item.cookingTime = cookingTime;
  if (isPopular !== undefined) item.isPopular = isPopular;
  if (isSpicy !== undefined) item.isSpicy = isSpicy;
  if (isVeggie !== undefined) item.isVeggie = isVeggie;
  if (isGlutenFree !== undefined) item.isGlutenFree = isGlutenFree;
  if (ingredients !== undefined) {
    item.ingredients = Array.isArray(ingredients) ? ingredients : ingredients.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (pairingSuggestion !== undefined) item.pairingSuggestion = pairingSuggestion;

  writeDb(db);
  res.json({ success: true, item, message: 'Plato actualizado con éxito' });
});

app.delete('/api/menu/:id', (req, res) => {
  const db = readDb();
  const idx = db.menu.findIndex((i: any) => i.id === req.params.id);
  if (idx < 0) {
    return res.status(404).json({ error: 'Plato no encontrado' });
  }
  db.menu.splice(idx, 1);
  writeDb(db);
  res.json({ success: true, message: 'Plato eliminado de la carta' });
});

// --- 4. PROMOTIONS CMS (ADMIN) ---

app.get('/api/promos', (req, res) => {
  const db = readDb();
  res.json({ success: true, promos: db.promos || [] });
});

app.post('/api/promos', (req, res) => {
  const db = readDb();
  const { title, subtitle, description, priceNow, priceOld, discount, pill, image, badge, active } = req.body;

  if (!title || !priceNow) {
    return res.status(400).json({ error: 'Título y precio son obligatorios' });
  }

  const newPromo = {
    id: `promo-${Date.now()}`,
    title: title.trim(),
    subtitle: subtitle || '',
    description: description || '',
    priceNow: parseFloat(priceNow),
    priceOld: priceOld ? parseFloat(priceOld) : Math.round(parseFloat(priceNow) * 1.3),
    discount: discount || 'Oferta',
    pill: pill || 'Promoción',
    image: image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    badge: badge || 'Disponible',
    active: active !== undefined ? Boolean(active) : true
  };

  db.promos.push(newPromo);
  writeDb(db);
  res.status(201).json({ success: true, promo: newPromo, message: 'Promoción creada' });
});

app.put('/api/promos/:id', (req, res) => {
  const db = readDb();
  const promo = db.promos.find((p: any) => p.id === req.params.id);
  if (!promo) {
    return res.status(404).json({ error: 'Promoción no encontrada' });
  }

  Object.assign(promo, req.body);
  writeDb(db);
  res.json({ success: true, promo, message: 'Promoción actualizada' });
});

app.delete('/api/promos/:id', (req, res) => {
  const db = readDb();
  const idx = db.promos.findIndex((p: any) => p.id === req.params.id);
  if (idx < 0) {
    return res.status(404).json({ error: 'Promoción no encontrada' });
  }
  db.promos.splice(idx, 1);
  writeDb(db);
  res.json({ success: true, message: 'Promoción eliminada' });
});

// --- 5. TAPS, WAITER CALLS, RESERVATIONS, REVIEWS & SOMMELIER ---

app.get('/api/taps', (req, res) => {
  const db = readDb();
  res.json({ success: true, taps: db.taps || [] });
});

app.post('/api/taps', (req, res) => {
  const db = readDb();
  const { name, brewery, style, abv, ibu, temperature, kegPercentage, pricePinta, priceGrowler, status, color, tastingNotes, foodPairing } = req.body;

  if (!name || !pricePinta) {
    return res.status(400).json({ error: 'Nombre de cerveza y precio son requeridos' });
  }

  const nextTapNum = (db.taps && db.taps.length > 0)
    ? Math.max(...db.taps.map((t: any) => t.tapNumber || 0)) + 1
    : 1;

  const newTap = {
    id: `tap-${Date.now()}`,
    tapNumber: req.body.tapNumber || nextTapNum,
    name: name.trim(),
    brewery: brewery ? brewery.trim() : 'Brasa & Lúpulo Brewing Co.',
    style: style ? style.trim() : 'Craft Beer',
    abv: parseFloat(abv) || 5.0,
    ibu: parseInt(ibu, 10) || 20,
    temperature: temperature || '3.0°C',
    kegPercentage: kegPercentage !== undefined ? parseInt(kegPercentage, 10) : 100,
    pricePinta: parseFloat(pricePinta),
    priceGrowler: priceGrowler ? parseFloat(priceGrowler) : Math.round(parseFloat(pricePinta) * 2.7),
    status: status || 'activa',
    color: color || 'dorado-ambar',
    tastingNotes: Array.isArray(tastingNotes) ? tastingNotes : (tastingNotes || '').split(',').map((s: string) => s.trim()).filter(Boolean),
    foodPairing: foodPairing || 'Ideal con hamburguesas smash'
  };

  db.taps.push(newTap);
  writeDb(db);
  res.status(201).json({ success: true, tap: newTap, message: 'Canilla de cerveza agregada a la pizarra' });
});

app.put('/api/taps/:id', (req, res) => {
  const db = readDb();
  const tap = db.taps.find((t: any) => t.id === req.params.id);
  if (!tap) {
    return res.status(404).json({ error: 'Canilla no encontrada' });
  }

  const { name, brewery, style, abv, ibu, temperature, kegPercentage, pricePinta, priceGrowler, status, color, tastingNotes, foodPairing, tapNumber } = req.body;
  if (name) tap.name = name.trim();
  if (brewery) tap.brewery = brewery.trim();
  if (style) tap.style = style.trim();
  if (abv !== undefined) tap.abv = parseFloat(abv);
  if (ibu !== undefined) tap.ibu = parseInt(ibu, 10);
  if (temperature) tap.temperature = temperature;
  if (kegPercentage !== undefined) tap.kegPercentage = Math.min(100, Math.max(0, parseInt(kegPercentage, 10)));
  if (pricePinta !== undefined) tap.pricePinta = parseFloat(pricePinta);
  if (priceGrowler !== undefined) tap.priceGrowler = parseFloat(priceGrowler);
  if (status) tap.status = status;
  if (color) tap.color = color;
  if (tapNumber !== undefined) tap.tapNumber = parseInt(tapNumber, 10);
  if (tastingNotes !== undefined) {
    tap.tastingNotes = Array.isArray(tastingNotes) ? tastingNotes : tastingNotes.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (foodPairing !== undefined) tap.foodPairing = foodPairing;

  writeDb(db);
  res.json({ success: true, tap, message: 'Canilla actualizada en la pizarra' });
});

app.delete('/api/taps/:id', (req, res) => {
  const db = readDb();
  const idx = db.taps.findIndex((t: any) => t.id === req.params.id);
  if (idx < 0) {
    return res.status(404).json({ error: 'Canilla no encontrada' });
  }
  db.taps.splice(idx, 1);
  writeDb(db);
  res.json({ success: true, message: 'Canilla eliminada de la pizarra' });
});

// Staff / Bar dispatch pour from keg
app.post('/api/taps/:id/pour', (req, res) => {
  const db = readDb();
  const tap = db.taps.find((t: any) => t.id === req.params.id);
  if (!tap) return res.status(404).json({ error: 'Canilla no encontrada' });
  const amount = req.body?.size === 'growler' ? 5 : 2;
  tap.kegPercentage = Math.max(0, tap.kegPercentage - amount);
  if (tap.kegPercentage <= 20) tap.status = 'ultimas_pintas';
  writeDb(db);
  res.json({ success: true, tap, message: 'Despacho de barra registrado en el barril' });
});

// Admin / Staff reload keg to 100%
app.post('/api/taps/:id/refill', (req, res) => {
  const db = readDb();
  const tap = db.taps.find((t: any) => t.id === req.params.id);
  if (!tap) return res.status(404).json({ error: 'Canilla no encontrada' });
  tap.kegPercentage = 100;
  tap.status = 'activa';
  writeDb(db);
  res.json({ success: true, tap, message: `Barril de ${tap.name} recargado al 100%` });
});

// Waiter / Table Calls (Real-time alerts for Mozos & Staff)
app.get('/api/table/call-waiter', (req, res) => {
  const db = readDb();
  res.json({ success: true, calls: db.waiterCalls || [] });
});

app.post('/api/table/call-waiter', (req, res) => {
  const db = readDb();
  const { tableNumber = 1, reason = 'Llamado al Mozo', customerName = '' } = req.body;
  const newCall = {
    id: `CALL-${Date.now().toString().slice(-5)}`,
    tableNumber: Number(tableNumber) || 1,
    reason,
    customerName,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.waiterCalls.unshift(newCall);
  writeDb(db);
  res.status(201).json({
    success: true,
    call: newCall,
    message: `¡Aviso enviado al personal de salón para la Mesa #${tableNumber}!`
  });
});

app.post('/api/table/call-waiter/:id/attend', (req, res) => {
  const db = readDb();
  const call = (db.waiterCalls || []).find((c: any) => c.id === req.params.id);
  if (!call) return res.status(404).json({ error: 'Alerta de mesa no encontrada' });
  call.status = 'attended';
  call.attendedBy = req.body?.employeeName || 'Personal de Salón';
  writeDb(db);
  res.json({ success: true, call, message: `Mesa #${call.tableNumber} marcada como atendida` });
});

app.get('/api/reservations', (req, res) => {
  const db = readDb();
  res.json({ success: true, reservations: db.reservations || [] });
});

app.post('/api/reservations', (req, res) => {
  const db = readDb();
  const { name, phone, email, date, time, guests, zone, occasion, notes } = req.body;
  if (!name || !phone || !date || !time) {
    return res.status(400).json({ error: 'Campos requeridos incompletos' });
  }

  const resNum = Math.floor(100 + Math.random() * 900);
  const newReservation = {
    id: `RES-${resNum}`,
    resNumber: `#RES-${resNum}`,
    name,
    phone,
    email: email || '',
    date,
    time,
    guests: parseInt(guests || '2', 10),
    zone: zone || 'Patio Cervecero',
    occasion: occasion || 'Casual / Amigos',
    status: 'confirmed',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  db.reservations.unshift(newReservation);
  writeDb(db);
  res.status(201).json({ success: true, reservation: newReservation });
});

app.get('/api/reviews', (req, res) => {
  const db = readDb();
  res.json({ success: true, reviews: db.reviews || [] });
});

app.post('/api/reviews', (req, res) => {
  const db = readDb();
  const { name, rating, dish, comment } = req.body;
  if (!name || !comment) return res.status(400).json({ error: 'Datos incompletos' });

  const newReview = {
    id: `rev-${Date.now()}`,
    name,
    rating: Math.min(5, Math.max(1, parseInt(rating || '5', 10))),
    date: 'Reciente',
    dish: dish || 'Experiencia General',
    comment,
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
  };

  db.reviews.unshift(newReview);
  writeDb(db);
  res.status(201).json({ success: true, review: newReview });
});

app.post('/api/ai/sommelier', async (req, res) => {
  try {
    const { userPreference, selectedDish } = req.body;
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({
        success: true,
        recommendation: {
          beerName: 'Furia Citra IPA (Tap 1)',
          dishName: selectedDish || 'Smash Brasa Doble Cheddar',
          whyItWorks: 'El amargor lupulado y los aromas cítricos cortan la untuosidad del queso cheddar fundido y la panceta crocante, limpiando el paladar en cada bocado.',
          tastingNotes: ['Cítrico', 'Lúpulo fresco', 'Contraste de grasas perfecto'],
          servingTemp: '2.8°C en vaso pinta cervecera helada'
        }
      });
    }

    const systemInstruction = `Eres el Maestro Cervecero y Sommelier de "Brasa & Lúpulo" en Tacuarembó, Uruguay.
Responde en formato JSON con:
- beerName: nombre de la cerveza de las 8 canillas
- dishName: nombre de la smash burger o pizza sugerida
- whyItWorks: explicación apasionada y culinaria (2 oraciones)
- tastingNotes: array de 3 notas de cata
- servingTemp: temperatura y vaso ideal`;

    const promptText = `Preferencia: "${userPreference || 'Quiero algo sabroso con buen queso y buena birra'}". Plato considerado: "${selectedDish || 'Cualquiera'}".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, recommendation: parsed });
  } catch (err: any) {
    res.json({
      success: true,
      recommendation: {
        beerName: 'Roble & Malta Scottish (Tap 3)',
        dishName: 'Pizza Pepperoni & Miel Picante',
        whyItWorks: 'Las notas a caramelo toffee de la Scottish equilibran el toque picante de la miel y el crocante del horno de leña.',
        tastingNotes: ['Toffee acaramelado', 'Picor balanceado', 'Piso de piedra'],
        servingTemp: '3.5°C en copa cervecera'
      }
    });
  }
});

// Setup Vite dev server or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Brasa & Lúpulo] Servidor POS en ejecución en http://0.0.0.0:${port}`);
  });
}

startServer();
