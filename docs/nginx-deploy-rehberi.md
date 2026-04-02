# Ganged Reality — Nginx Sunucu Deploy Rehberi

Bu rehber, uygulamayi kendi sunucunda (Ubuntu/Debian) Nginx ile nasil yayinlayacagini adim adim anlatir.

---

## Gereksinimler

- Ubuntu 20.04+ veya Debian 11+ sunucu
- SSH erisiminiz olmali
- Domain adresiniz DNS'te sunucunun IP'sine yonlenmis olmali
- Sunucuda root veya sudo yetkisi

---

## Adim 1: Sunucu Hazirlik

SSH ile sunucuya baglan:

```bash
ssh kullanici@sunucu-ip
```

Gerekli yazilimlari kur:

```bash
# Sistem guncelle
sudo apt update && sudo apt upgrade -y

# Node.js 20 kur
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Nginx kur
sudo apt install -y nginx

# PM2 kur (Node.js process manager)
sudo npm install -g pm2

# Git kur (ihtiyac halinde)
sudo apt install -y git

# Kurulum kontrol
node -v    # v20.x.x
npm -v     # 10.x.x
nginx -v   # nginx/1.x.x
pm2 -v     # 5.x.x
```

---

## Adim 2: Proje Dosyalarini Sunucuya Aktar

### Yontem A: Git ile (Onerilen)

```bash
# Proje dizini olustur
sudo mkdir -p /var/www/gangedreality
sudo chown $USER:$USER /var/www/gangedreality

# Repo'yu clone'la
cd /var/www/gangedreality
git clone <repo-url> .
```

### Yontem B: Dosya Kopyalama ile (SCP/SFTP)

Kendi bilgisayarindan:

```powershell
# Windows'tan sunucuya kopyala
scp -r C:\Users\erden.aydogdu\Desktop\gangedreality\* kullanici@sunucu-ip:/var/www/gangedreality/
```

Ya da FileZilla / WinSCP gibi bir SFTP istemcisi kullan.

---

## Adim 3: Proje Dizin Yapisini Olustur

Sunucuda su yapiya sahip olacaksin:

```
/var/www/gangedreality/
├── dist/                  ← Frontend build ciktisi (Adim 5'te olusacak)
├── server/                ← Backend kaynak kodu
├── projects/              ← Proje verileri (model, texture, JSON)
├── src/                   ← Frontend kaynak kodu
├── package.json
└── ...
```

Proje veri dizinini olustur:

```bash
sudo mkdir -p /var/www/gangedreality/projects
sudo chown $USER:$USER /var/www/gangedreality/projects
```

---

## Bu Deploy'da Kim Neyi Serve Ediyor?

Bu projede production'da 3 ayri katman var. En cok karisan nokta burasi:

```text
Tarayici
    |
    v
Nginx
    |-- / ve /assets/*          -> /var/www/gangedreality/dist/  (frontend build)
    |-- /data/*                 -> /var/www/gangedreality/projects/ (model, texture, JSON)
    \-- /api/*                 -> http://127.0.0.1:3001          (Node/Express backend)
```

Ozet:

- Frontend'i Node.js serve etmiyor. `npm run build` sonrasi olusan `dist/` klasorunu dogrudan **Nginx** serve ediyor.
- Backend'i **PM2** altinda calisan Express uygulamasi serve ediyor. Bu uygulama sadece `/api/*` isteklerini karsiliyor.
- Proje dosyalari (`project.json`, `scene.json`, `model/`, `textures/`) dogrudan **Nginx** tarafindan `/data/*` olarak yayinlaniyor.
- Tarayici `/13` veya `/13/editor` gibi bir route'a gittiginde, Nginx `index.html` donuyor; ekrani acan sey React Router oluyor.

---

## Adim 4: Mevcut Projeleri Tasi

Eger `public/data/` altinda mevcut projeler varsa bunlari `projects/` dizinine kopyala:

```bash
cp -r /var/www/gangedreality/public/data/* /var/www/gangedreality/projects/
```

Kontrol et:

```bash
ls /var/www/gangedreality/projects/
# 1101-8-10  1108-1  13  14  demo  text  projects.json
```

Her proje klasorunde su dosyalar olmali:
```
projects/13/
├── project.json
├── scene.json
├── interactions.json
├── variants.json
├── hotspots.json
├── model/
└── textures/
```

---

## Adim 5: Frontend Build

Bu adimda React/Vite uygulamasini production icin derliyoruz. Ortaya bir Node sunucusu degil, statik dosya ciktilari cikar.

```bash
cd /var/www/gangedreality

# Bagimliliklari kur
npm install

# Production build
npm run build
```

Basarili olursa `dist/` klasoru olusur:

```bash
ls dist/
# index.html  assets/
```

Bu klasorun anlami:

- `dist/index.html` -> uygulamanin ana HTML dosyasi
- `dist/assets/*` -> build edilmis JS/CSS dosyalari
- Bunlari production'da **Nginx** serve edecek
- Frontend icin ayrica `pm2 start ...` veya `node server.js` gibi bir sey yapmayacaksin

---

## Adim 6: Backend Kur ve Baslat

Bu adim frontend'den ayridir. Burada sadece `/api/*` endpoint'lerini cevaplayan Express backend'i ayaga kaldiriyoruz.

### 6A: Bagimliliklari Kur

```bash
cd /var/www/gangedreality/server
npm install
```

### 6B: Backend Build

```bash
npm run build
```

Bu `server/dist/` altinda JavaScript dosyalarini olusturur.

### 6C: Environment Dosyasi Olustur

```bash
nano /var/www/gangedreality/server/.env
```

Icerik:

```env
PORT=3001
PROJECTS_STORAGE_PATH=/var/www/gangedreality/projects
API_EDITOR_PASSWORD=BURAYA_GUCLU_BIR_SIFRE_YAZ
JWT_SECRET=BURAYA_RASTGELE_UZUN_BIR_METIN_YAZ_EN_AZ_32_KARAKTER
CORS_ORIGIN=https://yourdomain.com
```

Notlar:

- `PROJECTS_STORAGE_PATH`, backend'in proje JSON'larini ve yuklenen dosyalari hangi klasorde okuyup yazacagini belirler.
- Bu rehberde o klasor `/var/www/gangedreality/projects`.
- Frontend build'i `dist/` altinda durur; backend onu serve etmez.

> **ONEMLI:** `API_EDITOR_PASSWORD` ve `JWT_SECRET` degerlerini degistir!
> Rastgele secret olusturmak icin: `openssl rand -hex 32`

### 6D: PM2 ile Baslat

```bash
cd /var/www/gangedreality/server

# .env dosyasini yukle ve baslat
pm2 start dist/index.js --name "gr-api" --env-file .env

# Calistigini kontrol et
pm2 status
pm2 logs gr-api --lines 10

# Hizli test
curl http://localhost:3001/api/health
# {"status":"ok","projectsPath":"/var/www/gangedreality/projects"}

# Sunucu yeniden basladiginda otomatik calissin
pm2 save
pm2 startup
# (Cikan komutu kopyala yapistir calistir)
```

Bu noktada durum su olacak:

- Express backend `127.0.0.1:3001` uzerinde calisiyor
- Henuz public'e acik olmak zorunda degil; disaridan erisim Nginx uzerinden olacak
- Tarayici backend'e direkt degil, Nginx'in `/api/*` proxy'si uzerinden gidecek

---

## Adim 7: Nginx Yapilandir

Bu adimda uc farkli seyi tek bir domain altinda birlestiriyoruz:

- `dist/` -> site arayuzu
- `projects/` -> `/data/*` altinda statik proje dosyalari
- `localhost:3001` -> `/api/*` altinda backend

### 7A: Site Config Olustur

```bash
sudo nano /etc/nginx/sites-available/gangedreality
```

Su icerigi yapistir (**yourdomain.com** yerine kendi domaininizi yazin):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend build ciktisi: Nginx dogrudan dist/ klasorunu serve eder
    root /var/www/gangedreality/dist;
    index index.html;

    # Proje veri dosyalari (model, texture, JSON)
    # Ornek: /data/13/project.json -> /var/www/gangedreality/projects/13/project.json
    location /data/ {
        alias /var/www/gangedreality/projects/;
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }

    # API istekleri Node/Express backend'e gider
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Buyuk model upload icin
        client_max_body_size 200M;
        proxy_read_timeout 120s;
    }

    # SPA fallback:
    # /13, /13/editor, /admin gibi route'lar fiziksel dosya degilse index.html don
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip sikistirma
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;
}
```

Bu config'in davranisi:

- `https://yourdomain.com/` -> Nginx, `dist/index.html` doner
- `https://yourdomain.com/assets/...` -> Nginx, `dist/assets/...` dosyasini doner
- `https://yourdomain.com/data/13/project.json` -> Nginx, `projects/13/project.json` dosyasini doner
- `https://yourdomain.com/api/projects` -> Nginx, istegi `127.0.0.1:3001/api/projects` adresine proxy eder
- `https://yourdomain.com/13/editor` -> fiziksel dosya olmadigi icin `index.html` doner; route'u frontend acip render eder

### 7B: Siteyi Aktif Et

```bash
# Symlink olustur
sudo ln -s /etc/nginx/sites-available/gangedreality /etc/nginx/sites-enabled/

# Default siteyi kaldir (isteğe bagli)
sudo rm /etc/nginx/sites-enabled/default

# Config'i test et
sudo nginx -t
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Nginx'i yeniden yukle
sudo systemctl reload nginx
```

---

## Adim 8: SSL Sertifikasi (HTTPS)

```bash
# Certbot kur
sudo apt install -y certbot python3-certbot-nginx

# SSL sertifikasi al ve Nginx'e otomatik ekle
sudo certbot --nginx -d yourdomain.com

# Otomatik yenileme test
sudo certbot renew --dry-run
```

Bu islemden sonra:
- `http://yourdomain.com` → otomatik `https://yourdomain.com`'a yonlenir
- Certbot sertifikayi 90 gunde bir otomatik yeniler

---

## Adim 9: Test Et

### 9A: Temel Kontroller

```bash
# API calisiyor mu?
curl https://yourdomain.com/api/health
# {"status":"ok","projectsPath":"/var/www/gangedreality/projects"}

# Proje listesi geliyor mu?
curl https://yourdomain.com/api/projects
# [{...}, {...}]

# SPA yukleniyor mu?
curl -s https://yourdomain.com/ | head -5
# <!DOCTYPE html>...

# Proje verisi geliyor mu?
curl https://yourdomain.com/data/13/project.json
# {"projectId":"13","projectName":"deneme",...}
```

### 9B: Tarayici Testleri

1. `https://yourdomain.com/` → Ana sayfa acilmali
2. `https://yourdomain.com/13` → 3D viewer calismali
3. `https://yourdomain.com/13/editor` → Editor acilmali
4. Editor'da "Sunucuya Kaydet" → sifre sor → kaydet → toast mesaji
5. `https://yourdomain.com/admin` → Admin panel, sifre ile giris

---

## Adim 10: Gunluk Yedekleme (Backup)

```bash
# Backup dizini olustur
sudo mkdir -p /var/backups/gangedreality

# Cron job ekle (her gece saat 03:00'te)
crontab -e
```

Su satiri ekle:

```
0 3 * * * tar -czf /var/backups/gangedreality/backup-$(date +\%Y\%m\%d).tar.gz /var/www/gangedreality/projects/
```

Eski backup'lari temizlemek icin (30 gunluk):

```
0 4 * * * find /var/backups/gangedreality -name "*.tar.gz" -mtime +30 -delete
```

---

## Guncelleme Rehberi

Kod degisikligi yaptiginda sunucuyu guncellemek icin:

### Frontend Guncelleme

```bash
cd /var/www/gangedreality

# Kodu cek
git pull

# Build
npm install
npm run build

# Hepsi bu — Nginx ayni klasorden yeni dist/ dosyalarini serve eder
```

Frontend guncellemesinden sonra ayri bir restart gerekmez; cunku frontend'i calistiran ayri bir Node prosesi yoktur.

### Backend Guncelleme

```bash
cd /var/www/gangedreality/server

# Kodu cek (eger git kullaniyorsan)
git pull

# Build
npm install
npm run build

# PM2 restart
pm2 restart gr-api

# Kontrol
pm2 logs gr-api --lines 5
```

Backend degisikliginde ise restart gerekir; cunku `/api/*` isteklerini cevaplayan proses PM2 altindaki Node uygulamasidir.

---

## Yaygin Sorunlar ve Cozumler

| Sorun | Cozum |
|-------|-------|
| `502 Bad Gateway` | Backend calisiyor mu? `pm2 status` ile kontrol et. `pm2 restart gr-api` dene |
| `413 Request Entity Too Large` | Nginx'te `client_max_body_size 200M;` eklenmemis. Ekle ve `sudo systemctl reload nginx` |
| Sayfa yukleniyor ama beyaz ekran | `dist/` klasoru dogru yerde mi? `ls /var/www/gangedreality/dist/index.html` |
| `/data/` 404 donuyor | `alias` yolunun sonundaki `/` isaretini unutma: `alias /var/www/gangedreality/projects/;` |
| Model/texture yuklemiyor | `projects/` klasorunun yazma izni var mi? `sudo chown -R $USER:$USER /var/www/gangedreality/projects` |
| SSL sertifikasi almadi | Domain DNS'te sunucu IP'sine yonlenmis mi? `dig yourdomain.com` ile kontrol et |
| `pm2 startup` calismiyor | `pm2 startup` komutunun ciktisindaki `sudo env ...` komutunu kopyala yapistir |
| SPA route'lari 404 | `try_files $uri $uri/ /index.html;` satiri Nginx config'te var mi? |

---

## Mimari Ozet

```
Kullanici Tarayicisi
       |
       ▼
  [ Nginx :443 ]
       |
    ├── GET /              → dist/index.html (frontend statik)
    ├── GET /assets/*      → dist/assets/* (frontend JS, CSS)
    ├── GET /data/*        → projects/* (model, texture, JSON)
    ├── GET/POST/PUT /api/*→ proxy → Express :3001 (backend CRUD)
    └── GET /:projectId    → dist/index.html (SPA fallback)
                                      |
                                      ▼
                              React Router
                                      |
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                   ▼
                HomePage        ViewerPage          EditorPage
                                                         |
                                                    "Sunucuya Kaydet"
                                                         |
                                                         ▼
                                                    Express API
                                                         |
                                                         ▼
                                                 projects/ dizini
```

---

## Onemli Notlar

1. **`projects/` dizini uygulama kodundan ayri.** Deploy ettiginde proje verilerin kaybolmaz.
2. **`API_EDITOR_PASSWORD` ve `JWT_SECRET` degerlerini guclu sec.** Production'da `test123` kullanma.
3. **`CORS_ORIGIN` degerini kendi domainine ayarla.** Baska sitelerden API'ne istek atilmasini engeller.
4. **Yedeklemeyi unutma.** Proje verileri dosya sisteminde — veritabani gibi otomatik backup mekanizmasi yok.
5. **Buyuk model dosyalari (100MB+) icin** upload suresi uzayabilir. `proxy_read_timeout 120s;` bu yuzden var.
6. **Frontend ve backend farkli seylerdir.** Frontend build edilip `dist/` olarak Nginx tarafindan serve edilir; backend ise PM2 altinda Node olarak calisir ve sadece `/api/*` isteklerini karsilar.
