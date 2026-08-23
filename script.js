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

const PATRON_SIFRESI = "1234";
const ELEMAN_SIFRESI = "5678";
let aktifRol = "musteri";

const cihazFormu = document.getElementById('cihaz-formu');
const cihazListesi = document.getElementById('cihaz-listesi');

let cihazlar = [];

// Buluttan Verileri Canlı Dinle (Laptop ve Telefon Anlık Senkronize Olur)
db.collection("cihazlar").onSnapshot((snapshot) => {
    cihazlar = [];
    snapshot.forEach((doc) => {
        cihazlar.push({ firebaseId: doc.id, ...doc.data() });
    });
    listeyiGuncelle(cihazlar);
});

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

// Cihaz Kaydetme (Bulut Veritabanına Yazar)
if (cihazFormu) {
    cihazFormu.addEventListener('submit', function(e) {
        e.preventDefault();

        const yeniCihaz = {
            id: Date.now(),
            musteriAdi: document.getElementById('musteri-adi').value,
            telefon: document.getElementById('telefon').value,
            cihazTipi: document.getElementById('cihaz-tipi').value,
            marka: document.getElementById('marka').value,
            model: document.getElementById('model').value,
            seriNo: document.getElementById('seri-no').value,
            ariza: document.getElementById('ariza').value,
            gelisTipi: document.getElementById('gelis-tipi').value,
            kargoFirmasi: document.getElementById('kargo-firmasi').value || '-',
            kargoKodu: document.getElementById('kargo-kodu').value || '-',
            durum: 'Bekliyor',
            girisTarihi: new Date().toLocaleDateString('tr-TR'),
            cikisTarihi: '-'
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

// Durum Güncelleme
function durumDegistir(firebaseId, yeniDurum) {
    db.collection("cihazlar").doc(firebaseId).update({
        durum: yeniDurum,
        cikisTarihi: yeniDurum === 'Tamamlandı' ? new Date().toLocaleDateString('tr-TR') : '-'
    });
}

// Kayıt Silme
function cihazSil(firebaseId) {
    if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
        db.collection("cihazlar").doc(firebaseId).delete();
    }
}
// Arama ve Filtreleme Fonksiyonu
function tablodaAra() {
    const aramaMetni = document.getElementById('tablo-arama').value.toLowerCase();
    const filtrelenmis = cihazlar.filter(c => 
        c.musteriAdi.toLowerCase().includes(aramaMetni) ||
        c.seriNo.toLowerCase().includes(aramaMetni) ||
        c.marka.toLowerCase().includes(aramaMetni)
    );
    listeyiGuncelle(filtrelenmis);
}

// Tabloyu Ekrana Basma Fonksiyonu
function listeyiGuncelle(liste) {
    if (!cihazListesi) return;
    cihazListesi.innerHTML = '';
    
    let bekleyen = 0, islemde = 0, tamamlanan = 0;

    liste.forEach((c) => {
        if (c.durum === 'Bekliyor') bekleyen++;
        if (c.durum === 'İşlemde') islemde++;
        if (c.durum === 'Tamamlandı') tamamlanan++;

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
                <button onclick="cihazSil('${c.firebaseId}')" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;">Sil</button>
            </td>
        `;
        cihazListesi.appendChild(tr);
    });

    // Sayaçları Güncelle
    if (document.getElementById('toplam-sayi')) document.getElementById('toplam-sayi').innerText = liste.length;
    if (document.getElementById('bekleyen-sayi')) document.getElementById('bekleyen-sayi').innerText = bekleyen;
    if (document.getElementById('islemde-sayi')) document.getElementById('islemde-sayi').innerText = islemde;
    if (document.getElementById('tamamlanan-sayi')) document.getElementById('tamamlanan-sayi').innerText = tamamlanan;
}
