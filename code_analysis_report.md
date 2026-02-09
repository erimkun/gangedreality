# Derinlemesine Kod Analizi Raporu

Tarih: 2026-02-09

Bu rapor, kod tabaninda statik inceleme ile tespit edilen riskleri, uyumsuzluklari ve uretimde sorun cikarabilecek durumlari icerir. Calistirma veya runtime testi yapilmamistir.

## Bulgular (Oncelik Sirasina Gore)

1) Kritik - XSS riski (ikon bloklari)
- SVG metni dogrudan HTML olarak basiliyor. Kullanici girdisi sanitizasyonsuz geldigi icin popup uzerinden script calistirilabilir.
- Konum: src/components/ui/BlockRenderer.tsx (satir 54, 90)
- Not: SVG yalnizca allowlist ile sanitize edilip render ediliyor; SVG degilse ikon metin olarak basiliyor.

2) Yuksek - Variants texture export kopuyor
- Variants tarafinda dosya esleme __dataUrlToFileName ile tutuluyor.
- Exporter sadece __blobUrlToFileName okuyor.
- Sonuc: JSON icinde data URL kalir, ZIP icindeki dosya yoluyla eslesmez. Production'da texture bos gelir.
- Konum: src/components/ui/panels/VariantsPanel.tsx (satir 204-229), src/utils/zipExporter.ts (satir 81-91)
- Cozum: Exporter, texture URL'lerini hem __blobUrlToFileName hem de __dataUrlToFileName uzerinden cozluyor.

3) Yuksek - Projeler arasi ghost data
- scene.json / interactions.json / variants.json / hotspots.json bulunamazsa ilgili store sifirlanmiyor.
- Onceki projenin verisi yeni projede kalabiliyor.
- Konum: src/store/useProjectStore.ts (satir 154, 169, 195, 223)
- Cozum: Eksik config dosyalarinda ilgili store varsayilan config ile sifirlaniyor.

4) Orta - Export sirasinda store mutasyonu
- Exporter, projectData.project.assets uzerinde dogrudan degisiklik yapiyor.
- getFullProjectData deep copy donmedigi icin store sessizce degisiyor.
- Konum: src/utils/zipExporter.ts (satir 136-146), src/store/useProjectStore.ts (satir 375)
- Cozum: Exporter, deep clone edilen export verisi uzerinde calisiyor; canli store degismiyor.

5) Orta - Editor lock uygulanmiyor
- editorLock config'te var ama route guard yok.
- /:projectId/editor her durumda acik.
- Konum: src/types/index.ts (satir 29), src/App.tsx (satir 18)
- Cozum: VITE_EDITOR_PASSWORD ile sifre korumasi eklendi; dogru sifre girilmeden editor acilmiyor.

6) Orta - Global dosya haritalari temizlenmiyor
- window.__loadedModelFiles ve window.__loadedTextures proje bazinda sifirlanmiyor.
- Eski dosyalar yeni export'a karisabilir.
- Konum: src/hooks/useModelLoader.ts (satir 55-58), src/components/ui/panels/VariantsPanel.tsx (satir 204-229), src/utils/zipExporter.ts (satir 157-160)
- Cozum: Proje yukle/olustur/sifirla akışında global dosya haritalari temizleniyor.

## Negatif Yol Haritalari (Sorun Zincirleri)

Roadmap 1 - Eksik config dosyasi
- Yeni projede hotspots.json yok
- loadProject sadece ok ise set ediyor
- Onceki projenin hotspotlari kalir
- Export alinirsa yanlis hotspotlar prod'a tasinir

Roadmap 2 - Variants texture export
- Kullanici texture ekler -> data URL kaydi olusur
- Export sirasinda data URL dosya yoluna donusturulmez
- ZIP icindeki JSON data URL kalir
- Production'da texture gorunmez

Roadmap 3 - Yetkisiz editor erisimi
- editorLock true olsa bile route guard yok
- Editor linkini bilen herkes girer
- Admin onay akisi bypass olur

## Production Icin Oneriler (Admin Publish Akisi)

1) Minimum degisiklikle manual publish
- Editor sadece ZIP uretir
- Admin ZIP'i kontrol eder ve server'a kopyalar
- Export oncesi validator eklenmeli (missing files, data URL var mi, model dosyasi var mi)

2) Admin publish endpoint
- Editor draft olarak sunucuya yukler
- Admin panelinden publish edilir
- Draft ve live ayri dizin veya bucket

3) Versiyonlu publish + audit
- Draft snapshot'lari DB'de tutulur
- Asset'ler object storage'da
- Publish atomik olarak "current" versiyona isaret eder
- Rollback ve audit log kolaylasir

## Kisa Yorum

ZIP'i kendin server'a atmak kucuk/tek-admin senaryosunda calisir. Ancak export tutarliligi (data URL eslesmesi) ve store'de kalan eski veriler temizlenmeden production'a cikmak risklidir.
