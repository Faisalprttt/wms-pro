import { fmt, openModal, closeModal, toast, saveTx } from '../utils.js';

export function inventory(filter = 'all') {
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
            <th>Aksi</th>
          </tr></thead>
          <tbody>
            ${list.length === 0 ? `<tr><td colspan="7" class="empty-state">Tidak ada data</td></tr>` :
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

export function quickAdjust(productId) {
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

export function doQuickAdjust(productId) {
  const delta = parseInt(document.getElementById('qa_delta').value);
  const note = document.getElementById('qa_note').value;
  if (isNaN(delta) || delta === 0) { toast('Masukkan jumlah perubahan', 'error'); return; }
  DB.addTransaction({ type: 'ADJ', productId, qty: delta, locationId: DB.getOne('products', productId)?.locationId, note: note || 'Penyesuaian manual' });
  closeModal();
  toast('Stok berhasil disesuaikan');
  inventory();
}
