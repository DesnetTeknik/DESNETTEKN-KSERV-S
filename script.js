// FIREBASE YAPILANDIRMASI
const firebaseConfig = {
    apiKey: "AIzaSyCjVuS94dkxNlPfp04Eqgty0sj7Xo0qc6s",
    authDomain: "desnetteknik-66527.firebaseapp.com",
    projectId: "desnetteknik-66527",
    storageBucket: "desnetteknik-66527.firebasestorage.app",
    messagingSenderId: "200503339006",
    appId: "1:200503339006:web:0e940ae8a383a802a042af"
};

// Firebase Başlatma
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

let mevcutKullaniciRol = "personel";

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. SEKME GEÇİŞLERİ
    const btnSorgulaSekme = document.getElementById("btn-sorgula-sekme");
    const btnPanelSekme = document.getElementById("btn-panel-sekme");
    const sorgulamaSayfasi = document.getElementById("sorgulama-sayfasi");
    const panelSayfasi = document.getElementById("panel-sayfasi");

    if (btnSorgulaSekme && btnPanelSekme) {
        btnSorgulaSekme.addEventListener("click", (e) => {
            e.preventDefault();
            sorgulamaSayfasi.style.display = "block";
            panelSayfasi.style.display = "none";
            btnSorgulaSekme.classList.add("active");
            btnPanelSekme.classList.remove("active");
        });

        btnPanelSekme.addEventListener("click", (e) => {
            e.preventDefault();
            sorgulamaSayfasi.style.display = "none";
            panelSayfasi.style.display = "block";
            btnPanelSekme.classList.add("active");
            btnSorgulaSekme.classList.remove("active");
        });
    }

    // 2. GİRİŞ YAP BUTONU
    const btnGiris = document.getElementById("btn-giris-yap");
    if (btnGiris) {
        btnGiris.addEventListener("click", (e) => {
            e.preventDefault();
            const email = document.getElementById("giris-kullanici").value.trim();
            const sifre = document.getElementById("giris-sifre").value.trim();

            if (!email || !sifre) {
                alert("Lütfen e-posta ve şifrenizi giriniz.");
                return;
            }

            auth.signInWithEmailAndPassword(email, sifre)
                .then(() => {
                    alert("✅ Giriş Başarılı!");
                })
                .catch((error) => {
                    alert("❌ Giriş Yapılamadı:\n" + error.message);
                });
        });
    }

    // 3. ÇIKIŞ YAP BUTONU
    const btnCikis = document.getElementById("btn-cikis-yap");
    if (btnCikis) {
        btnCikis.addEventListener("click", (e) => {
            e.preventDefault();
            auth.signOut();
        });
    }

    // 4. MÜŞTERİ SORGULAMA
    const btnSorgula = document.getElementById("btn-sorgula");
    if (btnSorgula) {
        btnSorgula.addEventListener("click", (e) => {
            e.preventDefault();
            sorgulaCihaz();
        });
    }

    // 5. YENİ CİHAZ KAYDET
    const btnCihazEkle = document.getElementById("btn-cihaz-ekle");
    if (btnCihazEkle) {
        btnCihazEkle.addEventListener("click", (e) => {
            e.preventDefault();
            yeniCihazEkle();
        });
    }
});

// OTURUM & YETKİLENDİRME DURUMU
auth.onAuthStateChanged((user) => {
    const girisEkrani = document.getElementById("giris-ekrani");
    const panelIcerigi = document.getElementById("panel-icerigi");
    const rolRozet = document.getElementById("aktif-rol-bilgisi");

    if (user) {
        if (girisEkrani) girisEkrani.style.display = "none";
        if (panelIcerigi) panelIcerigi.style.display = "block";
        
        if (user.email === "admin@desnet.com" || user.email.includes("admin")) {
            mevcutKullaniciRol = "admin";
        } else {
            mevcutKullaniciRol = "personel";
        }

        if (rolRozet) {
            rolRozet.innerText = `Oturum Açık: ${user.email} (${mevcutKullaniciRol.toUpperCase()})`;
        }

        cihazlariGetir();
    } else {
        if (girisEkrani) girisEkrani.style.display = "block";
        if (panelIcerigi) panelIcerigi.style.display = "none";
    }
});

// CİHAZLARI LİSTELEME
function cihazlariGetir() {
    const tabloBody = document.getElementById("cihaz-tablo-body");
    if (!tabloBody) return;

    db.collection("cihazlar").orderBy("tarih", "desc").onSnapshot((snapshot) => {
        tabloBody.innerHTML = "";

        snapshot.forEach((doc) => {
            const data = doc.data();
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><b>${data.takipNo || doc.id}</b></td>
                <td>${data.musteri || '-'}</td>
                <td>${data.cihaz || '-'}</td>
                <td>${data.seriNo || '-'}</td>
                <td><span class="badge ${getDurumClass(data.durum)}">${data.durum}</span></td>
                <td>${data.aciklama || '-'}</td>
                <td>
                    <button type="button" class="btn-print" onclick="cihazYazdir('${doc.id}')">🖨️ Fiş</button>
                    ${mevcutKullaniciRol === "admin" ? `<button type="button" class="btn-sil" onclick="cihazSil('${doc.id}')">🗑️ Sil</button>` : ''}
                </td>
            `;
            tabloBody.appendChild(tr);
        });
    }, (err) => {
        console.error("Veri çekme hatası:", err);
    });
}

// CİHAZ KAYDETME
function yeniCihazEkle() {
    const musteri = document.getElementById("yeni-musteri").value.trim();
    const cihaz = document.getElementById("yeni-cihaz").value.trim();
    const seriNo = document.getElementById("yeni-seri").value.trim();
    const durum = document.getElementById("yeni-durum").value;
    const aciklama = document.getElementById("yeni-aciklama").value.trim();

    if (!musteri || !cihaz) {
        alert("Lütfen Müşteri ve Cihaz bilgilerini doldurun.");
        return;
    }

    const takipNo = "DES-" + Math.floor(1000 + Math.random() * 9000);

    db.collection("cihazlar").add({
        takipNo: takipNo,
        musteri: musteri,
        cihaz: cihaz,
        seriNo: seriNo,
        durum: durum,
        aciklama: aciklama,
        tarih: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("✅ Cihaz Başarıyla Kaydedildi!\nTakip No: " + takipNo);
        document.getElementById("yeni-musteri").value = "";
        document.getElementById("yeni-cihaz").value = "";
        document.getElementById("yeni-seri").value = "";
        document.getElementById("yeni-aciklama").value = "";
    }).catch((err) => {
        alert("❌ Kayıt Hatası: " + err.message);
    });
}

// SERVİS FİŞİ YAZDIRMA
function cihazYazdir(id) {
    db.collection("cihazlar").doc(id).get().then((doc) => {
        if (!doc.exists) return;
        const data = doc.data();
        
        const yazdirPenceresi = window.open('', '_blank', 'width=600,height=600');
        yazdirPenceresi.document.write(`
            <html>
            <head>
                <title>Servis Fişi - ${data.takipNo}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .info { margin-top: 20px; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>DESNET TEKNİK SERVİS FİŞİ</h2>
                    <p>Takip No: <strong>${data.takipNo}</strong></p>
                </div>
                <div class="info">
                    <p><strong>Müşteri:</strong> ${data.musteri}</p>
                    <p><strong>Cihaz Model:</strong> ${data.cihaz}</p>
                    <p><strong>Seri No:</strong> ${data.seriNo}</p>
                    <p><strong>Durum:</strong> ${data.durum}</p>
                    <p><strong>Açıklama / Arıza:</strong> ${data.aciklama}</p>
                </div>
                <div class="footer">
                    <p>Cihaz tesliminde bu fişin ibraz edilmesi zorunludur.</p>
                </div>
            </body>
            </html>
        `);
        yazdirPenceresi.document.close();
        yazdirPenceresi.focus();
        setTimeout(() => { yazdirPenceresi.print(); }, 500);
    });
}

// CİHAZ SİLME
function cihazSil(id) {
    if (mevcutKullaniciRol !== "admin") {
        alert("⛔ Bu işlem için Admin yetkisi gerekiyor!");
        return;
    }

    if (confirm("Bu cihaz kaydını silmek istediğinize emin misiniz?")) {
        db.collection("cihazlar").doc(id).delete()
            .then(() => alert("Kayıt silindi."))
            .catch((err) => alert("Silme hatası: " + err.message));
    }
}

// MÜŞTERİ SORGULAMA
function sorgulaCihaz() {
    const kod = document.getElementById("sorgu-kod").value.trim();
    const sonucAlan = document.getElementById("sorgu-sonuc");

    if (!kod) {
        alert("Lütfen bir takip numarası giriniz.");
        return;
    }

    db.collection("cihazlar").where("takipNo", "==", kod).get().then((querySnapshot) => {
        if (querySnapshot.empty) {
            sonucAlan.innerHTML = `<p style="color:red; font-weight:bold;">Kayıt bulunamadı. Lütfen numarayı kontrol edin.</p>`;
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                sonucAlan.innerHTML = `
                    <div style="border:1px solid #0056b3; padding:15px; border-radius:8px; background:#f4f8ff;">
                        <h3 style="margin-top:0;">Cihaz Durumu: <span style="color:#2196F3;">${data.durum}</span></h3>
                        <p><strong>Müşteri:</strong> ${data.musteri}</p>
                        <p><strong>Cihaz:</strong> ${data.cihaz}</p>
                        <p><strong>Seri No:</strong> ${data.seriNo}</p>
                        <p><strong>Açıklama:</strong> ${data.aciklama}</p>
                    </div>
                `;
            });
        }
    });
}

function getDurumClass(durum) {
    if (durum === "Tamamlandı" || durum === "Teslim Edildi") return "badge-success";
    if (durum === "İşlemde" || durum === "Parça Bekliyor") return "badge-warning";
    return "badge-danger";
}
