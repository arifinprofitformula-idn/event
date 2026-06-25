# Shared Hosting Deploy Guide (PHP + MySQL)

Panduan ini untuk shared hosting cPanel/LiteSpeed/Apache tanpa Node.js App.

Arsitektur production:

- Frontend React di-build menjadi static files.
- Backend API memakai PHP di folder `api/`.
- Database memakai MySQL.
- Hosting melayani folder `release/`, bukan source project mentah.

## Alur GitHub + Git Pull Di Hosting

Jika terminal hosting hanya bisa `git pull` dan tidak bisa menjalankan `npm install` / `npm run release`, gunakan alur ini:

1. Build release di local.
2. Commit folder `release/` ke GitHub.
3. Di hosting, jalankan `git pull`.
4. Document root subdomain diarahkan ke folder `release/`.

Dengan alur ini, hosting tidak perlu Node.js dan tidak perlu build.

File rahasia tetap tidak ikut repo:

```text
api/config.php
release/api/config.php
```

Keduanya sudah di-ignore oleh `.gitignore`.

Di hosting, buat `release/api/config.php` sekali saja. File itu tidak akan tertimpa oleh `git pull` selama tidak pernah dicommit.

Catatan `.htaccess`:

- Root repo tidak perlu `.htaccess`.
- File rewrite yang dipakai production adalah `release/.htaccess`.
- Jika hosting punya `.htaccess` sendiri di root repo, biarkan sebagai file lokal/untracked selama document root tetap mengarah ke `release/`.

## 1. Requirement Hosting

- PHP 8.1+ dengan extension `pdo_mysql`.
- MySQL 5.7+/8.0+ atau MariaDB 10.3+.
- Apache/LiteSpeed dengan `.htaccess` dan `mod_rewrite` aktif.
- Subdomain/domain document root yang bisa kamu isi file.

Tidak perlu Node.js di server hosting.

## 2. Buat Database MySQL

Di cPanel:

1. Buka MySQL Databases.
2. Buat database, contoh: `cpaneluser_event_manager`.
3. Buat user database, contoh: `cpaneluser_event_user`.
4. Set password kuat.
5. Assign user ke database dengan `ALL PRIVILEGES`.

Tabel akan dibuat otomatis saat API pertama kali dipanggil. Jika hosting memblokir `CREATE TABLE`, import file:

```text
mysql-schema.sql
```

File ini ikut tersedia di folder `release/`.

## 3. Build Paket Release Di Lokal

Jalankan di komputer lokal/project:

```bash
npm install
npm run release
```

Perintah ini akan:

1. Menjalankan `npm run build`.
2. Membuat folder `release/`.
3. Menyalin static frontend, `api/`, `.htaccess`, dan schema SQL.

Setelah itu commit perubahan termasuk folder `release/`:

```bash
git add .
git commit -m "Build production release"
git push
```

Di hosting:

```bash
git pull
```

## 4. Setup Document Root cPanel

Untuk alur GitHub, arahkan document root subdomain ke folder:

```text
.../nama-repo/release
```

Contoh:

```text
/home/USER/repositories/event/release
```

Pastikan file ini ada di document root:

```text
index.html
.htaccess
api/index.php
api/config.example.php
```

## 5. Buat Config PHP

Di server hosting:

1. Copy:

```text
api/config.example.php
```

menjadi:

```text
api/config.php
```

2. Edit `api/config.php`:

```php
<?php
return [
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'cpaneluser_event_manager',
        'user' => 'cpaneluser_event_user',
        'password' => 'PASSWORD_DATABASE',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'admin_name' => 'Administrator',
        'admin_email' => 'owner@example.com',
        'admin_password' => 'PASSWORD_ADMIN_AWAL',
        'session_name' => 'em_session',
        'cookie_secure' => true,
    ],
];
```

Catatan:

- `admin_password` dipakai hanya saat tabel user masih kosong.
- Setelah login pertama, buat admin baru atau ubah kredensial.
- Jangan commit `api/config.php` atau `release/api/config.php`.

## 6. Test API

Buka:

```text
https://event.arvadigital.web.id/api/auth/session
```

Jika benar, responsnya:

```json
{"session":null}
```

Jika muncul 404 LiteSpeed:

- `.htaccess` belum terbaca,
- file belum diupload ke document root yang benar,
- atau subdomain masih mengarah ke folder lain.

Jika muncul error database:

- cek host, database, user, password,
- pastikan user database punya privilege,
- cek PHP extension `pdo_mysql`.

## 7. Login

Buka:

```text
https://event.arvadigital.web.id/
```

Login dengan:

- Email: nilai `admin_email`
- Password: nilai `admin_password`

## 8. Backup

Backup database MySQL secara rutin.

Tabel utama:

- `em_users`
- `em_app_data`

## 9. Troubleshooting Blank Page

View source halaman. Production yang benar harus memuat asset seperti:

```html
<script type="module" crossorigin src="/assets/index-xxxxx.js"></script>
```

Jika masih ada:

```html
<script type="module" src="/src/main.jsx"></script>
```

berarti kamu mengupload source project mentah, bukan isi folder `release/`.

Solusi:

```bash
npm run release
git add release
git commit -m "Build release"
git push
```

Lalu di hosting:

```bash
git pull
```
