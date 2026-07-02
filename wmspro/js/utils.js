/* ============================================================
   WMS PRO — Shared Utilities
   ============================================================ */

export const fmt = {
  currency: n => 'Rp ' + Math.round(n).toLocaleString('id-ID'),
  date: s => s ? new Date(s).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '-',
  datetime: s => s ? new Date(s).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '-',
  num: n => Math.round(n).toLocaleString('id-ID'),
};

export function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = (type === 'success' ? '✓ ' : type === 'error' ? '✗ ' : '⚠ ') + msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

export function openModal(title, html, wide = false) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').className = 'modal' + (wide ? ' wide' : '');
  document.getElementById('modalOverlay').classList.add('open');
}

export function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

export function updateUserInfoUI() {
  const userNameEl = document.getElementById('sidebarUserName');
  const userRoleEl = document.getElementById('sidebarUserRole');
  const currentUser = localStorage.getItem('wms_logged_in_user') || 'Admin Gudang';
  const displayName = currentUser.charAt(0).toUpperCase() + currentUser.slice(1);

  if (userNameEl) userNameEl.textContent = displayName;
  if (userRoleEl) userRoleEl.textContent = 'Administrator';

  const avatar = document.querySelector('.user-avatar');
  if (avatar) avatar.textContent = displayName.slice(0, 2).toUpperCase();
}

export function getBadge(stock, min) {
  if (stock <= 0) return '<span class="badge badge-red">Habis</span>';
  if (stock <= min) return '<span class="badge badge-orange">Menipis</span>';
  return '<span class="badge badge-green">Normal</span>';
}

export function getTxBadge(type) {
  const map = { IN: ['badge-green', 'Masuk'], OUT: ['badge-blue', 'Keluar'], ADJ: ['badge-orange', 'Penyesuaian'], TRF: ['badge-gray', 'Transfer'] };
  const [cls, label] = map[type] || ['badge-gray', type];
  return `<span class="badge ${cls}">${label}</span>`;
}

export function txTable(txs) {
  return `<div class="card"><div class="table-wrapper"><table>
    <thead><tr><th>#</th><th>Produk</th><th>SKU</th><th>Jumlah</th><th>Tipe</th><th>Lokasi</th><th>Catatan</th><th>Waktu</th><th>Oleh</th></tr></thead>
    <tbody>
    ${txs.length === 0 ? '<tr><td colspan="9" class="empty-state">Belum ada data transaksi</td></tr>' :
    txs.map(t => `<tr>
      <td style="font-size:12px;color:var(--gray-500)">#${t.id}</td>
      <td style="font-weight:500">${t.productName}</td>
      <td><code style="font-size:11px;background:var(--gray-100);padding:2px 5px;border-radius:3px">${t.productSku}</code></td>
      <td style="font-weight:600;color:${t.type === 'IN' ? 'var(--green)' : t.type === 'OUT' ? 'var(--blue-dark)' : 'var(--orange)'}">
        ${t.type === 'ADJ' && t.qty > 0 ? '+' : ''}${fmt.num(t.qty)}
      </td>
      <td>${getTxBadge(t.type)}</td>
      <td style="font-size:12px">${t.locationName}</td>
      <td style="font-size:12px;color:var(--gray-600);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.note || '-'}</td>
      <td style="font-size:12px;white-space:nowrap">${fmt.datetime(t.createdAt)}</td>
      <td style="font-size:12px">${t.createdBy}</td>
    </tr>`).join('')}
    </tbody>
  </table></div></div>`;
}

export function addNotification(entry) {
  const notifications = JSON.parse(localStorage.getItem('wms_notifications') || '[]');
  const now = new Date();
  notifications.unshift({
    id: now.getTime(),
    ...entry,
    timestamp: now.toLocaleTimeString('id-ID', { hour12: false }),
  });
  localStorage.setItem('wms_notifications', JSON.stringify(notifications.slice(0, 5)));
}

export function getNotifications() {
  return JSON.parse(localStorage.getItem('wms_notifications') || '[]');
}

export function saveTx(type, prodField, qtyField, locField, noteField, callback, reasonField = null) {
  const prodId = parseInt(document.getElementById(prodField).value);
  const qty = parseInt(document.getElementById(qtyField).value);
  const locId = parseInt(document.getElementById(locField).value);
  let note = document.getElementById(noteField).value;

  if (reasonField) note = document.getElementById(reasonField).value + (note ? ': ' + note : '');
  if (!prodId || isNaN(qty) || qty === 0) { toast('Lengkapi data yang diperlukan', 'error'); return; }

  const tx = DB.addTransaction({ type, productId: prodId, qty, locationId: locId, note: note || '-' });
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
  if (typeof callback === 'function') callback();
  return tx;
}

export function initHeroSlider() {
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
