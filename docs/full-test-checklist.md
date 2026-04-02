# Ganged Reality — Kapsamli Test Kontrol Listesi

> Nginx'e deploy etmeden once tum bu adimlari yerel ortamda test et.
> Her basarili testi `[x]` olarak isaretle.
> 2026-03-09 test notu: Bos kutu ya henuz test edilmedi ya da beklenen sonuc alinmadi; belirgin basarisizliklar satir sonunda not edildi.

---

## 0. Ortam Hazirlik

- [x] `npm install` (root) — hatasiz tamamlandi
- [x] `cd server && npm install` — hatasiz tamamlandi
- [x] `npm run build` (root) — frontend build basarili, `dist/` olusmus
- [x] `cd server && npm run build` — backend build basarili, `server/dist/` olusmus
- [x] `npm run dev` — concurrently ile frontend + backend birlikte basliyor
- [x] Terminal ciktisinda `[fe] VITE ready` ve `[be] Server running on port 3001` gorunuyor
- [x] `http://localhost:5173` tarayicida aciliyor
- [x] `http://localhost:3001/api/health` → `{"status":"ok","projectsPath":"..."}` donuyor

---

## 1. Ana Sayfa (HomePage — `/`)

- [x] `http://localhost:5173/` aciliyor, WebGL arka plan animasyonu calisiyor
- [ ] Mevcut projeler listeleniyor (kart/liste gorunumu) — BASARISIZ: landing icerigi var, proje kartlari render olmadi
- [ ] Bir proje kartina tiklaninca `/:projectId` viewer'a gidiyor — BASARISIZ: proje karti uretilemedigi icin akis dogrulanamadi
- [ ] Editor linkine tiklaninca `/:projectId/editor` aciliyor — BASARISIZ: proje karti uretilemedigi icin akis dogrulanamadi
- [ ] `/admin` linkine tiklaninca admin sayfasina gidiyor — BASARISIZ: sayfada `/admin` linki gorunmedi
- [ ] Sayfa responsive — mobilde de duzgun gorunuyor

---

## 2. Viewer Sayfasi (`/:projectId`)

### 2A: Proje Yukleme
- [x] `http://localhost:5173/13` → proje yukleniyor, model gorunuyor
- [x] `http://localhost:5173/1108-1` → farkli proje yukleniyor
- [x] `http://localhost:5173/olmayan-proje` → editor'a yonlendirme veya "bulunamadi" mesaji
- [x] Proje yuklenirken loading ekrani gorunuyor
- [x] Model yuklendikten sonra loading kaybolup sahne gorunuyor

### 2B: Orbit Modu (Varsayilan)
- [x ] Sol tik + surukle → sahne doner
- [ x] Sag tik + surukle → pan (kaydir)
- [x ] Fare tekerlegi → zoom in/out
- [x] Sahne bos degilse model ortada gorunuyor

### 2C: Player Modu
- [ x] Player moduna gecis butonu calisiyor

- [ ]x Fare ile etrafina bakiliyor (first-person)
- [ x] Goz yuksekligi (eyeHeight) uygulanmis
- [ x] Hareket hizi ayarlanmis (moveSpeed)

### 2D: Hotspot Navigasyonu
- [x ] Sahnedeki hotspot noktlari gorunuyor (daire/pin)
- [ x] Hotspot'a tiklaninca kamera 2.5s animasyonla o noktaya gidiyor
- [ x] Gecis sirasinda motion blur efekti calisiyor (aktifse)
- [ x] Animasyon bitince kamera dogru pozisyonda duruyor
- [x ] Hotspot label'lari gorunuyor (varsa)
- [ x] Hotspot'lara hizli art arda tiklandiginda crash olmuyor

### 2E: Interaction Zone'lar
- [ x] Yakinliga gore popup aciliyor (proximity trigger)
- [x ] Popup icinde text bloklari duzgun gorunuyor
- [ x] Popup icinde resim bloklari gorunuyor
- [x ] Popup icinde liste bloklari gorunuyor
- [x ] Popup kapatma calisiyor
- [ x] Zone'dan uzaklasilinca popup kapaniyor (auto-close)

### 2F: Variant Configurator
- [x] Configurator paneli gorunuyor (variant gruplari varsa)
- [x ] Variant secenegi tiklaninca material/renk degisiyor
- [ x] Texture variant secilince doku dogru uygulaniyor
- [ x] Renk variant secilince renk dogru degisiyor
- [ ] Birden fazla grup birbirinden bagimsiz calisiyor

f

### 2H: Diger Viewer Ozellikleri
- [x ] FPS sayaci gosteriliyor (aktifse)
- [ x] Kontrol bilgisi (ControlsInfo) gorunuyor
- [ x] Arka plan sesi calisiyor (ayarlanmissa)
- [ x] HDRI ortam ayarlari (preset veya custom) dogru gorunuyor
- [ x] Gzip ile sikistirilmis asset'ler dogru yukleniyor

---

## 3. Editor Sayfasi (`/:projectId/editor`)

### 3A: Giris & Yukleme
- [x] `http://localhost:5173/13/editor` → editor aciliyor
- [ ] VITE_EDITOR_PASSWORD ayarliysa sifre soruyor
- [ ] Dogru sifre ile giris yapiliyor
- [ ] Yanlis sifre ile giris reddediliyor
- [ ] Sifre localStorage'da saklaniyor (sayfa yenilemede tekrar sormuyor)
- [ ] Proje verileri dogru yukleniyor (sahne, isiklar, hotspot'lar)
- [ ] Kamera onceki kayitli pozisyona donuyor

### 3B: Canvas Kontrolleri
- [ x] Orbit kontrolleri: sag tik dondurme, orta tik pan, tekerlek zoom
- [ x] Fly mode: sol tik + WASD, hiz gostergesi gorunuyor
- [x ] Fly hizi arttirilip azaltilabiliyor (1-50 aralik)
- [x ] Orbit ile fly arasinda gecis duzgun calisiyor

### 3C: Transform Araclari
- [ x] Translate (W veya G tusu) → obje tasiniyor
- [ x] Rotate (E tusu) → obje dondurulluyor
- [ x] Scale (R veya S tusu) → obje olcekleniyor
- [x ] Gizmo gorunuyor ve surukleyince obje hareket ediyor
- [x ] World/Local space toggle calisiyor
- [ x] Gizmo surukleme sirasinda orbit devre disi

### 3D: Obje Secimi
- [ x] Sahneye tikleyince obje seciliyor
- [ x] SelectionHighlight (outline) gorunuyor
- [ x] Ctrl+Click ile coklu secim calisiyor
- [ x] Ctrl+A ile tum mesh'ler seciliyor
- [ x] Bos alana tikleyince secim kalkiyor
- [ x] Delete tusu ile secili obje siliniyor (soft delete — visible=false)
- [ x] Silinen obje Outliner'dan kayboluyor

### 3E: Sol Panel — Properties (Ozellikler)
- [ ] Secili objenin Position X/Y/Z alanlari gorunuyor
- [ ] Deger degistirilince obje hareket ediyor
- [ ] Rotation X/Y/Z degisikligi objeyi dondurur
- [ ] Scale X/Y/Z degisikligi objeyi olcekler
- [ ] "Walkable Mesh" toggle calisiyor
- [ ] "Variant Group Olustur" butonu calisiyor

### 3F: Sol Panel — Isiklar (Lights)
- [ ] Directional Light ekleniyor
- [ ] Point Light ekleniyor
- [ ] Spot Light ekleniyor
- [ ] Ambient Light ekleniyor
- [ ] Isik rengi degistiriliyor
- [ ] Isik yogunlugu degistiriliyor
- [ ] Isik pozisyonu degistiriliyor
- [ ] Golge ayarlari (shadow) degistiriliyor
- [ ] Isik silinebiliyor

### 3G: Sol Panel — Player Ayarlari
- [ ] Baslangic pozisyonu X/Y/Z ayarlanabiliyor
- [ ] Baslangic rotasyonu ayarlanabiliyor
- [ ] Hareket hizi ayarlanabiliyor
- [ ] Goz yuksekligi ayarlanabiliyor
- [ ] "Kameradan Ayarla" butonu gecerli kamera pozisyonunu aliyor

### 3H: Sol Panel — Interaction Zone'lar
- [ ] Yeni zone ekleniyor
- [ ] Zone pozisyonu degistiriliyor
- [ ] Zone yaricapi degistiriliyor
- [ ] Trigger tipi seciliyor (proximity)
- [ ] Popup icine text blogu ekleniyor
- [ ] Popup icine resim blogu ekleniyor
- [ ] Popup icine liste blogu ekleniyor
- [ ] Popup icine divider ekleniyor
- [ ] Popup stili (renk, opaklık, padding, border, blur, golge) degistiriliyor
- [ ] Zone silinebiliyor
- [ ] Sahnede zone kureleri gorunuyor

### 3I: Sol Panel — Variant Gruplari
- [ ] Yeni variant grubu oluşturuluyor
- [ ] Gruba hedef mesh ekleniyor
- [ ] Renk variant secenegi ekleniyor
- [ ] Texture variant secenegi ekleniyor
- [ ] Texture URL, Normal Map, Roughness Map alanlari calisiyor
- [ ] Metalness/Roughness slider'lari calisiyor
- [ ] Tiling ayarlari calisiyor
- [ ] Variant secimi canli onizleme yapıyor (editor'da)
- [ ] Variant grubu silinebiliyor

### 3J: Sol Panel — Efektler (Effects)
- [ ] N8AO (Ambient Occlusion) toggle & ayarlari
- [ ] Bloom toggle & ayarlari (intensity, threshold, radius)
- [ ] Vignette toggle & ayarlari
- [ ] Color Grading ayarlari
- [ ] Efektler canli olarak sahnede gorunuyor

### 3K: Sol Panel — Hotspot Noktlari
- [ ] Yeni navigasyon noktasi ekleniyor
- [ ] Nokta pozisyonu degistiriliyor
- [ ] Nokta gorunurlugu toggle ediliyor
- [ ] Label metni degistiriliyor
- [ ] Custom icon yuklenebiliyor
- [ ] Sekil (daire/pin) degistiriliyor
- [ ] Varsayilan renk/boyut ayarlari degistiriliyor
- [ ] Walkable mesh secimi calisiyor
- [ ] Nokta silinebiliyor

### 3L: Sol Panel — Outliner
- [ ] Tum sahne mesh'leri listeleniyor
- [ ] Mesh ismi gorunuyor
- [ ] Mesh gorunurluk toggle calisiyor (goz ikonu)
- [ ] Mesh'e tikleyince sahnede seciliyor
- [ ] Hiyerarsi dogru gorunuyor (group > mesh)

### 3M: Ortam (Environment) Ayarlari
- [ ] HDRI preset degistiriliyor (apartment, city, forest, vb.)
- [ ] HDRI yogunlugu degistiriliyor
- [ ] HDRI rotasyonu degistiriliyor
- [ ] Custom HDRI dosyasi yuklenebiliyor
- [ ] Arka plan bulanikligi (backgroundBlurriness) ayarlanabiliyor
- [ ] Arka plan gosterme/gizleme toggle

### 3N: Model Yukleme
- [ ] Drag & drop ile GLB dosyasi yukleniyor
- [ ] Dosya secici ile GLB dosyasi yukleniyor
- [x] Model yuklendikten sonra sahnede gorunuyor
- [ ] Birden fazla model art arda yuklenebiliyor
- [ ] Desteklenmeyen dosya formati reddediliyor (sadece .glb, .gltf)
- [ ] Cok buyuk dosya (>200MB) icin uyari veya hata

### 3O: Undo/Redo
- [ ] Ctrl+Z → son islemi geri aliyor
- [ ] Ctrl+Y → geri alinan islemi yeniden yapiyor
- [ ] Birden fazla undo/redo art arda calisiyor
- [ ] Maksimum 50 gecmis kaydi tutuluyor

### 3P: Sunucuya Kaydet
- [x] "Sunucuya Kaydet" butonu gorunuyor (bulut ikonu, sag ustte)
- [ ] Ctrl+S kisayolu calisiyor
- [x] Token yoksa sifre modali aciliyor
- [x] Dogru sifre ile token aliniyor ve kayit basliyor
- [x] Yanlis sifre ile hata mesaji gorunuyor
- [x] Model dosyalari (GLB) sunucuya yukleniyor
- [x] Texture dosyalari sunucuya yukleniyor
- [ ] Interaction resimleri sunucuya yukleniyor
- [x] blob: URL'ler JSON'larda relative path'e donuyor (model/xxx.glb)
- [x] /data/projectId/... URL'ler relative path'e donuyor
- [x] Tum JSON'lar (project, scene, interactions, variants, hotspots) kaydediliyor
- [ ] Basari toast mesaji gorunuyor: "Proje sunucuya kaydedildi!"
- [ ] Hata durumunda hata toast mesaji gorunuyor
- [x] **Kaydet → Sayfa yenile → Model tekrar yukleniyor (blob sorunu yok)**
- [x] **Kaydet → Viewer'da ac → Duzgun gorunuyor**

### 3Q: ZIP Disa Aktar
- [x] "Disa Aktar" butonu gorunuyor
- [ ] Ctrl+Shift+E kisayolu calisiyor
- [ ] ZIP dosyasi indiriliyor — TEST EDILEMEDI: tarayici oturumunda download eventi yakalanamadi
- [ ] ZIP icinde: project.json, scene.json, interactions.json, variants.json, hotspots.json
- [ ] ZIP icinde: model/ klasoru (GLB dosyasi)
- [ ] ZIP icinde: textures/ klasoru (texture dosyalari)
- [ ] ZIP icinde: README.md
- [ ] JSON'lardaki URL'ler relative path olarak yazilmis
- [ ] Interaction resimleri textures/ klasorune eklenmis
- [ ] Progress gostergesi calisiyor

### 3R: Viewer Onizleme
- [x] Editor icinden "Onizle" butonu calisiyor
- [ ] Onizleme modali aciliyor — BASARISIZ: buton modal yerine dogrudan `/:projectId` route'una gidiyor
- [x] Viewer gorunumu dogru calisiyor
- [ ] Modal kapatilinca editor'a donuyor — BASARISIZ: modal acilmadigi icin editor'a modal kapatarak donus yok

---

## 4. Admin Sayfasi (`/admin`)

### 4A: Giris
- [x] `http://localhost:5173/admin` → sifre ekrani gorunuyor
- [x] Dogru sifre ile giris yapiliyor
- [x] Yanlis sifre ile hata mesaji
- [ ] "Ana Sayfa" linki calisiyor
- [ ] Token varsa otomatik giris (sifre sormadan)
- [x] Cikis butonu calisiyor ve tekrar sifre soruyor

### 4B: Proje Listesi
- [x] Tum projeler kartlar halinde gorunuyor
- [x] Her kartta thumbnail gorunuyor (varsa)
- [ ] Thumbnail yoksa placeholder icon gorunuyor
- [x] Durum badge'i gorunuyor (Yayinda / Taslak)
- [x] Proje adi gorunuyor
- [x] Proje ID gorunuyor
- [x] Proje sayisi header'da gorunuyor
- [ ] Hic proje yoksa "Henuz proje yok" mesaji gorunuyor

### 4C: Yeni Proje Olusturma
- [x] "Yeni Proje" butonu modali aciyor
- [ ] Proje ID alani ozel karakter filtreliyor (sadece harf, rakam, tire, alt cizgi)
- [x] Proje adi girilebiliyor
- [ ] Bos ID ile gonderilemiyor
- [x] Olusturma basarili → toast + liste guncelleniyor
- [x] Ayni ID ile tekrar olusturma → hata (409 conflict)
- [ ] Iptal butonu modali kapatiyor

### 4D: Proje Duzenleme
- [x] Proje adina tiklaninca inline editing aciliyor
- [x] Yeni ad girilip Enter ile kaydediliyor
- [ ] Escape ile iptal ediliyor
- [x] Durum toggle: "Taslaga Al" / "Yayinla" calisiyor

### 4E: Thumbnail Yukleme
- [x] Proje kartinin uzerine gelinince "Thumbnail Degistir" gorunuyor
- [x] Resim dosyasi secilip yukleniyor
- [x] Yukleme sonrasi thumbnail guncelleniyor
- [x] Thumbnail `textures/thumbnail.jpg` olarak kaydediliyor

### 4F: ZIP Import
- [ ] "ZIP Import" butonu modali aciyor
- [ ] ZIP dosyasi drag & drop ile yuklenebiliyor
- [ ] ZIP dosyasi dosya secici ile yuklenebiliyor
- [ ] Proje ID otomatik ZIP adından olusturuluyor
- [ ] Import basarili → toast + liste guncelleniyor
- [ ] Buyuk ZIP dosyasi (50MB+) yuklenebiliyor

### 4G: Proje Silme
- [x] "Sil" butonu onay modali aciyor
- [x] Onay modali proje adini gosteriyor
- [x] "Evet, Sil" ile proje siliniyor
- [x] "Iptal" ile modal kapaniyor
- [x] Silme sonrasi liste guncelleniyor
- [x] Silinen proje dosya sisteminden de kalkiyor

### 4H: Navigasyon Linkleri
- [x] "Editor" linki → `/:projectId/editor` aciyor
- [x] "Viewer" linki → `/:projectId` aciyor
- [ ] "Ana Sayfa" linki → `/` aciyor

---

## 5. API Endpoint Testleri (Backend)

### 5A: Health Check
- [x] `GET /api/health` → 200, `{"status":"ok",...}`

### 5B: Auth
- [x] `POST /api/auth/login` dogru sifre → 200, token donuyor
- [x] `POST /api/auth/login` yanlis sifre → 401
- [x] `POST /api/auth/login` bos body → 401
- [ ] API_EDITOR_PASSWORD bos ise herkese token veriyor

### 5C: Proje Listesi
- [x] `GET /api/projects` → 200, dizi donuyor
- [x] Her proje icinde projectId, projectName, status, thumbnail alanlari var

### 5D: Proje Detay
- [x] `GET /api/projects/13` → 200, project+scene+interactions+variants+hotspots donuyor
- [x] `GET /api/projects/olmayan` → 404
- [ ] `GET /api/projects/../etc/passwd` → 400 (path traversal engeli) — BASARISIZ: 404 dondu

### 5E: Proje Oluşturma
- [x] `POST /api/projects` token ile → 201
- [x] `POST /api/projects` token olmadan → 401
- [x] `POST /api/projects` gecersiz ID (`../hack`) → 400
- [x] `POST /api/projects` var olan ID → 409

### 5F: Proje Kaydetme
- [x] `PUT /api/projects/:id` JSON body ile → 200
- [x] `PUT /api/projects/:id` bos body → 400
- [x] `PUT /api/projects/:id` token olmadan → 401

### 5G: Proje Silme
- [x] `DELETE /api/projects/:id` token ile → 200
- [x] `DELETE /api/projects/:id` token olmadan → 401
- [x] Silme sonrasi klasor kaybolmus mu? `ls public/data/silinecek` → yok

### 5H: Asset Upload
- [x] `POST /api/projects/:id/assets?folder=model` GLB dosyasi → 200
- [x] `POST /api/projects/:id/assets?folder=textures` PNG dosyasi → 200
- [x] `POST /api/projects/:id/assets` izin verilmeyen uzanti (.exe) → 400
- [ ] `POST /api/projects/:id/assets` dosya adi `../hack.glb` → 400 — BASARISIZ: crafted multipart filename 200 ile kabul edildi
- [ ] `POST /api/projects/:id/assets` 200MB ustu → 413
- [x] Dosya fiziksel olarak dogru klasorde mi? `ls public/data/:id/model/`

### 5I: Thumbnail Upload
- [x] `POST /api/projects/:id/thumbnail` resim dosyasi → 200
- [x] Dosya `textures/thumbnail.jpg` olarak kaydedilmis mi?
- [x] `project.json` icinde `thumbnail: "textures/thumbnail.jpg"` var mi?

### 5J: ZIP Publish
- [ ] `POST /api/projects/:id/publish` ZIP dosyasi → 200
- [ ] ZIP icerigi dogru klasore cikarilmis mi?
- [ ] Path traversal iceren ZIP (../../hack) → dosya disari cikmamis

### 5K: Settings
- [x] `PATCH /api/projects/:id/settings` `{projectName:"Yeni Ad"}` → 200
- [x] `PATCH /api/projects/:id/settings` `{status:"draft"}` → 200
- [x] `PATCH /api/projects/:id/settings` `{status:"invalid"}` → 400

---

## 6. Entegrasyon Testleri (Uctan Uca)

### 6A: Yeni Proje Akisi
- [x] Admin'den yeni proje olustur (ID: `test-proje`) — `agenttest` ile dogrulandi
- [x] Editor'a git: `http://localhost:5173/test-proje/editor` — `agenttest/editor` ile dogrulandi
- [ ] Model yukle (drag & drop) — DOSYA SECICI ile model yukleme dogrulandi, drag & drop ayri dogrulanmadi
- [ ] Isik ekle, pozisyonunu degistir
- [ ] Hotspot noktasi ekle
- [ ] Interaction zone ekle, popup icine text yaz
- [x] "Sunucuya Kaydet" tikla, sifre gir → basarili
- [x] Sayfayi yenile → her sey yerinde mi?
- [x] Viewer'da ac: `http://localhost:5173/test-proje` → model gorunuyor mu? — `agenttest` ile dogrulandi
- [ ] Viewer'da hotspot'a tikla → animasyon calisiyor mu?
- [ ] Viewer'da zone'a yaklas → popup aciliyor mu?

### 6B: Mevcut Proje Akisi
- [ ] `http://localhost:5173/13/editor` ac
- [ ] Sahnede bir sey degistir (ísik rengini degistir)
- [ ] "Sunucuya Kaydet" tikla
- [ ] Viewer'da ac: `http://localhost:5173/13` → degisiklik yansimis mi?
- [ ] Sayfa yenile → degisiklik hala orada mi?

### 6C: ZIP Import + Edit Akisi
- [ ] Editor'dan proje export et (ZIP indir)
- [ ] Admin'den ZIP Import et (farkli ID ile)
- [ ] Import edilen projeyi editor'da ac → her sey yuklu mu?
- [ ] Degisiklik yap → kaydet → viewer'da kontrol et

### 6D: Coklu Proje
- [x] 2-3 farkli proje arasinda gec
- [ ] Her projenin kendi verisi korunmus mu?
- [x] Bir projeyi silerken diger projeler etkilenmemis mi?

### 6E: Auth Akisi
- [x] Token olmadan editor'dan kaydet → sifre modali aciyor
- [x] Sifre gir → token aliniyor → kayit otomatik basliyor
- [ ] Token suresi dolmus (24 saat) → tekrar sifre soruyor
- [x] Admin'de cikis yap → tekrar sifre soruyor
- [ ] Yanlis sifre 3 kere → hala dogru sifre ile girebiliyor

---

## 7. Performans & Edge Case'ler

### 7A: Buyuk Dosyalar
- [ ] 100MB GLB dosyasi yukleniyor mu?
- [ ] 4K texture yukleniyor mu?
- [ ] Yuklerken progress/loading gorunuyor mu?

### 7B: Hatali Durumlar
- [ ] Backend kapali iken editor'da gezinme calisiyor mu? (statik icerik)
- [ ] Backend kapali iken "Sunucuya Kaydet" → anlamli hata mesaji
- [ ] Network kesilince ne oluyor?
- [ ] Gecersiz JSON dosyasi olan proje acilinca ne oluyor?

### 7C: Tarayici Uyumluluk
- [ ] Chrome → tum ozellikler calisiyor
- [ ] Firefox → tum ozellikler calisiyor
- [ ] Edge → tum ozellikler calisiyor
- [ ] Safari (Mac varsa) → WebGL calisiyor

### 7D: Esanli Islemler
- [ ] Kaydet sirasinda baska sekmeye gecis yapilinca crash olmuyor
- [ ] Iki farkli sekmede ayni projeyi acma → veri catismasi yok (overwrite)
- [ ] Export sirasinda sayfadan cikilinca crash yok

---

## 8. Ortam Degiskenleri

- [x] `VITE_API_BASE_URL` bos → default `/api` kullaniliyor
- [x] `VITE_EDITOR_PASSWORD` bos → editor kilitsiz aciliyor
- [ ] `VITE_EDITOR_PASSWORD` dolu → sifre soruyor
- [ ] `API_EDITOR_PASSWORD` bos → herkese token veriyor (dikkat!)
- [ ] `PROJECTS_STORAGE_PATH` yanlis → anlamli hata mesaji
- [ ] `JWT_SECRET` farkli deger → eski tokenlar gecersiz oluyor

---

## 9. Guvenlik Kontrolleri

- [ ] Path traversal: `GET /api/projects/../../../etc/passwd` → 400 — BASARISIZ: 404 dondu
- [ ] Path traversal: Asset upload `filename=../../hack.js` → 400 — BASARISIZ: upload 200 ile kabul edildi
- [ ] Path traversal: ZIP icinde `../../etc/passwd` → atlaniyor (extract edilmiyor)
- [x] Auth bypass: Token olmadan POST/PUT/DELETE → 401
- [ ] Auth bypass: Gecersiz token → 401
- [ ] Auth bypass: Suresi dolmus token → 401
- [ ] XSS: Proje adinda `<script>alert(1)</script>` → escape ediliyor
- [x] Dosya turu: `.exe`, `.sh`, `.bat` upload → 400 (izin verilmeyen tur)
- [ ] Buyuk dosya: 200MB ustu → 413

---

## Ozet: Kritik Test Sirasi

Eger zaman kisitliysa bu sirada test et (en onemli once):

1. **Ortam baslatma** (Adim 0)
2. **API endpoint'leri** (Adim 5A-5E)
3. **Editor kaydet + yenile** (Adim 3P — ozellikle blob URL fix kontrolu)
4. **Admin temel islemler** (Adim 4A-4C, 4G)
5. **Uctan uca akis** (Adim 6A — yeni proje akisi)
6. **Viewer calisiyor mu** (Adim 2A-2C)
7. **Guvenlik kontrolleri** (Adim 9)
