# Test Sorunları ve Eksiklikler (Problems.md)

Bu dosya, `must_be_tested.md` dosyasındaki test adımlarının uygulanması sonucunda tespit edilen sorunları ve eksiklikleri içerir.

## 1. Başlangıç ve Yönlendirme (Routing)
- [x] Ana Sayfa (/) Erişimi - **BAŞARILI**
- [x] Viewer (/demo) Erişimi - **BAŞARILI**
- [x] Editor (/demo/editor) Erişimi - **BAŞARILI**
- [x] Yeni Proje (404) Senaryosu - **BAŞARILI**

## 2. Model Yükleme
- [x] Drag & Drop UI (Modal) - **BAŞARILI**
- [x] Model Yükle Butonu - **BAŞARILI**

## 3. Viewer Modu (İzleyici)
- [x] Kamera Kontrolleri (Orbit, Pan, Zoom) - **BAŞARILI**
- [x] Arayüz Kontrolleri (Ana sayfa linki, Editor butonu) - **BAŞARILI**

## 4. Editör Modu - Temel İşlevler
- [x] Nesne Seçimi ve Gizmo - **BAŞARILI**
- [ ] Transform Araçları (Translate, Rotate, Scale) - **KISMEN HATALI** (R tuşu çalışmıyor, buton çalışıyor)
- [ ] Undo/Redo Bekleniyor
- [x] Sağ Panel Tabları - **BAŞARILI**

## 5. Editör Modu - Işık Yönetimi
- [x] Işık Ekleme/Silme - **BAŞARILI**

## 6. Editör Modu - Gelişmiş Özellikler
- [x] Scene Outliner - **DÜZELTILDI** (Lights ve Zones kategorileri artık sol panelde görünüyor)
- [x] Görünürlük Kontrolü - **BAŞARILI**
- [ ] Çoklu Seçim - **HATALI** (Ctrl+Click veya Ctrl+A ile çoklu seçim paneli tetiklenmiyor)

## 7. Etkileşim Bölgeleri
- [x] Zone Ekleme - **BAŞARILI**
- [x] Zone Düzenleme (İsim) - **BAŞARILI**
- [x] Zone Silme - **BAŞARILI** (Buton ile)

## 8. Oyuncu Modu
- [x] Editor -> Test Modu Geçişi - **BAŞARILI**
- [x] Hareket ve Collision - **BAŞARILI**

## 9. Materyal Varyasyon Sistemi
- [x] Varyasyon Grubu Oluşturma - **BAŞARILI**
- [x] Seçenek Ekleme - **BAŞARILI**
- [ ] Grup İsimlendirme - **HATALI** (Arayüz tepki vermiyor)
- [ ] Grup Silme - **HATALI** (Silme butonu yok)

## 10. Kayıt ve Dışa Aktarım
- [ ] Proje Kaydetme - **HATALI** (Kaydet butonu yok, Ctrl+S bildirimi yok)
- [x] Dışa Aktarım (Export) - **BAŞARILI**
- [x] İçe Aktarım (Import) - **BAŞARILI** (Arayüz ve Modal mevcut)

## 11. Toast Bildirim Sistemi
- [x] Bildirimler - **BAŞARILI** (Başarılı işlem bildirimleri çalışıyor)

## 12. Performans
- [ ] FPS ve Yükleme Süresi Gözlemi Bekleniyor

## 13. Mobil Uyumluluk
- [ ] Responsive Kontrolü Bekleniyor
