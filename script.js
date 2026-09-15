// FIREBASE YAPILANDIRMASI
const firebaseConfig = {
    apiKey: "AIzaSyCjVuS94dkxNLPfp04Eqgty0sj7Xo0qc6s",
    authDomain: "desnetteknik-66527.firebaseapp.com",
    projectId: "desnetteknik-66527",
    storageBucket: "desnetteknik-66527.firebasestorage.app",
    messagingSenderId: "200503339006",
    appId: "1:200503339006:web:0e940ae8a383a802a042af"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

let mevcutKullaniciRol = "personel"; // Varsayılan rol

document.addEventListener("DOMContentLoaded", () => {
    // 1. SEKME GEÇİŞLERİ
    const btnSorgulaSekme = document.getElementById("btn-sorgula-sekme");
    const btnPanelSekme = document.getElementById("btn-panel-sekme");
    const sorgulamaSayfasi = document.getElementById("sorgulama-sayfasi");
    const panelSayfasi = document.getElementById("panel-sayfasi");

    if (btnSorgulaSekme && btnPanelSekme) {
        btnSorgulaSekme.addEventListener("click", () => {
            sorgulamaSayfasi.style.display = "block";
            panelSayfasi.style.display = "none";
            btnSorgulaSekme.classList.add("active");
            btnPanelSekme.classList.remove("active");
        });

        btnPanelSekme.addEventListener("click", () => {
            sorgulamaSayfasi.style.display = "none";
            panelSayfasi.style.display = "block";
            btnPanelSekme.classList.add("active");
            btnSorgulaSekme.classList.remove("active");
        });
    }

    // 2. OTURUM VE GİRİŞ İŞLEMLERİ
    const btnGiris = document.getElementById("btn-giris-yap");
    if (btnGiris) {
        btnGiris.addEventListener("click", () => {
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
                    alert("❌ Giriş Yapılamadı: " + error.message);
                });
        });
    }

    const btnCikis = document.getElementById("btn-cikis-yap");
    if (btnCikis) {
        btnCikis.addEventListener("click", () => auth.signOut());
    }

    // 3. MÜŞTERİ SORGULAMA İŞLEMİ
    const btnSorgula = document.getElementById("btn-sorgula");
    if (btnSorgula) {
        btnSorgula.addEventListener("click", sorgulaCihaz);
    }

    // 4. YENİ CİHAZ EKLEME (PANEL)
    const btnCihazEkle = document.getElementById("btn-cihaz-ekle");
    if (btnCihazEkle) {
        btnCihazEkle.addEventListener("click", yeniCihazEkle);
    }
});

// OTURUM DURUMU & YETKİLENDİRME TAKİBİ
auth.onAuthStateChanged((user) => {
    const girisEkrani = document.getElementById("giris-ekrani");
    const panelIcerigi = document.getElementById("panel-icerigi");
    const rolRozet = document.getElementById("aktif-rol-bilgisi");

    if (user) {
        if (girisEkrani) girisEkrani.style.display = "none";
        if (panelIcerigi) panelIcerigi.style.display = "block";
        
        // E-posta kontrolü ile Rol Belirleme (Yetki Sistemi)
        if (user.email === "admin@desnet.com" || user.email.includes("admin")) {
            mevcutKullaniciRol = "admin";
        } else {
            mevcutKullaniciRol = "personel";
        }

        if (rolRozet) {
            rolRozet.innerText = `Oturum: ${user.email} (${mevcutKullaniciRol.toUpperCase()})`;
        }

        // Verileri Yükle
        cihazlariGetir();
    } else {
        if (girisEkrani) girisEkrani.style.display = "block";
        if (panelIcerigi) panelIcerigi.style.display = "none";
    }
});

// CİHAZLARI GETİR VE TABLOYU DOLDUR
function cihazlariGetir() {
    const tabloBody = document.getElementById("cihaz-tablo-body");
    if (!tabloBody) return;

    db.collection("cihazlar").orderBy("tarih", "desc").onSnapshot((snapshot) => {
        tabloBody.innerHTML = "";
        let toplam = 0, serviste = 0, teslim = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            toplam++;
            if (data.durum === "Teslim Edildi") teslim++; else serviste++;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><b>${data.takipNo || doc.id}</b></td>
                <td>${data.musteri || '-'}</td>
                <td>${data.cihaz || '-'}</td>
                <td>${data.seriNo || '-'}</td>
                <td><span class="badge ${getDurumClass(data.durum)}">${data.durum}</span></td>
                <td>${data.aciklama || '-'}</td>
                <td>
                    <button class="btn-print" onclick="cihazYazdir('${doc.id}')">🖨️ Fiş</button>
                    ${mevcutKullaniciRol === "admin" ? `<button class="btn-sil" onclick="cihazSil('${doc.id}')">🗑️ Sil</button>` : ''}
                </td>
            `;
            tabloBody.appendChild(tr);
        });

        // İstatistik Alanlarını Güncelle (Varsa)
        if (document.getElementById("toplam-cihaz")) document.getElementById("toplam-cihaz").innerText = toplam;
        if (document.getElementById("servisteki-cihaz")) document.getElementById("servisteki-cihaz").innerText = serviste;
        if (document.getElementById("teslim-cihaz")) document.getElementById("teslim-cihaz").innerText = teslim;
    });
}

// CİHAZ YAZDIRMA (SERVİS FİŞİ)
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

// YENİ CİHAZ EKLEME
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
        alert("✅ Cihaz Kaydedildi! Takip No: " + takipNo);
        document.getElementById("yeni-musteri").value = "";
        document.getElementById("yeni-cihaz").value = "";
        document.getElementById("yeni-seri").value = "";
        document.getElementById("yeni-aciklama").value = "";
    }).catch((err) => {
        alert("Hata: " + err.message);
    });
}

// CİHAZ SİLME (Sadece Admin)
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

// MÜŞTERİ SORGULAMA KODU
function sorgulaCihaz() {
    const kod = document.getElementById("sorgu-kod").value.trim();
    const sonucAlan = document.getElementById("sorgu-sonuc");

    if (!kod) {
        alert("Lütfen bir takip numarası giriniz.");
        return;
    }

    db.collection("cihazlar").where("takipNo", "==", kod).get().then((querySnapshot) => {
        if (querySnapshot.empty) {
            sonucAlan.innerHTML = `<p style="color:red;">Kayıt bulunamadı. Lütfen numarayı kontrol edin.</p>`;
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                sonucAlan.innerHTML = `
                    <div style="border:1px solid #ccc; padding:15px; border-radius:8px; background:#f9f9f9;">
                        <h3>Cihaz Durumu: <span style="color:#2196F3;">${data.durum}</span></h3>
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
