const PATRON_SIFRESI = "1234";
const ELEMAN_SIFRESI = "5678";
let aktifRol = "musteri"; 

const cihazFormu = document.getElementById('cihaz-formu');
const cihazListesi = document.getElementById('cihaz-listesi');

let cihazlar = JSON.parse(localStorage.getItem('teknikServisCihazlar')) || [];

listeyiGuncelle(cihazlar);

// Kargo Alanı Göster/Gizle
function kargoAlanlariniYonet() {
    const gelisTipi = document.getElementById('gelis-tipi').value;
    const kargoAlani = document.getElementById('kargo-detay-alani');
    if (gelisTipi === 'Kargo') {
        kargoAlani.style.display = 'flex';
    } else {
        kargoAlani.style.display = 'none';
    }
}

// Sekme Geçiş Mantığı
function sekmeDegistir(sekmeId) {
    if (sekmeId === 'yonetici-paneli' && aktifRol === 'musteri') {
        document.getElementById('sifre-modal').style.display = 'flex';
        return;
    }

    document.querySelectorAll('.sekme-icerik').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sekme-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(sekmeId).classList.add('active');
    
    const butonlar = document.querySelectorAll('.sekme-btn');
    if(sekmeId === 'musteri-paneli') butonlar[0].classList.add('active');
    if(sekmeId === 'yonetici-paneli') butonlar[1].classList.add('active');
}

// Şifre Kontrolü
function sifreKontrol() {
    const girilenSifre = document.getElementById('yonetici-sifre-input').value;
    const hataMesaji = document.getElementById('sifre-hata');

    if (girilenSifre === PATRON_SIFRESI) {
        aktifRol = "patron";
        girisBasarili();
    } else if (girilenSifre === ELEMAN_SIFRESI) {
        aktifRol = "eleman";
        girisBasarili();
    } else {
        hataMesaji.style.display = 'block';
    }
}

function girisBasarili() {
    modalKapat();
    sekmeDegistir('yonetici-paneli');
    listeyiGuncelle(cihazlar);
}

function modalKapat() {
    document.getElementById('sifre-modal').style.display = 'none';
    document.getElementById('yonetici-sifre-input').value = '';
    document.getElementById('sifre-hata').style.display = 'none';
}

// Cihaz Ekleme
cihazFormu.addEventListener('submit', function(olay) {
    olay.preventDefault();

    const aksesuarlar = [];
    if (document.getElementById('acc-adaptor').checked) aksesuarlar.push('Adaptör');
    if (document.getElementById('acc-kablo').checked) aksesuarlar.push('Kablo');
    if (document.getElementById('acc-batarya').checked) aksesuarlar.push('Batarya');
    if (document.getElementById('acc-dock').checked) aksesuarlar.push('Dock');

    const gelisTipi = document.getElementById('gelis-tipi').value;
    const kargoFirmasi = document.getElementById('kargo-firmasi').value;
    const kargoKodu = document.getElementById('kargo-kodu').value;

    const yeniCihaz = {
        id: Date.now(),
        tarih: new Date().toLocaleDateString('tr-TR'),
        cikisTarihi: '-',
        gelisTipi: gelisTipi,
        kargoBilgisi: gelisTipi === 'Kargo' ? `${kargoFirmasi} (${kargoKodu})` : 'Elden',
        musteri: document.getElementById('musteri-adi').value,
        telefon: document.getElementById('telefon').value,
        tip: document.getElementById('cihaz-tipi').value,
        model: document.getElementById('cihaz-model').value,
        seriNo: document.getElementById('seri-no').value,
        ariza: document.getElementById('ariza-detay').value,
        aksesuarlar: aksesuarlar.length > 0 ? aksesuarlar.join(', ') : 'Yok',
        durum: 'Bekliyor'
    };

    cihazlar.push(yeniCihaz);
    hafizayaKaydet();
    cihazFormu.reset();
    document.getElementById('kargo-detay-alani').style.display = 'none';
    listeyiGuncelle(cihazlar);
});

// Tabloyu Güncelleme
function listeyiGuncelle(veriListesi) {
    cihazListesi.innerHTML = '';

    let bekleyen = 0, islemde = 0, tamamlanan = 0;

    cihazlar.forEach(cihaz => {
        if (cihaz.durum === 'Bekliyor') bekleyen++;
        if (cihaz.durum === 'İşlemde') islemde++;
        if (cihaz.durum === 'Tamamlandı') tamamlanan++;
    });

    veriListesi.forEach(function(cihaz) {
        const satir = document.createElement('tr');
        
        const silButonuHTML = aktifRol === 'patron' 
            ? `<button onclick="sil(${cihaz.id})" class="btn-sil">Sil</button>` 
            : `<span style="color:#aaa; font-size:12px;">Yetki Yok</span>`;

        satir.innerHTML = `
            <td>${cihaz.tarih}</td>
            <td><strong style="color:${cihaz.cikisTarihi !== '-' ? 'green' : '#666'}">${cihaz.cikisTarihi}</strong></td>
            <td><strong>${cihaz.gelisTipi}</strong><br><small>${cihaz.kargoBilgisi || ''}</small></td>
            <td><strong>${cihaz.musteri}</strong><br><small>${cihaz.telefon}</small></td>
            <td>[${cihaz.tip}] ${cihaz.model}</td>
            <td><code>${cihaz.seriNo}</code></td>
            <td>${cihaz.aksesuarlar}</td>
            <td>${cihaz.ariza}</td>
            <td>
                <select onchange="durumDegistir(${cihaz.id}, this.value)">
                    <option value="Bekliyor" ${cihaz.durum === 'Bekliyor' ? 'selected' : ''}>Bekliyor</option>
                    <option value="İşlemde" ${cihaz.durum === 'İşlemde' ? 'selected' : ''}>İşlemde</option>
                    <option value="Tamamlandı" ${cihaz.durum === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
                </select>
            </td>
            <td>
                <button onclick="etiketYazdir(${cihaz.id})" class="btn-etiket">🏷️ Etiket</button>
                ${silButonuHTML}
            </td>
        `;
        cihazListesi.appendChild(satir);
    });

    document.getElementById('toplam-sayi').textContent = cihazlar.length;
    document.getElementById('bekleyen-sayi').textContent = bekleyen;
    document.getElementById('islemde-sayi').textContent = islemde;
    document.getElementById('tamamlanan-sayi').textContent = tamamlanan;
}

// Durum Değiştirme
function durumDegistir(id, yeniDurum) {
    const cihaz = cihazlar.find(item => item.id === id);
    if (cihaz) {
        cihaz.durum = yeniDurum;
        
        if (yeniDurum === 'Tamamlandı') {
            cihaz.cikisTarihi = new Date().toLocaleDateString('tr-TR');
        } else {
            cihaz.cikisTarihi = '-';
        }

        hafizayaKaydet();
        listeyiGuncelle(cihazlar);
    }
}

// TSC / Mobil Yazıcı Etiket Çıktısı
function etiketYazdir(id) {
    const cihaz = cihazlar.find(item => item.id === id);
    if (!cihaz) return;

    let etiketAlani = document.getElementById('yazdir-etiket-alani');
    if (!etiketAlani) {
        etiketAlani = document.createElement('div');
        etiketAlani.id = 'yazdir-etiket-alani';
        document.body.appendChild(etiketAlani);
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(cihaz.seriNo)}`;

    etiketAlani.innerHTML = `
        <div style="border: 2px solid black; padding: 8px; font-size: 11px; text-align: center;">
            <div style="font-weight: bold; font-size: 13px; border-bottom: 1px solid black; padding-bottom: 3px;">TEKNİK SERVİS ETİKETİ</div>
            <div style="margin-top: 5px; text-align: left;">
                <b>Firma:</b> ${cihaz.musteri}<br>
                <b>Model:</b> ${cihaz.model}<br>
                <b>S/N:</b> ${cihaz.seriNo}<br>
                <b>Tarih:</b> ${cihaz.tarih}
            </div>
            <div style="margin-top: 5px;">
                <img src="${qrUrl}" width="70" height="70" alt="QR Code"><br>
                <small>${cihaz.seriNo}</small>
            </div>
        </div>
    `;

    window.print();
}

// Yönetici Arama
function yoneticiFiltrele() {
    const aramaMetni = document.getElementById('yonetici-arama').value.toLowerCase().trim();
    const filtrelenmis = cihazlar.filter(cihaz => 
        cihaz.musteri.toLowerCase().includes(aramaMetni) ||
        cihaz.model.toLowerCase().includes(aramaMetni) ||
        cihaz.seriNo.toLowerCase().includes(aramaMetni)
    );
    listeyiGuncelle(filtrelenmis);
}

// Müşteri Sorgulama
function musteriSorgula() {
    const aramaMetni = document.getElementById('musteri-sorgu-input').value.toLowerCase().trim();
    const sonucAlani = document.getElementById('musteri-sonuc');
    sonucAlani.innerHTML = '';

    if (aramaMetni === '') {
        sonucAlani.innerHTML = '<p style="text-align:center; color:red;">Lütfen Firma Adı veya Seri No girin!</p>';
        return;
    }

    const eşleşenler = cihazlar.filter(cihaz => 
        cihaz.musteri.toLowerCase().includes(aramaMetni) ||
        cihaz.seriNo.toLowerCase().includes(aramaMetni)
    );

    if (eşleşenler.length === 0) {
        sonucAlani.innerHTML = '<p style="text-align:center; color:#6b7280;">Kayıtlı cihaz bulunamadı.</p>';
    } else {
        eşleşenler.forEach(cihaz => {
            const kart = document.createElement('div');
            kart.className = 'sonuc-kart';
            kart.innerHTML = `
                <h3>${cihaz.model} (S/N: ${cihaz.seriNo})</h3>
                <p><strong>Firma:</strong> ${cihaz.musteri}</p>
                <p><strong>Geliş Biçimi:</strong> ${cihaz.gelisTipi} ${cihaz.gelisTipi === 'Kargo' ? '(' + cihaz.kargoBilgisi + ')' : ''}</p>
                <p><strong>Giriş Tarihi:</strong> ${cihaz.tarih}</p>
                <p><strong>Çıkış Tarihi:</strong> ${cihaz.cikisTarihi}</p>
                <p><strong>Arıza:</strong> ${cihaz.ariza}</p>
                <p><strong>Durum:</strong> <span style="color:#2563eb; font-weight:bold;">${cihaz.durum}</span></p>
            `;
            sonucAlani.appendChild(kart);
        });
    }
}

// Silme Fonksiyonu
function sil(id) {
    if (aktifRol !== 'patron') {
        alert('Cihaz silme yetkiniz yok!');
        return;
    }
    if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
        cihazlar = cihazlar.filter(item => item.id !== id);
        hafizayaKaydet();
        listeyiGuncelle(cihazlar);
    }
}

function hafizayaKaydet() {
    localStorage.setItem('teknikServisCihazlar', JSON.stringify(cihazlar));
}
