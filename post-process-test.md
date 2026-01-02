# Post Processing Test Rehberi

## 🔧 Ön Gereksinimler
- Dev server çalışıyor olmalı (`npm run dev`)
- Tarayıcıda Console açık olmalı (F12 > Console)

---

## 📋 Test 1: Post Processing Açma/Kapama

### Adımlar:
1. Editor'a gir (herhangi bir proje) http://localhost:5173/1108-1/editor bu projeye girebilirsin
2. Sağ panelden **"Post Processing"** sekmesine git
3. En üstteki **"Post Processing"** master toggle'ını kontrol et

### Beklenen Console Çıktısı:
```
[PostProcessing] Mounted, postProcessing.enabled: true
[PostProcessing] SAO config: {enabled: false, intensity: 0.5, ...}
```

### ✅ Başarı Kriteri:
- Toggle açıkken: `postProcessing.enabled: true`
- Toggle kapalıyken: `[PostProcessing] Disabled, returning null`

---

## 📋 Test 2: Ambient Occlusion (N8AO)

### Adımlar:
1. Post Processing toggle'ını **AÇ** (mavi olmalı)
2. **"Ambient Occlusion (SAO)"** bölümünü bul
3. SAO toggle'ını **AÇ** (mavi olmalı)
4. Şu değerleri ayarla:
   - Yoğunluk (Intensity): **2.0**
   - Yarıçap (Radius): **10**
   - Ölçek (Scale): **1.0**

### Beklenen Console Çıktısı:
```
[PostProcessing] N8AO ACTIVE - intensity: 2 radius: 10
```

### Görsel Kontrol:
- Köşelerde koyu gölgeler görünmeli
- Nesnelerin birleştiği yerlerde karanlık alanlar olmalı
- Duvar-zemin birleşiminde belirgin AO görünmeli

### ✅ Başarı Kriteri:
- Console'da "N8AO ACTIVE" mesajı var
- Sahnede görsel fark var (köşeler koyulaşmış)

---

## 📋 Test 3: Bloom Efekti

### Adımlar:
1. **"Bloom (Parlama)"** bölümünü bul
2. Toggle'ı **AÇ**
3. Şu değerleri ayarla:
   - Şiddet (Strength): **1.5**
   - Yarıçap (Radius): **0.5**
   - Eşik (Threshold): **0.3**

### Görsel Kontrol:
- Parlak yüzeylerde ışık taşması (glow) görünmeli
- Pencerelerden gelen ışık parlamalı

### ✅ Başarı Kriteri:
- Parlak alanlarda belirgin glow efekti

---

## 📋 Test 4: Vignette

### Adımlar:
1. **"Vignette (Kenar Koyulaştırma)"** bölümünü bul
2. Toggle'ı **AÇ**
3. Şu değerleri ayarla:
   - Koyuluk (Darkness): **1.0**
   - Ofset: **0.5**

### Görsel Kontrol:
- Ekranın kenarları koyulaşmalı
- Merkez daha aydınlık kalmalı

### ✅ Başarı Kriteri:
- Kenarlar belirgin şekilde koyu

---

## 📋 Test 5: Renk Düzeltme

### Adımlar:
1. **"Renk Düzeltme"** bölümünü bul
2. Toggle'ı **AÇ**
3. Hızlı önayarlardan **"Siyah-Beyaz"** seç

### Görsel Kontrol:
- Tüm sahne siyah-beyaz olmalı

### Geri al:
- **"Normal"** önayarına tıkla

### ✅ Başarı Kriteri:
- Siyah-beyaz modda renkler yok
- Normal modda renkler geri geldi

---

## 📋 Test 6: Tone Mapping

### Adımlar:
1. **"Tone Mapping"** bölümünü bul
2. Algoritma dropdown'ından farklı seçenekler dene:
   - ACES Filmic
   - Reinhard
   - AgX
3. Pozlama (Exposure) değerini değiştir: **0.5 → 2.0**

### Görsel Kontrol:
- Her algoritma farklı renk görünümü vermeli
- Düşük exposure: Karanlık sahne
- Yüksek exposure: Parlak sahne

---

## 🐛 Sorun Giderme

### SAO çalışmıyor?
1. Console'da hata var mı kontrol et
2. Her iki toggle da **mavi** (açık) mı?
3. Intensity değeri **0'dan büyük** mü?

### Hiçbir efekt görünmüyor?
1. Master "Post Processing" toggle'ı açık mı?
2. Console'da `[PostProcessing] Disabled, returning null` görüyorsan → Master toggle kapalı

### Console'da hiç log yok?
1. PostProcessing komponenti yüklenmiyor olabilir
2. EditorPage.tsx'de `<PostProcessing />` var mı kontrol et

---

## 📊 Test Sonuçları

| Test | Durum | Notlar |
|------|-------|--------|
| Post Processing Toggle | ⬜ | |
| Ambient Occlusion | ⬜ | |
| Bloom | ⬜ | |
| Vignette | ⬜ | |
| Renk Düzeltme | ⬜ | |
| Tone Mapping | ⬜ | |

---

## 🔍 Debug Komutları (Console'da)

```javascript
// Store'daki post processing durumunu görmek için:
useSceneStore.getState().postProcessing

// SAO ayarlarını görmek için:
useSceneStore.getState().postProcessing.sao
```
