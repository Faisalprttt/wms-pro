import { fmt, getNotifications, txTable, initHeroSlider, getTxBadge } from '../utils.js';

export function dashboard() {
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
  <div class="dashboard-grid">
    <section class="hero-panel card">
      <div class="hero-copy">
        <span class="eyebrow">Warehouse Intelligence</span>
        <h1>Dashboard Gudang Modern dengan Sentuhan Dribbble</h1>
        <p>Monitor stok, lihat notifikasi real-time, dan kelola alur masuk/keluar dalam satu tampilan profesional.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" onclick="navigate('inbound')">Terima Barang</button>
          <button class="btn btn-secondary" onclick="navigate('outbound')">Kirim Barang</button>
        </div>
      </div>
      <div class="hero-slider">
        <div class="slider-track">
          <article class="slide-item active">
            <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80" alt="Warehouse illustration">
            <div class="slide-caption">
              <h2>Kontrol Stok Secara Visual</h2>
              <p>Ubah dashboard biasa menjadi pengalaman monitoring yang menarik.</p>
            </div>
          </article>
          <article class="slide-item">
            <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80" alt="Logistics illustration">
            <div class="slide-caption">
              <h2>Analitik Stok & Lokasi</h2>
              <p>Lihat tren keluar-masuk dan rencanakan ruang penyimpanan lebih baik.</p>
            </div>
          </article>
          <article class="slide-item">
            <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80" alt="Inventory illustration">
            <div class="slide-caption">
              <h2>Notifikasi Aksi Langsung</h2>
              <p>Dapatkan pemberitahuan saat stok menipis, stok habis, atau barang dipindah.</p>
            </div>
          </article>
        </div>
        <div class="slider-controls">
          ${[0, 1, 2].map(i => `<button class="dot ${i === 0 ? 'active' : ''}" onclick="setHeroSlide(${i})"></button>`).join('')}
        </div>
      </div>
    </section>

    <section class="stats-panel">
      <div class="small-cards">
        <div class="stat-card card accent-blue">
          <div class="stat-title">Produk Terdaftar</div>
          <div class="stat-value">${fmt.num(s.totalProducts)}</div>
        </div>
        <div class="stat-card card accent-green">
          <div class="stat-title">Total Stok</div>
          <div class="stat-value">${fmt.num(s.totalStock)}</div>
        </div>
        <div class="stat-card card accent-orange">
          <div class="stat-title">Stok Menipis</div>
          <div class="stat-value">${fmt.num(s.lowStockCount)}</div>
        </div>
        <div class="stat-card card accent-indigo">
          <div class="stat-title">Nilai Persediaan</div>
          <div class="stat-value">${fmt.currency(s.totalValue)}</div>
        </div>
      </div>

      <div class="chart-card card">
        <div class="card-header"><span>Aktivitas 6 Bulan</span></div>
        <div class="activity-chart">
          ${monthKeys.map(key => `
            <div class="activity-row">
              <div class="activity-label">${key}</div>
              <div class="activity-bars">
                <div class="bar in" style="width:${(activity[key].in / maxVal) * 100}%"></div>
                <div class="bar out" style="width:${(activity[key].out / maxVal) * 100}%"></div>
              </div>
              <div class="activity-value">${fmt.num(activity[key].in + activity[key].out)}</div>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <section class="live-feed card">
      <div class="section-header">
        <div><h2>Notifikasi Terbaru</h2><p>Update ringkas dari aktivitas gudang.</p></div>
        <button class="btn btn-sm btn-secondary" onclick="navigate('history')">Lihat Semua</button>
      </div>
      <div class="feed-list">
        ${notifications.length === 0 ? '<div class="empty-state">Belum ada notifikasi</div>' : notifications.map(note => `
          <div class="feed-item feed-${note.type}">
            <div class="feed-meta"><strong>${note.title}</strong><span>${note.timestamp}</span></div>
            <div class="feed-message">${note.message}</div>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="recent-transactions card">
      <div class="section-header"><h2>Riwayat Terakhir</h2></div>
      ${txTable(recentTxs)}
    </section>
  </div>`;

  setTimeout(initHeroSlider, 0);
}
