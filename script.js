// FIREBASE YAPILANDIRMASI
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// SAYFA TIKLAMA VE GEÇİŞ OLAYLARI (DOM YÜKLENDİKTEN SONRA)
document.addEventListener("DOMContentLoaded", function() {
    
    const btnSorgulaSekme = document.getElementById('btn-sorgula-sekme');
    const btnPanelSekme = document.getElementById('btn-panel-sekme');
    const sorgulamaSayfasi = document.getElementById('sorgulama-sayfasi');
    const panelSayfasi = document.getElementById('panel-sayfasi');

    // Müşteri Sorgulama Sekmesi Tıklama
    if(btnSorgulaSekme) {
        btnSorgulaSekme.addEventListener('click', function() {
            sorgulamaSayfasi.style.display = 'block';
            panelSayfasi.style.display = 'none';
            btnSorgulaSekme.classList.add('active');
            btnPanelSekme.classList.remove('active');
        });
    }

    // Yönetici Paneli Sekmesi Tıklama
    if(btnPanelSekme) {
        btnPanelSekme.addEventListener('click', function() {
            sorgulamaSayfasi.style.display = 'none';
            panelSayfasi.style.display = 'block';
            btnPanelSekme.classList.add('active');
            btnSorgulaSekme.classList.remove('active');
        });
    }

    // Giriş Yap Butonu Tıklama
    const btnGiris = document.getElementById('btn-giris-yap');
    if(btnGiris) {
        btnGiris.addEventListener('click', sistemeGirisYap);
    }

    // Çıkış Yap Butonu Tıklama
    const btnCikis = document.getElementById('btn-cikis-yap');
    if(btnCikis) {
        btnCikis.addEventListener('click', sistemdenCikisYap);
    }

    // Sorgula Butonu Tıklama
    const btnSorguIslem = document.getElementById('btn-sorgula-islem');
    if(btnSorguIslem) {
        btnSorguIslem.addEventListener('click', cihazSorgula);
    }

    // Yeni Kayıt Formu Gönderme
    const kayitFormu = document.getElementById('yeni-kayit-formu');
    if(kayitFormu) {
        kayitFormu.addEventListener('submit', yeniKayitEkle);
    }
});

// YÖNETİCİ GİRİŞİ
function sistemeGirisYap() {
    const email = document.getElementById('giris-kullanici').value.trim();
    const sifre = document.getElementById('giris-sifre').value.trim();

    if (!email || !sifre) {
        alert("Lütfen e-posta ve şifrenizi giriniz.");
        return;
    }

    auth.signInWithEmailAndPassword(email, sifre)
        .then((userCredential) => {
            alert("✅ Giriş Başarılı!");
        })
        .catch((error) => {
            console.error("Firebase Auth Hatası:", error);
            alert("❌ Giriş Yapılamadı!\nHata Kodu: " + error.code + "\nDetay: " + error.message);
        });
}

// OTURUMU KAPATMA
function sistemdenCikisYap() {
    auth.signOut().then(() => {
        alert("Çıkış yapıldı.");
    }).catch((error) => {
        alert("Çıkış hatası: " + error.message);
    });
}

// OTURUM DURUMU KONTROLÜ
auth.onAuthStateChanged((user) => {
    const girisEkrani = document.getElementById('giris-ekrani');
    const panelIcerigi = document.getElementById('panel-icerigi');
    const rolRozet = document.getElementById('aktif-rol-bilgisi');

    if (user) {
        if (girisEkrani) girisEkrani.style.display = "none";
        if (panelIcerigi) panelIcerigi.style.display = "block";
        if (rolRozet) rolRozet.innerText = `Oturum Açık: ${user.email}`;
        servisListesiniYukle();
    } else {
        if (girisEkrani) girisEkrani.style.display = "block";
        if (panelIcerigi) panelIcerigi.style.display = "none";
    }
});

// MÜŞTERİ CİHAZ SORGULAMA
function cihazSorgula() {
    const sorguNo = document.getElementById('sorgu-no').value.trim();
    const sorguSn = document.getElementById('sorgu-sn').value.trim();

    if (!sorguNo || !sorguSn) {
        alert("Lütfen hem Servis Takip Numarasını hem de Seri Numarasını giriniz.");
        return;
    }

    db.collection("servis_kayitlari")
        .where("takipNo", "==", sorguNo)
        .where("seriNo", "==", sorguSn)
        .get()
        .then((querySnapshot) => {
            const sonucKutu = document.getElementById('sorgu-sonuc');
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    document.getElementById('sonuc-musteri').innerText = data.musteri || "-";
                    document.getElementById('sonuc-cihaz').innerText = data.cihaz || "-";
                    document.getElementById('sonuc-sn').innerText = data.seriNo || "-";
                    document.getElementById('sonuc-durum').innerText = data.durum || "-";
                    document.getElementById('sonuc-aciklama').innerText = data.aciklama || "Açıklama girilmemiş.";
                    sonucKutu.style.display = "block";
                });
            } else {
                sonucKutu.style.display = "none";
                alert("Aradığınız kriterlere uygun cihaz kaydı bulunamadı.");
            }
        })
        .catch((error) => {
            console.error("Sorgulama hatası:", error);
            alert("Sorgulama sırasında bir hata oluştu: " + error.message);
        });
}

// YENİ SERVİS KAYDI EKLEME
function yeniKayitEkle(e) {
    e.preventDefault();

    const musteri = document.getElementById('kayit-musteri').value.trim();
    const cihaz = document.getElementById('kayit-cihaz').value.trim();
    const seriNo = document.getElementById('kayit-sn').value.trim();
    const durum = document.getElementById('kayit-durum').value;
    const aciklama = document.getElementById('kayit-aciklama').value.trim();

    const takipNo = "DES-" + Math.floor(1000 + Math.random() * 9000);

    db.collection("servis_kayitlari").add({
        takipNo: takipNo,
        musteri: musteri,
        cihaz: cihaz,
        seriNo: seriNo,
        durum: durum,
        aciklama: aciklama,
        tarih: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("✅ Kayıt Oluşturuldu!\nServis Takip No: " + takipNo);
        document.getElementById('yeni-kayit-formu').reset();
        servisListesiniYukle();
    })
    .catch((error) => {
        alert("Kayıt eklenirken hata oluştu: " + error.message);
    });
}

// SERVİS LİSTESİNİ YÜKLE
function servisListesiniYukle() {
    const listBody = document.getElementById('servis-listesi-body');
    if (!listBody) return;

    db.collection("servis_kayitlari").orderBy("tarih", "desc").get()
        .then((querySnapshot) => {
            listBody.innerHTML = "";
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const row = `
                    <tr>
                        <td><strong>${data.takipNo || '-'}</strong></td>
                        <td>${data.musteri || '-'}</td>
                        <td>${data.cihaz || '-'}</td>
                        <td>${data.seriNo || '-'}</td>
                        <td><span class="durum-rozet">${data.durum || '-'}</span></td>
                        <td>${data.aciklama || '-'}</td>
                        <td>
                            <button class="btn-danger-sm" onclick="kayitSil('${doc.id}')">Sil</button>
                        </td>
                    </tr>
                `;
                listBody.innerHTML += row;
            });
        })
        .catch((error) => {
            console.error("Liste yükleme hatası:", error);
        });
}

// KAYIT SİL
function kayitSil(docId) {
    if (confirm("Bu kayıt silinecek. Onaylıyor musunuz?")) {
        db.collection("servis_kayitlari").doc(docId).delete()
            .then(() => {
                alert("Kayıt başarıyla silindi.");
                servisListesiniYukle();
            })
            .catch((error) => {
                alert("Silme hatası: " + error.message);
            });
    }
}
