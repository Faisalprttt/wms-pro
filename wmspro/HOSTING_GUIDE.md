# Panduan Hosting WMS Pro

Project ini bisa di-host dengan mudah karena sebagian besar tampilannya berjalan sebagai website statis. Saat ini aplikasi memakai LocalStorage di browser, sehingga untuk tampilan dasar Anda tidak perlu database.

## 1. Opsi hosting paling mudah

### A. Hosting gratis (direkomendasikan untuk uji coba)
Gunakan salah satu layanan berikut:
- Netlify
- Vercel
- GitHub Pages

Langkah:
1. Upload project ke GitHub.
2. Buka Netlify atau Vercel.
3. Import repository Anda.
4. Pilih folder root project.
5. Publish.

Setelah selesai, Anda akan mendapat alamat website seperti:
- https://nama-proyek.netlify.app
- https://nama-proyek.vercel.app

## 2. Hosting ke shared hosting (lebih umum)
Jika Anda ingin memakai hosting biasa seperti Hostinger, Niagahoster, atau InfinityFree:

1. Beli atau gunakan akun hosting.
2. Masuk ke panel hosting.
3. Upload semua file proyek ke folder public_html atau www.
4. Pastikan file utama Anda adalah index.html.
5. Buka domain Anda di browser.

### Struktur file yang perlu di-upload
- index.html
- css/
- js/
- images/
- database/

## 3. Jika ingin memakai database
File SQL tersedia di [database/wms_database.sql](database/wms_database.sql).

Langkah:
1. Buat database di hosting.
2. Import file SQL tersebut melalui phpMyAdmin.
3. Sesuaikan pengaturan koneksi database jika nanti project dikembangkan menjadi versi server-side.

> Catatan: versi saat ini belum memakai database server secara langsung. Data disimpan di browser melalui LocalStorage.

## 4. Tips penting
- Pastikan semua file terupload lengkap, terutama folder css, js, dan images.
- Jalankan project dari domain utama, bukan dari file lokal.
- Jika tampilan tidak muncul, cek apakah path file CSS dan JS benar.

## 5. Cek hasil hosting
Setelah upload selesai, buka alamat domain Anda. Jika muncul halaman login WMS Pro, berarti hosting berhasil.

## 6. Jika ingin hosting cepat dan gratis
Rekomendasi paling praktis:
- Pakai Netlify atau Vercel untuk demo.
- Pakai InfinityFree jika ingin domain gratis lebih lama.

Jika Anda mau, saya bisa lanjut bantu buatkan versi langkah yang lebih detail sesuai layanan hosting yang Anda pilih, misalnya:
- InfinityFree
- Hostinger
- Vercel
- GitHub Pages
