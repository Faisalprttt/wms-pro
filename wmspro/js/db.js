/* ============================================================
   WMS PRO — Database Layer (localStorage)
   Semua data disimpan di browser localStorage.
   File SQL terpisah tersedia untuk MySQL/PostgreSQL.
   ============================================================ */

const DB = {
  /* ----- SEED DATA ----- */
  seed() {
    if (localStorage.getItem('wms_seeded')) return;

    const categories = [
      { id: 1, name: 'Elektronik', description: 'Produk elektronik dan gadget', icon: '⚡' },
      { id: 2, name: 'Pakaian', description: 'Pakaian dan aksesoris', icon: '👕' },
      { id: 3, name: 'Makanan & Minuman', description: 'Produk konsumsi', icon: '🥤' },
      { id: 4, name: 'Alat Rumah Tangga', description: 'Peralatan rumah', icon: '🏠' },
      { id: 5, name: 'Bahan Baku', description: 'Raw material', icon: '📦' },
    ];

    const units = [
      { id: 1, name: 'Pcs', description: 'Per buah/unit' },
      { id: 2, name: 'Kg', description: 'Kilogram' },
      { id: 3, name: 'Liter', description: 'Liter' },
      { id: 4, name: 'Box', description: 'Per kotak' },
      { id: 5, name: 'Lusin', description: '12 pcs' },
      { id: 6, name: 'Meter', description: 'Per meter' },
    ];

    const suppliers = [
      { id: 1, name: 'PT Maju Elektronik', contact: 'Budi Santoso', phone: '021-5551234', email: 'budi@majuelektronik.com', address: 'Jl. Industri No. 45, Jakarta', status: 'Aktif', createdAt: new Date('2024-01-15').toISOString() },
      { id: 2, name: 'CV Sumber Textile', contact: 'Siti Rahayu', phone: '022-7778888', email: 'siti@sumbertextile.com', address: 'Jl. Raya Bandung No. 12, Bandung', status: 'Aktif', createdAt: new Date('2024-02-20').toISOString() },
      { id: 3, name: 'PT Berkah Pangan', contact: 'Ahmad Fauzi', phone: '031-9990000', email: 'ahmad@berkahpangan.com', address: 'Jl. Pahlawan No. 88, Surabaya', status: 'Aktif', createdAt: new Date('2024-01-10').toISOString() },
      { id: 4, name: 'UD Perabot Jaya', contact: 'Dewi Lestari', phone: '024-3334444', email: 'dewi@perabotjaya.com', address: 'Jl. Pemuda No. 23, Semarang', status: 'Nonaktif', createdAt: new Date('2024-03-05').toISOString() },
    ];

    const locations = [
      { id: 1, code: 'RAK-A01', name: 'Rak A - Baris 1', zone: 'Zona A', capacity: 500, status: 'Aktif' },
      { id: 2, code: 'RAK-A02', name: 'Rak A - Baris 2', zone: 'Zona A', capacity: 500, status: 'Aktif' },
      { id: 3, code: 'RAK-B01', name: 'Rak B - Baris 1', zone: 'Zona B', capacity: 300, status: 'Aktif' },
      { id: 4, code: 'RAK-B02', name: 'Rak B - Baris 2', zone: 'Zona B', capacity: 300, status: 'Aktif' },
      { id: 5, code: 'RAK-C01', name: 'Rak C - Baris 1', zone: 'Zona C', capacity: 800, status: 'Aktif' },
      { id: 6, code: 'FLR-D01', name: 'Lantai D - Zona 1', zone: 'Zona D', capacity: 2000, status: 'Aktif' },
      { id: 7, code: 'FLR-D02', name: 'Lantai D - Zona 2', zone: 'Zona D', capacity: 2000, status: 'Aktif' },
      { id: 8, code: 'COLD-E01', name: 'Cold Storage E - 1', zone: 'Zona E (Cold)', capacity: 400, status: 'Aktif' },
    ];

    const products = [
      { id: 1, sku: 'ELK-001', name: 'Smartphone Android 6"', categoryId: 1, unitId: 1, supplierId: 1, locationId: 1, buyPrice: 1800000, sellPrice: 2299000, minStock: 10, stock: 45, description: 'Smartphone android 6 inch', status: 'Aktif' },
      { id: 2, sku: 'ELK-002', name: 'Headphone Wireless BT', categoryId: 1, unitId: 1, supplierId: 1, locationId: 1, buyPrice: 250000, sellPrice: 399000, minStock: 15, stock: 8, description: 'Headphone bluetooth 5.0', status: 'Aktif' },
      { id: 3, sku: 'ELK-003', name: 'Charger USB-C 65W', categoryId: 1, unitId: 1, supplierId: 1, locationId: 2, buyPrice: 120000, sellPrice: 189000, minStock: 20, stock: 62, description: 'Fast charger 65 watt', status: 'Aktif' },
      { id: 4, sku: 'PAK-001', name: 'Kaos Katun Premium', categoryId: 2, unitId: 1, supplierId: 2, locationId: 3, buyPrice: 45000, sellPrice: 89000, minStock: 30, stock: 120, description: 'Kaos 100% cotton combed 30s', status: 'Aktif' },
      { id: 5, sku: 'PAK-002', name: 'Celana Chino Slim', categoryId: 2, unitId: 1, supplierId: 2, locationId: 3, buyPrice: 85000, sellPrice: 149000, minStock: 20, stock: 5, description: 'Celana chino stretch', status: 'Aktif' },
      { id: 6, sku: 'PAK-003', name: 'Jaket Hoodie Fleece', categoryId: 2, unitId: 1, supplierId: 2, locationId: 4, buyPrice: 120000, sellPrice: 219000, minStock: 15, stock: 33, description: 'Hoodie fleece anti angin', status: 'Aktif' },
      { id: 7, sku: 'MKN-001', name: 'Air Mineral 1500ml', categoryId: 3, unitId: 4, supplierId: 3, locationId: 8, buyPrice: 3500, sellPrice: 5000, minStock: 100, stock: 350, description: 'Air mineral kemasan besar', status: 'Aktif' },
      { id: 8, sku: 'MKN-002', name: 'Mie Instan Goreng', categoryId: 3, unitId: 4, supplierId: 3, locationId: 6, buyPrice: 28000, sellPrice: 38000, minStock: 50, stock: 7, description: 'Mie instan box isi 40 pcs', status: 'Aktif' },
      { id: 9, sku: 'ALT-001', name: 'Panci Stainless 24cm', categoryId: 4, unitId: 1, supplierId: 4, locationId: 5, buyPrice: 85000, sellPrice: 135000, minStock: 10, stock: 28, description: 'Panci stainless steel food grade', status: 'Aktif' },
      { id: 10, sku: 'ALT-002', name: 'Sapu Ijuk Premium', categoryId: 4, unitId: 1, supplierId: 4, locationId: 7, buyPrice: 22000, sellPrice: 38000, minStock: 20, stock: 14, description: 'Sapu ijuk kualitas premium', status: 'Aktif' },
      { id: 11, sku: 'BBK-001', name: 'Kain Katun per Meter', categoryId: 5, unitId: 6, supplierId: 2, locationId: 4, buyPrice: 15000, sellPrice: 25000, minStock: 100, stock: 3, description: 'Kain katun combed putih', status: 'Aktif' },
      { id: 12, sku: 'BBK-002', name: 'Benang Jahit 500m', categoryId: 5, unitId: 4, supplierId: 2, locationId: 4, buyPrice: 12000, sellPrice: 20000, minStock: 30, stock: 47, description: 'Benang jahit polyester', status: 'Aktif' },
    ];

    const now = new Date();
    const transactions = [];
    let txId = 1;

    const addTx = (type, productId, qty, locationId, note, daysAgo = 0) => {
      const d = new Date(now); d.setDate(d.getDate() - daysAgo);
      transactions.push({
        id: txId++, type, productId, qty, locationId,
        note, createdAt: d.toISOString(), createdBy: 'Admin Gudang'
      });
    };

    // Inbound
    addTx('IN', 1, 50, 1, 'Pembelian awal stok dari PT Maju Elektronik', 30);
    addTx('IN', 2, 20, 1, 'Restock headphone wireless', 25);
    addTx('IN', 3, 80, 2, 'Restock charger USB-C', 20);
    addTx('IN', 4, 150, 3, 'Pembelian batch kaos katun', 28);
    addTx('IN', 7, 500, 8, 'Pembelian air mineral cold storage', 15);
    addTx('IN', 8, 100, 6, 'Restock mie instan box', 10);
    addTx('IN', 9, 30, 5, 'Pembelian panci stainless', 8);

    // Outbound
    addTx('OUT', 1, 5, 1, 'Pengiriman ke Toko A', 5);
    addTx('OUT', 4, 30, 3, 'Order online marketplace', 4);
    addTx('OUT', 7, 150, 8, 'Delivery ke minimarket', 3);
    addTx('OUT', 6, 7, 4, 'Pengiriman ke reseller Bandung', 2);
    addTx('OUT', 8, 93, 6, 'Distribusi ke warung-warung', 1);

    // Adjustment
    addTx('ADJ', 11, -2, 4, 'Stok rusak saat penghitungan fisik', 3);
    addTx('ADJ', 5, -5, 3, 'Defect saat audit bulanan', 6);
    addTx('ADJ', 2, -2, 1, 'Produk expired / rusak', 7);

    // Transfer
    addTx('TRF', 10, 10, 5, 'Transfer dari Zona C ke Zona D untuk efisiensi', 4);

    this.set('categories', categories);
    this.set('units', units);
    this.set('suppliers', suppliers);
    this.set('locations', locations);
    this.set('products', products);
    this.set('transactions', transactions);
    this.set('tx_counter', txId);
    this.set('prod_counter', 13);
    this.set('supp_counter', 5);
    this.set('loc_counter', 9);
    localStorage.setItem('wms_seeded', '1');
  },

  /* ----- CRUD HELPERS ----- */
  get: (key) => JSON.parse(localStorage.getItem('wms_' + key) || '[]'),
  set: (key, val) => localStorage.setItem('wms_' + key, JSON.stringify(val)),
  getOne: (key, id) => DB.get(key).find(x => x.id === id),
  nextId(counter) {
    const n = parseInt(localStorage.getItem('wms_' + counter) || '1');
    localStorage.setItem('wms_' + counter, n + 1);
    return n;
  },

  /* ----- PRODUCTS ----- */
  getProducts() {
    const prods = this.get('products');
    const cats = this.get('categories');
    const units = this.get('units');
    const supps = this.get('suppliers');
    const locs = this.get('locations');
    return prods.map(p => ({
      ...p,
      categoryName: cats.find(c => c.id === p.categoryId)?.name || '-',
      unitName: units.find(u => u.id === p.unitId)?.name || '-',
      supplierName: supps.find(s => s.id === p.supplierId)?.name || '-',
      locationName: locs.find(l => l.id === p.locationId)?.name || '-',
    }));
  },
  saveProduct(data) {
    const prods = this.get('products');
    if (data.id) {
      const idx = prods.findIndex(p => p.id === data.id);
      if (idx !== -1) prods[idx] = { ...prods[idx], ...data };
    } else {
      data.id = this.nextId('prod_counter');
      data.stock = data.stock || 0;
      prods.push(data);
    }
    this.set('products', prods);
    return data;
  },
  deleteProduct(id) {
    this.set('products', this.get('products').filter(p => p.id !== id));
  },

  /* ----- INVENTORY / STOCK ----- */
  adjustStock(productId, delta) {
    const prods = this.get('products');
    const idx = prods.findIndex(p => p.id === productId);
    if (idx !== -1) {
      prods[idx].stock = Math.max(0, (prods[idx].stock || 0) + delta);
      this.set('products', prods);
    }
  },

  /* ----- TRANSACTIONS ----- */
  addTransaction(data) {
    const txs = this.get('transactions');
    data.id = this.nextId('tx_counter');
    data.createdAt = new Date().toISOString();
    data.createdBy = 'Admin Gudang';
    txs.unshift(data);
    this.set('transactions', txs);

    // Update stock
    if (data.type === 'IN') this.adjustStock(data.productId, data.qty);
    else if (data.type === 'OUT') this.adjustStock(data.productId, -data.qty);
    else if (data.type === 'ADJ') this.adjustStock(data.productId, data.qty);

    return data;
  },
  getTransactions() {
    const txs = this.get('transactions');
    const prods = this.get('products');
    const locs = this.get('locations');
    return txs.map(t => ({
      ...t,
      productName: prods.find(p => p.id === t.productId)?.name || '-',
      productSku: prods.find(p => p.id === t.productId)?.sku || '-',
      locationName: locs.find(l => l.id === t.locationId)?.name || '-',
    }));
  },

  /* ----- SUPPLIERS ----- */
  saveSupplier(data) {
    const list = this.get('suppliers');
    if (data.id) {
      const idx = list.findIndex(s => s.id === data.id);
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
    } else {
      data.id = this.nextId('supp_counter');
      data.createdAt = new Date().toISOString();
      list.push(data);
    }
    this.set('suppliers', list);
    return data;
  },
  deleteSupplier(id) {
    this.set('suppliers', this.get('suppliers').filter(s => s.id !== id));
  },

  /* ----- LOCATIONS ----- */
  saveLocation(data) {
    const list = this.get('locations');
    if (data.id) {
      const idx = list.findIndex(l => l.id === data.id);
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
    } else {
      data.id = this.nextId('loc_counter');
      list.push(data);
    }
    this.set('locations', list);
    return data;
  },
  deleteLocation(id) {
    this.set('locations', this.get('locations').filter(l => l.id !== id));
  },

  /* ----- CATEGORIES ----- */
  saveCategory(data) {
    const list = this.get('categories');
    if (data.id) {
      const idx = list.findIndex(c => c.id === data.id);
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
    } else {
      const maxId = list.reduce((m, c) => Math.max(m, c.id), 0);
      data.id = maxId + 1;
      list.push(data);
    }
    this.set('categories', list);
    return data;
  },
  deleteCategory(id) {
    this.set('categories', this.get('categories').filter(c => c.id !== id));
  },

  /* ----- UNITS ----- */
  saveUnit(data) {
    const list = this.get('units');
    if (data.id) {
      const idx = list.findIndex(u => u.id === data.id);
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
    } else {
      const maxId = list.reduce((m, u) => Math.max(m, u.id), 0);
      data.id = maxId + 1;
      list.push(data);
    }
    this.set('units', list);
    return data;
  },
  deleteUnit(id) {
    this.set('units', this.get('units').filter(u => u.id !== id));
  },

  /* ----- STATS ----- */
  getDashboardStats() {
    const products = this.get('products');
    const transactions = this.get('transactions');
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const todayTx = transactions.filter(t => new Date(t.createdAt) >= today);
    const todayIn = todayTx.filter(t => t.type === 'IN').reduce((s, t) => s + t.qty, 0);
    const todayOut = todayTx.filter(t => t.type === 'OUT').reduce((s, t) => s + t.qty, 0);
    const lowStock = products.filter(p => p.stock <= p.minStock);
    const totalValue = products.reduce((s, p) => s + (p.stock * p.buyPrice), 0);

    return {
      totalProducts: products.length,
      totalStock: products.reduce((s, p) => s + p.stock, 0),
      lowStockCount: lowStock.length,
      todayIn, todayOut, totalValue,
      lowStockItems: lowStock.sort((a, b) => a.stock - b.stock).slice(0, 5),
    };
  },

  getMonthlyActivity() {
    const txs = this.get('transactions');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const data = {};
    txs.forEach(t => {
      const d = new Date(t.createdAt);
      const key = months[d.getMonth()];
      if (!data[key]) data[key] = { in: 0, out: 0 };
      if (t.type === 'IN') data[key].in += t.qty;
      if (t.type === 'OUT') data[key].out += t.qty;
    });
    return data;
  },
};

// Init
DB.seed();
