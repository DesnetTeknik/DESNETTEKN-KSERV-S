// FIREBASE BULUT YAPILANDIRMASI
const firebaseConfig = {
    apiKey: "AIzaSyCjVuS94dkxNLPfp04Eqgty0sj7Xo0qc6s",
    authDomain: "desnetteknik-66527.firebaseapp.com",
    projectId: "desnetteknik-66527",
    storageBucket: "desnetteknik-66527.firebasestorage.app",
    messagingSenderId: "200503339006",
    appId: "1:200503339006:web:0e940ae8a383a802a042af",
    measurementId: "G-NK5KLZVW0G"
};

// Firebase Başlat
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// SİZİN ÖZEL KULLANICI LİSTENİZ VE YETKİLERİ
const KULLANICILAR = [
    { kullaniciAdi: "omer.ekinci", sifre: "omer1221", adSoyad: "Ömer Ekinci", rol: "Patron", yetki: "TAM" },
    { kullaniciAdi: "muhammed.simsek", sifre: "mami7883", adSoyad: "Muhammed Şimşek", rol: "Teknik Servis Yöneticisi", yetki: "TAM" },
    { kullaniciAdi: "yigit.turker", sifre: "yigit5678", adSoyad: "Yiğit Türker", rol: "Teknik Eleman", yetki: "EKLEME_YAZDIRMA" },
    { kullaniciAdi: "emin.muhasebe", sifre: "emin.1244", adSoyad: "Emin", rol: "Muhasebeci", yetki: "IZLEYICI" }
];

let aktifKullanici = null;
let cihazlar = [];

const cihazFormu = document.getElementById('cihaz-formu');
const cihazListesi = document.getElementById('cihaz-listesi');

// 1. SEKME DEĞİŞTİRME FONKSİYONU
function sekmeDegistir(sekmeId) {
    document.querySelectorAll('.sekme-icerik').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sekme-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(sekmeId).classList.add('active');
    
    const butonlar = document.querySelectorAll('.sekme-btn');
    if(sekmeId === 'musteri-paneli') butonlar[0].classList.add('active');
    if(sekmeId === 'yonetici-paneli') butonlar[1].classList.add('active');
}

// 2. SİSTEME GİRİŞ YAPMA FONKSİYONU
function sistemeGirisYap() {
    const girilenKullanici = document.getElementById('giris-kullanici').value.trim();
    const girilenSifre = document.getElementById('giris-sifre').value.trim();
    
    const eslesen = KULLANICILAR.find(u => 
        u.kullaniciAdi.toLowerCase() === girilenKullanici.toLowerCase() && 
        u.sifre === girilenSifre
    );

    if (eslesen) {
        aktifKullanici = eslesen;
        
        document.getElementById('giris-ekrani').style.display = "none";
        document.getElementById('panel-icerigi').style.display = "block";
        
        document.getElementById('aktif-kullanici-adi').innerText = eslesen.adSoyad;
        document.getElementById('aktif-rol-bilgisi').innerText = eslesen.rol;

        // Yetkiye göre Arayüz Gizleme/Gösterme
        const kayitFormAlani = document.getElementById('kayit-form-alani');
        if (eslesen.yetki === "IZLEYICI") {
            kayitFormAlani.style.display = "none"; // Muhasebeci yeni kayıt ekleyemez
        } else {
            kayitFormAlani.style.display = "block";
        }

        // Kutuları temizle
        document.getElementById('giris-kullanici').value = "";
        document.getElementById('giris-sifre').value = "";

        // Tabloyu kullanıcının yetkilerine göre yeniden çiz
        listeyiGuncelle(cihazlar);
    } else {
        alert("❌ Kullanıcı adı veya şifre hatalı!");
    }
}

// 3. ÇIKIŞ YAPMA FONKSİYONU
function cikisYap() {
    aktifKullanici = null;
    document.getElementById('giris-ekrani').style.display = "flex";
    document.getElementById('panel-icerigi').style.display = "none";
}

// 4. BULUT VERİTABANINI DİNLEME (CANLI SENKRONİZASYON)
db.collection("cihazlar").onSnapshot((snapshot) => {
    cihazlar = [];
    snapshot.forEach((doc) => {
        cihazlar.push({ firebaseId: doc.id, ...doc.data() });
    });
    listeyiGuncelle(cihazlar);
});

// 5. KARGO ALANI YÖNETİMİ
function kargoAlanlariniYonet() {
    const gelisTipi = document.getElementById('gelis-tipi').value;
    const kargoAlani = document.getElementById('kargo-detay-alani');
    if (gelisTipi === 'Kargo') {
        kargoAlani.style.display = 'flex';
    } else {
        kargoAlani.style.display = 'none';
    }
}

// 6. CİHAZ KAYDETME
if (cihazFormu) {
    cihazFormu.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!aktifKullanici || aktifKullanici.yetki === "IZLEYICI") {
            alert("❌ Yeni cihaz ekleme yetkiniz yok!");
            return;
        }

        const secilenAksesuarlar = [];
        document.querySelectorAll('.aksesuar-cb:checked').forEach(cb => {
            secilenAksesuarlar.push(cb.value);
        });

        const yeniCihaz = {
            id: Date.now(),
            musteriAdi: document.getElementById('musteri-adi').value,
            telefon: document.getElementById('telefon').value,
            cihazTipi: document.getElementById('cihaz-tipi').value,
            marka: document.getElementById('marka').value,
            seriNo: document.getElementById('seri-no').value,
            ariza: document.getElementById('ariza').value,
            gelisTipi: document.getElementById('gelis-tipi').value,
            kargoFirmasi: document.getElementById('kargo-firmasi').value || '-',
            kargoKodu: document.getElementById('kargo-kodu').value || '-',
            aksesuarlar: secilenAksesuarlar.join(', ') || 'Yok',
            durum: 'Bekliyor',
            girisTarihi: new Date().toLocaleDateString('tr-TR'),
            cikisTarihi: '-'
        };

        db.collection("cihazlar").add(yeniCihaz).then(() => {
            alert('✅ Cihaz kaydı eklendi!');
            cihazFormu.reset();
            kargoAlanlariniYonet();
        }).catch((err) => {
            alert('❌ Hata: ' + err.message);
        });
    });
}

// 7. MÜŞTERİ SORGULAMA FONKSİYONU
function musteriSorgula() {
    const aramaMetni = document.getElementById('musteri-sorgu-input').value.trim().toLowerCase();
    const sonucAlani = document.getElementById('musteri-sonuc-alani');
    
    if (!aramaMetni) {
        sonucAlani.innerHTML = "<p style='color:red; margin-top:15px;'>Lütfen Firma Adı veya Seri No giriniz.</p>";
        return;
    }

    const eslesenler = cihazlar.filter(c => 
        c.musteriAdi.toLowerCase().includes(aramaMetni) || 
        c.seriNo.toLowerCase().includes(aramaMetni)
    );

    if (eslesenler.length === 0) {
        sonucAlani.innerHTML = "<p style='margin-top:15px;'>Aradığınız kriterlere uygun cihaz bulunamadı.</p>";
        return;
    }

    let html = "<div style='margin-top:20px;'>";
    eslesenler.forEach(c => {
        html += `
            <div style="background:#f4f4f4; padding:15px; margin-bottom:10px; border-radius:5px; border-left:5px solid #0284c7; text-align:left;">
                <h3>${c.musteriAdi} - [${c.cihazTipi}] ${c.marka}</h3>
                <p><strong>Seri No:</strong> ${c.seriNo}</p>
                <p><strong>Arıza:</strong> ${c.ariza}</p>
                <p><strong>Durum:</strong> <span style="font-weight:bold; color:#0284c7;">${c.durum}</span></p>
                <p><strong>Giriş Tarihi:</strong> ${c.girisTarihi} | <strong>Çıkış Tarihi:</strong> ${c.cikisTarihi}</p>
            </div>
        `;
    });
    html += "</div>";
    sonucAlani.innerHTML = html;
}

// 8. TABLODA ARAMA
function tablodaAra() {
    const aramaMetni = document.getElementById('tablo-arama').value.toLowerCase();
    const filtrelenmis = cihazlar.filter(c => 
        c.musteriAdi.toLowerCase().includes(aramaMetni) ||
        c.seriNo.toLowerCase().includes(aramaMetni) ||
        c.marka.toLowerCase().includes(aramaMetni)
    );
    listeyiGuncelle(filtrelenmis);
}

// 9. LİSTEYİ VE İSTATİSTİKLERİ GÜNCELLEME (YETKİ KONTROLLÜ)
function listeyiGuncelle(liste) {
    if (!cihazListesi) return;
    cihazListesi.innerHTML = '';
    
    let bekleyen = 0, islemde = 0, tamamlanan = 0;

    liste.forEach((c) => {
        if (c.durum === 'Bekliyor') bekleyen++;
        if (c.durum === 'İşlemde') islemde++;
        if (c.durum === 'Tamamlandı') tamamlanan++;

        const tr = document.createElement('tr');

        // Durum Seçimi (Sadece Patron ve Yöneticide Aktif)
        let durumHtml = `<span class="rol-rozet">${c.durum}</span>`;
        if (aktifKullanici && aktifKullanici.yetki === "TAM") {
            durumHtml = `
                <select onchange="durumDegistir('${c.firebaseId}', this.value)">
                    <option value="Bekliyor" ${c.durum === 'Bekliyor' ? 'selected' : ''}>Bekliyor</option>
                    <option value="İşlemde" ${c.durum === 'İşlemde' ? 'selected' : ''}>İşlemde</option>
                    <option value="Tamamlandı" ${c.durum === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
                </select>
            `;
        }

        // İşlem Butonları (Yazdırma ve Silme Yetkisi)
        let islemButonlari = `<span style="color:#94a3b8; font-size:11px;">Yetki Yok</span>`;
        if (aktifKullanici) {
            let butonlar = "";
            
            // Yazdırma yetkisi var mı? (Muhasebeci hariç)
            if (aktifKullanici.yetki === "TAM" || aktifKullanici.yetki === "EKLEME_YAZDIRMA") {
                butonlar += `<button onclick="etiketYazdir('${c.firebaseId}')" style="background:#0284c7; color:white; border:none; padding:5px 8px; cursor:pointer; border-radius:3px; margin-right:4px;">Yazdır</button>`;
            }

            // Silme yetkisi var mı? (Sadece TAM yetki)
            if (aktifKullanici.yetki === "TAM") {
                butonlar += `<button onclick="cihazSil('${c.firebaseId}')" style="background:#ef4444; color:white; border:none; padding:5px 8px; cursor:pointer; border-radius:3px;">Sil</button>`;
            }

            if (butonlar !== "") islemButonlari = butonlar;
        }

        tr.innerHTML = `
            <td>${c.girisTarihi || '-'}</td>
            <td>${c.cikisTarihi || '-'}</td>
            <td>${c.gelisTipi || 'Elden'}</td>
            <td><strong>${c.musteriAdi}</strong><br><small>${c.telefon}</small></td>
            <td>[${c.cihazTipi}] ${c.marka}</td>
            <td><code>${c.seriNo}</code></td>
            <td>${c.aksesuarlar || '-'}</td>
            <td>${c.ariza}</td>
            <td>${durumHtml}</td>
            <td>${islemButonlari}</td>
        `;
        cihazListesi.appendChild(tr);
    });

    if (document.getElementById('toplam-sayi')) document.getElementById('toplam-sayi').innerText = liste.length;
    if (document.getElementById('bekleyen-sayi')) document.getElementById('bekleyen-sayi').innerText = bekleyen;
    if (document.getElementById('islemde-sayi')) document.getElementById('islemde-sayi').innerText = islemde;
    if (document.getElementById('tamamlanan-sayi')) document.getElementById('tamamlanan-sayi').innerText = tamamlanan;
}

// 10. DURUM GÜNCELLEME VE SİLME (GÜVENLİK KONTROLLÜ)
function durumDegistir(firebaseId, yeniDurum) {
    if (!aktifKullanici || aktifKullanici.yetki !== "TAM") {
        alert("❌ Durum değiştirme yetkiniz yok!");
        return;
    }
    db.collection("cihazlar").doc(firebaseId).update({
        durum: yeniDurum,
        cikisTarihi: yeniDurum === 'Tamamlandı' ? new Date().toLocaleDateString('tr-TR') : '-'
    });
}

function cihazSil(firebaseId) {
    if (!aktifKullanici || aktifKullanici.yetki !== "TAM") {
        alert("❌ Cihaz silme yetkiniz yok!");
        return;
    }
    if (confirm('Bu kaydı bulut veritabanından silmek istediğinize emin misiniz?')) {
        db.collection("cihazlar").doc(firebaseId).delete();
    }
}

// 11. ETİKET YAZDIRMA (50mm x 30mm)
function etiketYazdir(firebaseId) {
    const cihaz = cihazlar.find(c => c.firebaseId === firebaseId);
    if (!cihaz) return;

    document.getElementById('lbl-musteri').innerText = cihaz.musteriAdi;
    document.getElementById('lbl-cihaz').innerText = `${cihaz.cihazTipi} ${cihaz.marka}`;
    document.getElementById('lbl-tarih').innerText = cihaz.girisTarihi || '-';
    document.getElementById('lbl-serino').innerText = cihaz.seriNo;

    const qrKapsayici = document.getElementById('lbl-qrcode');
    qrKapsayici.innerHTML = "";

    try {
        new QRCode(qrKapsayici, {
            text: cihaz.seriNo,
            width: 80,
            height: 80,
            correctLevel: QRCode.CorrectLevel.M
        });
    } catch (e) {
        console.log("QR Kod hatası:", e);
    }

    setTimeout(() => {
        window.print();
    }, 250);
}
