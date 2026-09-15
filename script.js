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

// TANIMLI KULLANICI HESAPLARI VE YETKİLERİ
const KULLANICILAR = [
    { kadi: "omer.ekinci", sifre: "omer1221", unvan: "Patron", silmeYetkisi: true },
    { kadi: "muhammed.simsek", sifre: "mami7883", unvan: "Teknik Servis Yöneticisi", silmeYetkisi: true },
    { kadi: "yigit.turker", sifre: "yigit5678", unvan: "Teknik Servis Elemanı", silmeYetkisi: false },
    { kadi: "emin.muhasebe", sifre: "emin.1244", unvan: "Muhasebeci", silmeYetkisi: false }
];

let aktifKullanici = null;

const cihazFormu = document.getElementById('cihaz-formu');
const stokFormu = document.getElementById('stok-formu');
const cihazListesi = document.getElementById('cihaz-listesi');
const stokListesi = document.getElementById('stok-listesi');

let cihazlar = [];
let stoklar = [];

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
    const kadiInput = document.getElementById('giris-kullanici').value.trim().toLowerCase();
    const sifreInput = document.getElementById('giris-sifre').value.trim();
    
    const girisEkrani = document.getElementById('giris-ekrani');
    const panelIcerigi = document.getElementById('panel-icerigi');
    const rolRozet = document.getElementById('aktif-rol-bilgisi');

    const eşleşenKullanıcı = KULLANICILAR.find(u => u.kadi.toLowerCase() === kadiInput && u.sifre === sifreInput);

    if (eşleşenKullanıcı) {
        aktifKullanici = eşleşenKullanıcı;
        girisEkrani.style.display = "none";
        panelIcerigi.style.display = "block";
        rolRozet.innerText = `Giriş Yapıldı: ${aktifKullanici.unvan} (${aktifKullanici.kadi})`;
        
        document.getElementById('giris-kullanici').value = "";
        document.getElementById('giris-sifre').value = "";
        
        listeyiGuncelle(cihazlar);
        stokListesiniGuncelle(stoklar);
    } else {
        alert("❌ Hatalı kullanıcı adı veya şifre!");
    }
}

// 3. ÇIKIŞ YAPMA FONKSİYONU
function cikisYap() {
    aktifKullanici = null;
    document.getElementById('giris-ekrani').style.display = "block";
    document.getElementById('panel-icerigi').style.display = "none";
}

// 4. BULUT VERİTABANINI DİNLEME (CİHAZLAR & STOKLAR CANLI SENKRONİZASYON)
db.collection("cihazlar").onSnapshot((snapshot) => {
    cihazlar = [];
    snapshot.forEach((doc) => {
        cihazlar.push({ firebaseId: doc.id, ...doc.data() });
    });
    listeyiGuncelle(cihazlar);
});

db.collection("stoklar").onSnapshot((snapshot) => {
    stoklar = [];
    snapshot.forEach((doc) => {
        stoklar.push({ firebaseId: doc.id, ...doc.data() });
    });
    stokListesiniGuncelle(stoklar);
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
            cikisTarihi: '-',
            kaydeden: aktifKullanici ? aktifKullanici.kadi : 'Bilinmiyor'
        };

        db.collection("cihazlar").add(yeniCihaz).then(() => {
            alert('✅ Cihaz kaydı buluta eklendi!');
            cihazFormu.reset();
            kargoAlanlariniYonet();
        }).catch((err) => {
            alert('❌ Hata: ' + err.message);
        });
    });
}

// 7. STOK KAYDETME FONKSİYONU
if (stokFormu) {
    stokFormu.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!aktifKullanici || !aktifKullanici.silmeYetkisi) {
            alert("❌ Stok ekleme yetkiniz bulunmamaktadır.");
            return;
        }

        const yeniStok = {
            stokAdi: document.getElementById('stok-adi').value,
            uyumluluk: document.getElementById('stok-uyumluluk').value,
            adet: parseInt(document.getElementById('stok-adet').value) || 0,
            kritikLimit: parseInt(document.getElementById('stok-kritik').value) || 2,
            fiyat: document.getElementById('stok-fiyat').value,
            ekleyen: aktifKullanici.kadi
        };

        db.collection("stoklar").add(yeniStok).then(() => {
            alert('✅ Yeni yedek parça stoğa eklendi!');
            stokFormu.reset();
        }).catch((err) => {
            alert('❌ Stok ekleme hatası: ' + err.message);
        });
    });
}

// 8. MÜŞTERİ SORGULAMA
function musteriSorgula() {
    const aramaMetni = document.getElementById('musteri-sorgu-input').value.trim().toLowerCase();
    const sonucAlani = document.getElementById('musteri-sonuc-alani');
    
    if (!aramaMetni) {
        sonucAlani.innerHTML = "<p style='color:red; margin-top:15px;'>Lütfen arama yapmak için Firma Adı veya Seri No giriniz.</p>";
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
            <div style="background:#f4f4f4; padding:15px; margin-bottom:10px; border-radius:5px; border-left:5px solid #007bff;">
                <h3>${c.musteriAdi} - [${c.cihazTipi}] ${c.marka}</h3>
                <p><strong>Seri No:</strong> ${c.seriNo}</p>
                <p><strong>Arıza:</strong> ${c.ariza}</p>
                <p><strong>Durum:</strong> <span style="font-weight:bold; color:blue;">${c.durum}</span></p>
                <p><strong>Giriş Tarihi:</strong> ${c.girisTarihi} | <strong>Çıkış Tarihi:</strong> ${c.cikisTarihi}</p>
            </div>
        `;
    });
    html += "</div>";
    sonucAlani.innerHTML = html;
}

// 9. TABLODA ARAMA
function tablodaAra() {
    const aramaMetni = document.getElementById('tablo-arama').value.toLowerCase();
    const filtrelenmis = cihazlar.filter(c => 
        c.musteriAdi.toLowerCase().includes(aramaMetni) ||
        c.seriNo.toLowerCase().includes(aramaMetni) ||
        c.marka.toLowerCase().includes(aramaMetni)
    );
    listeyiGuncelle(filtrelenmis);
}

// 10. LİSTEYİ VE İSTATİSTİKLERİ GÜNCELLEME
function listeyiGuncelle(liste) {
    if (!cihazListesi) return;
    cihazListesi.innerHTML = '';
    
    let bekleyen = 0, islemde = 0, tamamlanan = 0;

    liste.forEach((c) => {
        if (c.durum === 'Bekliyor') bekleyen++;
        if (c.durum === 'İşlemde') islemde++;
        if (c.durum === 'Tamamlandı') tamamlanan++;

        const silButonHtml = (aktifKullanici && aktifKullanici.silmeYetkisi) 
            ? `<button onclick="cihazSil('${c.firebaseId}')" style="background:#d9534f; color:white; border:none; padding:5px 8px; cursor:pointer; border-radius:3px;">Sil</button>` 
            : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.girisTarihi || '-'}</td>
            <td>${c.cikisTarihi || '-'}</td>
            <td>${c.gelisTipi || 'Elden'}</td>
            <td><strong>${c.musteriAdi}</strong><br><small>${c.telefon}</small></td>
            <td>[${c.cihazTipi}] ${c.marka}</td>
            <td><code>${c.seriNo}</code></td>
            <td>${c.aksesuarlar || '-'}</td>
            <td>${c.ariza}</td>
            <td>
                <select onchange="durumDegistir('${c.firebaseId}', this.value)">
                    <option value="Bekliyor" ${c.durum === 'Bekliyor' ? 'selected' : ''}>Bekliyor</option>
                    <option value="İşlemde" ${c.durum === 'İşlemde' ? 'selected' : ''}>İşlemde</option>
                    <option value="Tamamlandı" ${c.durum === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
                </select>
            </td>
            <td>
                <button onclick="etiketYazdir('${c.firebaseId}')" style="background:#0d6efd; color:white; border:none; padding:5px 8px; cursor:pointer; border-radius:3px; margin-right:4px;">Yazdır</button>
                ${silButonHtml}
            </td>
        `;
        cihazListesi.appendChild(tr);
    });

    if (document.getElementById('toplam-sayi')) document.getElementById('toplam-sayi').innerText = liste.length;
    if (document.getElementById('bekleyen-sayi')) document.getElementById('bekleyen-sayi').innerText = bekleyen;
    if (document.getElementById('islemde-sayi')) document.getElementById('islemde-sayi').innerText = islemde;
    if (document.getElementById('tamamlanan-sayi')) document.getElementById('tamamlanan-sayi').innerText = tamamlanan;
}

// 11. STOK LİSTESİNİ GÜNCELLEME
function stokListesiniGuncelle(liste) {
    if (!stokListesi) return;
    stokListesi.innerHTML = '';

    liste.forEach((s) => {
        const kritikDurum = s.adet <= s.kritikLimit;
        const durumBadge = kritikDurum 
            ? `<span style="background:#dc3545; color:white; padding:3px 8px; border-radius:10px; font-size:12px; font-weight:bold;">⚠️ Kritik Stok</span>` 
            : `<span style="background:#28a745; color:white; padding:3px 8px; border-radius:10px; font-size:12px;">✅ Yeterli</span>`;

        const silButonHtml = (aktifKullanici && aktifKullanici.silmeYetkisi) 
            ? `<button onclick="stokSil('${s.firebaseId}')" style="background:#d9534f; color:white; border:none; padding:4px 8px; cursor:pointer; border-radius:3px;">Sil</button>` 
            : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${s.stokAdi}</strong></td>
            <td>${s.uyumluluk}</td>
            <td><b style="font-size:16px;">${s.adet}</b> Adet</td>
            <td>${s.kritikLimit}</td>
            <td>${s.fiyat}</td>
            <td>${durumBadge}</td>
            <td>
                <button onclick="stokAdetGuncelle('${s.firebaseId}', ${s.adet + 1})" style="background:#198754; color:white; border:none; padding:4px 8px; cursor:pointer; border-radius:3px; margin-right:2px;">+</button>
                <button onclick="stokAdetGuncelle('${s.firebaseId}', ${s.adet - 1})" style="background:#ffc107; color:black; border:none; padding:4px 8px; cursor:pointer; border-radius:3px; margin-right:4px;">-</button>
                ${silButonHtml}
            </td>
        `;
        stokListesi.appendChild(tr);
    });
}

// 12. STOK GÜNCELLEME VE SİLME
function stokAdetGuncelle(firebaseId, yeniAdet) {
    if (yeniAdet < 0) return;
    db.collection("stoklar").doc(firebaseId).update({
        adet: yeniAdet
    });
}

function stokSil(firebaseId) {
    if (!aktifKullanici || !aktifKullanici.silmeYetkisi) {
        alert("❌ Stok silme yetkiniz yok!");
        return;
    }
    if (confirm('Bu parça stoğunu silmek istediğinize emin misiniz?')) {
        db.collection("stoklar").doc(firebaseId).delete();
    }
}

// 13. DURUM GÜNCELLEME VE SİLME
function durumDegistir(firebaseId, yeniDurum) {
    db.collection("cihazlar").doc(firebaseId).update({
        durum: yeniDurum,
        cikisTarihi: yeniDurum === 'Tamamlandı' ? new Date().toLocaleDateString('tr-TR') : '-'
    });
}

function cihazSil(firebaseId) {
    if (!aktifKullanici || !aktifKullanici.silmeYetkisi) {
        alert("❌ Bu işlem için yetkiniz yok! Yalnızca Patron veya Teknik Servis Yöneticisi silme yapabilir.");
        return;
    }
    if (confirm('Bu kaydı bulut veritabanından silmek istediğinize emin misiniz?')) {
        db.collection("cihazlar").doc(firebaseId).delete();
    }
}

// 14. ETİKET YAZDIRMA FONKSİYONU
function etiketYazdir(firebaseId) {
    const cihaz = cihazlar.find(c => c.firebaseId === firebaseId);
    if (!cihaz) return;

    document.getElementById('lbl-musteri').innerText = cihaz.musteriAdi || '-';
    document.getElementById('lbl-cihaz').innerText = `${cihaz.cihazTipi || ''} ${cihaz.marka || ''}`.trim();
    document.getElementById('lbl-tarih').innerText = cihaz.girisTarihi || '-';
    document.getElementById('lbl-serino').innerText = cihaz.seriNo || '-';

    const qrKapsayici = document.getElementById('lbl-qrcode');
    qrKapsayici.innerHTML = "";

    const qrText = encodeURIComponent(cihaz.seriNo || '000000');
    
    const qrImg = document.createElement('img');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${qrText}`;
    qrImg.style.width = "64px";
    qrImg.style.height = "64px";
    
    qrImg.onload = function() {
        setTimeout(() => {
            window.print();
        }, 100);
    };

    qrImg.onerror = function() {
        window.print();
    };

    qrKapsayici.appendChild(qrImg);
}
