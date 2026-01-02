# GangedReality - Test Talimatları ve Kontrol Listesi (Must Be Tested)

Bu belge, **GangedReality Web Tabanlı 3D CMS** projesinin tüm geliştirme fazları tamamlandığında yapılacak testleri adım adım içerir. Test eden kişi, aşağıdaki senaryoları sırasıyla uygulayarak sistemin doğruluğunu teyit etmelidir.

---

## 📋 Ön Hazırlık

- [ ] **Geliştirme Sunucusu Başlatma:**
    - Terminalde proje klasörüne gidin
    - `npm run dev` komutunu çalıştırın
    - Sunucu başarıyla çalıştığında, tarayıcıda `http://localhost:5173` adresini açın

---

## 1. Başlangıç ve Yönlendirme (Routing) Testleri

Bu testler uygulamanın doğru açılıp açılmadığını ve URL yapısını kontrol eder.

### 1.1 Ana Sayfa
- [ ] **Ana Sayfa Erişimi:**
    - Tarayıcıda `/` adresine gidin
    - Ana sayfanın (HomePage) açıldığını doğrulayın
    - Logo ve proje listesi/başlangıç butonlarını görün

### 1.2 Viewer Modu Yönlendirmesi
- [ ] **Mevcut Proje Görüntüleme:**
    - `/demo` adresine gidin
    - Yükleme ekranının (LoadingScreen) animasyonlu şekilde çıktığını görün
    - "Proje yükleniyor..." mesajını görün
    - 3D sahnenin başarıyla yüklendiğini doğrulayın

### 1.3 Editor Modu Yönlendirmesi
- [ ] **Mevcut Projeyi Editör Modunda Açma:**
    - `/demo/editor` adresine gidin
    - Editör arayüzünün yüklendiğini görün
    - Sol sidebar, sağ panel ve üst toolbar'ın göründüğünü doğrulayın

### 1.4 Yeni Proje Oluşturma (404 Senaryosu)
- [ ] **Olmayan Proje Senaryosu:**
    - Rastgele bir ID ile `/yeni-proje-xyz/editor` adresine gidin
    - "Yeni Proje Oluştur" dialogunun açıldığını görün
    - Proje adı girin (örn: "Test Projesi")
    - "Oluştur" butonuna tıklayın
    - Boş sahne veya varsayılan küp ile editörün açıldığını teyit edin
    - "Model Yükle" promptunun çıktığını görün

---

## 2. Model Yükleme Testleri

### 2.1 Drag & Drop Model Yükleme
- [ ] **GLB/GLTF Dosyası Sürükle-Bırak:**
    - Editör modunda "📦 Model Yükle" butonuna tıklayın veya
    - Bir .glb dosyasını doğrudan sahneye sürükleyip bırakın
    - Drop zone'un aktif olduğunu (renk değişimi) görün
    - Model yüklenirken loading göstergesi çıktığını doğrulayın
    - Modelin sahnede göründüğünü teyit edin

### 2.2 Yüklenen Modelin Özellikleri
- [ ] **Model Mesh Kaydı:**
    - Model yüklendikten sonra Scene Outliner'ı (`H` tuşu) açın
    - Modelin tüm meshlerinin listelendiğini görün
    - Her mesh'in isim, tip ve görünürlük durumunu kontrol edin

---

## 3. Viewer Modu (İzleyici) Testleri

Son kullanıcının deneyimleyeceği standart mod.

### 3.1 Orbit Kamera Kontrolleri
- [ ] **Mouse Sol Tık + Sürükle:**
    - Sahneyi 360° döndürebildiğinizi doğrulayın
    - Hareketin yumuşak (damping) olduğunu kontrol edin
- [ ] **Mouse Sağ Tık + Sürükle:**
    - Sahneyi pan (kaydırma) yapabildiğinizi doğrulayın
- [ ] **Mouse Tekerleği:**
    - Yakınlaşıp uzaklaştığınızı (Zoom) kontrol edin
    - minDistance ve maxDistance sınırlarını test edin
- [ ] **Dokunmatik (Mobil):**
    - Tek parmak ile döndürme
    - İki parmak ile zoom/pan

### 3.2 Arayüz Kontrolleri
- [ ] **Üst Bar:**
    - "← Ana Sayfa" linkinin çalıştığını doğrulayın
    - Proje adının gösterildiğini görün
    - "VIEWER" badge'inin göründüğünü kontrol edin
- [ ] **Editör Moduna Geçiş:**
    - "✏️ Editör Modu" butonuna tıklayın
    - `/projectId/editor` adresine yönlendirildiğinizi doğrulayın
- [ ] **Mod Değiştirici (Alt Bar):**
    - "🎯 Orbit View" butonunun aktif olduğunu görün
    - "🚶 Player Mode" butonuna tıklayın ve modun değiştiğini doğrulayın

---

## 4. Editör Modu - Temel İşlevler (Faz 2)

İçerik üreticisinin sahneyi düzenlediği mod.

### 4.1 Nesne Seçimi
- [ ] **Tek Nesne Seçimi:**
    - Sahnedeki bir objeye sol tıklayın
    - Objenin etrafında yeşil seçim kutusu (BoxHelper) belirdiğini görün
    - TransformControls (Gizmo okları) çıktığını doğrulayın
- [ ] **Seçimi Kaldırma:**
    - Boş alana tıklayın
    - Seçimin kalktığını ve Gizmo'nun kaybolduğunu görün

### 4.2 Transform Araçları (Gizmo)
- [ ] **Translate (Taşıma - Varsayılan):**
    - Kırmızı (X), Yeşil (Y), Mavi (Z) oklarını tutup sürükleyin
    - Objenin o eksende hareket ettiğini doğrulayın
- [ ] **Rotate (Döndürme):**
    - Sağ panelden veya toolbar'dan "Rotate" modunu seçin
    - Daire şeklindeki gizmo'ları kullanarak objeyi döndürün
- [ ] **Scale (Ölçeklendirme):**
    - "Scale" modunu seçin
    - Küp şeklindeki tutamaçlarla objeyi büyütüp küçültün
- [ ] **Araç Değiştirme Kısayolları:**
    - `W` tuşu: Translate
    - `E` tuşu: Rotate  
    - `R` tuşu: Scale

### 4.3 Geri Al / İleri Al (Undo/Redo)
- [ ] **Undo İşlemi:**
    - Bir objeyi hareket ettirin
    - `Ctrl+Z` tuşuna basın
    - Objenin eski konumuna döndüğünü doğrulayın
    - Toolbar'daki Undo butonunun çalıştığını test edin
- [ ] **Redo İşlemi:**
    - `Ctrl+Y` veya `Ctrl+Shift+Z` tuşuna basın
    - İşlemin geri geldiğini doğrulayın
- [ ] **History Stack:**
    - Birden fazla işlem yapın (5-10 değişiklik)
    - Sırayla geri alabildiğinizi test edin
    - İleri alabildiğinizi test edin

### 4.4 Sağ Panel (EditorPanel)
- [ ] **Panel Görünürlüğü:**
    - Sağ panelin varsayılanda açık olduğunu görün
- [ ] **Tab Geçişleri:**
    - 📋 Özellikler
    - 💡 Işıklar
    - 📍 Noktalar (Interactions)
    - 🎨 Varyant
    - Her taba tıklayın ve içeriğin değiştiğini görün

### 4.5 Özellikler Paneli
- [ ] **Seçili Obje Bilgileri:**
    - Bir obje seçin
    - Mesh adının gösterildiğini görün
    - Position (X, Y, Z) değerlerinin doğru olduğunu kontrol edin
- [ ] **Sürüklenebilir Sayı Girdisi:**
    - X, Y, Z labellarını sürükleyerek değer değiştirin
    - `Ctrl + Sürükle`: Hassas mod (10x yavaş)
    - `Shift + Sürükle`: Hızlı mod (10x hızlı)
- [ ] **Manuel Değer Girişi:**
    - Input alanına değer yazıp Enter'a basın
    - Objenin konumunun değiştiğini görün

---

## 5. Editör Modu - Işık Yönetimi

### 5.1 Işık Ekleme
- [ ] **Directional Light Ekleme:**
    - Sol sidebar'dan "💡 Işık Ekle" butonuna tıklayın
    - Yeni bir directional light'ın sahneye eklendiğini görün
    - Light helper'ın (yön oku) göründüğünü doğrulayın
- [ ] **Point Light Ekleme:**
    - Işıklar panelinden "Point Light" ekleyin
    - Küre şeklindeki helper'ın göründüğünü görün
- [ ] **Spot Light Ekleme:**
    - Işıklar panelinden "Spot Light" ekleyin
    - Koni şeklindeki helper'ı görün

### 5.2 Işık Düzenleme
- [ ] **Işık Seçimi:**
    - Işık helper'ına tıklayın
    - Gizmo'nun çıktığını görün
- [ ] **Işık Konumu:**
    - Işığı taşıyın
    - Gölgelerin gerçek zamanlı değiştiğini gözlemleyin
- [ ] **Işık Ayarları (Panel):**
    - Intensity (Yoğunluk) slider'ını değiştirin
    - Color picker ile renk değiştirin
    - Cast Shadow toggle'ını test edin

### 5.3 Işık Silme
- [ ] **Işık Kaldırma:**
    - Bir ışığı seçin
    - Panel'deki "Sil" butonuna tıklayın
    - Işığın sahneden kaldırıldığını doğrulayın

---

## 6. Editör Modu - Gelişmiş Özellikler (Faz 2.5)

### 6.1 Scene Outliner (Sol Panel)
- [ ] **Outliner Açma/Kapama:**
    - `H` tuşuna basın veya sidebar'dan "📋 Outliner" butonuna tıklayın
    - Sol panelin açılıp kapandığını görün
- [ ] **Hiyerarşik Liste:**
    - "Meshes" kategorisini görün
    - "Lights" kategorisini görün
    - "Zones" kategorisini görün
    - Kategori başlıklarına tıklayarak daraltın/genişletin
- [ ] **Arama/Filtreleme:**
    - Arama kutusuna mesh adı yazın
    - Listenin filtrelendiğini görün
- [ ] **Outliner'dan Seçim:**
    - Listeden bir mesh adına tıklayın
    - Sahnedeki objenin seçildiğini ve vurgulandığını görün
    - Otomatik scroll'un çalıştığını kontrol edin

### 6.2 Görünürlük Kontrolü
- [ ] **Visibility Toggle:**
    - Outliner'da göz ikonuna (👁️) tıklayın
    - Objenin sahnede gizlendiğini görün
    - Gizli objenin listede farklı renkte gösterildiğini kontrol edin
    - Tekrar tıklayarak görünür yapın

### 6.3 Çoklu Seçim (Multi-Select)
- [ ] **Ctrl + Tıklama:**
    - Bir obje seçili iken
    - `Ctrl` tuşuna basılı tutup başka bir objeye tıklayın
    - Her iki objenin de seçili olduğunu (yeşil kutular) görün
- [ ] **Outliner'dan Çoklu Seçim:**
    - Listeden `Ctrl + Click` ile birden fazla mesh seçin
    - Tüm seçili meshlerin vurgulandığını görün
- [ ] **Ctrl+A (Tümünü Seç):**
    - `Ctrl+A` tuşlarına basın
    - Sahnedeki tüm meshlerin seçildiğini doğrulayın
- [ ] **Çoklu Seçim Paneli:**
    - Birden fazla obje seçiliyken sağ paneli kontrol edin
    - "🎯 Çoklu Seçim - X obje seçili" bilgisini görün
    - Merkez nokta koordinatlarını görün
- [ ] **Toplu Taşıma:**
    - Çoklu seçim durumunda Gizmo ile tüm objeleri birlikte taşıyın
    - Panel'den merkez noktasını değiştirerek toplu taşıma yapın

### 6.4 Kamera Odaklanma (Focus)
- [ ] **F Tuşu ile Odaklanma:**
    - Uzakta veya küçük bir objeyi seçin
    - `F` tuşuna basın
    - Kameranın yumuşak animasyonla (easeOutCubic) objeye yaklaştığını görün
    - OrbitControls hedefinin obje merkezine ayarlandığını kontrol edin
- [ ] **Outliner'dan Çift Tık:**
    - Listeden bir öğeye çift tıklayın
    - Kameranın o objeye odaklandığını görün

### 6.5 Silme İşlemleri
- [ ] **Delete Tuşu:**
    - Bir obje seçin
    - `Delete` tuşuna basın
    - Objenin sahneden silindiğini doğrulayın
    - Outliner listesinden de kaldırıldığını görün

---

## 7. Etkileşim Bölgeleri (Interaction Zones) - Faz 3

### 7.1 Zone Ekleme
- [ ] **Yeni Zone Oluşturma:**
    - Sol sidebar'dan "📍 Nokta Ekle" butonuna tıklayın
    - Sahnede yarı saydam kırmızı kürenin belirdiğini görün
    - Kürenin varsayılan konumda (0, 1.5, 0) oluştuğunu kontrol edin
- [ ] **Zone Konumlandırma:**
    - Küreyi Gizmo ile istediğiniz yere taşıyın
    - Bir kapı veya objenin önüne yerleştirin
- [ ] **Zone Boyutlandırma:**
    - Scale aracı ile kürenin yarıçapını (radius) değiştirin
    - Tetiklenme alanının büyüklüğünü ayarlayın

### 7.2 Zone İçerik Düzenleme
- [ ] **Interactions Paneli:**
    - Sağ panelden "📍 Noktalar" tabını açın
    - Eklenen zone'ların listelendiğini görün
- [ ] **Zone Seçimi:**
    - Listeden bir zone'a tıklayın
    - Sahnedeki kürenin yeşile döndüğünü görün
- [ ] **İçerik Formu:**
    - **Başlık:** "Mutfak" gibi bir başlık girin
    - **İçerik:** "İtalyan tasarımı dolaplar..." açıklama yazın
    - **Media Type:** image/video/none seçin
    - **Media URL:** Görsel/video URL'si girin
- [ ] **Stil Ayarları:**
    - Arka plan rengi seçin
    - Metin rengi seçin
    - Opaklık (opacity) değerini ayarlayın
    - Kenarlık, gölge ve diğer stil özelliklerini test edin

### 7.3 Zone Silme
- [ ] **Zone Kaldırma:**
    - Bir zone seçin
    - Paneldeki "Sil" butonuna veya `Delete` tuşuna basın
    - Zone'un hem sahneden hem listeden kaldırıldığını doğrulayın

---

## 8. Oyuncu Modu (Player/Test Mode) - Faz 3

### 8.1 Modlar Arası Geçiş
- [ ] **Editör'den Test Moduna:**
    - Üst toolbar'dan "🎮 Test" modunu seçin
    - Kameranın insan gözü seviyesine (eyeHeight: 1.7m) indiğini görün
    - Sol sidebar ve sağ panelin gizlendiğini kontrol edin
- [ ] **Pointer Lock:**
    - Sahneye tıklayın
    - Mouse imlecinin kilitlendiğini (Pointer Lock API) doğrulayın
    - `ESC` tuşu ile kilidi açın

### 8.2 FPS Kontrolleri
- [ ] **Hareket Tuşları:**
    - `W` - İleri
    - `S` - Geri
    - `A` - Sola
    - `D` - Sağa
    - Hareketlerin akıcı olduğunu kontrol edin
- [ ] **Bakış Kontrolü:**
    - Mouse'u hareket ettirin
    - Kameranın mouse'a göre döndüğünü doğrulayın
    - Yukarı/aşağı bakış sınırlarını test edin

### 8.3 Çarpışma Sistemi (Collision)
- [ ] **Duvar Çarpışması:**
    - Bir duvara doğru yürüyün
    - Duvarın içinden geçemediğinizi doğrulayın
    - Capsule Collider'ın çalıştığını görün
- [ ] **Zemin Kontrolü:**
    - Yürürken yere yapışık kaldığınızı kontrol edin
- [ ] **Octree Collision:**
    - Karmaşık mesh'lerle çarpışmayı test edin

### 8.4 Pop-up Tetikleme
- [ ] **Proximity Trigger:**
    - Önceden eklediğiniz interaction zone'a yürüyün
    - Belirlenen mesafeye (radius) girince pop-up'ın açıldığını görün
    - Pop-up'ta başlık, içerik ve medyanın doğru gösterildiğini kontrol edin
- [ ] **Pop-up Kapatma:**
    - Zone'dan uzaklaşın
    - Pop-up'ın otomatik kapandığını doğrulayın
- [ ] **Stil Uygulaması:**
    - Pop-up'ın tanımlanan stilde (renk, opaklık vb.) göründüğünü kontrol edin

### 8.5 Test Modundan Çıkış
- [ ] **Editör Moduna Dönüş:**
    - `ESC` tuşuna basın
    - "✏️ Düzenle" modunu seçin
    - Editör arayüzünün geri geldiğini doğrulayın

---

## 9. Materyal Varyasyon Sistemi (Faz 4)

### 9.1 Varyasyon Grubu Oluşturma (Editör)
- [ ] **Mesh Seçimi:**
    - Editörde bir duvar veya zemin mesh'i seçin
- [ ] **Varyant Paneli:**
    - Sağ panelden "🎨 Varyant" tabını açın
    - "Varyasyon Grubu Oluştur" butonuna tıklayın
- [ ] **Grup Bilgileri:**
    - Grup adı girin: "Salon Duvarı"
    - Hedef mesh'leri ekleyin (seçili mesh otomatik eklenmeli)
- [ ] **Renk Seçeneği Ekleme:**
    - "Seçenek Ekle" butonuna tıklayın
    - Tip: "Renk" seçin
    - İsim: "Bej" girin
    - Color picker'dan renk seçin
- [ ] **Texture Seçeneği Ekleme:**
    - "Seçenek Ekle" butonuna tıklayın
    - Tip: "Doku" seçin
    - İsim: "Parke" girin
    - Texture URL'si girin veya dosya yükleyin
    - Tiling değerlerini ayarlayın

### 9.2 Editör'de Önizleme
- [ ] **Renk Değişimi:**
    - Oluşturduğunuz seçeneklere tıklayın
    - Mesh'in renginin anlık değiştiğini görün
- [ ] **Varsayılan Seçenek:**
    - Default option'ı ayarlayın
    - Sayfa yenilendiğinde bu seçeneğin uygulandığını kontrol edin

### 9.3 Viewer'da Configurator Panel
- [ ] **Panel Görünürlüğü:**
    - Viewer moduna geçin
    - Sağ üstte özelleştirme panelinin göründüğünü doğrulayın
- [ ] **Grup Listesi:**
    - Tüm varyasyon gruplarının listelendiğini görün
    - Her grubun ikonunu ve aktif seçeneği görün
- [ ] **Grup Genişletme:**
    - Bir gruba tıklayın
    - Seçeneklerin açıldığını görün

### 9.4 Runtime Materyal Değişimi
- [ ] **Renk Seçimi:**
    - Bir renk seçeneğine tıklayın
    - 3D modeldeki mesh'in renginin anlık değiştiğini doğrulayın
- [ ] **Texture Seçimi:**
    - Bir doku seçeneğine tıklayın
    - Texture'ın doğru uygulandığını görün
    - Tiling'in doğru çalıştığını kontrol edin

### 9.5 URL Paylaşımı
- [ ] **Config URL:**
    - Birkaç seçim yapın
    - URL'in otomatik güncellendiğini görün (?config=... parametresi)
- [ ] **Link Paylaşma:**
    - "🔗 Linki Kopyala" butonuna tıklayın
    - Toast mesajını görün
    - Kopyalanan linki yeni sekmede açın
    - Aynı konfigürasyonun yüklendiğini doğrulayın

---

## 10. Kayıt ve Dışa Aktarım (Export) - Faz 2

### 10.1 Projeyi İndirme
- [ ] **Export Butonu:**
    - Editör üst bar'da "💾 Kaydet" veya "📦 İndir" butonunu bulun
    - Butona tıklayın
- [ ] **Progress Göstergesi:**
    - Export sırasında ilerleme çubuğunu görün
    - Aşamaları takip edin:
        - "Konfigürasyon dosyaları ekleniyor..."
        - "Model ekleniyor..."
        - "ZIP dosyası oluşturuluyor..."
        - "İndirme başlatılıyor..."
        - "Tamamlandı!"
- [ ] **Toast Bildirimi:**
    - "Proje başarıyla dışa aktarıldı!" mesajını görün
- [ ] **Dosya İndirme:**
    - Tarayıcının `projectId.zip` dosyasını indirdiğini doğrulayın

### 10.2 Zip İçeriği Kontrolü
- [ ] **Klasör Yapısı:**
    - Zip dosyasını açın ve şu yapıyı kontrol edin:
    ```
    project-id/
    ├── data/
    │   ├── project.json
    │   ├── scene.json
    │   ├── interactions.json
    │   └── variants.json
    ├── model/
    │   └── *.glb
    ├── textures/
    │   └── (yüklenen dokular)
    └── README.md
    ```
- [ ] **README Dosyası:**
    - README.md'nin proje bilgilerini içerdiğini kontrol edin

### 10.3 JSON Veri Doğrulama
- [ ] **project.json:**
    - Proje ID, adı, versiyon bilgilerini kontrol edin
    - Asset yollarının doğru olduğunu görün
- [ ] **scene.json:**
    - Environment ayarlarını kontrol edin
    - Eklediğiniz ışıkların listede olduğunu doğrulayın
    - Player start position'ı kontrol edin
- [ ] **interactions.json:**
    - Eklediğiniz zone'ların listelendiğini görün
    - Position, radius ve popup içeriklerini kontrol edin
- [ ] **variants.json:**
    - Oluşturduğunuz grupları görün
    - Target mesh isimlerini kontrol edin
    - Seçeneklerin doğru kaydedildiğini doğrulayın

### 10.4 Projeyi Tekrar Yükleme (Import)
- [ ] **Zip Import:**
    - İndirilen zip dosyasını tekrar yükleyin (eğer import özelliği varsa)
    - Tüm ayarların geri geldiğini doğrulayın

---

## 11. Toast Bildirim Sistemi

- [ ] **Başarı Mesajları (Yeşil):**
    - Export başarılı olduğunda görünüyor mu?
- [ ] **Hata Mesajları (Kırmızı):**
    - Hatalı işlemlerde görünüyor mu?
- [ ] **Bilgi Mesajları (Mavi):**
    - Copy link gibi işlemlerde görünüyor mu?
- [ ] **Otomatik Kapanma:**
    - Toastların birkaç saniye sonra kaybolduğunu doğrulayın

---

## 12. Performans ve Optimizasyon Testleri (Faz 5)

### 12.1 Yükleme Performansı
- [ ] **Loading Screen:**
    - İlk yüklemede animasyonlu loading ekranını görün
    - Spinner/progress bar'ın çalıştığını kontrol edin
- [ ] **Model Yükleme Süresi:**
    - Büyük modellerin (>10MB) makul sürede yüklendiğini kontrol edin
    - Progressive loading'in çalıştığını doğrulayın

### 12.2 Render Performansı
- [ ] **FPS Kontrolü:**
    - Sahne düzgün render ediliyor mu?
    - Karmaşık sahnelerde 30+ FPS korunuyor mu?
- [ ] **Gölge Performansı:**
    - Shadow map'lerin performansı düşürmediğini kontrol edin

### 12.3 Memory Kullanımı
- [ ] **Memory Leak:**
    - Sayfada uzun süre kalın
    - DevTools > Memory'den leak kontrolü yapın
    - Sahne değişikliklerinde memory'nin düzgün temizlendiğini doğrulayın

---

## 13. Mobil Uyumluluk (Faz 5)

### 13.1 Responsive Tasarım
- [ ] **Tablet Görünüm:**
    - Tarayıcıyı tablet boyutuna getirin
    - UI'ın düzgün görüntülendiğini kontrol edin
- [ ] **Mobil Görünüm:**
    - 375px genişliğe daraltın
    - Tüm butonların erişilebilir olduğunu doğrulayın

### 13.2 Dokunmatik Kontroller
- [ ] **Touch Orbit:**
    - Tek parmakla sahneyi döndürün
- [ ] **Pinch Zoom:**
    - İki parmakla yakınlaştırın/uzaklaştırın
- [ ] **Touch Pan:**
    - İki parmakla sahneyi kaydırın

### 13.3 Mobile Player Mode
- [ ] **Virtual Joystick:**
    - Mobilde player modunda sanal joystick'in çıktığını görün
    - Joystick ile hareket edebildiğinizi test edin
- [ ] **Look Controls:**
    - Ekrana dokunarak bakış açısını değiştirebildiğinizi kontrol edin

---

## 14. Tarayıcı Uyumluluk

- [ ] **Chrome:** Tüm testleri Chrome'da tekrarlayın
- [ ] **Firefox:** Temel fonksiyonları Firefox'ta test edin
- [ ] **Safari:** macOS/iOS'ta test edin
- [ ] **Edge:** Windows Edge'de test edin

---

## 📝 Test Sonuç Raporu

| Kategori | Toplam Test | Geçen | Kalan | Hata |
|----------|-------------|-------|-------|------|
| Routing | | | | |
| Model Yükleme | | | | |
| Viewer Mode | | | | |
| Editör Temel | | | | |
| Işık Yönetimi | | | | |
| Editör Gelişmiş | | | | |
| Interaction Zones | | | | |
| Player Mode | | | | |
| Varyasyon Sistemi | | | | |
| Export/Import | | | | |
| Toast Bildirimleri | | | | |
| Performans | | | | |
| Mobil | | | | |
| **TOPLAM** | | | | |

---

## 🐛 Hata Raporlama Rehberi

Herhangi bir hata tespit ettiğinizde:

1. **Konsol Loglarını Kontrol Edin:**
   - F12 > Console sekmesini açın
   - Kırmızı hata mesajlarını kopyalayın

2. **Hata Detaylarını Kaydedin:**
   - Hangi adımda oldu?
   - Ne yapılmaya çalışıldı?
   - Beklenen davranış neydi?
   - Gerçekleşen davranış neydi?

3. **Ekran Görüntüsü Alın:**
   - Hatanın görsel kanıtını ekleyin

4. **Ortam Bilgisi:**
   - Tarayıcı adı ve versiyonu
   - İşletim sistemi
   - Ekran çözünürlüğü

---

**Son Güncelleme:** 30 Aralık 2025
