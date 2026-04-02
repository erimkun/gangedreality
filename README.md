# Ganged Reality - 3D İnteraktif İçerik Yönetim Sistemi

Ganged Reality, modern web teknolojileri kullanarak 3D ortamları yönetmek, düzenlemek ve yayınlamak için tam özellikli bir CMS sistemidir. React, Three.js ve Zustand ile güçlendirilmiş, gerçek zamanlı etkileşimler ve materyal varyasyonlarını destekler.

## ✨ Özellikler

- 🎨 **3D Model Editörü**: GLB/GLTF formatında profesyonel 3D modelleri içe aktarın ve düzenleyin
- 🎬 **Görüntüleme Modları**: Okuma modunda zengin kütüphane görüntüsü ile uygulamalar ve editör modunda tam kontrol
- 💾 **Sahne Yönetimi**: Ortam ayarları, aydınlatma, kamera, efektler ve oyuncu konumlanması
- 🎯 **Etkileşim Sistemleri**: Yakınlık tabanlı tetikleyiciler, açılır pencereler, metin, resim ve liste blokları
- 🎨 **Materyal Varyasyonları**: Sahne içindeki nesneler için renkler ve dokular dinamik olarak değiştirebilir
- 🗺️ **Hotspot Navigasyonu**: 3D ortamda gezinme noktaları, özel şekiller ve simgeler
- ⚡ **Gerçek Zamanlı İleri Görünüm**: Sahnede yapılan değişiklikleri anında görün
- 📦 **ZIP Dışa Aktarma**: Tam projeyi paylaşılabilir ZIP dosyası olarak dışa aktarın
- 🔐 **Şifre Korumalı Editor**: Editör moduna güvenli erişim
- 📱 **Duyarlı Tasarım**: Masaüstü ve mobil cihazlarda çalışır
- 🎞️ **Gelişmiş Efektler**: AO (Ambient Occlusion), Bloom, Vignette, Renk Gradasyonu, Hareket Bulanıklığı

## 🛠️ Teknoloji Stack'i

### Frontend
- **React** 18.3.1 - UI framework
- **Three.js** 0.167.1 - 3D rendering
- **React Three Fiber** 8.18.0 - React renderer for Three.js
- **React Three Drei** 9.122.0 - Useful helpers for R3F
- **Zustand** 5.0.2 - State management
- **Tailwind CSS** 3.4.17 - Styling
- **React Router** 7.1.0 - Routing
- **GSAP** 3.14.2 - Animations
- **JSZip** 3.10.1 - ZIP file handling
- **PostProcessing** 6.36.0 - Post-processing effects

### Backend
- **Node.js/TypeScript** - Server runtime
- **Express** (implied) - API server

### Tools & Build
- **Vite** 6.0.5 - Build tool
- **TypeScript** 5.7.2 - Type safety
- **PostCSS** 8.4.49 - CSS processing
- **ESLint** 9.17.0 - Code linting

### Deployment
- **Vercel** - Frontend hosting with SPA configuration

## 📦 Kurulum

### Ön Koşullar
- Node.js 18+ ve npm/yarn
- Git

### Adım 1: Projeyi Klonlayın
```bash
git clone <repository-url>
cd gangedreality
```

### Adım 2: Bağımlılıkları Yükleyin
```bash
npm install
cd server && npm install && cd ..
```

### Adım 3: Çevre Değişkenlerini Ayarlayın
Frontend root'ta `.env.local` dosyası oluşturun:
```env
VITE_EDITOR_PASSWORD=your_secure_password_here
```

Backend için `server/.env` dosyası oluşturun:
```env
NODE_ENV=development
PORT=5000
```

## 🚀 Geliştirme Sunucusu

Frontend ve backend'i paralel olarak çalıştırın:

```bash
npm run dev
```

Bu komut:
- Frontend Vite sunucusunu `http://localhost:5173` adresinde başlatır
- Backend sunucusunu `http://localhost:5000` adresinde başlatır

Ayrı ayrı çalıştırmak için:
```bash
npm run dev:fe    # Sadece frontend
npm run dev:be    # Sadece backend
```

## 🏗️ Yapı ve Dağıtım

### Production Build'i Oluşturun
```bash
npm run build
```

Bu komut:
- TypeScript'i kontrol eder
- Frontend ve backend'i optimize eder
- `dist/` klasöründe kullanıma hazır dosyalar oluşturur

### Yerel Olarak Önizleyin
```bash
npm run preview
```

## 📁 Proje Yapısı

```
gangedreality/
├── src/                          # Frontend kaynak kodu
│   ├── components/
│   │   ├── canvas/              # 3D renderer bileşenleri
│   │   │   ├── ModelRenderer.tsx
│   │   │   ├── FlyControls.tsx
│   │   │   ├── LightingManager.tsx
│   │   │   ├── EffectsManager.tsx
│   │   │   ├── HotspotRenderer.tsx
│   │   │   └── ...
│   │   ├── ui/                  # UI panelleri
│   │   │   └── panels/
│   │   │       ├── PropertiesPanel.tsx
│   │   │       ├── LightsPanel.tsx
│   │   │       ├── InteractionsPanel.tsx
│   │   │       ├── VariantsPanel.tsx
│   │   │       ├── EffectsPanel.tsx
│   │   │       └── ...
│   │   └── ViewerContent.tsx
│   ├── pages/
│   │   ├── HomePage.tsx         # Proje listesi
│   │   ├── ViewerPage.tsx       # 3D görüntüleme
│   │   └── EditorPage.tsx       # 3D edit
│   ├── hooks/
│   │   ├── useModelLoader.ts    # Model yükleme
│   │   └── useHistory.ts        # Undo/Redo
│   ├── store/                   # Zustand state stores
│   │   ├── useProjectStore.ts
│   │   ├── useSceneStore.ts
│   │   ├── useEditorStore.ts
│   │   ├── useInteractionsStore.ts
│   │   ├── useVariantsStore.ts
│   │   ├── useHotspotStore.ts
│   │   └── ...
│   ├── services/
│   │   └── api.ts              # API istekleri
│   ├── utils/
│   │   ├── zipExporter.ts      # ZIP export
│   │   └── Octree.ts           # Spatial indexing
│   ├── types/
│   │   └── index.ts            # TypeScript tipleri
│   ├── App.tsx
│   └── main.tsx
├── server/                       # Backend kaynak kodu
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   └── projects.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── utils/
│   │   │   └── fileManager.ts
│   │   ├── bootstrap.ts
│   │   └── index.ts
│   └── package.json
├── public/                       # Statik dosyalar
│   └── data/
│       ├── projects.json        # Tüm projelerin listesi
│       ├── {projectId}/
│       │   ├── project.json     # Proje metaveri
│       │   ├── scene.json       # Sahne ve ortam
│       │   ├── interactions.json # Etkileşim noktaları
│       │   ├── variants.json    # Materyal varyasyonları
│       │   ├── hotspots.json    # Navigasyon noktaları
│       │   ├── model/           # 3D modeller
│       │   └── textures/        # Dokular ve HDRi
├── nginx/                        # Nginx konfigürasyonu
├── docs/                         # Belgeleme
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

## 🎯 Kullanım

### Ana Sayfa (Homepage)
- Tüm yayınlanmış projeleri listeler
- `public/data/projects.json` adresinden yüklenir
- Proje kartlarına tıklayarak görüntüleme moduna gidin

### Görüntüleme Modu (`/:projectId`)
- Proje ID'si ile tam 3D sahneyi görüntüleyin
- **Kontroller**:
  - Sol tık + WASD: Uçuş hareketi
  - Fareyi Hareket Ettir: Kamera yönü
  - Etkileşim bölgelerine girme: Açılır pencereleri göster

### Editör Modu (`/:projectId/editor`)
- Proje yapısını tamamen düzenleyin
- Şifre korumalı erişim (VITE_EDITOR_PASSWORD)
- **Ana özellikler**:
  - Modelleri içe aktarın ve konumlandırın
  - Malzemeleri ve dokuları yönetin
  - Işık ve efektleri ayarlayın
  - Etkileşim bölgeleri ve hotspot'ları oluşturun
  - Undo/Redo desteği (Ctrl+Z / Ctrl+Shift+Z)
  - Tamamlanmış projeyi ZIP olarak dışa aktarın

## 📊 Veri Yapısı

### project.json
```json
{
  "id": "project-id",
  "name": "Proje Adı",
  "description": "Açıklama",
  "assets": {
    "models": [{ "name": "Model", "path": "model/model.glb" }],
    "textures": [{ "name": "HDRi", "path": "textures/hdri.hdr" }]
  }
}
```

### scene.json
Ortam ayarları, kamera, ışıklar ve efektler içerir.

### interactions.json
Yakınlık tabanlı etkileşim bölgeleri ve açılır pencere içeriği.

### hotspots.json
Navigasyon noktaları, şekilleri ve özel simgeleri.

### variants.json
Materyal varyasyonları (renkler, dokular).

## 🔐 Güvenlik

- Editör şifresi ortam değişkeni ile korunur
- API istekleri backend tarafından doğrulanır
- Dosya yükleme boyut sınırları var
- ZIP dışa aktarma veya genel erişim olabilir

## 📚 Belgeleme

Ek belgeleme için `docs/` klasörüne bakın:
- `local-test-rehberi.md` - Yerel testing kılavuzu
- `full-test-checklist.md` - Kapsamlı test kontrol listesi
- `nginx-deploy-rehberi.md` - Nginx dağıtım kılavuzu

## 🌐 Dağıtım

### Vercel (Recommended)
1. Repository'yi GitHub'a itin
2. Vercel Dashboard'da yeni proje oluşturun
3. Root directory'i seçin
4. `VITE_EDITOR_PASSWORD` ortam değişkenini ayarlayın
5. Deploy edin

### Özel Sunucu / Docker
1. `npm run build` komutunu çalıştırın
2. Nginx/Apache kullanarak `dist/` klasörünü sunun
3. API istekleri backend sunucusuna yönlendirin

### Nginx Örneği
Nginx yapılandırması için `nginx/gangedreality.conf` dosyasına bakın.

## 🐛 Hata Raporlama

Hataları GitHub Issues'te raporlayın. Lütfen aşağıdakileri ekleyin:
- Hatanın açıklaması
- Adımları tekrar üretin
- Tarayıcı ve OS bilgisi
- Varsa hata mesajı

## 📝 Katkı

Katkılar memnuniyetle karşılanır! Lütfen:

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişiklikleri commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'ı push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel lisans altında yayınlanmıştır. Tüm hakları saklıdır.

## 📞 İletişim

Sorularınız veya önerileri için lütfen bağlantı kurun.

---

**Son Güncelleme**: 2 Nisan 2026  
**Versiyon**: 0.0.1  
**Geliştirici**: Ganged Reality Team
