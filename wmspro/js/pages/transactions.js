import { fmt, openModal, closeModal, toast, saveTx, addNotification, txTable } from '../utils.js';

export function inbound() {
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

export function addInbound() {
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
    <div class="form-group"><label>Lokasi Penyimpanan *</label>
      <select class="form-control" id="ib_loc">
        ${locs.map(l => `<option value="${l.id}">${l.code} - ${l.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Catatan</label><textarea class="form-control" id="ib_note" rows="2" placeholder="No. PO, sumber barang, dll..."></textarea></div>
  </div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-success" onclick="saveTx('IN','ib_prod','ib_qty','ib_loc','ib_note',inbound)">✓ Terima Barang</button>
  </div>`);
}

export function outbound() {
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

export function addOutbound() {
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
    <div class="form-group"><label>Lokasi Pengambilan *</label>
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

export function updateMaxQty(prodId, qtyFieldId) {
  const opt = document.querySelector(`#ob_prod option[value="${prodId}"]`);
  const stock = opt ? parseInt(opt.dataset.stock) : 0;
  const hint = document.getElementById('ob_maxhint');
  if (hint) hint.textContent = stock ? `(maks. ${stock} unit)` : '';
  const qtyInput = document.getElementById(qtyFieldId);
  if (qtyInput) qtyInput.max = stock;
}

export function saveOutbound() {
  const prodId = parseInt(document.getElementById('ob_prod').value);
  const qty = parseInt(document.getElementById('ob_qty').value);
  const locId = parseInt(document.getElementById('ob_loc').value);
  const note = document.getElementById('ob_note').value;
  if (!prodId) { toast('Pilih produk', 'error'); return; }
  const prod = DB.getOne('products', prodId);
  if (qty > prod.stock) { toast(`Stok tidak cukup. Tersedia: ${prod.stock}`, 'error'); return; }
  if (!qty || qty <= 0) { toast('Masukkan jumlah valid', 'error'); return; }
  saveTx('OUT', 'ob_prod', 'ob_qty', 'ob_loc', 'ob_note', outbound);
}

export function transfer() {
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

export function addTransfer() {
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

export function saveTransfer() {
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

export function adjustment() {
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

export function addAdjustment() {
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
