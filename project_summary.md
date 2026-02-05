# GangedReality Proje Özeti
**Tarih:** 22 Ocak 2026

## 1. Proje Hakkında
GangedReality, web tabanlı bir **3D CMS (İçerik Yönetim Sistemi)** projesidir. Kullanıcıların 3D modelleri (GLB/GLTF) yüklemesine, sahneyi ışıklandırmasına, etkileşimli alanlar (Pop-up) ve materyal varyasyonları oluşturmasına olanak tanır. Hazırlanan projeler .zip formatında dışa aktarılarak herhangi bir web sunucusunda görüntülenebilir.

## 2. Mevcut Durum (Proje Aşaması)
Proje şu anda **Faz 4 (Materyal Varyasyon Sistemi)** aşamasını tamamlamış ve **Faz 5 (Cila ve Optimizasyon)** aşamasına geçmiştir. Temel araçların (Transform, Export, Hotspots, Player Controls) tamamı çalışır durumdadır.

### Tamamlanan Ana Özellikler:
- [x] **Core Altyapı:** Vite + React + TypeScript + R3F + Zustand kurulumu.
- [x] **Editör Modu:**
    - Transform Gizmo (Taşıma, Döndürme, Ölçekleme).
    - Scene Outliner (Sahne Hiyerarşisi).
    - Işık Yönetimi (Directional, Point, Ambient).
    - Çoklu Model Desteği.
- [x] **Materyal Varyasyon Sistemi (Configurator):**
    - Mesh seçip renk/doku varyasyonları atama.
    - Menü üzerinden anlık materyal değiştirme.
- [x] **Etkileşim Sistemi:**
    - Yakınlık tabanlı (proximity) tetiklenen Pop-up alanları.
    - Dinamik Pop-up içerik editörü (Metin, Resim, Liste vb.).
- [x] **Navigasyon ve Oyuncu Modu:**
    - FPS (First Person) kontrolleri ve Octree tabanlı çarpışma (collision) sistemi.
    - Hotspot (Noktasal) navigasyon sistemi.
- [x] **Görsel Kalite:**
    - SSAO, Bloom, Vignette gibi post-processing efektleri.
    - HDRi/Environment map yönetimi.
- [x] **Dışa Aktarma:** Projeyi assets ve data klasörleriyle birlikte .zip olarak paketleme.

## 3. Klasör ve Dosya Yapısı

### Kök Dizin
- `src/`: Uygulama kaynak kodları.
- `public/`: Statik asset'ler ve örnek proje verileri (data/).
- `Project.md`: Projenin yol haritası ve teknik tasarımı.
- `package.json`: Bağımlılıklar (Three.js, Zustand, R3F vb.).

### `src/` Alt Dizini
- **`components/`**:
    - `canvas/`: 3D sahne elemanları (ModelRenderer, PlayerControls, LightingManager vb.).
    - `ui/`: 2D arayüz bileşenleri (Paneller, Menüler, Toast bildirimleri).
        - `panels/`: Editör panelleri (Variants, Lights, Effects, Interactions vb.).
- **`store/`**: Zustand ile yönetilen global state'ler (useProjectStore, useSceneStore, useEditorStore vb.).
- **`pages/`**:
    - `HomePage.tsx`: Proje listesi ve giriş sayfası.
    - `EditorPage.tsx`: Sahne düzenleme arayüzü.
    - `ViewerPage.tsx`: Projenin son kullanıcı tarafındaki görünümü.
- **`hooks/`**: Özel React kancaları (useModelLoader, useHistory vb.).
- **`utils/`**: Yardımcı fonksiyonlar (Octree fizik motoru, zipExporter).
- **`types/`**: TypeScript interface tanımlamaları.

### `public/data/` (Veri Yapısı)
Her proje kendi klasörü altında şu JSON dosyalarını barındırır:
- `project.json`: Genel meta veriler ve model yolları.
- `scene.json`: Işıklar, kamera ve çevre ayarları.
- `interactions.json`: Pop-up tetikleyicileri.
- `variants.json`: Materyal değiştirme seçenekleri.
- `hotspots.json`: Navigasyon noktaları.

## 4. Kullanılan Teknolojiler
- **Framework:** React 18
- **3D Engine:** Three.js & React Three Fiber
- **State Management:** Zustand (zundo ile undo/redo desteği)
- **Styling:** Tailwind CSS
- **Physics:** Custom Octree Implementation (FPS Collision)
- **Export:** JSZip & FileSaver

---
*GangedReality Project Summary - 2026*
