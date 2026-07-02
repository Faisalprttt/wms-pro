import { fmt, openModal, closeModal, toast, getBadge } from '../utils.js';

export function products(search = '', catFilter = '') {
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

export function editProduct(id = null) {
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

export function saveProduct(id) {
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

export function viewProduct(id) {
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
    <div class="info-item"><label>Status Stok</label>${getBadge(p.stock, p.minStock)}</div>
  </div>
  ${p.description ? `<div class="divider"></div><div class="info-item"><label>Deskripsi</label><span>${p.description}</span></div>` : ''}`;
  openModal('Detail Produk', html);
}

export function deleteProduct(id) {
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
