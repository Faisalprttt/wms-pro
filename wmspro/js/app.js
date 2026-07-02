/* ============================================================
   FAISAL GARMENT SYSTEM — Application Logic
   ============================================================ */

/* === UTILITIES === */
const fmt = {
  currency: n => 'Rp ' + Math.round(n).toLocaleString('id-ID'),
  date: s => s ? new Date(s).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '-',
  datetime: s => s ? new Date(s).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '-',
  num: n => Math.round(n).toLocaleString('id-ID'),
};

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = (type === 'success' ? '✓ ' : type === 'error' ? '✗ ' : '⚠ ') + msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function openModal(title, html, wide = false) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').className = 'modal' + (wide ? ' wide' : '');
  document.getElementById('modalOverlay').classList.add('open');
}
function clearActiveGeoWatch() {
  if (window.__geoWatchId !== undefined) {
    navigator.geolocation?.clearWatch(window.__geoWatchId);
    window.__geoWatchId = undefined;
  }
}

function closeModal() {
  clearActiveGeoWatch();
  document.getElementById('modalOverlay').classList.remove('open');
}

function updateUserInfoUI() {
  const userNameEl = document.getElementById('sidebarUserName');
  const userRoleEl = document.getElementById('sidebarUserRole');
  const currentUser = localStorage.getItem('wms_logged_in_user') || 'Admin Gudang';
  const displayName = currentUser.charAt(0).toUpperCase() + currentUser.slice(1);

  if (userNameEl) userNameEl.textContent = displayName;
  if (userRoleEl) userRoleEl.textContent = 'Administrator';

  const avatar = document.querySelector('.user-avatar');
  if (avatar) avatar.textContent = displayName.slice(0, 2).toUpperCase();
}

function showLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) {
    loginScreen.style.display = 'flex';
    loginScreen.classList.remove('fade-out');
  }
}

function hideLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) {
    loginScreen.classList.add('fade-out');
    setTimeout(() => {
      loginScreen.style.display = 'none';
    }, 600);
  }
}

function logout() {
  localStorage.removeItem('wms_logged_in_user');
  updateUserInfoUI();
  document.getElementById('pageContent').innerHTML = '';
  showLoginScreen();
  toast('Anda telah keluar dari sistem.', 'success');
}

/* === REALTIME CLOCK UTILITY === */
function startRealtimeClock() {
  function updateClock() {
    const now = new Date();
    // Format: 26 Jun 2026, 20:56:03
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', options);
    const timeStr = now.toLocaleTimeString('id-ID', { hour12: false }); // Format 24 jam
    
    // Cari elemen penampung jam di halaman
    const clockElement = document.getElementById('liveClock');
    if (clockElement) {
      clockElement.innerHTML = `🕒 <strong>${dateStr}</strong> | ${timeStr}`;
    }
  }
  
  // Perbarui setiap 1 detik
  if (window.__realtimeClockInterval) clearInterval(window.__realtimeClockInterval);
  window.__realtimeClockInterval = setInterval(updateClock, 1000);
  updateClock(); // Jalankan sekali di awal agar tidak menunggu 1 detik
}
















function getBadge(stock, min) {
  if (stock <= 0) return '<span class="badge badge-red">Habis</span>';
  if (stock <= min) return '<span class="badge badge-orange">Menipis</span>';
  return '<span class="badge badge-green">Normal</span>';
}

function getTxBadge(type) {
  const map = { IN: ['badge-green', 'Masuk'], OUT: ['badge-blue', 'Keluar'], ADJ: ['badge-orange', 'Penyesuaian'], TRF: ['badge-gray', 'Transfer'] };
  const [cls, label] = map[type] || ['badge-gray', type];
  return `<span class="badge ${cls}">${label}</span>`;
}

function initHeroSlider() {
  const heroSlider = document.querySelector('.hero-slider');
  const track = heroSlider?.querySelector('.slider-track');
  const slides = heroSlider ? Array.from(heroSlider.querySelectorAll('.slide-item')) : [];
  const dots = heroSlider ? Array.from(heroSlider.querySelectorAll('.dot')) : [];
  if (!track || slides.length === 0 || dots.length === 0) return;

  if (window.__heroSliderTimer) {
    clearInterval(window.__heroSliderTimer);
    window.__heroSliderTimer = null;
  }

  const goSlide = (index) => {
    const nextIndex = ((index % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(-${nextIndex * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === nextIndex));
    slides.forEach((slide, i) => slide.classList.toggle('active', i === nextIndex));
    window.__heroSlideIndex = nextIndex;
  };

  window.setHeroSlide = (index) => {
    goSlide(index);
    resetHeroSliderTimer();
  };

  const resetHeroSliderTimer = () => {
    if (window.__heroSliderTimer) clearInterval(window.__heroSliderTimer);
    window.__heroSliderTimer = setInterval(() => {
      goSlide(window.__heroSlideIndex + 1);
    }, 5200);
  };

  goSlide(0);
  resetHeroSliderTimer();
}

/* === ROUTING === */
function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const el = document.querySelector(`[data-page="${page}"]`);
  if (el) el.classList.add('active');
  const pages = { dashboard, products, inventory, locations, inbound, outbound, transfer, adjustment, suppliers, categories, units, reports, history };
  const fn = pages[page];
  if (fn) fn();
}

/* ============================================================
   DASHBOARD (DENGAN GRAFIK ANTI-GAGAL)
   ============================================================ */
function dashboard() {
  const s = DB.getDashboardStats();
  const txs = DB.getTransactions() || [];
  const recentTxs = txs.slice(0, 10);
  
  function getMonthName(date) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return monthNames[date.getMonth()] + ' ' + date.getFullYear();
  }

  const activity = {};
  const monthKeys = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mName = getMonthName(d);
    activity[mName] = { in: 0, out: 0 };
    monthKeys.push(mName);
  }

  txs.forEach(t => {
    if (!t.createdAt) return;
    const d = new Date(t.createdAt);
    const mName = getMonthName(d);
    
    if (activity[mName] !== undefined) {
      if (t.type === 'IN') activity[mName].in += t.qty;
      if (t.type === 'OUT' || t.type === 'TRF') activity[mName].out += t.qty; 
    }
  });

  let maxVal = 1;
  monthKeys.forEach(m => {
    if (activity[m].in > maxVal) maxVal = activity[m].in;
    if (activity[m].out > maxVal) maxVal = activity[m].out;
  });

  const notifications = getNotifications();
  document.getElementById('pageContent').innerHTML = `
  <div class="page-header">
    <div class="page-title">Dashboard</div>
    <div class="header-actions">
      <div style="display:flex; align-items:center; gap:8px; margin-right:8px; color:#334155; font-weight:600;">
        <span>👤 ${localStorage.getItem('wms_logged_in_user') || 'Admin Gudang'}</span>
      </div>
      <button class="btn btn-sm btn-secondary" onclick="logout()" style="border:1px solid #fecaca; color:#b91c1c; background:#fef2f2;">
        🚪 Log Out
      </button>
      <button class="btn btn-sm" onclick="injectDummyData()" style="background: #f59e0b; color: white; border: none; font-weight: 600; cursor: pointer; padding: 6px 12px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        ⚡ Load Data Uji Coba
      </button>
      <span class="text-muted" id="liveClock" style="font-weight: 500;"></span>
    </div>
  </div>
  <div class="page-body">
    <div class="dashboard-menu">
      <button class="menu-card" onclick="navigate('products')">
        <div class="menu-icon">📦</div>
        <div>
          <div class="menu-label">Produk</div>
          <div class="menu-desc">Kelola katalog</div>
        </div>
      </button>
      <button class="menu-card" onclick="navigate('inventory')">
        <div class="menu-icon">📊</div>
        <div>
          <div class="menu-label">Inventori</div>
          <div class="menu-desc">Lihat stok</div>
        </div>
      </button>
      <button class="menu-card" onclick="navigate('inbound')">
        <div class="menu-icon">⬇️</div>
        <div>
          <div class="menu-label">Barang Masuk</div>
          <div class="menu-desc">Tambah penerimaan</div>
        </div>
      </button>
      <button class="menu-card" onclick="navigate('outbound')">
        <div class="menu-icon">⬆️</div>
        <div>
          <div class="menu-label">Barang Keluar</div>
          <div class="menu-desc">Kelola pengiriman</div>
        </div>
      </button>
      <button class="menu-card" onclick="navigate('reports')">
        <div class="menu-icon">📄</div>
        <div>
          <div class="menu-label">Laporan</div>
          <div class="menu-desc">Status stok</div>
        </div>
      </button>
    </div>
    <section class="hero-panel">
      <div class="hero-copy">
        <div class="hero-badge">Warehouse Intelligence</div>
        <h1>Kelola stok & pengiriman dengan cepat, jelas, dan rapi.</h1>
        <p>Ringkas status gudang, pergerakan barang, dan performa operasional di satu tampilan yang bersih dan modern.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" onclick="navigate('inventory')">Lihat Inventori</button>
          <button class="btn btn-secondary" onclick="navigate('reports')">Lihat Laporan</button>
        </div>
        <div class="hero-slider">
          <div class="slider-track">
            <div class="slide-item" style="background-image:url('images/image1.jpg');">
              <div class="slide-overlay"></div>
              <div class="slide-caption">
                <span>Warehouse Live</span>
                <strong>Stok & aktivitas gudang realtime</strong>
              </div>
            </div>
            <div class="slide-item" style="background-image:url('images/image2.jpg');">
              <div class="slide-overlay"></div>
              <div class="slide-caption">
                <span>Pengiriman Cepat</span>
                <strong>Monitoring armada dalam perjalanan</strong>
              </div>
            </div>
            <div class="slide-item" style="background-image:url('images/image3.avif');">
              <div class="slide-overlay"></div>
              <div class="slide-caption">
                <span>Tim Operasional</span>
                <strong>Tim siap menjaga proses tetap lancar</strong>
              </div>
            </div>
          </div>
          <div class="slider-dots">
            <button class="dot active" onclick="setHeroSlide(0)"></button>
            <button class="dot" onclick="setHeroSlide(1)"></button>
            <button class="dot" onclick="setHeroSlide(2)"></button>
          </div>
        </div>
      </div>
      <div class="hero-summary-card">
        <div class="hero-visual">
          <div class="visual-topline">Live Warehouse View</div>
          <div class="visual-scene">
            <div class="visual-building">
              <div class="building-window"></div>
              <div class="building-door"></div>
            </div>
            <div class="visual-truck">
              <div class="truck-body"></div>
              <div class="truck-cargo"></div>
              <div class="truck-wheel truck-wheel-left"></div>
              <div class="truck-wheel truck-wheel-right"></div>
            </div>
            <div class="visual-pulse"></div>
          </div>
          <div class="visual-status">
            <span>3 gudang aktif</span>
            <strong>92% on-time delivery</strong>
          </div>
        </div>
        <div class="summary-title">Status Gudang Hari Ini</div>
        <div class="summary-row"><span>Produk Aktif</span><strong>${fmt.num(s.totalProducts)}</strong></div>
        <div class="summary-row"><span>Barang Masuk</span><strong>${fmt.num(s.totalStock)}</strong></div>
        <div class="summary-row"><span>Stok Menipis</span><strong class="warning">${s.lowStockCount}</strong></div>
        <div class="summary-chip">Aktifkan alert otomatis untuk stok rendah</div>
      </div>
    </section>

    <div class="notification-panel">
      <h3>Notifikasi Terbaru</h3>
      <ul class="notification-list">
        ${notifications.length === 0 ? `
          <li class="notification-item"><span class="notice-dot">✔</span><div class="notice-body"><strong>Tidak ada notifikasi</strong><div class="notice-meta">Aksi stok akan muncul di sini saat Anda melakukan transaksi.</div></div></li>
        ` : notifications.map(n => `
          <li class="notification-item ${n.type}">
            <span>${n.type === 'in' ? '📥' : n.type === 'out' ? '📤' : n.type === 'empty' ? '⚠️' : 'ℹ️'}</span>
            <div class="notice-body">
              <strong>${n.title}</strong>
              <div>${n.message}</div>
              <div class="notice-meta">${n.timestamp}</div>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="stats-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:20px;">
      <div class="stat-card" style="background:#fff; padding:16px; border-radius:8px; border:1px solid #e2e8f0; display:flex; gap:12px; align-items:center;">
        <div style="font-size:24px;">📦</div>
        <div>
          <div style="font-size:12px; color:#64748b;">Total Produk</div>
          <div style="font-size:20px; font-weight:700;">${fmt.num(s.totalProducts)}</div>
        </div>
      </div>
      <div class="stat-card" style="background:#fff; padding:16px; border-radius:8px; border:1px solid #e2e8f0; display:flex; gap:12px; align-items:center;">
        <div style="font-size:24px;">🏪</div>
        <div>
          <div style="font-size:12px; color:#64748b;">Total Stok</div>
          <div style="font-size:20px; font-weight:700;">${fmt.num(s.totalStock)}</div>
        </div>
      </div>
      <div class="stat-card" style="background:#fff; padding:16px; border-radius:8px; border:1px solid #e2e8f0; display:flex; gap:12px; align-items:center;">
        <div style="font-size:24px;">⚠️</div>
        <div>
          <div style="font-size:12px; color:#64748b;">Stok Menipis</div>
          <div style="font-size:20px; font-weight:700; color:#ef4444;">${s.lowStockCount}</div>
        </div>
      </div>
    </div>

    <div class="charts-grid" style="display:grid; grid-template-columns:2fr 1fr; gap:16px;">
      <div class="card" style="background:#fff; border-radius:8px; border:1px solid #e2e8f0; overflow:hidden;">
        <div class="card-header" style="padding:16px; border-bottom:1px solid #e2e8f0; font-weight:600;">
          Aktivitas Bulanan (6 Bulan Terakhir)
        </div>
        <div class="card-body" style="padding:20px;">
          <div style="display:flex; gap:16px; margin-bottom:20px; font-size:12px; font-weight:500;">
            <span style="display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;background:#3b82f6;border-radius:2px;"></span>Masuk</span>
            <span style="display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;background:#10b981;border-radius:2px;"></span>Keluar</span>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:16px;">
          ${monthKeys.map(m => {
            const d = activity[m];
            const inPercent = d.in > 0 ? Math.max(((d.in / maxVal) * 100), 1).toFixed(1) : 0;
            const outPercent = d.out > 0 ? Math.max(((d.out / maxVal) * 100), 1).toFixed(1) : 0;
            
            return `
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:65px; font-size:12px; font-weight:600; color:#475569;">${m}</div>
              <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                <div style="width:100%; height:12px; background:#f1f5f9; border-radius:6px; overflow:hidden;">
                  <div style="width:${inPercent}%; height:100%; background:#3b82f6; border-radius:6px;"></div>
                </div>
                <div style="width:100%; height:12px; background:#f1f5f9; border-radius:6px; overflow:hidden;">
                  <div style="width:${outPercent}%; height:100%; background:#10b981; border-radius:6px;"></div>
                </div>
              </div>
              <div style="width:45px; text-align:right; font-size:11px; font-weight:600;">
                <div style="color:#3b82f6; line-height:12px; margin-bottom:4px;">${d.in}</div>
                <div style="color:#10b981; line-height:12px;">${d.out}</div>
              </div>
            </div>`;
          }).join('')}
          </div>
        </div>
      </div>

      <div class="card" style="background:#fff; border-radius:8px; border:1px solid #e2e8f0; overflow:hidden;">
        <div class="card-header" style="padding:16px; border-bottom:1px solid #e2e8f0; font-weight:600; display:flex; justify-content:space-between;">
          <span>Stok Menipis</span>
          <button class="btn btn-sm" onclick="navigate('inventory')" style="background:#f1f5f9; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">Lihat Semua</button>
        </div>
        <div class="card-body" style="padding:16px;">
          ${s.lowStockItems.length === 0 ? '<div style="text-align:center; padding:20px; color:#64748b;">✅ Semua stok aman</div>' :
          s.lowStockItems.map(p => `
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9;">
              <div>
                <div style="font-weight:500; font-size:13px;">${p.name}</div>
                <div style="font-size:11px; color:#64748b;">${p.sku}</div>
              </div>
              <div style="text-align:right;">
                <span style="color:#ef4444; font-weight:700;">${p.stock}</span> 
                <span style="color:#64748b; font-size:11px;">/ ${p.minStock}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
      <div class="card-header" style="padding:16px; border-bottom:1px solid #e2e8f0; font-weight:600;">
        Aktivitas Terbaru
      </div>
      <div class="card-body" style="padding:0 16px;">
        ${recentTxs.length === 0 ? '<div style="padding:20px; text-align:center; color:#64748b;">Tidak ada aktivitas transaksi</div>' : 
        recentTxs.map(t => `
        <div style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #f1f5f9;">
          <div style="width:8px; height:8px; border-radius:50%; background:${t.type === 'IN' ? '#10b981' : t.type === 'OUT' ? '#3b82f6' : '#f59e0b'};"></div>
          <div style="flex:1; font-size:13px;">
            ${getTxBadge(t.type)} &nbsp;<strong>${t.productName}</strong> — ${fmt.num(t.qty)} unit
            <span style="color:#64748b; font-size:11px;">di ${t.locationName}</span>
          </div>
          <div style="font-size:11px; color:#64748b;">${fmt.datetime(t.createdAt)}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;

  initHeroSlider();
}

/* ============================================================
   PRODUCTS
   ============================================================ */
function products(search = '', catFilter = '') {
  let list = DB.getProducts();
  if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
  if (catFilter) list = list.filter(p => p.categoryId == catFilter);
  const cats = DB.get('categories');

  document.getElementById('pageContent').innerHTML = `
  <div class="page-header">
    <div class="page-title">Produk</div>
    <div class="header-actions">
      <button class="btn btn-primary" onclick="editProduct()">+ Tambah Produk</button>
    </div>
  </div>
  <div class="page-body">
    <div class="toolbar">
      <div class="search-box"><input type="text" placeholder="Cari produk / SKU..." id="prodSearch" value="${search}" oninput="products(this.value, document.getElementById('catFilter').value)"></div>
      <select class="filter" id="catFilter" onchange="products(document.getElementById('prodSearch').value, this.value)">
        <option value="">Semua Kategori</option>
        ${cats.map(c => `<option value="${c.id}" ${catFilter == c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
      <span class="text-muted">${list.length} produk</span>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>SKU</th><th>Nama Produk</th><th>Kategori</th>
            <th>Lokasi</th><th>Harga Beli</th><th>Harga Jual</th>
            <th>Stok</th><th>Status</th><th>Aksi</th>
          </tr></thead>
          <tbody>
            ${list.length === 0 ? `<tr><td colspan="9" class="empty-state">Tidak ada produk ditemukan</td></tr>` :
            list.map(p => `<tr>
              <td><code style="font-size:12px;background:var(--gray-100);padding:2px 6px;border-radius:4px">${p.sku}</code></td>
              <td><div style="font-weight:500">${p.name}</div><div class="text-muted">${p.supplierName}</div></td>
              <td>${p.categoryName}</td>
              <td style="font-size:12px">${p.locationName}</td>
              <td>${fmt.currency(p.buyPrice)}</td>
              <td>${fmt.currency(p.sellPrice)}</td>
              <td>
                <div style="font-weight:600">${fmt.num(p.stock)} ${p.unitName}</div>
                ${getBadge(p.stock, p.minStock)}
              </td>
              <td><span class="badge ${p.status === 'Aktif' ? 'badge-green' : 'badge-gray'}">${p.status}</span></td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-sm btn-secondary" onclick="editProduct(${p.id})" title="Edit">✏️</button>
                  <button class="btn btn-sm btn-secondary" onclick="viewProduct(${p.id})" title="Detail">👁</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})" title="Hapus">🗑</button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function editProduct(id = null) {
  const prod = id ? DB.getOne('products', id) : null;
  const cats = DB.get('categories');
  const units = DB.get('units');
  const supps = DB.get('suppliers');
  const locs = DB.get('locations');

  const html = `
  <div class="form-grid">
    <div class="form-group">
      <label>SKU *</label>
      <input class="form-control" id="f_sku" value="${prod?.sku || ''}" placeholder="ELK-001">
    </div>
    <div class="form-group">
      <label>Status</label>
      <select class="form-control" id="f_status">
        <option ${prod?.status !== 'Nonaktif' ? 'selected' : ''}>Aktif</option>
        <option ${prod?.status === 'Nonaktif' ? 'selected' : ''}>Nonaktif</option>
      </select>
    </div>
    <div class="form-group full">
      <label>Nama Produk *</label>
      <input class="form-control" id="f_name" value="${prod?.name || ''}" placeholder="Nama produk lengkap">
    </div>
    <div class="form-group">
      <label>Kategori *</label>
      <select class="form-control" id="f_cat">
        ${cats.map(c => `<option value="${c.id}" ${prod?.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Satuan *</label>
      <select class="form-control" id="f_unit">
        ${units.map(u => `<option value="${u.id}" ${prod?.unitId === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Supplier</label>
      <select class="form-control" id="f_supp">
        <option value="">-- Pilih Supplier --</option>
        ${supps.map(s => `<option value="${s.id}" ${prod?.supplierId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Lokasi Penyimpanan</label>
      <select class="form-control" id="f_loc">
        <option value="">-- Pilih Lokasi --</option>
        ${locs.map(l => `<option value="${l.id}" ${prod?.locationId === l.id ? 'selected' : ''}>${l.code} - ${l.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Harga Beli *</label>
      <input class="form-control" id="f_buy" type="number" value="${prod?.buyPrice || ''}" placeholder="0">
    </div>
    <div class="form-group">
      <label>Harga Jual *</label>
      <input class="form-control" id="f_sell" type="number" value="${prod?.sellPrice || ''}" placeholder="0">
    </div>
    <div class="form-group">
      <label>Stok Minimum</label>
      <input class="form-control" id="f_min" type="number" value="${prod?.minStock || 10}" placeholder="10">
    </div>
    ${!id ? `<div class="form-group">
      <label>Stok Awal</label>
      <input class="form-control" id="f_stock" type="number" value="0" placeholder="0">
    </div>` : ''}
    <div class="form-group full">
      <label>Deskripsi</label>
      <textarea class="form-control" id="f_desc" rows="2" placeholder="Deskripsi produk...">${prod?.description || ''}</textarea>
    </div>
  </div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="saveProduct(${id || 'null'})">💾 Simpan</button>
  </div>`;
  openModal(id ? 'Edit Produk' : 'Tambah Produk Baru', html);
}

function saveProduct(id) {
  const sku = document.getElementById('f_sku').value.trim();
  const name = document.getElementById('f_name').value.trim();
  const buy = parseFloat(document.getElementById('f_buy').value);
  const sell = parseFloat(document.getElementById('f_sell').value);
  if (!sku || !name || !buy || !sell) { toast('Harap lengkapi field wajib', 'error'); return; }

  const data = {
    id: id || null,
    sku, name, status: document.getElementById('f_status').value,
    categoryId: parseInt(document.getElementById('f_cat').value),
    unitId: parseInt(document.getElementById('f_unit').value),
    supplierId: parseInt(document.getElementById('f_supp').value) || null,
    locationId: parseInt(document.getElementById('f_loc').value) || null,
    buyPrice: buy, sellPrice: sell,
    minStock: parseInt(document.getElementById('f_min').value) || 10,
    description: document.getElementById('f_desc').value,
  };
  if (!id) data.stock = parseInt(document.getElementById('f_stock').value) || 0;

  DB.saveProduct(data);
  closeModal();
  toast(id ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan');
  products();
}

function viewProduct(id) {
  const p = DB.getProducts().find(x => x.id === id);
  if (!p) return;
  const html = `
  <div class="info-grid">
    <div class="info-item"><label>SKU</label><span>${p.sku}</span></div>
    <div class="info-item"><label>Status</label><span class="badge ${p.status === 'Aktif' ? 'badge-green' : 'badge-gray'}">${p.status}</span></div>
    <div class="info-item" style="grid-column:1/-1"><label>Nama Produk</label><span>${p.name}</span></div>
    <div class="info-item"><label>Kategori</label><span>${p.categoryName}</span></div>
    <div class="info-item"><label>Satuan</label><span>${p.unitName}</span></div>
    <div class="info-item"><label>Supplier</label><span>${p.supplierName}</span></div>
    <div class="info-item"><label>Lokasi</label><span>${p.locationName}</span></div>
    <div class="info-item"><label>Harga Beli</label><span>${fmt.currency(p.buyPrice)}</span></div>
    <div class="info-item"><label>Harga Jual</label><span>${fmt.currency(p.sellPrice)}</span></div>
    <div class="info-item"><label>Stok Saat Ini</label><span style="font-weight:700;font-size:20px">${fmt.num(p.stock)} ${p.unitName}</span></div>
    <div class="info-item"><label>Stok Minimum</label><span>${p.minStock} ${p.unitName}</span></div>
    <div class="info-item"><label>Nilai Stok</label><span>${fmt.currency(p.stock * p.buyPrice)}</span></div>
    <div class="info-item"><label>Status Stok</label>${getBadge(p.stock, p.minStock)}</div>
  </div>
  ${p.description ? `<div class="divider"></div><div class="info-item"><label>Deskripsi</label><span>${p.description}</span></div>` : ''}`;
  openModal('Detail Produk', html);
}

function deleteProduct(id) {
  const p = DB.getOne('products', id);
  openModal('Hapus Produk', `
  <div class="confirm-text">Yakin ingin menghapus produk ini?</div>
  <div class="highlight-box">${p.sku} — ${p.name}</div>
  <div class="confirm-text" style="color:var(--red)">⚠ Data tidak dapat dikembalikan.</div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-danger" onclick="DB.deleteProduct(${id});closeModal();toast('Produk dihapus','warning');products()">🗑 Hapus</button>
  </div>`);
}

/* ============================================================
   INVENTORY
   ============================================================ */
function inventory(filter = 'all') {
  let list = DB.getProducts();
  if (filter === 'low') list = list.filter(p => p.stock > 0 && p.stock <= p.minStock);
  if (filter === 'empty') list = list.filter(p => p.stock <= 0);
  if (filter === 'normal') list = list.filter(p => p.stock > p.minStock);

  document.getElementById('pageContent').innerHTML = `
  <div class="page-header">
    <div class="page-title">Inventori</div>
    <div class="header-actions">
      <button class="btn btn-secondary" onclick="navigate('adjustment')">± Penyesuaian Stok</button>
    </div>
  </div>
  <div class="page-body">
    <div class="toolbar">
      <button class="btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="inventory('all')">Semua</button>
      <button class="btn ${filter === 'normal' ? 'btn-primary' : 'btn-secondary'}" onclick="inventory('normal')">Normal</button>
      <button class="btn ${filter === 'low' ? 'btn-primary' : 'btn-secondary'}" onclick="inventory('low')">Menipis</button>
      <button class="btn ${filter === 'empty' ? 'btn-primary' : 'btn-secondary'}" onclick="inventory('empty')">Habis</button>
      <span class="text-muted">${list.length} item</span>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>SKU</th><th>Produk</th><th>Lokasi</th>
            <th>Stok Saat Ini</th><th>Min. Stok</th><th>Status</th>
            <th>Nilai Stok</th><th>Aksi</th>
          </tr></thead>
          <tbody>
            ${list.length === 0 ? `<tr><td colspan="8" class="empty-state">Tidak ada data</td></tr>` :
            list.map(p => `<tr>
              <td><code style="font-size:12px;background:var(--gray-100);padding:2px 6px;border-radius:4px">${p.sku}</code></td>
              <td><div style="font-weight:500">${p.name}</div><div class="text-muted">${p.categoryName}</div></td>
              <td style="font-size:12px;color:var(--gray-600)">${p.locationName}</td>
              <td>
                <div style="font-weight:700;font-size:16px">${fmt.num(p.stock)}</div>
                <div class="text-muted">${p.unitName}</div>
              </td>
              <td>${fmt.num(p.minStock)} ${p.unitName}</td>
              <td>${getBadge(p.stock, p.minStock)}</td>
              <td>${fmt.currency(p.stock * p.buyPrice)}</td>
              <td>
                <button class="btn btn-sm btn-secondary" onclick="quickAdjust(${p.id})">± Sesuaikan</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function quickAdjust(productId) {
  const p = DB.getOne('products', productId);
  openModal('Penyesuaian Cepat — ' + p.name, `
  <div style="text-align:center;margin-bottom:20px">
    <div class="stat-value">${fmt.num(p.stock)}</div>
    <div class="text-muted">Stok saat ini</div>
  </div>
  <div class="form-grid cols-1">
    <div class="form-group">
      <label>Perubahan Stok (+ tambah / - kurangi)</label>
      <input class="form-control" id="qa_delta" type="number" placeholder="contoh: +10 atau -5" style="font-size:18px;text-align:center">
    </div>
    <div class="form-group">
      <label>Keterangan</label>
      <input class="form-control" id="qa_note" placeholder="Alasan penyesuaian">
    </div>
  </div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="doQuickAdjust(${productId})">Simpan</button>
  </div>`);
}

function doQuickAdjust(productId) {
  const delta = parseInt(document.getElementById('qa_delta').value);
  const note = document.getElementById('qa_note').value;
  if (isNaN(delta) || delta === 0) { toast('Masukkan jumlah perubahan', 'error'); return; }
  DB.addTransaction({ type: 'ADJ', productId, qty: delta, locationId: DB.getOne('products', productId)?.locationId, note: note || 'Penyesuaian manual' });
  closeModal();
  toast('Stok berhasil disesuaikan');
  inventory();
}

/* ============================================================
   LOCATIONS
   ============================================================ */
function locations() {
  const list = DB.get('locations');
  document.getElementById('pageContent').innerHTML = `
  <div class="page-header">
    <div class="page-title">Lokasi Gudang</div>
    <div class="header-actions">
      <button class="btn btn-primary" onclick="editLocation()">+ Tambah Lokasi</button>
    </div>
  </div>
  <div class="page-body">
    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Kode</th><th>Nama Lokasi</th><th>Zona</th><th>Kapasitas</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
          ${list.map(l => `<tr>
            <td><code style="font-size:12px;background:var(--blue-light);color:var(--blue-dark);padding:3px 8px;border-radius:4px">${l.code}</code></td>
            <td style="font-weight:500">${l.name}</td>
            <td>${l.zone}</td>
            <td>${fmt.num(l.capacity)} unit</td>
            <td><span class="badge ${l.status === 'Aktif' ? 'badge-green' : 'badge-gray'}">${l.status}</span></td>
            <td>
              <div style="display:flex;gap:4px">
                <button class="btn btn-sm btn-secondary" onclick="editLocation(${l.id})">✏️ Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteLocation(${l.id})">🗑</button>
              </div>
            </td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function editLocation(id = null) {
  const loc = id ? DB.getOne('locations', id) : null;
  openModal(id ? 'Edit Lokasi' : 'Tambah Lokasi', `
  <div class="form-grid">
    <div class="form-group"><label>Kode Lokasi *</label><input class="form-control" id="fl_code" value="${loc?.code || ''}" placeholder="RAK-A01"></div>
    <div class="form-group"><label>Zona</label><input class="form-control" id="fl_zone" value="${loc?.zone || ''}" placeholder="Zona A"></div>
    <div class="form-group full"><label>Nama Lokasi *</label><input class="form-control" id="fl_name" value="${loc?.name || ''}" placeholder="Rak A - Baris 1"></div>
    <div class="form-group"><label>Kapasitas (unit)</label><input class="form-control" id="fl_cap" type="number" value="${loc?.capacity || 100}"></div>
    <div class="form-group"><label>Status</label><select class="form-control" id="fl_stat"><option ${loc?.status !== 'Nonaktif' ? 'selected' : ''}>Aktif</option><option ${loc?.status === 'Nonaktif' ? 'selected' : ''}>Nonaktif</option></select></div>
  </div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="saveLocation(${id || 'null'})">💾 Simpan</button>
  </div>`);
}

function saveLocation(id) {
  const code = document.getElementById('fl_code').value.trim();
  const name = document.getElementById('fl_name').value.trim();
  if (!code || !name) { toast('Kode dan nama wajib diisi', 'error'); return; }
  DB.saveLocation({ id, code, name, zone: document.getElementById('fl_zone').value, capacity: parseInt(document.getElementById('fl_cap').value) || 100, status: document.getElementById('fl_stat').value });
  closeModal(); toast('Lokasi disimpan'); locations();
}

function deleteLocation(id) {
  const l = DB.getOne('locations', id);
  openModal('Hapus Lokasi', `<div class="confirm-text">Hapus lokasi <strong>${l.code} - ${l.name}</strong>?</div><div class="form-actions"><button class="btn btn-secondary" onclick="closeModal()">Batal</button><button class="btn btn-danger" onclick="DB.deleteLocation(${id});closeModal();toast('Lokasi dihapus','warning');locations()">Hapus</button></div>`);
}

function previewSelectedImage(input, previewId, imageId) {
  const previewWrap = document.getElementById(previewId);
  const previewImg = document.getElementById(imageId);
  if (!previewWrap || !previewImg || !input?.files?.length) {
    if (previewWrap) previewWrap.style.display = 'none';
    return;
  }

  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    previewImg.src = reader.result;
    previewWrap.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function readFileAsDataUrl(file) {
  if (!file) return '';
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function formatGeoLocation(position) {
  const lat = position.coords.latitude.toFixed(6);
  const lng = position.coords.longitude.toFixed(6);
  const accuracy = position.coords.accuracy ? ` (±${Math.round(position.coords.accuracy)}m)` : '';
  return `${lat}, ${lng}${accuracy}`;
}

function startLiveLocation(inputId, statusId) {
  const inputEl = document.getElementById(inputId);
  const statusEl = document.getElementById(statusId);
  if (!navigator.geolocation) {
    toast('Browser tidak mendukung GPS', 'error');
    return;
  }

  clearActiveGeoWatch();
  if (statusEl) statusEl.textContent = 'Mencari lokasi...';
  if (inputEl) inputEl.value = '';

  window.__geoWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const value = formatGeoLocation(position);
      if (inputEl) inputEl.value = value;
      if (statusEl) statusEl.textContent = `Lokasi aktif • ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    },
    (error) => {
      let message = 'Gagal mengambil lokasi';
      if (error.code === 1) message = 'Izin lokasi ditolak';
      if (error.code === 2) message = 'Lokasi tidak tersedia saat ini';
      if (error.code === 3) message = 'Waktu pencarian lokasi habis';
      if (statusEl) statusEl.textContent = message;
      toast(message, 'error');
    },
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
  );
}

function stopLiveLocation(statusId = null) {
  clearActiveGeoWatch();
  const statusEl = statusId ? document.getElementById(statusId) : null;
  if (statusEl) statusEl.textContent = 'Pelacakan lokasi dihentikan';
}

/* ============================================================
   INBOUND (Barang Masuk)
   ============================================================ */
function inbound() {
  const txs = DB.getTransactions().filter(t => t.type === 'IN');
  document.getElementById('pageContent').innerHTML = `
  <div class="page-header">
    <div class="page-title">Barang Masuk</div>
    <div class="header-actions">
      <button class="btn btn-primary" onclick="addInbound()">+ Terima Barang</button>
    </div>
  </div>
  <div class="page-body">
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">
      <div class="stat-card"><div class="stat-icon green">📥</div><div><div class="stat-label">Total Penerimaan</div><div class="stat-value">${txs.length}</div></div></div>
      <div class="stat-card"><div class="stat-icon blue">📦</div><div><div class="stat-label">Total Unit Masuk</div><div class="stat-value">${fmt.num(txs.reduce((s,t)=>s+t.qty,0))}</div></div></div>
      <div class="stat-card"><div class="stat-icon green">📅</div><div><div class="stat-label">Bulan Ini</div><div class="stat-value">${txs.filter(t => new Date(t.createdAt).getMonth() === new Date().getMonth()).length}</div></div></div>
    </div>
    ${txTable(txs)}
  </div>`;
}

function addInbound() {
  const prods = DB.get('products');
  const locs = DB.get('locations');
  openModal('Terima Barang Masuk', `
  <div class="form-grid cols-1">
    <div class="form-group"><label>Produk *</label>
      <select class="form-control" id="ib_prod">
        <option value="">-- Pilih Produk --</option>
        ${prods.map(p => `<option value="${p.id}">[${p.sku}] ${p.name} (Stok: ${p.stock})</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Jumlah *</label><input class="form-control" id="ib_qty" type="number" min="1" placeholder="0"></div>
    <div class="form-group"><label>Foto Barang</label>
      <input class="form-control" id="ib_photo" type="file" accept="image/*" onchange="previewSelectedImage(this,'ib_photo_preview','ib_photo_img')">
      <div id="ib_photo_preview" style="margin-top:8px;display:none">
        <img id="ib_photo_img" style="max-width:100%;max-height:180px;border-radius:8px;border:1px solid var(--gray-200);object-fit:cover;" alt="Preview foto barang">
      </div>
    </div>
    <div class="form-group"><label>Lokasi Foto / Area</label><input class="form-control" id="ib_photo_loc" placeholder="Contoh: Dock A / Area Penerimaan"></div>
    <div class="form-group"><label>Lokasi Real-Time</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">
        <button type="button" class="btn btn-sm btn-secondary" onclick="startLiveLocation('ib_geo','ib_geo_status')">📍 Lacak Lokasi</button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="stopLiveLocation('ib_geo_status')">⏹ Hentikan</button>
      </div>
      <input class="form-control" id="ib_geo" placeholder="Klik tombol lacak lokasi" readonly>
      <div id="ib_geo_status" style="font-size:12px;color:var(--gray-600);margin-top:4px">Belum aktif</div>
    </div>
    <div class="form-group"><label>Tempat Penyimpanan *</label>
      <select class="form-control" id="ib_loc">
        ${locs.map(l => `<option value="${l.id}">${l.code} - ${l.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Catatan</label><textarea class="form-control" id="ib_note" rows="2" placeholder="No. PO, sumber barang, dll..."></textarea></div>
  </div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-success" onclick="saveInbound()">✓ Terima Barang</button>
  </div>`);
}

async function saveInbound() {
  const prodId = parseInt(document.getElementById('ib_prod').value);
  const qty = parseInt(document.getElementById('ib_qty').value);
  const locId = parseInt(document.getElementById('ib_loc').value);
  const note = document.getElementById('ib_note').value;
  const photoLocation = document.getElementById('ib_photo_loc').value.trim();
  const geoLocation = document.getElementById('ib_geo').value.trim();
  const photoFile = document.getElementById('ib_photo').files[0];
  const photoData = await readFileAsDataUrl(photoFile);
  const storageLocationName = DB.getOne('locations', locId)?.name || '-';

  if (!prodId || isNaN(qty) || qty <= 0) { toast('Lengkapi data yang diperlukan', 'error'); return; }
  saveTx('IN', 'ib_prod', 'ib_qty', 'ib_loc', 'ib_note', inbound, null, {
    photoData,
    photoLocation,
    geoLocation,
    storageLocationName,
    note: note || '-'
  });
}

/* ============================================================
   OUTBOUND (Barang Keluar)
   ============================================================ */
function outbound() {
  const txs = DB.getTransactions().filter(t => t.type === 'OUT');
  document.getElementById('pageContent').innerHTML = `
  <div class="page-header">
    <div class="page-title">Barang Keluar</div>
    <div class="header-actions">
      <button class="btn btn-primary" onclick="addOutbound()">+ Kirim Barang</button>
    </div>
  </div>
  <div class="page-body">
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">
      <div class="stat-card"><div class="stat-icon blue">📤</div><div><div class="stat-label">Total Pengiriman</div><div class="stat-value">${txs.length}</div></div></div>
      <div class="stat-card"><div class="stat-icon red">📦</div><div><div class="stat-label">Total Unit Keluar</div><div class="stat-value">${fmt.num(txs.reduce((s,t)=>s+t.qty,0))}</div></div></div>
      <div class="stat-card"><div class="stat-icon blue">📅</div><div><div class="stat-label">Bulan Ini</div><div class="stat-value">${txs.filter(t => new Date(t.createdAt).getMonth() === new Date().getMonth()).length}</div></div></div>
    </div>
    ${txTable(txs)}
  </div>`;
}

function addOutbound() {
  const prods = DB.get('products').filter(p => p.stock > 0);
  const locs = DB.get('locations');
  openModal('Kirim Barang Keluar', `
  <div class="form-grid cols-1">
    <div class="form-group"><label>Produk *</label>
      <select class="form-control" id="ob_prod" onchange="updateMaxQty(this.value,'ob_qty')">
        <option value="">-- Pilih Produk --</option>
        ${prods.map(p => `<option value="${p.id}" data-stock="${p.stock}">[${p.sku}] ${p.name} (Stok: ${p.stock})</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Jumlah * <span id="ob_maxhint" style="color:var(--gray-500);font-weight:400"></span></label>
      <input class="form-control" id="ob_qty" type="number" min="1" placeholder="0">
    </div>
    <div class="form-group"><label>Foto Barang</label>
      <input class="form-control" id="ob_photo" type="file" accept="image/*" onchange="previewSelectedImage(this,'ob_photo_preview','ob_photo_img')">
      <div id="ob_photo_preview" style="margin-top:8px;display:none">
        <img id="ob_photo_img" style="max-width:100%;max-height:180px;border-radius:8px;border:1px solid var(--gray-200);object-fit:cover;" alt="Preview foto barang">
      </div>
    </div>
    <div class="form-group"><label>Lokasi Foto / Area</label><input class="form-control" id="ob_photo_loc" placeholder="Contoh: Loading Dock / Area Pengiriman"></div>
    <div class="form-group"><label>Lokasi Real-Time</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">
        <button type="button" class="btn btn-sm btn-secondary" onclick="startLiveLocation('ob_geo','ob_geo_status')">📍 Lacak Lokasi</button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="stopLiveLocation('ob_geo_status')">⏹ Hentikan</button>
      </div>
      <input class="form-control" id="ob_geo" placeholder="Klik tombol lacak lokasi" readonly>
      <div id="ob_geo_status" style="font-size:12px;color:var(--gray-600);margin-top:4px">Belum aktif</div>
    </div>
    <div class="form-group"><label>Tempat Penyimpanan *</label>
      <select class="form-control" id="ob_loc">
        ${locs.map(l => `<option value="${l.id}">${l.code} - ${l.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Catatan / Tujuan</label><textarea class="form-control" id="ob_note" rows="2" placeholder="No. DO, tujuan pengiriman..."></textarea></div>
  </div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="saveOutbound()">✓ Kirim Barang</button>
  </div>`);
}

function updateMaxQty(prodId, qtyFieldId) {
  const opt = document.querySelector(`#ob_prod option[value="${prodId}"]`);
  const stock = opt ? parseInt(opt.dataset.stock) : 0;
  document.getElementById('ob_maxhint').textContent = stock ? `(maks. ${stock} unit)` : '';
  document.getElementById(qtyFieldId).max = stock;
}

async function saveOutbound() {
  const prodId = parseInt(document.getElementById('ob_prod').value);
  const qty = parseInt(document.getElementById('ob_qty').value);
  const locId = parseInt(document.getElementById('ob_loc').value);
  const note = document.getElementById('ob_note').value;
  const photoLocation = document.getElementById('ob_photo_loc').value.trim();
  const geoLocation = document.getElementById('ob_geo').value.trim();
  const photoFile = document.getElementById('ob_photo').files[0];
  const photoData = await readFileAsDataUrl(photoFile);
  const storageLocationName = DB.getOne('locations', locId)?.name || '-';
  if (!prodId) { toast('Pilih produk', 'error'); return; }
  const prod = DB.getOne('products', prodId);
  if (qty > prod.stock) { toast(`Stok tidak cukup. Tersedia: ${prod.stock}`, 'error'); return; }
  if (!qty || qty <= 0) { toast('Masukkan jumlah valid', 'error'); return; }
  saveTx('OUT', 'ob_prod', 'ob_qty', 'ob_loc', 'ob_note', outbound, null, {
    photoData,
    photoLocation,
    geoLocation,
    storageLocationName,
    note: note || '-'
  });
}

/* ============================================================
   TRANSFER STOK
   ============================================================ */
function transfer() {
  const txs = DB.getTransactions().filter(t => t.type === 'TRF');
  document.getElementById('pageContent').innerHTML = `
  <div class="page-header">
    <div class="page-title">Transfer Stok</div>
    <div class="header-actions">
      <button class="btn btn-primary" onclick="addTransfer()">+ Transfer Stok</button>
    </div>
  </div>
  <div class="page-body">${txTable(txs)}</div>`;
}

function addTransfer() {
  const prods = DB.get('products').filter(p => p.stock > 0);
  const locs = DB.get('locations');
  openModal('Transfer Stok Antar Lokasi', `
  <div class="form-grid cols-1">
    <div class="form-group"><label>Produk *</label>
      <select class="form-control" id="tr_prod">
        ${prods.map(p => `<option value="${p.id}">[${p.sku}] ${p.name} (Stok: ${p.stock})</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Jumlah *</label><input class="form-control" id="tr_qty" type="number" min="1" placeholder="0"></div>
    <div class="form-group"><label>Dari Lokasi *</label>
      <select class="form-control" id="tr_from">
        ${locs.map(l => `<option value="${l.id}">${l.code} - ${l.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Ke Lokasi *</label>
      <select class="form-control" id="tr_to">
        ${locs.map(l => `<option value="${l.id}">${l.code} - ${l.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Catatan</label><input class="form-control" id="tr_note" placeholder="Alasan transfer..."></div>
  </div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="saveTransfer()">↔ Transfer</button>
  </div>`);
}

function saveTransfer() {
  const prodId = parseInt(document.getElementById('tr_prod').value);
  const qty = parseInt(document.getElementById('tr_qty').value);
  const fromLoc = parseInt(document.getElementById('tr_from').value);
  const toLoc = parseInt(document.getElementById('tr_to').value);
  const note = document.getElementById('tr_note').value;
  if (fromLoc === toLoc) { toast('Lokasi asal dan tujuan tidak boleh sama', 'error'); return; }
  const prod = DB.getOne('products', prodId);
  if (qty > prod.stock) { toast('Stok tidak mencukupi', 'error'); return; }
  const fromName = DB.getOne('locations', fromLoc)?.name;
  const toName = DB.getOne('locations', toLoc)?.name;
  DB.addTransaction({ type: 'TRF', productId: prodId, qty, locationId: fromLoc, note: `Transfer dari ${fromName} ke ${toName}. ${note}` });
  const prods = DB.get('products');
  const idx = prods.findIndex(p => p.id === prodId);
  if (idx !== -1) { prods[idx].locationId = toLoc; DB.set('products', prods); }
  addNotification({ type: 'warning', title: 'Transfer Stok', message: `Stok ${prod.name} dipindahkan dari ${fromName} ke ${toName}.` });
  closeModal(); toast('Transfer berhasil', 'success'); transfer();
}

/* ============================================================
   PENYESUAIAN (Adjustment)
   ============================================================ */
function adjustment() {
  const txs = DB.getTransactions().filter(t => t.type === 'ADJ');
  document.getElementById('pageContent').innerHTML = `
  <div class="page-header">
    <div class="page-title">Penyesuaian Stok</div>
    <div class="header-actions">
      <button class="btn btn-primary" onclick="addAdjustment()">+ Penyesuaian</button>
    </div>
  </div>
  <div class="page-body">${txTable(txs)}</div>`;
}

function addAdjustment() {
  const prods = DB.get('products');
  const locs = DB.get('locations');
  openModal('Penyesuaian Stok', `
  <div class="form-grid cols-1">
    <div class="form-group"><label>Produk *</label>
      <select class="form-control" id="adj_prod">
        ${prods.map(p => `<option value="${p.id}">[${p.sku}] ${p.name} (Stok: ${p.stock})</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Perubahan Jumlah (+ atau -) *</label><input class="form-control" id="adj_qty" type="number" placeholder="contoh: -3 atau +5"></div>
    <div class="form-group"><label>Lokasi</label>
      <select class="form-control" id="adj_loc">
        ${locs.map(l => `<option value="${l.id}">${l.code} - ${l.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Alasan Penyesuaian *</label>
      <select class="form-control" id="adj_reason">
        <option>Stok rusak/cacat</option><option>Produk expired</option>
        <option>Selisih hitung fisik</option><option>Kesalahan input</option><option>Lainnya</option>
      </select>
    </div>
    <div class="form-group"><label>Catatan Tambahan</label><textarea class="form-control" id="adj_note" rows="2"></textarea></div>
  </div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="saveTx('ADJ','adj_prod','adj_qty','adj_loc','adj_note',adjustment,'adj_reason')">Simpan Penyesuaian</button>
  </div>`);
}

function saveTx(type, prodField, qtyField, locField, noteField, callback, reasonField = null, extraData = {}) {
  const prodId = parseInt(document.getElementById(prodField).value);
  const qty = parseInt(document.getElementById(qtyField).value);
  const locId = parseInt(document.getElementById(locField).value);
  let note = document.getElementById(noteField).value;

  if (reasonField) note = document.getElementById(reasonField).value + (note ? ': ' + note : '');
  if (!prodId || isNaN(qty) || qty === 0) { toast('Lengkapi data yang diperlukan', 'error'); return; }

  const tx = DB.addTransaction({ type, productId: prodId, qty, locationId: locId, note: note || '-', ...extraData });
  const prod = DB.getOne('products', prodId);
  const status = prod.stock === 0 ? 'empty' : prod.stock <= prod.minStock ? 'warning' : (type === 'IN' ? 'in' : type === 'OUT' ? 'out' : 'warning');
  const message = type === 'IN'
    ? `Stok masuk +${fmt.num(qty)} untuk ${prod.name}. Sisa: ${fmt.num(prod.stock)}`
    : type === 'OUT'
      ? `Stok keluar -${fmt.num(qty)} untuk ${prod.name}. Sisa: ${fmt.num(prod.stock)}`
      : `Penyesuaian stok ${prod.name} sebesar ${qty > 0 ? '+' : ''}${fmt.num(qty)}. Sisa: ${fmt.num(prod.stock)}`;

  closeModal();
  toast(message, type === 'IN' ? 'success' : type === 'OUT' ? 'warning' : 'warning');
  addNotification({ type: status, title: `${type === 'IN' ? 'Barang Masuk' : type === 'OUT' ? 'Barang Keluar' : 'Penyesuaian'}`, message });
  callback();
}

function addNotification(entry) {
  const notifications = JSON.parse(localStorage.getItem('wms_notifications') || '[]');
  const now = new Date();
  notifications.unshift({
    id: now.getTime(),
    ...entry,
    timestamp: now.toLocaleTimeString('id-ID', { hour12: false }),
  });
  localStorage.setItem('wms_notifications', JSON.stringify(notifications.slice(0, 5)));
}

function getNotifications() {
  return JSON.parse(localStorage.getItem('wms_notifications') || '[]');
}

function showTransactionDetail(tx) {
  const detailHtml = `
    <div class="form-grid cols-1">
      <div class="form-group">
        <label>Foto</label>
        ${tx.photoData ? `<img src="${tx.photoData}" style="width:100%;max-height:280px;object-fit:cover;border-radius:10px;border:1px solid var(--gray-200);" alt="Foto transaksi">` : '<div style="color:var(--gray-500)">Tidak ada foto</div>'}
      </div>
      <div class="form-group"><label>Produk</label><div>${tx.productName || '-'}</div></div>
      <div class="form-group"><label>Jumlah</label><div>${fmt.num(tx.qty)}</div></div>
      <div class="form-group"><label>Tanggal & Jam</label><div>${fmt.datetime(tx.createdAt)}</div></div>
      <div class="form-group"><label>Lokasi Real-Time</label><div>${tx.geoLocation || 'Tidak tersedia'}</div></div>
      <div class="form-group"><label>Lokasi Foto / Area</label><div>${tx.photoLocation || '-'}</div></div>
      <div class="form-group"><label>Tempat Penyimpanan</label><div>${tx.locationName || '-'}</div></div>
      <div class="form-group"><label>Catatan</label><div>${tx.note || '-'}</div></div>
      <div class="form-group"><label>Diproses Oleh</label><div>${tx.createdBy || '-'}</div></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Tutup</button>
    </div>`;
  openModal('Detail Transaksi', detailHtml);
}

function txTable(txs) {
  return `<div class="card"><div class="table-wrapper"><table>
    <thead><tr><th>#</th><th>Produk</th><th>SKU</th><th>Jumlah</th><th>Tipe</th><th>Tempat</th><th>Foto & Lokasi</th><th>Catatan</th><th>Waktu</th><th>Oleh</th></tr></thead>
    <tbody>
    ${txs.length === 0 ? '<tr><td colspan="10" class="empty-state">Belum ada data transaksi</td></tr>' :
    txs.map(t => `<tr>
      <td style="font-size:12px;color:var(--gray-500)">#${t.id}</td>
      <td style="font-weight:500">${t.productName}</td>
      <td><code style="font-size:11px;background:var(--gray-100);padding:2px 5px;border-radius:3px">${t.productSku}</code></td>
      <td style="font-weight:600;color:${t.type === 'IN' ? 'var(--green)' : t.type === 'OUT' ? 'var(--blue-dark)' : 'var(--orange)'}">
        ${t.type === 'ADJ' && t.qty > 0 ? '+' : ''}${fmt.num(t.qty)}
      </td>
      <td>${getTxBadge(t.type)}</td>
      <td style="font-size:12px">${t.locationName || '-'}</td>
      <td style="font-size:12px;min-width:220px">
        ${t.photoData ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><img src="${t.photoData}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--gray-200)" alt="Foto transaksi" /></div>` : '<div style="color:var(--gray-500)">Tidak ada foto</div>'}
        ${t.photoLocation ? `<div style="color:var(--gray-600)">📍 ${t.photoLocation}</div>` : ''}
        ${t.geoLocation ? `<div style="color:var(--blue);margin-top:4px">🛰 ${t.geoLocation}</div>` : ''}
        <div style="margin-top:6px"><button class="btn btn-sm btn-secondary" onclick="showTransactionDetail(${JSON.stringify(t).replace(/"/g, '&quot;')})">Lihat Detail</button></div>
      </td>
      <td style="font-size:12px;color:var(--gray-600);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.note || '-'}</td>
      <td style="font-size:12px;white-space:nowrap">${fmt.datetime(t.createdAt)}</td>
      <td style="font-size:12px">${t.createdBy}</td>
    </tr>`).join('')}
    </tbody>
  </table></div></div>`;
}

/* ============================================================
   SUPPLIERS
   ============================================================ */
function suppliers() {
  const list = DB.get('suppliers');
  document.getElementById('pageContent').innerHTML = `
  <div class="page-header">
    <div class="page-title">Supplier</div>
    <div class="header-actions">
      <button class="btn btn-primary" onclick="editSupplier()">+ Tambah Supplier</button>
    </div>
  </div>
  <div class="page-body">
    <div class="card">
      <div class="table-wrapper"><table>
        <thead><tr><th>Nama Perusahaan</th><th>PIC</th><th>Telepon</th><th>Email</th><th>Status</th><th>Terdaftar</th><th>Aksi</th></tr></thead>
        <tbody>
        ${list.map(s => `<tr>
          <td><div style="font-weight:500">${s.name}</div><div class="text-muted">${s.address || ''}</div></td>
          <td>${s.contact}</td>
          <td>${s.phone}</td>
          <td style="color:var(--blue)">${s.email}</td>
          <td><span class="badge ${s.status === 'Aktif' ? 'badge-green' : 'badge-gray'}">${s.status}</span></td>
          <td style="font-size:12px">${fmt.date(s.createdAt)}</td>
          <td><div style="display:flex;gap:4px">
            <button class="btn btn-sm btn-secondary" onclick="editSupplier(${s.id})">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteSupplier(${s.id})">🗑</button>
          </div></td>
        </tr>`).join('')}
        </tbody>
      </table></div>
    </div>
  </div>`;
}

function editSupplier(id = null) {
  const s = id ? DB.getOne('suppliers', id) : null;
  openModal(id ? 'Edit Supplier' : 'Tambah Supplier', `
  <div class="form-grid">
    <div class="form-group full"><label>Nama Perusahaan *</label><input class="form-control" id="fs_name" value="${s?.name || ''}" placeholder="PT / CV / UD ..."></div>
    <div class="form-group"><label>Nama PIC</label><input class="form-control" id="fs_contact" value="${s?.contact || ''}"></div>
    <div class="form-group"><label>Telepon</label><input class="form-control" id="fs_phone" value="${s?.phone || ''}"></div>
    <div class="form-group"><label>Email</label><input class="form-control" id="fs_email" type="email" value="${s?.email || ''}"></div>
    <div class="form-group"><label>Status</label><select class="form-control" id="fs_stat"><option ${s?.status !== 'Nonaktif' ? 'selected' : ''}>Aktif</option><option ${s?.status === 'Nonaktif' ? 'selected' : ''}>Nonaktif</option></select></div>
    <div class="form-group full"><label>Alamat</label><textarea class="form-control" id="fs_addr" rows="2">${s?.address || ''}</textarea></div>
  </div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="saveSupplier(${id || 'null'})">💾 Simpan</button>
  </div>`);
}

function saveSupplier(id) {
  const name = document.getElementById('fs_name').value.trim();
  if (!name) { toast('Nama supplier wajib diisi', 'error'); return; }
  DB.saveSupplier({ id, name, contact: document.getElementById('fs_contact').value, phone: document.getElementById('fs_phone').value, email: document.getElementById('fs_email').value, address: document.getElementById('fs_addr').value, status: document.getElementById('fs_stat').value });
  closeModal(); toast('Supplier disimpan'); suppliers();
}

function deleteSupplier(id) {
  const s = DB.getOne('suppliers', id);
  openModal('Hapus Supplier', `<div class="confirm-text">Hapus supplier <strong>${s.name}</strong>?</div><div class="form-actions"><button class="btn btn-secondary" onclick="closeModal()">Batal</button><button class="btn btn-danger" onclick="DB.deleteSupplier(${id});closeModal();toast('Supplier dihapus','warning');suppliers()">Hapus</button></div>`);
}

/* ============================================================
   CATEGORIES & UNITS
   ============================================================ */
function categories() {
  const list = DB.get('categories');
  document.getElementById('pageContent').innerHTML = `
  <div class="page-header"><div class="page-title">Kategori Produk</div>
    <div class="header-actions"><button class="btn btn-primary" onclick="editCategory()">+ Tambah Kategori</button></div>
  </div>
  <div class="page-body">
    <div class="card"><div class="table-wrapper"><table>
      <thead><tr><th>Ikon</th><th>Nama Kategori</th><th>Deskripsi</th><th>Jumlah Produk</th><th>Aksi</th></tr></thead>
      <tbody>
      ${list.map(c => {
        const count = DB.get('products').filter(p => p.categoryId === c.id).length;
        return `<tr>
          <td style="font-size:24px">${c.icon || '📁'}</td>
          <td style="font-weight:500">${c.name}</td>
          <td>${c.description}</td>
          <td><span class="badge badge-blue">${count} produk</span></td>
          <td><div style="display:flex;gap:4px">
            <button class="btn btn-sm btn-secondary" onclick="editCategory(${c.id})">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})">🗑</button>
          </div></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table></div></div>
  </div>`;
}

function editCategory(id = null) {
  const c = id ? DB.getOne('categories', id) : null;
  const presetIcons = ['📁', '📦', '👕', '👗', '👖', '🧵', '🪡', '🧷', '👟', '💼', '🏭', '🛒', '🏷️', '🎨'];
  
  const html = `
  <div class="form-grid cols-1">
    <div class="form-group">
      <label>Pilih Ikon Kategori</label>
      <div class="icon-picker-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 12px; background: var(--gray-50); padding: 10px; border-radius: 6px;">
        ${presetIcons.map(icon => `
          <button type="button" class="btn btn-secondary icon-option ${c?.icon === icon || (!c && icon === '📦') ? 'active' : ''}" 
                  style="font-size: 24px; padding: 6px; border: 2px solid ${c?.icon === icon || (!c && icon === '📦') ? 'var(--blue)' : 'transparent'}; transition: all 0.2s;"
                  onclick="selectCategoryIcon(this, '${icon}')">
            ${icon}
          </button>
        `).join('')}
      </div>
      <input type="hidden" id="fc_icon" value="${c?.icon || '📦'}">
    </div>
    <div class="form-group"><label>Nama Kategori *</label><input class="form-control" id="fc_name" value="${c?.name || ''}" placeholder="Contoh: Bahan Baku..."></div>
    <div class="form-group"><label>Deskripsi</label><textarea class="form-control" id="fc_desc" rows="2" placeholder="Deskripsi singkat...">${c?.description || ''}</textarea></div>
  </div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="saveCategory(${id || 'null'})">💾 Simpan</button>
  </div>`;
  openModal(id ? 'Edit Kategori' : 'Tambah Kategori', html);
}

function selectCategoryIcon(button, iconValue) {
  document.querySelectorAll('.icon-option').forEach(btn => btn.style.borderColor = 'transparent');
  button.style.borderColor = 'var(--blue)';
  document.getElementById('fc_icon').value = iconValue;
}

function saveCategory(id) {
  const name = document.getElementById('fc_name').value.trim();
  if (!name) { toast('Nama kategori wajib diisi', 'error'); return; }
  DB.saveCategory({ id, name, icon: document.getElementById('fc_icon').value, description: document.getElementById('fc_desc').value });
  closeModal(); toast('Kategori disimpan'); categories();
}

function deleteCategory(id) {
  const c = DB.getOne('categories', id);
  const used = DB.get('products').filter(p => p.categoryId === id).length;
  if (used > 0) { toast(`Tidak bisa hapus — digunakan ${used} produk`, 'error'); return; }
  openModal('Hapus Kategori', `<div class="confirm-text">Hapus kategori <strong>${c.name}</strong>?</div><div class="form-actions"><button class="btn btn-secondary" onclick="closeModal()">Batal</button><button class="btn btn-danger" onclick="DB.deleteCategory(${id});closeModal();toast('Kategori dihapus','warning');categories()">Hapus</button></div>`);
}

function units() {
  const list = DB.get('units');
  document.getElementById('pageContent').innerHTML = `
  <div class="page-header"><div class="page-title">Satuan</div>
    <div class="header-actions"><button class="btn btn-primary" onclick="editUnit()">+ Tambah Satuan</button></div>
  </div>
  <div class="page-body">
    <div class="card"><div class="table-wrapper"><table>
      <thead><tr><th>Nama Satuan</th><th>Deskripsi</th><th>Digunakan</th><th>Aksi</th></tr></thead>
      <tbody>
      ${list.map(u => {
        const count = DB.get('products').filter(p => p.unitId === u.id).length;
        return `<tr>
          <td style="font-weight:600">${u.name}</td>
          <td>${u.description}</td>
          <td><span class="badge badge-blue">${count} produk</span></td>
          <td><div style="display:flex;gap:4px">
            <button class="btn btn-sm btn-secondary" onclick="editUnit(${u.id})">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteUnit(${u.id})">🗑</button>
          </div></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table></div></div>
  </div>`;
}

function editUnit(id = null) {
  const u = id ? DB.getOne('units', id) : null;
  openModal(id ? 'Edit Satuan' : 'Tambah Satuan', `
  <div class="form-grid cols-1">
    <div class="form-group"><label>Nama Satuan *</label><input class="form-control" id="fu_name" value="${u?.name || ''}" placeholder="Pcs, Kg, Liter, Box..."></div>
    <div class="form-group"><label>Deskripsi</label><input class="form-control" id="fu_desc" value="${u?.description || ''}"></div>
  </div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="saveUnit(${id || 'null'})">💾 Simpan</button>
  </div>`);
}

function saveUnit(id) {
  const name = document.getElementById('fu_name').value.trim();
  if (!name) { toast('Nama satuan wajib diisi', 'error'); return; }
  DB.saveUnit({ id, name, description: document.getElementById('fu_desc').value });
  closeModal(); toast('Satuan disimpan'); units();
}

function deleteUnit(id) {
  const u = DB.getOne('units', id);
  const used = DB.get('products').filter(p => p.unitId === id).length;
  if (used > 0) { toast(`Tidak bisa hapus — digunakan ${used} produk`, 'error'); return; }
  openModal('Hapus Satuan', `<div class="confirm-text">Hapus satuan <strong>${u.name}</strong>?</div><div class="form-actions"><button class="btn btn-secondary" onclick="closeModal()">Batal</button><button class="btn btn-danger" onclick="DB.deleteUnit(${id});closeModal();toast('Satuan dihapus','warning');units()">Hapus</button></div>`);
}

/* ============================================================
   REPORTS
   ============================================================ */
function reports() {
  const prods = DB.getProducts();
  const totalValue = prods.reduce((s, p) => s + p.stock * p.buyPrice, 0);
  const totalSellValue = prods.reduce((s, p) => s + p.stock * p.sellPrice, 0);
  const cats = DB.get('categories');
  const byCat = cats.map(c => {
    const items = prods.filter(p => p.categoryId === c.id);
    return { name: c.name, count: items.length, stock: items.reduce((s, p) => s + p.stock, 0), value: items.reduce((s, p) => s + p.stock * p.buyPrice, 0) };
  }).filter(c => c.count > 0).sort((a, b) => b.value - a.value);
  const maxVal = Math.max(...byCat.map(c => c.value), 1);

  document.getElementById('pageContent').innerHTML = `
  <div class="page-header"><div class="page-title">Laporan Stok</div>
    <div class="header-actions">
      <button class="btn btn-secondary" onclick="printReport()">🖨 Cetak</button>
    </div>
  </div>
  <div class="page-body">
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card"><div class="stat-icon blue">📦</div><div><div class="stat-label">Total Produk</div><div class="stat-value">${prods.length}</div></div></div>
      <div class="stat-card"><div class="stat-icon green">🏪</div><div><div class="stat-label">Total Stok</div><div class="stat-value">${fmt.num(prods.reduce((s,p)=>s+p.stock,0))}</div></div></div>
      <div class="stat-card"><div class="stat-icon orange">💰</div><div><div class="stat-label">Nilai Beli</div><div class="stat-value" style="font-size:16px">${fmt.currency(totalValue)}</div></div></div>
      <div class="stat-card"><div class="stat-icon green">💵</div><div><div class="stat-label">Nilai Jual</div><div class="stat-value" style="font-size:16px">${fmt.currency(totalSellValue)}</div></div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div class="card">
        <div class="card-header"><span class="card-title">Nilai Stok per Kategori</span></div>
        <div class="card-body">
          <div class="bar-chart">
          ${byCat.map(c => `
            <div class="bar-row">
              <div class="bar-label" style="font-size:11px">${c.name}</div>
              <div class="bar-track"><div class="bar-fill" style="width:${(c.value/maxVal*100).toFixed(1)}%"></div></div>
              <div style="font-size:11px;min-width:80px;text-align:right">${fmt.currency(c.value)}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Ringkasan per Kategori</span></div>
        <div class="card-body" style="padding:0">
          <table><thead><tr><th>Kategori</th><th>Produk</th><th>Total Stok</th></tr></thead>
          <tbody>${byCat.map(c => `<tr><td>${c.name}</td><td>${c.count} produk</td><td>${fmt.num(c.stock)} unit</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Daftar Stok Lengkap</span></div>
      <div class="table-wrapper"><table>
        <thead><tr><th>SKU</th><th>Produk</th><th>Kategori</th><th>Stok</th><th>Min</th><th>Status</th><th>H. Beli</th><th>H. Jual</th><th>Nilai Stok</th></tr></thead>
        <tbody>
        ${prods.sort((a, b) => a.categoryId - b.categoryId).map(p => `<tr>
          <td><code style="font-size:11px;background:var(--gray-100);padding:2px 5px;border-radius:3px">${p.sku}</code></td>
          <td style="font-weight:500">${p.name}</td>
          <td>${p.categoryName}</td>
          <td style="font-weight:700">${fmt.num(p.stock)} ${p.unitName}</td>
          <td>${p.minStock}</td>
          <td>${getBadge(p.stock, p.minStock)}</td>
          <td>${fmt.currency(p.buyPrice)}</td>
          <td>${fmt.currency(p.sellPrice)}</td>
          <td style="font-weight:500">${fmt.currency(p.stock * p.buyPrice)}</td>
        </tr>`).join('')}
        </tbody>
      </table></div>
    </div>
  </div>`;
}

function printReport() { window.print(); }

/* ============================================================
   HISTORY (Riwayat Transaksi)
   ============================================================ */
function history(typeFilter = '', search = '') {
  let txs = DB.getTransactions();
  if (typeFilter) txs = txs.filter(t => t.type === typeFilter);
  if (search) txs = txs.filter(t => t.productName.toLowerCase().includes(search.toLowerCase()) || t.productSku.toLowerCase().includes(search.toLowerCase()));

  document.getElementById('pageContent').innerHTML = `
  <div class="page-header"><div class="page-title">Riwayat Transaksi</div>
    <div class="header-actions">
      <button class="btn btn-secondary" onclick="exportCSV()">📥 Export CSV</button>
    </div>
  </div>
  <div class="page-body">
    <div class="toolbar">
      <div class="search-box"><input type="text" placeholder="Cari produk..." id="histSearch" value="${search}" oninput="history(document.getElementById('histType').value, this.value)"></div>
      <select class="filter" id="histType" onchange="history(this.value, document.getElementById('histSearch').value)">
        <option value="">Semua Tipe</option>
        <option value="IN" ${typeFilter === 'IN' ? 'selected' : ''}>Barang Masuk</option>
        <option value="OUT" ${typeFilter === 'OUT' ? 'selected' : ''}>Barang Keluar</option>
        <option value="ADJ" ${typeFilter === 'ADJ' ? 'selected' : ''}>Penyesuaian</option>
        <option value="TRF" ${typeFilter === 'TRF' ? 'selected' : ''}>Transfer</option>
      </select>
      <span class="text-muted">${txs.length} transaksi</span>
    </div>
    ${txTable(txs)}
  </div>`;
}

function exportCSV() {
  const txs = DB.getTransactions();
  const header = ['ID', 'Tipe', 'Produk', 'SKU', 'Jumlah', 'Lokasi', 'Catatan', 'Waktu', 'Oleh'];
  const rows = txs.map(t => [t.id, t.type, t.productName, t.productSku, t.qty, t.locationName, t.note, fmt.datetime(t.createdAt), t.createdBy]);
  const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'wms_transaksi_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  toast('File CSV berhasil diunduh');
}

/* ============================================================
   TESTING & DUMMY DATA SEEDER
   ============================================================ */
function injectDummyData() {
  const categories = [
    { id: 1, name: 'Kain & Bahan Utama', icon: '🧵', description: 'Bahan mentah' },
    { id: 2, name: 'Benang', icon: '🪡', description: 'Berbagai jenis benang jahit' },
    { id: 3, name: 'Aksesoris', icon: '🧷', description: 'Kancing, resleting, label, dll' }
  ];

  const units = [
    { id: 1, name: 'Yard', description: 'Satuan panjang kain' },
    { id: 2, name: 'Meter', description: 'Satuan panjang' },
    { id: 3, name: 'Kg', description: 'Satuan berat' },
    { id: 4, name: 'Pcs', description: 'Satuan keping/buah' },
    { id: 5, name: 'Cone', description: 'Satuan gulungan benang' }
  ];

  const locations = [
    { id: 1, code: 'GDG-IN', name: 'Gudang Inbound', zone: 'Penerimaan', capacity: 5000, status: 'Aktif' },
    { id: 2, code: 'PRD-CUT', name: 'Area Cutting', zone: 'Produksi', capacity: 1000, status: 'Aktif' },
    { id: 3, code: 'PRD-SPG', name: 'Area Sponging', zone: 'Produksi', capacity: 1000, status: 'Aktif' },
    { id: 4, code: 'PRD-T3', name: 'Area T3', zone: 'Finishing', capacity: 2000, status: 'Aktif' },
    { id: 5, code: 'GDG-OUT', name: 'Gudang Outbound', zone: 'Pengiriman', capacity: 5000, status: 'Aktif' }
  ];

  const suppliers = [
    { id: 1, name: 'PT Trisco Textile', contact: 'Bapak Hendra', phone: '081234567890', email: 'sales@trisco.co.id', address: 'Cimahi, Jawa Barat', status: 'Aktif', createdAt: new Date().toISOString() },
    { id: 2, name: 'CV Maju Benang', contact: 'Ibu Siska', phone: '089876543210', email: 'order@majubnng.com', address: 'Bandung', status: 'Aktif', createdAt: new Date().toISOString() },
    { id: 3, name: 'Aksesoris Garmen Jaya', contact: 'Budi', phone: '081122334455', email: 'budi@aksesoris.com', address: 'Bandung', status: 'Aktif', createdAt: new Date().toISOString() }
  ];

  const products = [
    { id: 1, sku: 'FAB-TC-001', name: 'Kain TC Putih', status: 'Aktif', categoryId: 1, unitId: 1, supplierId: 1, locationId: 1, buyPrice: 15000, sellPrice: 18000, minStock: 500, description: 'Kain Tetoron Cotton standar', stock: 1500 },
    { id: 2, sku: 'FAB-CMB-002', name: 'Kain Katun Combed 30s Hitam', status: 'Aktif', categoryId: 1, unitId: 3, supplierId: 1, locationId: 1, buyPrice: 75000, sellPrice: 85000, minStock: 100, description: 'Bahan kaos premium', stock: 350 },
    { id: 3, sku: 'THR-PLY-001', name: 'Benang Jahit Polyester Hitam', status: 'Aktif', categoryId: 2, unitId: 5, supplierId: 2, locationId: 1, buyPrice: 12000, sellPrice: 15000, minStock: 50, description: 'Benang jahit standar', stock: 120 },
    { id: 4, sku: 'ACC-BTN-001', name: 'Kancing Kemeja 15mm Putih', status: 'Aktif', categoryId: 3, unitId: 4, supplierId: 3, locationId: 1, buyPrice: 150, sellPrice: 300, minStock: 2000, description: 'Kancing standar', stock: 5000 }
  ];

  const d = new Date();
  const pastDate = (monthsAgo) => new Date(d.getFullYear(), d.getMonth() - monthsAgo, Math.floor(Math.random() * 20) + 1).toISOString();

  const transactions = [
    { id: 1, type: 'IN', productId: 1, productName: 'Kain TC Putih', productSku: 'FAB-TC-001', qty: 2500, locationId: 1, locationName: 'Gudang Inbound', note: 'Restock kain', createdAt: pastDate(5), createdBy: 'Admin' },
    { id: 2, type: 'OUT', productId: 1, productName: 'Kain TC Putih', productSku: 'FAB-TC-001', qty: 1000, locationId: 2, locationName: 'Area Cutting', note: 'Kirim ke pemotongan', createdAt: pastDate(4), createdBy: 'Admin' },
    { id: 3, type: 'IN', productId: 2, productName: 'Kain Katun Combed 30s Hitam', productSku: 'FAB-CMB-002', qty: 800, locationId: 1, locationName: 'Gudang Inbound', note: 'Bahan kaos baru', createdAt: pastDate(4), createdBy: 'Admin' },
    { id: 4, type: 'OUT', productId: 2, productName: 'Kain Katun Combed 30s Hitam', productSku: 'FAB-CMB-002', qty: 450, locationId: 2, locationName: 'Area Cutting', note: 'Produksi kaos', createdAt: pastDate(3), createdBy: 'Admin' },
    { id: 5, type: 'IN', productId: 3, productName: 'Benang Jahit Polyester Hitam', productSku: 'THR-PLY-001', qty: 300, locationId: 1, locationName: 'Gudang Inbound', note: 'Restock benang', createdAt: pastDate(3), createdBy: 'Admin' },
    { id: 6, type: 'OUT', productId: 3, productName: 'Benang Jahit Polyester Hitam', productSku: 'THR-PLY-001', qty: 180, locationId: 3, locationName: 'Area Sponging', note: 'Dipakai jahit', createdAt: pastDate(2), createdBy: 'Admin' },
    { id: 7, type: 'IN', productId: 4, productName: 'Kancing Kemeja 15mm Putih', productSku: 'ACC-BTN-001', qty: 10000, locationId: 1, locationName: 'Gudang Inbound', note: 'Beli aksesoris', createdAt: pastDate(1), createdBy: 'Admin' },
    { id: 8, type: 'OUT', productId: 4, productName: 'Kancing Kemeja 15mm Putih', productSku: 'ACC-BTN-001', qty: 5000, locationId: 4, locationName: 'Area T3', note: 'Finishing kemeja', createdAt: pastDate(1), createdBy: 'Admin' },
    { id: 9, type: 'IN', productId: 1, productName: 'Kain TC Putih', productSku: 'FAB-TC-001', qty: 1500, locationId: 1, locationName: 'Gudang Inbound', note: 'Penerimaan rutin', createdAt: new Date().toISOString(), createdBy: 'Admin' },
    { id: 10, type: 'OUT', productId: 1, productName: 'Kain TC Putih', productSku: 'FAB-TC-001', qty: 200, locationId: 2, locationName: 'Area Cutting', note: 'Sample cutting', createdAt: new Date().toISOString(), createdBy: 'Admin' }
  ];

  DB.set('categories', categories);
  DB.set('units', units);
  DB.set('locations', locations);
  DB.set('suppliers', suppliers);
  DB.set('products', products);
  DB.set('transactions', transactions);

  toast('Data uji coba berhasil ditambahkan ke sistem!', 'success');
  dashboard();
}

/* ============================================================
   LOGIKA LOGIN & INISIALISASI APLIKASI
   ============================================================ */

function processLogin(event) {
  event.preventDefault();

  const btn = document.getElementById('btnLogin');
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value;

  btn.classList.add('is-loading');
  btn.disabled = true;

  setTimeout(() => {
    const publicUsername = 'guest';
    const publicPassword = '123456';

    if ((user === publicUsername || user === 'faisal') && (pass === publicPassword || pass === 'admin123')) {
      localStorage.setItem('wms_logged_in_user', user || publicUsername);
      hideLoginScreen();

      setTimeout(() => {
        startApplication();
        toast(`Selamat datang, ${user || publicUsername}!`, 'success');
      }, 600);
    } else {
      btn.classList.remove('is-loading');
      btn.disabled = false;
      toast('Username atau password salah! Coba guest / 123456', 'error');
    }
  }, 1000);
}

// Fungsi utama untuk menjalankan aplikasi setelah login sukses
function startApplication() {
  const existingProducts = DB.get('products');

  updateUserInfoUI();
  startRealtimeClock();

  if (!existingProducts || existingProducts.length === 0) {
    injectDummyData(); 
  } else {
    navigate('dashboard');
  }
}

function initApp() {
  updateUserInfoUI();
  const isLoggedIn = !!localStorage.getItem('wms_logged_in_user');

  if (isLoggedIn) {
    startApplication();
  } else {
    showLoginScreen();
  }
}

initApp();