import { openModal, closeModal, toast } from '../utils.js';

export function locations() {
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

export function editLocation(id = null) {
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

export function saveLocation(id) {
  const code = document.getElementById('fl_code').value.trim();
  const name = document.getElementById('fl_name').value.trim();
  if (!code || !name) { toast('Kode dan nama wajib diisi', 'error'); return; }
  DB.saveLocation({ id, code, name, zone: document.getElementById('fl_zone').value, capacity: parseInt(document.getElementById('fl_cap').value) || 100, status: document.getElementById('fl_stat').value });
  closeModal(); toast('Lokasi disimpan'); locations();
}

export function deleteLocation(id) {
  const l = DB.getOne('locations', id);
  openModal('Hapus Lokasi', `
  <div class="confirm-text">Hapus lokasi <strong>${l.code} - ${l.name}</strong>?</div>
  <div class="form-actions">
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-danger" onclick="DB.deleteLocation(${id});closeModal();toast('Lokasi dihapus','warning');locations()">Hapus</button>
  </div>`);
}
