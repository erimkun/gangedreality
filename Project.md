İstediğin detay seviyesinde, bu sistemi **"Web Tabanlı 3D CMS (İçerik Yönetim Sistemi)"** gibi kurgulayan kapsamlı teknik raporun **1. Bölümü (Mimari ve Veri Yapısı)** aşağıdadır.

Bu bölüm, kodlamaya başlamadan önce projenin omurgasını oluşturur.

---

# PROJE TEKNİK TASARIM RAPORU - BÖLÜM 1: MİMARİ & VERİ YAPISI

## 1. Teknoloji Yığını (Tech Stack) Seçimi

Performans, modülerlik ve "build" çıktı boyutu göz önüne alındığında önerim şudur:

* **Framework:** **Vite + React (TypeScript)**
* *Neden?* Next.js sunucu tarafı (SSR) odaklıdır. Bizim projemiz ise %90 Client-Side (Tarayıcıda) çalışacak bir 3D uygulamadır. Vite, daha hızlıdır, daha hafif çıktılar üretir ve alt klasörlerde (`/1108-1/` gibi) çalıştırmak için ayar yapması çok daha kolaydır.


* **3D Motoru:** **Three.js** + **React Three Fiber (R3F)**
* Declarative yapısı sayesinde React state'leri ile 3D sahneyi senkronize etmek çok kolaydır.


* **State Management (Durum Yönetimi):** **Zustand**
* *Neden?* Redux'tan çok daha hafiftir. "Undo/Redo" (Geri Al/İleri Al) mekanizmasını kurmak için `zundo` gibi hazır middleware'leri vardır. 3D render döngüsünü yavaşlatmaz.


* **UI Framework:** **Tailwind CSS** + **Radix UI** (veya benzeri Headless UI)
* Editör panelleri ve şık Pop-up'lar için.


* **Utility:** **Leva** (Hızlı debug panelleri için - Opsiyonel), **React-Three-Drei** (Hazır Gizmo, Camera Controls, Loaderlar için).

---

## 2. Sistem Mimarisi ve Dosya Yapısı

Sistemi tek bir devasa JSON yerine, yönetilebilir parçalara böleceğiz. Proje "Paketlendiğinde" (Zip'lendiğinde) klasör yapısı tam olarak şöyle görünecek:

### Sunucu / Klasör Yapısı (Örnek: `/1108-1/`)

```text
/1108-1/
  ├── index.html        (Viewer/App giriş noktası - Build edilmiş React App)
  ├── assets/           (Build edilmiş JS ve CSS dosyaları)
  ├── model/
  │   └── apartman.glb  (Ana 3D Model)
  ├── textures/         (Kullanıcının sonradan yüklediği HDRi veya materyal textureları)
  │   ├── environment.hdr
  │   └── parke_diffuse.jpg
  └── data/             (Veritabanı niyetine kullanacağımız JSON dosyaları)
      ├── project.json      (Genel ayarlar)
      ├── scene.json        (Işıklar, Player Start, Kamera)
      ├── interactions.json (Pop-up bölgeleri ve içerikleri)
      └── variants.json     (Değiştirilebilir materyal ve grup tanımları)

```

**Çalışma Mantığı:**

1. **URL Parametresi:** Uygulama açıldığında URL'e bakar.
2. **Load:** Eğer editör modundaysak veya Viewer modundaysak, `fetch('/data/project.json')` ile manifestoyu çeker, ardından diğer JSON'ları asenkron olarak yükler.
3. **Edit & Save:** Editörde değişiklik yapıldığında, Zustand store'daki veriler güncellenir. "Kaydet/Zip" dediğinde JSZip kütüphanesi tarayıcıda bu JSON'ları yeniden oluşturur, güncel assetleri ekler ve sana `.zip` olarak verir.

---

## 3. Detaylı Veri Şeması (Data Schema)

Verileri nasıl böleceğimiz, uygulamanın esnekliği için en kritik kısımdır.

### A. `project.json` (Meta Veriler)

Projenin kimliği ve genel mod ayarları.

```json
{
  "projectId": "1108-1",
  "projectName": "Örnek Daire 1",
  "version": "1.0",
  "defaultMode": "viewer", // Açılışta hangi modda başlasın
  "editorLock": false, // Kullanıcılar düzenleyemesin diye kilit
  "assets": {
    "mainModel": "model/apartman.glb",
    "envMap": "textures/environment.hdr"
  }
}

```

### B. `scene.json` (Sahne Ayarları & Işıklar)

Işıklandırma, başlangıç noktası ve atmosfer.

```json
{
  "lighting": {
    "environment": {
      "intensity": 1.2,
      "rotation": 0.5,
      "backgroundBlurriness": 0.1
    },
    "directionalLights": [
      {
        "id": "sun_light",
        "position": [10, 20, 10],
        "intensity": 2.5,
        "color": "#ffffee",
        "castShadow": true
      }
    ]
  },
  "player": {
    "startPosition": [0, 1.7, 5], // x, y, z
    "startRotation": [0, 0, 0],
    "moveSpeed": 2.0,
    "eyeHeight": 1.7
  }
}

```

### C. `interactions.json` (Pop-uplar & Tetikleyiciler)

Belirli koordinatlara girildiğinde açılacak pencereler.

```json
{
  "zones": [
    {
      "id": "zone_entrance",
      "position": [2, 1, -3],
      "radius": 1.5, // Tetiklenme alanı çapı
      "triggerType": "proximity", // Yaklaşınca aç
      "popup": {
        "title": "Geniş Antre",
        "content": "Bu alanda 1. sınıf seramik kullanılmıştır.",
        "mediaType": "image",
        "mediaUrl": "assets/antre_detay.jpg",
        "style": {
          "backgroundColor": "#ffffff",
          "textColor": "#000000",
          "opacity": 0.9
        }
      }
    }
  ]
}

```

### D. `variants.json` (Materyal Değiştirme Sistemi)

Senin istediğin "Menüden seçip değiştirme" sistemi burası.

```json
{
  "configurableGroups": [
    {
      "id": "group_salon_duvar",
      "displayName": "Salon Duvarları",
      "icon": "assets/icons/wall_icon.png", // Menüdeki küçük ikon
      "targetMeshNames": ["Wall_LivingRoom_01", "Wall_LivingRoom_02"], // Hangi 3D meshleri etkileyecek
      "options": [
        {
          "name": "Bej Boya",
          "type": "color",
          "value": "#f5f5dc"
        },
        {
          "name": "Modern Gri",
          "type": "color",
          "value": "#808080"
        },
        {
          "name": "Duvar Kağıdı A",
          "type": "texture",
          "textureUrl": "textures/wallpaper_a.jpg",
          "tiling": [2, 2]
        }
      ],
      "defaultOptionIndex": 0
    }
  ]
}

```

---

## 4. Editör Modu Özellikleri ve UX Tasarımı

Editör arayüzü "Canvas" (3D alan) üzerine bindirilmiş (Overlay) panellerden oluşacak.

### A. Gizmo & Seçim Sistemi

* Ekranda bir objeye tıkladığında `Raycaster` çalışacak.
* Seçili obje üzerinde "Translate/Rotate/Scale" Gizmo'su (oklar) çıkacak.
* **Undo/Redo:** Zustand kütüphanesinin `zundo` eklentisi ile kullanıcının yaptığı her işlem (hareket, renk değişimi) bir stack'e atılacak. `Ctrl+Z` yapıldığında JSON state'i bir önceki adıma dönecek.

### B. Pop-up Editörü

* Editörde "Trigger Ekle" butonu olacak.
* Sahneye şeffaf bir küre (Sphere) eklenecek. Bu küreyi Gizmo ile istediğin yere taşıyıp, `radius` değerini scale ederek ayarlayacaksın.
* Bu küreye tıkladığında sağ panelde "Pop-up İçeriği" formu açılacak (Başlık, Yazı, Resim Yükle, Renk Seç).

### C. Materyal Varyasyon Editörü (Configurator Builder)

* **Adım 1:** Sahnede bir Mesh seç (Örn: Kapı).
* **Adım 2:** Sağ tık veya menüden "Varyasyon Grubu Oluştur" de.
* **Adım 3:** Gruba isim ver (Örn: "Daire Giriş Kapısı").
* **Adım 4:** "Seçenek Ekle" diyerek renk paletinden veya doku kütüphanesinden alternatifleri ekle.

---

## 5. Runtime (Oynatıcı) Modları

Uygulama açıldığında sol üstte veya ayarlarda mod geçişi olacak.

### A. Viewer Modu (Orbit Controls)

* Kamera bir merkez etrafında döner (klasik mouse hareketi).
* Sağ tarafta bir "Özelleştirme Menüsü" (UI) durur.
* Burada `variants.json` okunarak oluşturulmuş liste (Salon Duvarı, Kapı, Zemin vb.) ve yanlarında ikonları olur. Tıklayınca seçenekler açılır ve anlık değişim sağlanır.

### B. Oyuncu (Player) Modu (First Person)

* Kamera `player.startPosition`'a ışınlanır.
* **Hareket:** WASD ve Mouse Look.
* **Collision (Çarpışma):** Karmaşık fizik motoru yerine, performans için **"Capsule Collider"** mantığı kullanacağız. Basitçe, oyuncunun etrafında sanal bir kapsül olacak ve yüklenen `navmesh` veya zemin/duvar objelerine çarptığında duracak. (Three.js'de `Octree` kullanarak statik mesh collision çok performanslı yapılır).
* **Interaction:** Oyuncu `interactions.json`'daki kürelerin içine girdiğinde (mesafe < radius), ekranda senin tasarladığın HTML/CSS Pop-up belirecek.

---
PROJE TEKNİK TASARIM RAPORU - BÖLÜM 2: KOD MİMARİSİ & COMPONENT HİYERARŞİSİ
Bu bölümde uygulamanın src klasörünün içini ve React componentlerinin birbirleriyle nasıl konuşacağını kurguluyoruz.

1. Klasör Yapısı (Source Code Structure)
Projenin sürdürülebilir olması için "Logic" (Mantık), "State" (Veri) ve "View" (Görünüm) birbirinden ayrılmalı.

Plaintext

src/
├── assets/             # Statik görseller (Logo, default ikonlar)
├── components/         # React Componentleri
│   ├── canvas/         # 3D Sahne elemanları (R3F componentleri)
│   │   ├── EditorControls.tsx   # Gizmo, Transform Controls
│   │   ├── PlayerControls.tsx   # FPS Kamera, Çarpışma mantığı
│   │   ├── ModelRenderer.tsx    # GLB Yükleyici ve Materyal Yöneticisi
│   │   ├── InteractionZone.tsx  # Pop-up tetikleyici görünmez küreler
│   │   └── LightingManager.tsx  # Işıklar ve HDRi yönetimi
│   ├── ui/             # 2D Arayüz (HTML/CSS)
│   │   ├── EditorPanel/         # Sağ/Sol menüler, ayar pencereleri
│   │   ├── Popups/              # Sahne içi bilgi pencereleri
│   │   └── ModeSwitcher.tsx     # Editor/Viewer/Player geçiş butonu
│   └── Layout.tsx      # Ana kapsayıcı
├── hooks/              # Özel mantık kancaları (useKeyboard, useAssetLoader)
├── store/              # ZUSTAND State Yönetimi (Beyin kısmı)
│   ├── useProjectStore.ts   # Proje genel ayarları
│   ├── useSceneStore.ts     # Sahne objeleri (Işık, Model konumları)
│   └── useEditorStore.ts    # Seçili obje, aktif araç (Move/Rotate), History
├── utils/              # Yardımcı fonksiyonlar (Zip oluşturucu, Math hesapları)
├── pages/              # Sayfa Yönlendirmeleri
│   ├── ViewerPage.tsx  # /1108-1
│   └── EditorPage.tsx  # /1108-1/editor
└── App.tsx             # Router ayarları
2. State Management (Zustand Stores) - Uygulamanın Beyni
Uygulamanın en önemli kısmı burası. React arayüzü ile Three.js sahnesi arasındaki senkronizasyonu bu "Store"lar sağlayacak.

A. useSceneStore (Sahne Verisi)
Sahnedeki her şeyin "gerçek" verisi burada tutulur. Editörde bir şeyi kaydırdığında burası güncellenir.

TypeScript

interface SceneState {
  // Yüklenen modelin verisi
  modelUrl: string | null;
  
  // Işık Ayarları
  environment: { hdri: string, intensity: number, rotation: number };
  lights: Array<{ type: 'directional'|'point', position: [x,y,z], intensity: number, color: string }>;

  // Etkileşim Noktaları (Pop-up Küreleri)
  interactionZones: Array<{
    id: string;
    position: [x,y,z];
    radius: number;
    content: { title: string, text: string, image: string };
  }>;

  // Fonksiyonlar
  updateLight: (id: string, prop: string, value: any) => void;
  addZone: (position: [x,y,z]) => void;
  updateZone: (id: string, data: any) => void;
}
B. useConfiguratorStore (Materyal Değiştirme Sistemi)
Senin "Varyasyon Grubu" dediğin yapı burada yönetilecek.

TypeScript

interface ConfiguratorState {
  groups: Array<{
    id: string;
    name: "Salon Duvarı";
    targetMeshNames: string[]; // ["Wall_01", "Wall_02"]
    options: Array<{ name: "Kırmızı", type: "color", value: "#ff0000" }>;
    selectedOptionIndex: number; // Şu an hangisi seçili?
  }>;
  
  // Mesh'e tıklandığında hangi gruba ait olduğunu bulur
  selectOption: (groupId: string, optionIndex: number) => void;
}
3. Kritik Componentlerin Mantığı
A. EditorPage.tsx (Akıllı Yönlendirici)
Senin sorduğun "Olmayan proje" senaryosunu yöneten yer.

URL'den ID'yi alır (useParams).

Sunucudan /data/${id}/project.json çekmeye çalışır.

Başarılıysa: Veriyi Store'a yükler -> Editörü açar.

Hata (404) ise: "Yeni proje oluşturulsun mu?" dialogunu gösterir -> Store'a default değerleri yükler -> Editörü açar.

B. ModelRenderer.tsx (Akıllı Model Yöneticisi)
Bu component sadece gltf yüklemekle kalmaz, aynı zamanda materyal değişimlerini dinler.

Model yüklendiğinde (useGLTF), sahnedeki tüm meshlerin isimlerini tarar.

useConfiguratorStore'u dinler. Eğer "Salon Duvarı" grubunda bir değişiklik olursa, ismi eşleşen meshlerin materyalini veya rengini anlık (hot-swap) değiştirir.

Editör Modunda: Mesh'e tıklandığında (raycast), o mesh'in ismini ve materyal bilgisini Editör Paneline gönderir.

C. InteractionZone.tsx (Görünür/Görünmez Küreler)
Editör Modunda: Yarı saydam kırmızı bir küre olarak görünür. Üzerinde Transform Gizmo çıkar, tutup taşıyabilirsin, büyütebilirsin.

Viewer Modunda: Görünmezdir.

Player Modunda: Sürekli oyuncunun konumunu kontrol eder. Distance(Player, Zone) < Zone.Radius olduğunda, ekrana Pop-up basar.

D. ZipExportManager (Paketleyici)
"Projeyi Ziple" butonuna bastığında çalışacak modül.

Zustand Store'daki güncel datayı (Scene, Config, Project) JSON stringine çevirir.

Kullanıcının editöre sürükleyip bıraktığı (veya hafızada blob olarak duran) görselleri (HDRi, texture) toplar.

JSZip kütüphanesi ile klasör yapısını oluşturur.

Tarayıcıda indirme işlemini başlatır.

4. Kullanıcı Deneyimi (UX) Akışı
Giriş: Kullanıcı /1108-1/editor adresine girer.

Yükleme: Model ve ayarlar yüklenir.

Düzenleme:

Sağ tık -> "Işık Ekle" -> Sahneye güneş gelir.

Modelin bir duvarına tıklar -> Sağ panelde "Bunu Varyasyon Yap" der -> Renk seçenekleri ekler.

Yere tıklar -> "Buraya Bilgi Noktası Ekle" der -> Başlık ve yazı girer.

Test: Sol üstten "Player Mode"a geçer. WASD ile yürür, duvara çarpıyor mu bakar, noktaya gelince yazı çıkıyor mu dener.

Çıktı: "Projeyi İndir" der.

Yayın: İnen klasörü sunucuya atar.
PROJE TEKNİK TASARIM RAPORU - BÖLÜM 3: GELİŞTİRME YOL HARİTASI (FAZLAR)
Toplam 5 ana faz (Sprint) belirledim. Her fazın sonunda elinde çalışan somut bir özellik olacak.

FAZ 1: Altyapı, Routing ve "Viewer" (Temel)
Amaç: Projenin iskeletini kurmak. URL'e girildiğinde modelin yüklenmesi ve "Olmayan Proje" mantığının çalışması.

Proje Kurulumu: Vite + React + TypeScript + Tailwind kurulumu.

Routing Mimarisi:

/ (Home), /:projectId, /:projectId/editor rotalarının ayarlanması.

404 (Proje Bulunamadı) durumunda "Yeni Proje Başlat" State'inin tetiklenmesi.

Data Loader Servisi:

URL parametresine göre project.json fetch eden fonksiyon.

Eğer fetch başarısız olursa (404), varsayılan (boş) JSON verisini Memory'e yükleyen yapı.

Basit 3D Sahne:

Three.js Canvas kurulumu.

GLB Loader entegrasyonu (Modeli sahneye koyma).

OrbitControls (Mouse ile dönme).

Çıktı: Tarayıcıda /test-1 yazınca model yüklenmeye çalışacak, yoksa "Model Yükle" butonu çıkacak basit bir viewer.

FAZ 2: Editör Çekirdeği (Gizmo & Zip Sistemi)
Amaç: Kullanıcının sahneye müdahale edebilmesi ve bunu kaydedebilmesi. En kritik faz burasıdır.

Zustand Store Entegrasyonu: useSceneStore yazılarak ışık ve obje pozisyonlarının state'e bağlanması.

Transform Controls (Gizmo):

Nesneye tıklayınca seçili hale gelmesi.

Okların çıkması ve nesnenin taşınması/döndürülmesi.

Yapılan hareketin Store'a güncellenmesi.

Editör UI Paneli (Sağ Menü):

Seçili objenin özelliklerini gösteren panel (Position X, Y, Z inputları).

Işık ekleme/kaldırma butonları.

Export Manager (Zip):

"Projeyi Kaydet" butonuna basınca; Store'daki veriyi JSON string'e çeviren, assetleri toplayan ve .zip olarak indiren modülün yazılması.

Test: İndirilen Zip'in içini açıp klasör yapısının (Bölüm 1'de konuştuğumuz gibi) doğru olup olmadığının kontrolü.

Çıktı: Modeli yükleyip, ışık ekleyip, objelerin yerini değiştirip ZİP olarak indirebildiğin çalışan bir editör.

### FAZ 2.5: Gelişmiş Editör Özellikleri (Editor UX)

Bu fazda editör kullanılabilirliğini artıran özellikler eklenecek.

**Scene Outliner Panel:**
- Sol tarafta açılır/kapanır panel (`H` tuşu ile toggle)
- Tüm scene mesh'lerini hiyerarşik olarak görüntüleme
- Mesh, Işık ve Interaction Zone kategorileri
- Arama/filtreleme özelliği
- Her satırda görünürlük toggle butonu (👁️)

**Multi-Select Desteği:**
- `Ctrl+A` ile tüm mesh'leri seçme
- Outliner'dan birden fazla mesh seçebilme (Ctrl+Click)
- Seçili mesh'lerin listesi tutulur

**Camera Focus (Odaklanma):**
- Bir mesh seçiliyken `F` tuşuna basınca kamera o mesh'e yumuşak geçişle odaklanır
- OrbitControls target'ı mesh'in bounding box center'ına ayarlanır
- Smooth easing animasyonu ile geçiş

**Mesh Visibility Toggle:**
- Outliner'da veya seçili mesh'te göster/gizle özelliği
- Gizli meshler outliner'da farklı renkte gösterilir
- `visible` property'si Three.js mesh'e uygulanır

**Varyant Renk Picker:**
- Varyant panelinde "+" butonu çalışır durumda
- İsim girişi ve renk seçici ile yeni renk varyantı ekleme
- Eklenen varyantlar listeye eklenir

**Klavye Kısayolları:**
- `H`: Outliner panelini aç/kapa
- `F`: Seçili mesh'e odaklan
- `Ctrl+A`: Tüm mesh'leri seç
- `Delete`: Seçili mesh'i sil
- `Ctrl+Z`: Geri al
- `Ctrl+Y`: İleri al

Çıktı: Profesyonel 3D editör benzeri UX ile mesh yönetimi, görünürlük kontrolü ve kamera navigasyonu.

FAZ 3: Oyuncu Modu (Player) ve Etkileşimler
Amaç: Uygulamanın "Gezilebilir" ve "Etkileşimli" hale gelmesi.

First Person Controller:

OrbitControls'dan çıkıp, WASD + Mouse Look mantığına geçiş.

Collision (Basit Fizik): Oyuncunun duvarların içinden geçmemesi için "Capsule Collider" ve "Octree" entegrasyonu.

Interaction Zones (Küreler):

Editörde: Yarı saydam küre ekleme ve scale etme.

Veri Yapısı: Küreye "Başlık, Açıklama, Görsel" verisi girme formu.

Runtime Mantığı: Oyuncu küreye girdiğinde (Distance Check) HTML Pop-up'ın ekranda belirmesi.

Mod Değiştirici (Switch):

Editör / Viewer / Player modları arasında geçiş yapan üst bar.

Çıktı: Evin içinde yürüyebildiğin, belirli noktalara gelince bilgi kartlarının açıldığı interaktif yapı.

FAZ 4: Materyal Varyasyon Sistemi (Configurator)
Amaç: "Duvar rengini değiştir" özelliğinin eklenmesi.

Mesh Seçici (Raycaster): Editörde herhangi bir mesh'e (örn: Kapı) tıklayıp "Bunu Varyasyon Grubu Yap" diyebilme.

Config Store & UI:

Varyasyon grubu oluşturma (İsim ver: "Salon Parke").

Seçenek ekleme (Renk seçici veya Texture yükleyici).

Runtime UI (Menü):

Viewer/Player modunda ekranın kenarında ikonlu bir menü oluşturma.

Menüden seçim yapınca Three.js materyalinin mesh.material.color.set() ile anlık değişmesi.

Çıktı: Kullanıcının ev içinde gezerken parkeleri, duvar renklerini değiştirebildiği tam sürüm.

FAZ 5: Cila ve Optimizasyon (Polish)
Amaç: Profesyonel görünüm ve performans.

Görsel Kalite:

Shadow Map (Gölgeler) ayarları.

Post-Processing (Bloom, Ambient Occlusion) eklenmesi (Web performansı elverirse).

Progressive Loading:

Büyük modeller yüklenirken şık bir "Loading Bar" yapılması.

Mobile Uyumluluk:

Telefondan girenler için dokunmatik kontrollerin (Joystick) eklenmesi.