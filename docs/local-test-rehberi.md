# Ganged Reality — Windows'ta Lokal Test Rehberi

Bu rehber, uygulamayi sunucuya atmadan once kendi bilgisayarinda Nginx + Backend + Frontend uclusunu test etmeni saglar.

---

## Ön Gereksinimler

- Node.js (v18+) kurulu olmali
- Git (ihtiyac halinde)
- Bir terminal (PowerShell veya VS Code terminal)

---

## Adim 1: Proje Bagimliliklarini Kur

Iki ayri `npm install` gerekiyor: biri frontend, biri backend.

```powershell
# Frontend
cd C:\Users\erden.aydogdu\Desktop\gangedreality
npm install

# Backend
cd server
npm install
```

---

## Adim 2: Mevcut Projeleri Kopyala (Ilk Sefer)

Mevcut projeler `public/data/` altinda duruyor. Backend ise `PROJECTS_STORAGE_PATH` dizininden okuyor.
Lokal test icin backend'in projelerini `public/data/` klasorunun kendisi olarak ayarlayacagiz.

```powershell
# Herhangi bir sey kopyalamana gerek yok
# Backend'i baslatirken PROJECTS_STORAGE_PATH olarak public/data/ vericez
```

---

## Adim 3: Backend'i Baslat (Terminal 1)

Yeni bir terminal ac:

```powershell
cd C:\Users\erden.aydogdu\Desktop\gangedreality\server

# Ortam degiskenlerini ayarla
$env:PORT = "3001"
$env:PROJECTS_STORAGE_PATH = "C:\Users\erden.aydogdu\Desktop\gangedreality\public\data"
$env:API_EDITOR_PASSWORD = "test123"
$env:JWT_SECRET = "local-dev-secret-key"

# Calistir (hot-reload ile)
npm run dev
```

Basarili olursa sunu gormalisin:
```
[GR-API] Server running on port 3001
[GR-API] Projects path: C:\Users\erden.aydogdu\Desktop\gangedreality\public\data
[GR-API] Auth: Password required
```

### Hizli Kontrol
Baska bir terminal ac ve test et:
```powershell
# Health check
Invoke-RestMethod http://localhost:3001/api/health

# Proje listesi
Invoke-RestMethod http://localhost:3001/api/projects
```

---

## Adim 4: Frontend'i Baslat (Terminal 2)

Ayri bir terminal ac:

```powershell
cd C:\Users\erden.aydogdu\Desktop\gangedreality
npm run dev
```

Tarayicida ac: **http://localhost:5173**

### Ne Oluyor?

```
Tarayici
  |
  ├── http://localhost:5173/          → Vite dev server (SPA)
  ├── http://localhost:5173/data/*    → Vite static (public/data/)
  └── http://localhost:5173/api/*     → Vite proxy → http://localhost:3001/api/*
```

`vite.config.ts` icinde `/api` proxy'si zaten tanimli. Yani tarayici `/api/projects` istegi yaptiginda, Vite bunu otomatik olarak `localhost:3001/api/projects`'e yonlendirir. **Nginx'e gerek yok — ayni mimarinin simülasyonunu yapiyorsun.**

---

## Adim 5: Test Senaryolari

### 5A: Editor'dan Sunucuya Kaydet

1. Tarayicida `http://localhost:5173/13/editor` ac
2. Editor password sorabilir (VITE_EDITOR_PASSWORD ayarliysan)
3. Sahnede bir seyler degistir (isik ekle, objeyi tasi, vb.)
4. Sag ustteki **"Sunucuya Kaydet"** butonuna tikla
5. Sifre modal'i acilacak → `test123` gir
6. "Proje sunucuya kaydedildi!" toast mesaji gormalisin
7. Dogrulama: `public/data/13/scene.json` dosyasini ac, degisikliklerin yazilmis olmali

### 5B: Admin Panel

1. `http://localhost:5173/admin` adresine git
2. Sifre: `test123`
3. Mevcut projeleri kartlar halinde gormeli
4. "Yeni Proje" tikla → proje ID ve ad gir → olustur
5. "ZIP Import" tikla → daha once export ettigin bir ZIP'i yukle
6. Proje kartinda "Taslaga Al" / "Yayinla" butonlarini test et
7. Thumbnail yukle: proje kartinin ustune gel, "Thumbnail Degistir" ile resim yukle

### 5C: Mevcut Akis Bozulmamis mi?

1. `http://localhost:5173/` → Ana sayfa hala calisiyor mu?
2. `http://localhost:5173/13` → Viewer hala calisiyor mu?
3. `http://localhost:5173/13/editor` → Editor hala calisiyor mu?
4. Editor'da "Disa Aktar" → ZIP indirme hala calisiyor mu?

### 5D: Auth Kontrolleri

```powershell
# Token olmadan proje olusturma denemesi → 401 donmeli
try {
  Invoke-RestMethod -Uri "http://localhost:3001/api/projects" `
    -Method Post `
    -Body '{"projectId":"hack","projectName":"test"}' `
    -ContentType "application/json"
} catch { $_.Exception.Response.StatusCode }
# Sonuc: 401

# Yanlis sifre → 401
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
  -Method Post `
  -Body '{"password":"yanlis"}' `
  -ContentType "application/json"
# Sonuc: Hata
```

---

## Adim 6: Production Build Test (Opsiyonel)

Vite dev server yerine production build'i de test edebilirsin:

```powershell
# Frontend build
cd C:\Users\erden.aydogdu\Desktop\gangedreality
npm run build

# Preview server baslat (dist/ klasorunu serve eder)
npm run preview
```

Bu `http://localhost:4173` adresinde calisir. Ama dikkat: preview server'da `/api` proxy'si yok. Tam production simülasyonu icin ya:
- Windows'a Nginx kur (sonraki bolum), ya da
- Sadece `npm run dev` ile test et (proxy otomatik calisiyor)

---

## Opsiyonel: Windows'ta Nginx Kurulumu (Tam Simülasyon)

Eger gercekten Nginx ile test etmek istersen:

### 1. Nginx Indir
- https://nginx.org/en/download.html → "Stable version" Windows zip'ini indir
- Ornegin `C:\nginx` altina cikart

### 2. nginx.conf Duzenle

`C:\nginx\conf\nginx.conf` dosyasini su sekilde duzenle:

```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    client_max_body_size 200M;

    server {
        listen 8080;
        server_name localhost;

        # SPA static (build edilmis dist/)
        root C:/Users/erden.aydogdu/Desktop/gangedreality/dist;
        index index.html;

        # Proje dosyalari
        location /data/ {
            alias C:/Users/erden.aydogdu/Desktop/gangedreality/public/data/;
        }

        # API proxy
        location /api/ {
            proxy_pass http://127.0.0.1:3001;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            client_max_body_size 200M;
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### 3. Build + Calistir

```powershell
# Frontend build
cd C:\Users\erden.aydogdu\Desktop\gangedreality
npm run build

# Backend baslat (ayri terminal)
cd server
$env:PORT = "3001"
$env:PROJECTS_STORAGE_PATH = "C:\Users\erden.aydogdu\Desktop\gangedreality\public\data"
$env:API_EDITOR_PASSWORD = "test123"
$env:JWT_SECRET = "local-dev-secret-key"
npm run dev

# Nginx baslat (ayri terminal)
cd C:\nginx
.\nginx.exe
```

### 4. Test Et

Tarayicida `http://localhost:8080` ac. Bu tam olarak production'daki gibi calisir:
- `/` → dist/ icindeki SPA
- `/data/*` → proje dosyalari
- `/api/*` → backend proxy

### 5. Nginx'i Durdurmak

```powershell
cd C:\nginx
.\nginx.exe -s quit
```

---

## Sorun Giderme

| Problem | Cozum |
|---------|-------|
| Backend baslamiyor | `PORT=3001` baska uygulama tarafindan kullaniliyor olabilir. `netstat -ano | findstr :3001` ile kontrol et |
| "Sunucuya Kaydet" 401 hatasi | Token suresi dolmus. Sayfayi yenile, tekrar sifre gir |
| Proje listesi bos geliyor | `PROJECTS_STORAGE_PATH` dogru mu kontrol et. O dizinde `project.json` iceren klasorler olmali |
| Vite proxy calismiyor | Backend'in calistigini kontrol et: `Invoke-RestMethod http://localhost:3001/api/health` |
| Upload hatasi | Dosya boyutu 200MB'yi asan model yollamiyorsun degil mi? |
| Nginx "403 Forbidden" | `root` ve `alias` yollarinda ters slash yerine duz slash kullan (`C:/path/to/dir/`) |

---

## Ozet: Calistirma Sirasi

```
Terminal 1: Backend       → cd server && npm run dev
Terminal 2: Frontend      → cd . && npm run dev
Tarayici:                 → http://localhost:5173
```

Hepsi bu. Iki terminal ac, iki komut calistir, test et.
