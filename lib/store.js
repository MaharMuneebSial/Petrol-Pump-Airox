// lib/store.js - Supabase-backed data management

import { supabase } from './supabase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getCompanyId = () => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('ps_company'))?.id || null;
  } catch {
    return null;
  }
};

// Unit mapping: display value → Supabase enum
const unitToDb = (unit) => {
  const map = { 'Ltr': 'ltr', 'Kg': 'kg', 'Cubic Meter': 'cubic_meter', 'Unit': 'unit' };
  return map[unit] || unit;
};

// Unit mapping: Supabase enum → display value
const unitFromDb = (unit) => {
  const map = { 'ltr': 'Ltr', 'kg': 'Kg', 'cubic_meter': 'Cubic Meter', 'unit': 'Unit' };
  return map[unit] || unit;
};

// ─── Company / Auth ──────────────────────────────────────────────────────────

export const getCompany = () => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('ps_company');
  return data ? JSON.parse(data) : null;
};

export const saveCompany = (company) => {
  localStorage.setItem('ps_company', JSON.stringify(company));
};

export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('ps_session');
};

export const getRole = () => {
  if (typeof window === 'undefined') return null;
  return getCompany()?.role || null;
};

export const isOwner = () => getRole() === 'owner';
export const isManager = () => getRole() === 'manager';
export const isCashier = () => getRole() === 'cashier';

export const setSession = (pumpCode) => {
  localStorage.setItem('ps_session', JSON.stringify({ pumpCode, loginAt: new Date().toISOString() }));
};

export const clearSession = () => {
  localStorage.removeItem('ps_session');
  localStorage.removeItem('ps_company');
};

// ─── Activity Logging ─────────────────────────────────────────────────────────

export const logActivity = async ({ action, entity, entityId, description, meta = {} }) => {
  try {
    const company_id = getCompanyId();
    const company = getCompany();
    if (!company_id || !company) return;
    await supabase.from('activity_logs').insert({
      company_id,
      performed_by: company.staffName || company.ownerName || company.businessName || 'Owner',
      role: company.role || 'owner',
      staff_id: company.staffId || null,
      action,
      entity,
      entity_id: entityId ? String(entityId) : null,
      description,
      meta,
    });
  } catch (err) {
    console.error('logActivity error:', err);
  }
};

export const getActivityLogs = async () => {
  const company_id = getCompanyId();
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) { console.error('getActivityLogs error:', error); return []; }
  return data || [];
};

// ─── Accounts ────────────────────────────────────────────────────────────────

const mapAccount = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type
    ? row.type.charAt(0).toUpperCase() + row.type.slice(1)
    : 'Other',
  phone: row.phone || '',
  address: row.address || '',
  openingBalance: parseFloat(row.opening_balance || 0),
  currentBalance: parseFloat(row.current_balance || 0),
  notes: row.notes || '',
  is_active: row.is_active,
});

export const getAccounts = async () => {
  const company_id = getCompanyId();
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('company_id', company_id)
    .order('name');
  if (error) { console.error('getAccounts error:', error); return []; }
  return (data || []).map(mapAccount);
};

export const getAccountById = async (id) => {
  console.log('[getAccountById] id:', id);
  const accounts = await getAccounts();
  console.log('[getAccountById] accounts fetched:', accounts.length, accounts.map(a => a.id));
  return accounts.find(a => String(a.id) === String(id)) || null;
};

export const addAccount = async (account) => {
  const company_id = getCompanyId();
  if (!company_id) return null;
  const openingBalance = parseFloat(account.openingBalance || 0);
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      company_id,
      name: account.name,
      type: (account.type || 'other').toLowerCase(),
      phone: account.phone || null,
      address: account.address || null,
      opening_balance: openingBalance,
      current_balance: openingBalance,
      notes: account.notes || null,
    })
    .select()
    .single();
  if (error) { console.error('addAccount error:', error); return null; }
  await logActivity({ action: 'add', entity: 'account', entityId: data.id, description: `Added account: ${account.name} (${account.type})`, meta: { name: account.name, type: account.type } });
  return mapAccount(data);
};

export const updateAccount = async (id, updates) => {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.type !== undefined) dbUpdates.type = (updates.type || '').toLowerCase();
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.openingBalance !== undefined) dbUpdates.opening_balance = updates.openingBalance;
  if (updates.currentBalance !== undefined) dbUpdates.current_balance = updates.currentBalance;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase
    .from('accounts')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) { console.error('updateAccount error:', error); return null; }
  await logActivity({ action: 'edit', entity: 'account', entityId: id, description: `Edited account: ${data.name}`, meta: { name: data.name, type: data.type } });
  return mapAccount(data);
};

export const deleteAccount = async (id) => {
  const { data: acc } = await supabase.from('accounts').select('name, type').eq('id', id).single();
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) { console.error('deleteAccount error:', error); return; }
  await logActivity({ action: 'delete', entity: 'account', entityId: id, description: `Deleted account: ${acc?.name || 'Unknown'} (${acc?.type || ''})`, meta: { name: acc?.name, type: acc?.type } });
};

// ─── Products ────────────────────────────────────────────────────────────────

const mapProduct = (row) => ({
  id: row.id,
  name: row.name,
  unit: unitFromDb(row.unit),
  stock: parseFloat(row.current_stock || 0),
  rate: parseFloat(row.selling_rate || 0),
  purchaseRate: parseFloat(row.purchase_rate || 0),
  hsnCode: row.hsn_code || '',
  is_active: row.is_active,
});

export const getProducts = async () => {
  const company_id = getCompanyId();
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('company_id', company_id)
    .order('name');
  if (error) { console.error('getProducts error:', error); return []; }
  return (data || []).map(mapProduct);
};

export const addProduct = async (product) => {
  const company_id = getCompanyId();
  if (!company_id) return null;
  const { data, error } = await supabase
    .from('products')
    .insert({
      company_id,
      name: product.name,
      unit: unitToDb(product.unit || 'Ltr'),
      current_stock: parseFloat(product.stock || 0),
      selling_rate: parseFloat(product.rate || 0),
      purchase_rate: parseFloat(product.purchaseRate || 0),
      hsn_code: product.hsnCode || null,
    })
    .select()
    .single();
  if (error) { console.error('addProduct error:', error); return null; }
  await logActivity({ action: 'add', entity: 'product', entityId: data.id, description: `Added product: ${product.name}`, meta: { name: product.name, unit: product.unit } });
  return mapProduct(data);
};

export const updateProduct = async (id, updates) => {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.unit !== undefined) dbUpdates.unit = unitToDb(updates.unit);
  if (updates.stock !== undefined) dbUpdates.current_stock = parseFloat(updates.stock);
  if (updates.rate !== undefined) dbUpdates.selling_rate = parseFloat(updates.rate);
  if (updates.purchaseRate !== undefined) dbUpdates.purchase_rate = parseFloat(updates.purchaseRate);
  if (updates.hsnCode !== undefined) dbUpdates.hsn_code = updates.hsnCode;

  const { data, error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) { console.error('updateProduct error:', error); return null; }
  await logActivity({ action: 'edit', entity: 'product', entityId: id, description: `Edited product: ${data.name}`, meta: { name: data.name } });
  return mapProduct(data);
};

export const deleteProduct = async (id) => {
  const { data: prod } = await supabase.from('products').select('name').eq('id', id).single();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) { console.error('deleteProduct error:', error); return; }
  await logActivity({ action: 'delete', entity: 'product', entityId: id, description: `Deleted product: ${prod?.name || 'Unknown'}`, meta: { name: prod?.name } });
};

// ─── Machines ────────────────────────────────────────────────────────────────

const mapMachine = (row) => ({
  id: row.id,
  name: row.name,
  machineNo: row.machine_no,
  productId: row.product_id,
  nozzleCount: row.nozzle_count,
  is_active: row.is_active,
});

export const getMachines = async () => {
  const company_id = getCompanyId();
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('company_id', company_id)
    .order('name');
  if (error) { console.error('getMachines error:', error); return []; }
  return (data || []).map(mapMachine);
};

export const addMachine = async (machine) => {
  const company_id = getCompanyId();
  if (!company_id) return null;
  const { data, error } = await supabase
    .from('machines')
    .insert({
      company_id,
      name: machine.name,
      machine_no: machine.machineNo,
      product_id: machine.productId,
      nozzle_count: parseInt(machine.nozzleCount || 2),
    })
    .select()
    .single();
  if (error) { console.error('addMachine error:', error); return null; }
  return mapMachine(data);
};

export const updateMachine = async (id, updates) => {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.machineNo !== undefined) dbUpdates.machine_no = updates.machineNo;
  if (updates.productId !== undefined) dbUpdates.product_id = updates.productId;
  if (updates.nozzleCount !== undefined) dbUpdates.nozzle_count = parseInt(updates.nozzleCount);

  const { data, error } = await supabase
    .from('machines')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) { console.error('updateMachine error:', error); return null; }
  return mapMachine(data);
};

export const deleteMachine = async (id) => {
  const { error } = await supabase.from('machines').delete().eq('id', id);
  if (error) console.error('deleteMachine error:', error);
};

// ─── Purchases ───────────────────────────────────────────────────────────────

const mapPurchase = (row) => ({
  id: row.id,
  date: row.purchase_date,
  productId: row.product_id,
  supplierId: row.account_id || null,
  quantity: parseFloat(row.quantity || 0),
  rate: parseFloat(row.rate || 0),
  total: parseFloat(row.total_amount || 0),
  paymentMode: row.payment_mode || 'cash',
  invoiceNo: row.invoice_no || '',
  note: row.note || '',
});

export const getPurchases = async () => {
  const company_id = getCompanyId();
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('company_id', company_id)
    .order('purchase_date', { ascending: false });
  if (error) { console.error('getPurchases error:', error); return []; }
  return (data || []).map(mapPurchase);
};

export const addPurchase = async (purchase) => {
  const company_id = getCompanyId();
  if (!company_id) return null;

  const quantity = parseFloat(purchase.quantity || 0);
  const rate = parseFloat(purchase.rate || 0);
  const total = parseFloat(purchase.total || (quantity * rate));

  const { data, error } = await supabase
    .from('purchases')
    .insert({
      company_id,
      purchase_date: purchase.date || new Date().toISOString().split('T')[0],
      product_id: purchase.productId,
      account_id: purchase.supplierId || null,
      quantity,
      rate,
      total_amount: total,
      payment_mode: purchase.paymentMode || 'cash',
      invoice_no: purchase.invoiceNo || null,
      note: purchase.note || null,
    })
    .select()
    .single();
  if (error) { console.error('addPurchase error:', error.message, error.details, error.hint); return null; }

  // Update product stock
  let productName = 'Unknown';
  if (purchase.productId) {
    const { data: prod } = await supabase
      .from('products')
      .select('current_stock, name')
      .eq('id', purchase.productId)
      .single();
    if (prod) {
      productName = prod.name || 'Unknown';
      await supabase
        .from('products')
        .update({
          current_stock: parseFloat(prod.current_stock || 0) + quantity,
          purchase_rate: rate,
        })
        .eq('id', purchase.productId);
    }
  }

  // Update supplier balance
  let supplierName = '';
  if (purchase.supplierId) {
    const { data: acc } = await supabase
      .from('accounts')
      .select('current_balance, name')
      .eq('id', purchase.supplierId)
      .single();
    if (acc) {
      supplierName = acc.name || '';
      await supabase
        .from('accounts')
        .update({ current_balance: parseFloat(acc.current_balance || 0) + total })
        .eq('id', purchase.supplierId);
    }
  }

  await logActivity({ action: 'add', entity: 'purchase', entityId: data.id, description: `Added purchase: ${quantity} ${productName}${supplierName ? ' from ' + supplierName : ''} · Rs. ${total}`, meta: { productId: purchase.productId, supplierId: purchase.supplierId, quantity, rate, total } });
  return mapPurchase(data);
};

export const updatePurchase = async (id, updates) => {
  // Fetch existing record so we can reverse its effects
  const { data: old } = await supabase.from('purchases').select('*').eq('id', id).single();
  if (!old) return null;

  const newQty       = updates.quantity   !== undefined ? parseFloat(updates.quantity)  : parseFloat(old.quantity);
  const newRate      = updates.rate       !== undefined ? parseFloat(updates.rate)       : parseFloat(old.rate);
  const newTotal     = parseFloat(updates.total || (newQty * newRate));
  const newProductId = updates.productId  !== undefined ? updates.productId             : old.product_id;
  const newSupplId   = updates.supplierId !== undefined ? (updates.supplierId || null)  : (old.account_id || null);

  const dbUpdates = { total_amount: newTotal };
  if (updates.date        !== undefined) dbUpdates.purchase_date = updates.date;
  if (updates.productId   !== undefined) dbUpdates.product_id    = updates.productId;
  if (updates.supplierId  !== undefined) dbUpdates.account_id    = updates.supplierId || null;
  if (updates.quantity    !== undefined) dbUpdates.quantity       = newQty;
  if (updates.rate        !== undefined) dbUpdates.rate           = newRate;
  if (updates.paymentMode !== undefined) dbUpdates.payment_mode  = updates.paymentMode;
  if (updates.invoiceNo   !== undefined) dbUpdates.invoice_no    = updates.invoiceNo || null;
  if (updates.note        !== undefined) dbUpdates.note          = updates.note || null;

  // Reverse old stock
  if (old.product_id) {
    const { data: prod } = await supabase.from('products').select('current_stock').eq('id', old.product_id).single();
    if (prod) await supabase.from('products').update({ current_stock: parseFloat(prod.current_stock) - parseFloat(old.quantity) }).eq('id', old.product_id);
  }
  // Reverse old supplier balance
  if (old.account_id) {
    const { data: acc } = await supabase.from('accounts').select('current_balance').eq('id', old.account_id).single();
    if (acc) await supabase.from('accounts').update({ current_balance: parseFloat(acc.current_balance) - parseFloat(old.total_amount) }).eq('id', old.account_id);
  }

  const { data, error } = await supabase.from('purchases').update(dbUpdates).eq('id', id).select().single();
  if (error) { console.error('updatePurchase error:', error); return null; }

  // Apply new stock
  let productName = 'Unknown';
  if (newProductId) {
    const { data: prod } = await supabase.from('products').select('current_stock, name').eq('id', newProductId).single();
    if (prod) {
      productName = prod.name || 'Unknown';
      await supabase.from('products').update({ current_stock: parseFloat(prod.current_stock) + newQty, purchase_rate: newRate }).eq('id', newProductId);
    }
  }
  // Apply new supplier balance
  let supplierName = '';
  if (newSupplId) {
    const { data: acc } = await supabase.from('accounts').select('current_balance, name').eq('id', newSupplId).single();
    if (acc) {
      supplierName = acc.name || '';
      await supabase.from('accounts').update({ current_balance: parseFloat(acc.current_balance) + newTotal }).eq('id', newSupplId);
    }
  }

  await logActivity({ action: 'edit', entity: 'purchase', entityId: id, description: `Edited purchase: ${productName}${supplierName ? ' from ' + supplierName : ''} · Rs. ${newTotal}`, meta: { productId: newProductId, supplierId: newSupplId, qty: newQty, rate: newRate, total: newTotal } });
  return mapPurchase(data);
};

export const deletePurchase = async (id) => {
  // Fetch purchase before deleting so we can reverse stock and supplier balance
  const { data: purchase } = await supabase
    .from('purchases')
    .select('product_id, account_id, quantity, total_amount')
    .eq('id', id)
    .single();

  // Fetch names for logging
  let productName = 'Unknown', supplierName = '';
  if (purchase?.product_id) {
    const { data: p } = await supabase.from('products').select('name').eq('id', purchase.product_id).single();
    if (p) productName = p.name;
  }
  if (purchase?.account_id) {
    const { data: a } = await supabase.from('accounts').select('name').eq('id', purchase.account_id).single();
    if (a) supplierName = a.name;
  }

  const { error } = await supabase.from('purchases').delete().eq('id', id);
  if (error) { console.error('deletePurchase error:', error); return; }

  if (purchase) {
    // Reverse product stock
    if (purchase.product_id) {
      const { data: prod } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', purchase.product_id)
        .single();
      if (prod) {
        await supabase
          .from('products')
          .update({ current_stock: parseFloat(prod.current_stock || 0) - parseFloat(purchase.quantity || 0) })
          .eq('id', purchase.product_id);
      }
    }

    // Reverse supplier balance
    if (purchase.account_id) {
      const { data: acc } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('id', purchase.account_id)
        .single();
      if (acc) {
        await supabase
          .from('accounts')
          .update({ current_balance: parseFloat(acc.current_balance || 0) - parseFloat(purchase.total_amount || 0) })
          .eq('id', purchase.account_id);
      }
    }
  }
  await logActivity({ action: 'delete', entity: 'purchase', entityId: id, description: `Deleted purchase: ${parseFloat(purchase?.quantity || 0)} ${productName}${supplierName ? ' from ' + supplierName : ''} · Rs. ${parseFloat(purchase?.total_amount || 0)}`, meta: { productId: purchase?.product_id, supplierId: purchase?.account_id, quantity: purchase?.quantity, total: purchase?.total_amount } });
};

// ─── Sales ───────────────────────────────────────────────────────────────────

const mapSale = (row) => ({
  id: row.id,
  date: row.sale_date,
  productId: row.product_id,
  customerId: row.account_id || null,
  quantity: parseFloat(row.quantity || 0),
  rate: parseFloat(row.rate || 0),
  total: parseFloat(row.total_amount || 0),
  paymentMode: row.payment_mode || 'cash',
  note: row.note || '',
});

export const getSales = async () => {
  const company_id = getCompanyId();
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('company_id', company_id)
    .order('sale_date', { ascending: false });
  if (error) { console.error('getSales error:', error); return []; }
  return (data || []).map(mapSale);
};

export const addSale = async (sale) => {
  const company_id = getCompanyId();
  if (!company_id) return null;

  const quantity = parseFloat(sale.quantity || 0);
  const rate = parseFloat(sale.rate || 0);
  const total = parseFloat(sale.total || (quantity * rate));

  // sale.payments = [{mode, amount, customerId?}] for split; null for simple
  const payments = sale.payments || null;
  const isSplit = payments && payments.filter(p => parseFloat(p.amount) > 0).length > 1;
  const finalMode = isSplit ? 'split' : (sale.paymentMode || 'cash');

  const { data, error } = await supabase
    .from('sales')
    .insert({
      company_id,
      sale_date: sale.date || new Date().toISOString().split('T')[0],
      product_id: sale.productId,
      account_id: sale.customerId || null,
      quantity,
      rate,
      total_amount: total,
      payment_mode: finalMode,
      note: sale.note || null,
    })
    .select()
    .single();
  if (error) { console.error('addSale error:', error); return null; }

  // Insert individual payment breakdown rows (for split or for record-keeping)
  if (payments && payments.length > 0) {
    const paymentRows = payments
      .filter(p => parseFloat(p.amount) > 0)
      .map(p => ({
        company_id,
        sale_id: data.id,
        payment_mode: p.mode,
        amount: parseFloat(p.amount),
        account_id: p.customerId || null,
        meta: p.meta || null,
      }));
    if (paymentRows.length) {
      const { error: spErr } = await supabase.from('sale_payments').insert(paymentRows);
      if (spErr) console.error('sale_payments insert error:', spErr);
    }
  }

  // Update product stock
  let saleProductName = 'Unknown';
  if (sale.productId) {
    const { data: prod } = await supabase
      .from('products')
      .select('current_stock, name')
      .eq('id', sale.productId)
      .single();
    if (prod) {
      saleProductName = prod.name || 'Unknown';
      await supabase
        .from('products')
        .update({ current_stock: parseFloat(prod.current_stock || 0) - quantity })
        .eq('id', sale.productId);
    }
  }

  // Update customer balance
  if (isSplit) {
    // Only the credit portion goes to the customer's balance
    const creditAmt = payments
      .filter(p => p.mode === 'credit')
      .reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    if (creditAmt > 0 && sale.customerId) {
      const { data: acc } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('id', sale.customerId)
        .single();
      if (acc) {
        await supabase
          .from('accounts')
          .update({ current_balance: parseFloat(acc.current_balance || 0) + creditAmt })
          .eq('id', sale.customerId);
      }
    }
  } else if (sale.customerId && finalMode === 'credit') {
    const { data: acc } = await supabase
      .from('accounts')
      .select('current_balance')
      .eq('id', sale.customerId)
      .single();
    if (acc) {
      await supabase
        .from('accounts')
        .update({ current_balance: parseFloat(acc.current_balance || 0) + total })
        .eq('id', sale.customerId);
    }
  }

  await logActivity({ action: 'add', entity: 'sale', entityId: data.id, description: `Added sale: ${quantity} ${saleProductName} · Rs. ${total}`, meta: { productId: sale.productId, customerId: sale.customerId, quantity, rate, total, paymentMode: finalMode } });
  return mapSale(data);
};

export const updateSale = async (id, updates) => {
  const dbUpdates = {};
  if (updates.date        !== undefined) dbUpdates.sale_date    = updates.date;
  if (updates.quantity    !== undefined) dbUpdates.quantity     = parseFloat(updates.quantity);
  if (updates.rate        !== undefined) dbUpdates.rate         = parseFloat(updates.rate);
  if (updates.total       !== undefined) dbUpdates.total_amount = parseFloat(updates.total);
  if (updates.paymentMode !== undefined) dbUpdates.payment_mode = updates.paymentMode;
  if (updates.customerId  !== undefined) dbUpdates.account_id   = updates.customerId || null;
  if (updates.note        !== undefined) dbUpdates.note         = updates.note || null;

  const { data, error } = await supabase
    .from('sales').update(dbUpdates).eq('id', id).select().single();
  if (error) { console.error('updateSale error:', error); return null; }
  await logActivity({ action: 'edit', entity: 'sale', entityId: id, description: `Edited sale · Rs. ${data.total_amount}`, meta: { productId: data.product_id, customerId: data.account_id, total: data.total_amount } });
  return mapSale(data);
};

export const getSalePayments = async (saleId) => {
  const { data, error } = await supabase
    .from('sale_payments').select('*').eq('sale_id', saleId);
  if (error) { console.error('getSalePayments error:', error); return []; }
  return (data || []).map(row => ({
    id: row.id, mode: row.payment_mode,
    amount: parseFloat(row.amount || 0),
    accountId: row.account_id || null,
    meta: row.meta || null,
  }));
};

export const deleteSale = async (id) => {
  const { data: sale } = await supabase.from('sales').select('product_id, account_id, quantity, total_amount').eq('id', id).single();
  let delProductName = 'Unknown';
  if (sale?.product_id) {
    const { data: p } = await supabase.from('products').select('name').eq('id', sale.product_id).single();
    if (p) delProductName = p.name;
  }
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) { console.error('deleteSale error:', error); return; }
  await logActivity({ action: 'delete', entity: 'sale', entityId: id, description: `Deleted sale: ${parseFloat(sale?.quantity || 0)} ${delProductName} · Rs. ${parseFloat(sale?.total_amount || 0)}`, meta: { productId: sale?.product_id, customerId: sale?.account_id, quantity: sale?.quantity, total: sale?.total_amount } });
};

// ─── Vouchers ────────────────────────────────────────────────────────────────

const mapVoucher = (row) => ({
  id: row.id,
  type: row.voucher_type,
  accountId: row.account_id,
  amount: parseFloat(row.amount || 0),
  date: row.voucher_date,
  description: row.description || '',
  referenceNo: row.reference_no || '',
});

export const getVouchers = async () => {
  const company_id = getCompanyId();
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('company_id', company_id)
    .order('voucher_date', { ascending: false });
  if (error) { console.error('getVouchers error:', error); return []; }
  return (data || []).map(mapVoucher);
};

export const addVoucher = async (voucher) => {
  const company_id = getCompanyId();
  if (!company_id) return null;

  const amount = parseFloat(voucher.amount || 0);

  const { data, error } = await supabase
    .from('vouchers')
    .insert({
      company_id,
      voucher_type: voucher.type,
      account_id: voucher.accountId,
      amount,
      voucher_date: voucher.date || new Date().toISOString().split('T')[0],
      description: voucher.description || null,
      reference_no: voucher.referenceNo || null,
    })
    .select()
    .single();
  if (error) { console.error('addVoucher error:', error); return null; }

  // Adjust account balance
  let voucherAccName = '';
  if (voucher.accountId) {
    const { data: acc } = await supabase
      .from('accounts')
      .select('current_balance, name')
      .eq('id', voucher.accountId)
      .single();
    if (acc) {
      voucherAccName = acc.name || '';
      let newBalance;
      if (voucher.type === 'receipt') {
        newBalance = parseFloat(acc.current_balance || 0) - amount;
      } else {
        newBalance = parseFloat(acc.current_balance || 0) + amount;
      }
      await supabase
        .from('accounts')
        .update({ current_balance: newBalance })
        .eq('id', voucher.accountId);
    }
  }

  await logActivity({ action: 'add', entity: 'voucher', entityId: data.id, description: `Added ${voucher.type} voucher: Rs. ${amount}${voucherAccName ? ' · ' + voucherAccName : ''}`, meta: { type: voucher.type, amount, accountId: voucher.accountId } });
  return mapVoucher(data);
};

export const updateVoucher = async (id, updates) => {
  const { data: old } = await supabase.from('vouchers').select('*').eq('id', id).single();
  if (!old) return null;

  const oldAmount    = parseFloat(old.amount);
  const newAmount    = updates.amount    !== undefined ? parseFloat(updates.amount) : oldAmount;
  const oldAccountId = old.account_id;
  const newAccountId = updates.accountId !== undefined ? updates.accountId : oldAccountId;

  const dbUpdates = {};
  if (updates.accountId   !== undefined) dbUpdates.account_id   = updates.accountId;
  if (updates.amount      !== undefined) dbUpdates.amount       = newAmount;
  if (updates.date        !== undefined) dbUpdates.voucher_date = updates.date;
  if (updates.description !== undefined) dbUpdates.description  = updates.description || null;

  // Reverse old balance effect on old account
  if (oldAccountId) {
    const { data: acc } = await supabase.from('accounts').select('current_balance').eq('id', oldAccountId).single();
    if (acc) {
      const reversed = old.voucher_type === 'receipt'
        ? parseFloat(acc.current_balance) + oldAmount   // receipt had decreased balance → add back
        : parseFloat(acc.current_balance) - oldAmount;  // payment had increased balance → subtract back
      await supabase.from('accounts').update({ current_balance: reversed }).eq('id', oldAccountId);
    }
  }

  const { data, error } = await supabase.from('vouchers').update(dbUpdates).eq('id', id).select().single();
  if (error) { console.error('updateVoucher error:', error); return null; }

  // Apply new balance effect on new account
  let updAccName = '';
  if (newAccountId) {
    const { data: acc } = await supabase.from('accounts').select('current_balance, name').eq('id', newAccountId).single();
    if (acc) {
      updAccName = acc.name || '';
      const newBal = old.voucher_type === 'receipt'
        ? parseFloat(acc.current_balance) - newAmount
        : parseFloat(acc.current_balance) + newAmount;
      await supabase.from('accounts').update({ current_balance: newBal }).eq('id', newAccountId);
    }
  }

  await logActivity({ action: 'edit', entity: 'voucher', entityId: id, description: `Edited ${old.voucher_type} voucher: Rs. ${newAmount}${updAccName ? ' · ' + updAccName : ''}`, meta: { type: old.voucher_type, amount: newAmount, accountId: newAccountId } });
  return mapVoucher(data);
};

export const deleteVoucher = async (id) => {
  const { data: v } = await supabase.from('vouchers').select('voucher_type, amount, account_id').eq('id', id).single();
  let delAccName = '';
  if (v?.account_id) {
    const { data: a } = await supabase.from('accounts').select('name').eq('id', v.account_id).single();
    if (a) delAccName = a.name;
  }
  const { error } = await supabase.from('vouchers').delete().eq('id', id);
  if (error) { console.error('deleteVoucher error:', error); return; }
  await logActivity({ action: 'delete', entity: 'voucher', entityId: id, description: `Deleted ${v?.voucher_type || 'voucher'}: Rs. ${parseFloat(v?.amount || 0)}${delAccName ? ' · ' + delAccName : ''}`, meta: { type: v?.voucher_type, amount: v?.amount, accountId: v?.account_id } });
};

// ─── Expenses ────────────────────────────────────────────────────────────────

export const getExpenses = async () => {
  const company_id = getCompanyId();
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('company_id', company_id)
    .order('expense_date', { ascending: false });
  if (error) { console.error('getExpenses error:', error); return []; }
  return (data || []).map(row => ({
    id: row.id,
    date: row.expense_date,
    // We store "category: description" in description field
    category: row.description?.split(': ')[0] || row.description || '',
    description: row.description?.split(': ').slice(1).join(': ') || '',
    amount: parseFloat(row.amount || 0),
    paymentMode: row.payment_mode || 'cash',
    accountId: row.account_id || null,
  }));
};

export const addExpense = async (expense) => {
  const company_id = getCompanyId();
  if (!company_id) return null;

  // Store category and description combined
  const descriptionField = expense.description
    ? `${expense.category}: ${expense.description}`
    : (expense.category || expense.description || '');

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      company_id,
      expense_date: expense.date || new Date().toISOString().split('T')[0],
      description: descriptionField,
      amount: parseFloat(expense.amount || 0),
      payment_mode: expense.paymentMode || 'cash',
      account_id: expense.accountId || null,
    })
    .select()
    .single();
  if (error) { console.error('addExpense error:', error); return null; }
  return {
    id: data.id,
    date: data.expense_date,
    category: data.description?.split(': ')[0] || data.description || '',
    description: data.description?.split(': ').slice(1).join(': ') || '',
    amount: parseFloat(data.amount || 0),
    paymentMode: data.payment_mode || 'cash',
    accountId: data.account_id || null,
  };
};

export const deleteExpense = async (id) => {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) console.error('deleteExpense error:', error);
};

// ─── Rate Adjustments ────────────────────────────────────────────────────────

const mapRateAdjustment = (row) => ({
  id: row.id,
  productId: row.product_id,
  oldRate: parseFloat(row.old_rate || 0),
  newRate: parseFloat(row.new_rate || 0),
  date: row.adjustment_date,
  reason: row.reason || '',
});

export const getRateAdjustments = async () => {
  const company_id = getCompanyId();
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('rate_adjustments')
    .select('*')
    .eq('company_id', company_id)
    .order('adjustment_date', { ascending: false });
  if (error) { console.error('getRateAdjustments error:', error); return []; }
  return (data || []).map(mapRateAdjustment);
};

export const addRateAdjustment = async (adjustment) => {
  const company_id = getCompanyId();
  if (!company_id) return null;

  const { data, error } = await supabase
    .from('rate_adjustments')
    .insert({
      company_id,
      product_id: adjustment.productId,
      old_rate: parseFloat(adjustment.oldRate || 0),
      new_rate: parseFloat(adjustment.newRate || 0),
      adjustment_date: adjustment.date || new Date().toISOString().split('T')[0],
      reason: adjustment.reason || null,
    })
    .select()
    .single();
  if (error) { console.error('addRateAdjustment error:', error); return null; }

  // Update product selling rate
  if (adjustment.productId) {
    await supabase
      .from('products')
      .update({ selling_rate: parseFloat(adjustment.newRate) })
      .eq('id', adjustment.productId);
  }

  return mapRateAdjustment(data);
};

// ─── Dashboard Summary ───────────────────────────────────────────────────────

export const getDashboardSummary = async () => {
  const company_id = getCompanyId();
  if (!company_id) return {
    monthlySaleAmt: 0, petrolLtr: 0, dieselLtr: 0, accountsCount: 0,
    totalPurchaseAmt: 0, totalSaleAmt: 0, totalExpenseAmt: 0, cashInHand: 0, stockDetails: [],
  };

  const [
    { data: salesData },
    { data: purchasesData },
    { data: expensesData },
    { data: accountsData },
    { data: productsData },
    { data: vouchersData },
  ] = await Promise.all([
    supabase.from('sales').select('*').eq('company_id', company_id),
    supabase.from('purchases').select('*').eq('company_id', company_id),
    supabase.from('expenses').select('*').eq('company_id', company_id),
    supabase.from('accounts').select('*').eq('company_id', company_id),
    supabase.from('products').select('*').eq('company_id', company_id),
    supabase.from('vouchers').select('*').eq('company_id', company_id),
  ]);

  const sales = (salesData || []).map(mapSale);
  const purchases = (purchasesData || []).map(mapPurchase);
  const expenses = (expensesData || []).map(row => ({ ...row, amount: parseFloat(row.amount || 0), date: row.expense_date }));
  const accounts = (accountsData || []).map(mapAccount);
  const products = (productsData || []).map(mapProduct);
  const vouchers = (vouchersData || []).map(mapVoucher);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlySales = sales.filter(s => new Date(s.date) >= monthStart);

  const totalSaleAmt = sales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
  const totalPurchaseAmt = purchases.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
  const totalExpenseAmt = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const monthlySaleAmt = monthlySales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);

  const petrolSales = monthlySales.filter(s => {
    const p = products.find(pr => pr.id === s.productId);
    return p && p.name.toLowerCase().includes('petrol');
  });
  const dieselSales = monthlySales.filter(s => {
    const p = products.find(pr => pr.id === s.productId);
    return p && p.name.toLowerCase().includes('diesel');
  });

  const petrolLtr = petrolSales.reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0);
  const dieselLtr = dieselSales.reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0);

  const totalReceiptVouchers = vouchers.filter(v => v.type === 'receipt').reduce((sum, v) => sum + parseFloat(v.amount || 0), 0);
  const totalPaymentVouchers = vouchers.filter(v => v.type === 'payment').reduce((sum, v) => sum + parseFloat(v.amount || 0), 0);
  const cashInHand = totalReceiptVouchers - totalPaymentVouchers - totalExpenseAmt;

  const stockDetails = products.map(p => ({
    name: p.name,
    stock: parseFloat(p.stock || 0),
    unit: p.unit,
    rate: parseFloat(p.rate || 0),
  }));

  return {
    monthlySaleAmt,
    petrolLtr,
    dieselLtr,
    accountsCount: accounts.length,
    totalPurchaseAmt,
    totalSaleAmt,
    totalExpenseAmt,
    cashInHand,
    stockDetails,
  };
};
