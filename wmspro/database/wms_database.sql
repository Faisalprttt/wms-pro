-- ============================================================
-- WMS PRO — Database Schema & Seed Data
-- Kompatibel dengan: MySQL 8+ / MariaDB 10.5+
-- ============================================================
-- Cara penggunaan:
--   mysql -u root -p < wms_database.sql
--   atau import via phpMyAdmin / DBeaver / TablePlus
-- ============================================================

CREATE DATABASE IF NOT EXISTS wms_pro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE wms_pro;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- TABEL: categories
-- ============================================================
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  description TEXT,
  icon        VARCHAR(10)   DEFAULT '📦',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_category_name (name)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: units
-- ============================================================
DROP TABLE IF EXISTS units;
CREATE TABLE units (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50)   NOT NULL,
  description VARCHAR(200),
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_unit_name (name)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: locations
-- ============================================================
DROP TABLE IF EXISTS locations;
CREATE TABLE locations (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(50)   NOT NULL COMMENT 'Kode unik lokasi (contoh: RAK-A01)',
  name        VARCHAR(150)  NOT NULL,
  zone        VARCHAR(100),
  capacity    INT UNSIGNED  NOT NULL DEFAULT 100 COMMENT 'Kapasitas maksimal (unit)',
  status      ENUM('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_location_code (code)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: suppliers
-- ============================================================
DROP TABLE IF EXISTS suppliers;
CREATE TABLE suppliers (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200)  NOT NULL,
  contact     VARCHAR(100)  COMMENT 'Nama PIC',
  phone       VARCHAR(30),
  email       VARCHAR(150),
  address     TEXT,
  status      ENUM('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: products
-- ============================================================
DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku           VARCHAR(50)    NOT NULL COMMENT 'Stock Keeping Unit',
  name          VARCHAR(250)   NOT NULL,
  description   TEXT,
  category_id   INT UNSIGNED   NOT NULL,
  unit_id       INT UNSIGNED   NOT NULL,
  supplier_id   INT UNSIGNED,
  location_id   INT UNSIGNED,
  buy_price     DECIMAL(15,2)  NOT NULL DEFAULT 0,
  sell_price    DECIMAL(15,2)  NOT NULL DEFAULT 0,
  stock         INT            NOT NULL DEFAULT 0 COMMENT 'Stok saat ini',
  min_stock     INT UNSIGNED   NOT NULL DEFAULT 10 COMMENT 'Batas stok minimum (alert)',
  status        ENUM('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_product_sku (sku),
  CONSTRAINT fk_product_category FOREIGN KEY (category_id)  REFERENCES categories (id),
  CONSTRAINT fk_product_unit     FOREIGN KEY (unit_id)       REFERENCES units (id),
  CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id)   REFERENCES suppliers (id) ON DELETE SET NULL,
  CONSTRAINT fk_product_location FOREIGN KEY (location_id)   REFERENCES locations (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: transactions
-- Menyimpan semua mutasi stok (masuk, keluar, penyesuaian, transfer)
-- ============================================================
DROP TABLE IF EXISTS transactions;
CREATE TABLE transactions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tx_type       ENUM('IN','OUT','ADJ','TRF') NOT NULL
                COMMENT 'IN=Masuk, OUT=Keluar, ADJ=Penyesuaian, TRF=Transfer',
  product_id    INT UNSIGNED NOT NULL,
  qty           INT NOT NULL COMMENT 'Jumlah (+/-). ADJ bisa negatif.',
  location_id   INT UNSIGNED COMMENT 'Lokasi asal transaksi',
  note          TEXT,
  reference_no  VARCHAR(100) COMMENT 'No. PO / DO / dokumen referensi',
  created_by    VARCHAR(100) NOT NULL DEFAULT 'system',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tx_product  FOREIGN KEY (product_id)  REFERENCES products (id),
  CONSTRAINT fk_tx_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE SET NULL,
  INDEX idx_tx_product  (product_id),
  INDEX idx_tx_type     (tx_type),
  INDEX idx_tx_date     (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: users (opsional — untuk sistem multi-user)
-- ============================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL,
  full_name   VARCHAR(150),
  email       VARCHAR(150),
  role        ENUM('admin','staff','viewer') NOT NULL DEFAULT 'staff',
  password    VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  last_login  DATETIME,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_username (username),
  UNIQUE KEY uk_email (email)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- VIEW: v_stock_status
-- Ringkasan status stok semua produk
-- ============================================================
DROP VIEW IF EXISTS v_stock_status;
CREATE VIEW v_stock_status AS
SELECT
  p.id,
  p.sku,
  p.name                                               AS product_name,
  c.name                                               AS category,
  u.name                                               AS unit,
  s.name                                               AS supplier,
  l.code                                               AS location_code,
  l.name                                               AS location_name,
  p.stock,
  p.min_stock,
  p.buy_price,
  p.sell_price,
  (p.stock * p.buy_price)                              AS stock_value,
  CASE
    WHEN p.stock  = 0            THEN 'Habis'
    WHEN p.stock <= p.min_stock  THEN 'Menipis'
    ELSE                              'Normal'
  END                                                  AS stock_status
FROM products p
JOIN  categories c ON c.id = p.category_id
JOIN  units      u ON u.id = p.unit_id
LEFT JOIN suppliers s ON s.id = p.supplier_id
LEFT JOIN locations l ON l.id = p.location_id;

-- ============================================================
-- VIEW: v_transaction_detail
-- Detail transaksi dengan nama produk dan lokasi
-- ============================================================
DROP VIEW IF EXISTS v_transaction_detail;
CREATE VIEW v_transaction_detail AS
SELECT
  t.id,
  t.tx_type,
  CASE t.tx_type
    WHEN 'IN'  THEN 'Barang Masuk'
    WHEN 'OUT' THEN 'Barang Keluar'
    WHEN 'ADJ' THEN 'Penyesuaian'
    WHEN 'TRF' THEN 'Transfer'
  END                      AS tx_type_label,
  p.sku,
  p.name                   AS product_name,
  t.qty,
  l.code                   AS location_code,
  l.name                   AS location_name,
  t.note,
  t.reference_no,
  t.created_by,
  t.created_at
FROM transactions t
JOIN products  p ON p.id = t.product_id
LEFT JOIN locations l ON l.id = t.location_id;

-- ============================================================
-- STORED PROCEDURE: sp_receive_goods
-- Penerimaan barang masuk dengan auto-update stok
-- ============================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_receive_goods$$
CREATE PROCEDURE sp_receive_goods(
  IN  p_product_id   INT UNSIGNED,
  IN  p_qty          INT UNSIGNED,
  IN  p_location_id  INT UNSIGNED,
  IN  p_note         TEXT,
  IN  p_reference_no VARCHAR(100),
  IN  p_created_by   VARCHAR(100),
  OUT p_tx_id        INT UNSIGNED
)
BEGIN
  START TRANSACTION;
    INSERT INTO transactions (tx_type, product_id, qty, location_id, note, reference_no, created_by)
    VALUES ('IN', p_product_id, p_qty, p_location_id, p_note, p_reference_no, p_created_by);
    SET p_tx_id = LAST_INSERT_ID();
    UPDATE products SET stock = stock + p_qty WHERE id = p_product_id;
  COMMIT;
END$$

-- ============================================================
-- STORED PROCEDURE: sp_ship_goods
-- Pengiriman barang keluar dengan validasi stok
-- ============================================================
DROP PROCEDURE IF EXISTS sp_ship_goods$$
CREATE PROCEDURE sp_ship_goods(
  IN  p_product_id   INT UNSIGNED,
  IN  p_qty          INT UNSIGNED,
  IN  p_location_id  INT UNSIGNED,
  IN  p_note         TEXT,
  IN  p_reference_no VARCHAR(100),
  IN  p_created_by   VARCHAR(100),
  OUT p_tx_id        INT UNSIGNED,
  OUT p_success      TINYINT,
  OUT p_message      VARCHAR(200)
)
BEGIN
  DECLARE v_current_stock INT;
  SET p_tx_id = 0; SET p_success = 0;

  SELECT stock INTO v_current_stock FROM products WHERE id = p_product_id FOR UPDATE;

  IF v_current_stock < p_qty THEN
    SET p_message = CONCAT('Stok tidak cukup. Tersedia: ', v_current_stock);
    ROLLBACK;
  ELSE
    START TRANSACTION;
      INSERT INTO transactions (tx_type, product_id, qty, location_id, note, reference_no, created_by)
      VALUES ('OUT', p_product_id, p_qty, p_location_id, p_note, p_reference_no, p_created_by);
      SET p_tx_id = LAST_INSERT_ID();
      UPDATE products SET stock = stock - p_qty WHERE id = p_product_id;
    COMMIT;
    SET p_success = 1; SET p_message = 'Berhasil';
  END IF;
END$$

-- ============================================================
-- STORED PROCEDURE: sp_adjust_stock
-- Penyesuaian stok (delta bisa negatif)
-- ============================================================
DROP PROCEDURE IF EXISTS sp_adjust_stock$$
CREATE PROCEDURE sp_adjust_stock(
  IN p_product_id  INT UNSIGNED,
  IN p_delta       INT,
  IN p_location_id INT UNSIGNED,
  IN p_note        TEXT,
  IN p_created_by  VARCHAR(100)
)
BEGIN
  START TRANSACTION;
    INSERT INTO transactions (tx_type, product_id, qty, location_id, note, created_by)
    VALUES ('ADJ', p_product_id, p_delta, p_location_id, p_note, p_created_by);
    UPDATE products
    SET stock = GREATEST(0, stock + p_delta)
    WHERE id = p_product_id;
  COMMIT;
END$$

DELIMITER ;

-- ============================================================
-- SEED DATA — Kategori
-- ============================================================
INSERT INTO categories (id, name, description, icon) VALUES
(1, 'Elektronik',          'Produk elektronik dan gadget',    '⚡'),
(2, 'Pakaian',             'Pakaian dan aksesoris',           '👕'),
(3, 'Makanan & Minuman',   'Produk konsumsi',                 '🥤'),
(4, 'Alat Rumah Tangga',   'Peralatan rumah',                 '🏠'),
(5, 'Bahan Baku',          'Raw material produksi',           '📦');

-- ============================================================
-- SEED DATA — Satuan
-- ============================================================
INSERT INTO units (id, name, description) VALUES
(1, 'Pcs',   'Per buah/unit'),
(2, 'Kg',    'Kilogram'),
(3, 'Liter', 'Liter'),
(4, 'Box',   'Per kotak'),
(5, 'Lusin', '12 pcs'),
(6, 'Meter', 'Per meter');

-- ============================================================
-- SEED DATA — Supplier
-- ============================================================
INSERT INTO suppliers (id, name, contact, phone, email, address, status) VALUES
(1, 'PT Maju Elektronik',  'Budi Santoso',  '021-5551234', 'budi@majuelektronik.com',  'Jl. Industri No. 45, Jakarta',         'Aktif'),
(2, 'CV Sumber Textile',   'Siti Rahayu',   '022-7778888', 'siti@sumbertextile.com',   'Jl. Raya Bandung No. 12, Bandung',     'Aktif'),
(3, 'PT Berkah Pangan',    'Ahmad Fauzi',   '031-9990000', 'ahmad@berkahpangan.com',   'Jl. Pahlawan No. 88, Surabaya',        'Aktif'),
(4, 'UD Perabot Jaya',     'Dewi Lestari',  '024-3334444', 'dewi@perabotjaya.com',     'Jl. Pemuda No. 23, Semarang',          'Nonaktif');

-- ============================================================
-- SEED DATA — Lokasi Gudang
-- ============================================================
INSERT INTO locations (id, code, name, zone, capacity, status) VALUES
(1, 'RAK-A01', 'Rak A - Baris 1',       'Zona A',        500,  'Aktif'),
(2, 'RAK-A02', 'Rak A - Baris 2',       'Zona A',        500,  'Aktif'),
(3, 'RAK-B01', 'Rak B - Baris 1',       'Zona B',        300,  'Aktif'),
(4, 'RAK-B02', 'Rak B - Baris 2',       'Zona B',        300,  'Aktif'),
(5, 'RAK-C01', 'Rak C - Baris 1',       'Zona C',        800,  'Aktif'),
(6, 'FLR-D01', 'Lantai D - Zona 1',     'Zona D',       2000,  'Aktif'),
(7, 'FLR-D02', 'Lantai D - Zona 2',     'Zona D',       2000,  'Aktif'),
(8, 'COLD-E01','Cold Storage E - 1',    'Zona E (Cold)', 400,  'Aktif');

-- ============================================================
-- SEED DATA — Produk
-- ============================================================
INSERT INTO products (id, sku, name, description, category_id, unit_id, supplier_id, location_id, buy_price, sell_price, stock, min_stock, status) VALUES
(1,  'ELK-001', 'Smartphone Android 6"',    'Smartphone android 6 inch',         1, 1, 1, 1, 1800000, 2299000,  45, 10, 'Aktif'),
(2,  'ELK-002', 'Headphone Wireless BT',    'Headphone bluetooth 5.0',           1, 1, 1, 1,  250000,  399000,   8, 15, 'Aktif'),
(3,  'ELK-003', 'Charger USB-C 65W',        'Fast charger 65 watt',              1, 1, 1, 2,  120000,  189000,  62, 20, 'Aktif'),
(4,  'PAK-001', 'Kaos Katun Premium',       'Kaos 100% cotton combed 30s',       2, 1, 2, 3,   45000,   89000, 120, 30, 'Aktif'),
(5,  'PAK-002', 'Celana Chino Slim',        'Celana chino stretch',              2, 1, 2, 3,   85000,  149000,   5, 20, 'Aktif'),
(6,  'PAK-003', 'Jaket Hoodie Fleece',      'Hoodie fleece anti angin',          2, 1, 2, 4,  120000,  219000,  33, 15, 'Aktif'),
(7,  'MKN-001', 'Air Mineral 1500ml',       'Air mineral kemasan besar',         3, 4, 3, 8,    3500,    5000, 350,100, 'Aktif'),
(8,  'MKN-002', 'Mie Instan Goreng',        'Mie instan box isi 40 pcs',         3, 4, 3, 6,   28000,   38000,   7, 50, 'Aktif'),
(9,  'ALT-001', 'Panci Stainless 24cm',     'Panci stainless steel food grade',  4, 1, 4, 5,   85000,  135000,  28, 10, 'Aktif'),
(10, 'ALT-002', 'Sapu Ijuk Premium',        'Sapu ijuk kualitas premium',        4, 1, 4, 7,   22000,   38000,  14, 20, 'Aktif'),
(11, 'BBK-001', 'Kain Katun per Meter',     'Kain katun combed putih',           5, 6, 2, 4,   15000,   25000,   3,100, 'Aktif'),
(12, 'BBK-002', 'Benang Jahit 500m',        'Benang jahit polyester',            5, 4, 2, 4,   12000,   20000,  47, 30, 'Aktif');

-- ============================================================
-- SEED DATA — Transaksi
-- ============================================================
INSERT INTO transactions (tx_type, product_id, qty, location_id, note, created_by, created_at) VALUES
-- Inbound
('IN', 1,  50, 1, 'Pembelian awal stok dari PT Maju Elektronik',    'Admin Gudang', DATE_SUB(NOW(), INTERVAL 30 DAY)),
('IN', 2,  20, 1, 'Restock headphone wireless',                      'Admin Gudang', DATE_SUB(NOW(), INTERVAL 25 DAY)),
('IN', 3,  80, 2, 'Restock charger USB-C',                           'Admin Gudang', DATE_SUB(NOW(), INTERVAL 20 DAY)),
('IN', 4, 150, 3, 'Pembelian batch kaos katun',                      'Admin Gudang', DATE_SUB(NOW(), INTERVAL 28 DAY)),
('IN', 7, 500, 8, 'Pembelian air mineral cold storage',              'Admin Gudang', DATE_SUB(NOW(), INTERVAL 15 DAY)),
('IN', 8, 100, 6, 'Restock mie instan box',                          'Admin Gudang', DATE_SUB(NOW(), INTERVAL 10 DAY)),
('IN', 9,  30, 5, 'Pembelian panci stainless',                       'Admin Gudang', DATE_SUB(NOW(), INTERVAL  8 DAY)),
-- Outbound
('OUT', 1,   5, 1, 'Pengiriman ke Toko A',                           'Admin Gudang', DATE_SUB(NOW(), INTERVAL  5 DAY)),
('OUT', 4,  30, 3, 'Order online marketplace',                       'Admin Gudang', DATE_SUB(NOW(), INTERVAL  4 DAY)),
('OUT', 7, 150, 8, 'Delivery ke minimarket',                         'Admin Gudang', DATE_SUB(NOW(), INTERVAL  3 DAY)),
('OUT', 6,   7, 4, 'Pengiriman ke reseller Bandung',                 'Admin Gudang', DATE_SUB(NOW(), INTERVAL  2 DAY)),
('OUT', 8,  93, 6, 'Distribusi ke warung-warung',                    'Admin Gudang', DATE_SUB(NOW(), INTERVAL  1 DAY)),
-- Adjustment
('ADJ', 11, -2, 4, 'Stok rusak saat penghitungan fisik',            'Admin Gudang', DATE_SUB(NOW(), INTERVAL  3 DAY)),
('ADJ',  5, -5, 3, 'Defect saat audit bulanan',                      'Admin Gudang', DATE_SUB(NOW(), INTERVAL  6 DAY)),
('ADJ',  2, -2, 1, 'Produk rusak saat penerimaan',                   'Admin Gudang', DATE_SUB(NOW(), INTERVAL  7 DAY)),
-- Transfer
('TRF', 10, 10, 5, 'Transfer dari Zona C ke Zona D untuk efisiensi', 'Admin Gudang', DATE_SUB(NOW(), INTERVAL  4 DAY));

-- ============================================================
-- SEED DATA — User default
-- password: 'admin123' (bcrypt hash di bawah hanya contoh, ganti di aplikasi nyata)
-- ============================================================
INSERT INTO users (username, full_name, email, role, password) VALUES
('admin', 'Admin Gudang', 'admin@wmspro.id', 'admin', '$2y$10$placeholder_hash_change_this');

-- ============================================================
-- USEFUL QUERIES
-- ============================================================

-- Lihat stok semua produk dengan status:
-- SELECT * FROM v_stock_status ORDER BY stock_status, category;

-- Produk stok menipis (< min_stock):
-- SELECT * FROM v_stock_status WHERE stock_status IN ('Habis','Menipis') ORDER BY stock;

-- Total nilai inventori per kategori:
-- SELECT category, COUNT(*) AS jumlah_produk, SUM(stock) AS total_stok, SUM(stock_value) AS nilai
-- FROM v_stock_status GROUP BY category ORDER BY nilai DESC;

-- Riwayat transaksi 30 hari terakhir:
-- SELECT * FROM v_transaction_detail WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY created_at DESC;

-- Barang masuk vs keluar per bulan:
-- SELECT DATE_FORMAT(created_at,'%Y-%m') AS bulan,
--   SUM(CASE WHEN tx_type='IN'  THEN qty ELSE 0 END) AS total_masuk,
--   SUM(CASE WHEN tx_type='OUT' THEN qty ELSE 0 END) AS total_keluar
-- FROM transactions GROUP BY bulan ORDER BY bulan DESC;

-- Panggil stored procedure penerimaan barang:
-- CALL sp_receive_goods(1, 50, 1, 'PO-2024-001', 'PO-001', 'admin', @tx_id);
-- SELECT @tx_id;

-- ============================================================
-- END OF SCRIPT
-- ============================================================
