// FIREBASE YAPILANDIRMASI
const firebaseConfig = {
    apiKey: "AIzaSyCjVuS94dkxNlPfp04Eqgty0sj7Xo0qc6s",
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

let mevcutKullaniciRol = "personel";

document.addEventListener("DOMContentLoaded", () => {
    
    // NAVIGATION SEKMELERİ
    const btnSorgula = document.getElementById("btn-sorgula-sekme");
    const btnPanel = document.getElementById("btn-panel-sekme");
    const btnKargo = document.getElementById("btn-kargo-sekme");
    const btnStok = document.getElementById("btn-stok-sekme");
    const btnYetki = document.getElementById("btn-yetki-sekme");

    const sorguSayfasi = document.getElementById("sorgulama-sayfasi");
    const panelSayfasi = document.getElementById("panel-sayfasi");

    const sekmeServis = document.getElementById("sekme-servis-icerik");
    const sekmeKargo = document.getElementById("sekme-kargo-icerik");
    const sekmeStok = document.getElementById("sekme-stok-icerik");
    const sekmeYetki = document.getElementById("sekme-yetki-icerik");

    function sekmeleriSifirla() {
        btnSorgula.classList.remove("active");
        btnPanel.classList.remove("active");
        btnKargo.classList.remove("active");
        btnStok.classList.remove("active");
        btnYetki.classList.remove("active");
    }

    btnSorgula.addEventListener("click", () => {
        sekmeleriSifirla();
        btnSorgula.classList.add("active");
        sorguSayfasi.style.display = "block";
        panelSayfasi.style.display = "none";
    });

    btnPanel.addEventListener("click", () => {
        sekmeleriSifirla();
        btnPanel.classList.add("active");
        sorguSayfasi.style.display = "none";
        panelSayfasi.style.display = "block";
        sekmeServis.style.display = "block";
        sekmeKargo.style.display = "none";
        sekmeStok.style.display = "none";
        sekmeYetki.style.display = "none";
    });

    btnKargo.addEventListener("click", () => {
        sekmeleriSifirla();
        btnKargo.classList.add("active");
        sorguSayfasi.style.display = "none";
        panelSayfasi.style.display = "block";
        sekmeServis.style.display = "none";
        sekmeKargo.style.display = "block";
        sekmeStok.style.display = "none";
        sekmeYetki.style.display = "none";
        kargolariGetir();
    });

    btnStok.addEventListener("click", () => {
        sekmeleriSifirla();
        btnStok.classList.add("active");
        sorguSayfasi.style.display = "none";
        panelSayfasi.style.display = "block";
        sekmeServis.style.display = "none";
        sekmeKargo.style.display = "none";
        sekmeStok.style.display = "block";
        sekmeYetki.style.display = "none";
        stoklariGetir();
    });

    btnYetki.addEventListener("click", () => {
        sekmeleriSifirla();
        btnYetki.classList.add("active");
        sorguSayfasi.style.display = "none";
        panelSayfasi.style.display = "block";
        sekmeServis.style.display = "none";
        sekmeKargo.style.display = "none";
        sekmeStok.style.display = "none";
        sekmeYetki.style.display = "block";
        yetkileriGetir();
    });

    // BUTON TETİKLEYİCİLERİ
    document.getElementById("btn-giris-yap")?.addEventListener("click", girisYap);
    document.getElementById("btn-cikis-yap")?.addEventListener("click", () => auth.signOut());
    document.getElementById("btn-cihaz-ekle")?.addEventListener("click", yeniCihazEkle);
    document.getElementById("btn-kargo-ekle")?.addEventListener("click", yeniKargoEkle);
    document.getElementById("btn-stok-ekle")?.addEventListener("click", yeniStokEkle);
    document.getElementById("btn-yetki-kaydet")?.addEventListener("click", yetkiGuncelle);
    document.getElementById("btn-sorgula")?.addEventListener("click", sorgulaCihaz);
});

// GİRİŞ İŞLEMİ
function girisYap() {
    const email = document.getElementById("giris-kullanici").value.trim();
    const sifre = document.getElementById("giris-sifre").value.trim();
    if (!email || !sifre) return alert("E-posta ve şifrenizi giriniz.");

    auth.signInWithEmailAndPassword(email, sifre)
        .then(() => alert("Giriş Başarılı!"))
        .catch(err => alert("Giriş Hatası: " + err.message));
}

// OTURUM DİNLEYİCİSİ VE ROL KONTROLÜ
auth.onAuthStateChanged((user) => {
    const girisEkrani = document.getElementById("giris-ekrani");
    const panelIcerigi = document.getElementById("panel-icerigi");
    const rolRozet = document.getElementById("aktif-rol-bilgisi");
    
    const oturumSartliSekmeler = document.querySelectorAll(".oturum-sartli");
    const adminSartliSekmeler = document.querySelectorAll(".admin-sartli");

    if (user) {
        if (girisEkrani) girisEkrani.style.display = "none";
        if (panelIcerigi) panelIcerigi.style.display = "block";

        oturumSartliSekmeler.forEach(el => el.style.display = "inline-block");

        db.collection("kullanicilar").doc(user.email).get().then((doc) => {
            if (doc.exists && doc.data().rol) {
                mevcutKullaniciRol = doc.data().rol;
            } else if (user.email === "admin@desnet.com" || user.email === "muhammed@desnet.com") {
                mevcutKullaniciRol = "admin";
            } else {
                mevcutKullaniciRol = "personel";
            }

            if (rolRozet) rolRozet.innerText = `Oturum Açık: ${user.email} (${mevcutKullaniciRol.toUpperCase()})`;

            if (mevcutKullaniciRol === "admin") {
                adminSartliSekmeler.forEach(el => el.style.display = "inline-block");
            } else {
                adminSartliSekmeler.forEach(el => el.style.display = "none");
            }

            cihazlariGetir();
        });

    } else {
        if (girisEkrani) girisEkrani.style.display = "block";
        if (panelIcerigi) panelIcerigi.style.display = "none";

        oturumSartliSekmeler.forEach(el => el.style.display = "none");
        adminSartliSekmeler.forEach(el => el.style.display = "none");
    }
});

// YETKİ GÜNCELLEME
function yetkiGuncelle() {
    const email = document.getElementById("yetki-email").value.trim();
    const rol = document.getElementById("yetki-rol").value;

    if (!email) return alert("Lütfen kullanıcı e-postasını girin.");

    db.collection("kullanicilar").doc(email).set({
        email: email,
        rol: rol,
        guncellemeTarihi: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert(`✅ ${email} adresi için yetki (${rol.toUpperCase()}) olarak güncellendi!`);
        document.getElementById("yetki-email").value = "";
    }).catch(err => alert("Yetki güncelleme hatası: " + err.message));
}

function yetkileriGetir() {
    const tabloBody = document.getElementById("yetki-tablo-body");
    db.collection("kullanicilar").onSnapshot((snapshot) => {
        tabloBody.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><b>${data.email}</b></td>
                <td><span class="badge ${data.rol === 'admin' ? 'badge-danger' : 'badge-success'}">${data.rol.toUpperCase()}</span></td>
                <td>
                    <button type="button" class="btn-sil" onclick="yetkiSil('${doc.id}')">Yetkiyi Kaldır</button>
                </td>
            `;
            tabloBody.appendChild(tr);
        });
    });
}

function yetkiSil(email) {
    if (confirm(`${email} kullanıcısının tanımlı yetkisini kaldırmak istiyor musunuz?`)) {
        db.collection("kullanicilar").doc(email).delete();
    }
}

// CİHAZ İŞLEMLERİ
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
                    <button type="button" class="btn-print" onclick="cihazEtiketYazdir('${doc.id}')">Etiket Bas</button>
                    ${mevcutKullaniciRol === "admin" ? `<button type="button" class="btn-sil" onclick="cihazSil('${doc.id}')">Sil</button>` : ''}
                </td>
            `;
            tabloBody.appendChild(tr);
        });
    });
}

function yeniCihazEkle() {
    const musteri = document.getElementById("yeni-musteri").value.trim();
    const cihaz = document.getElementById("yeni-cihaz").value.trim();
    const seriNo = document.getElementById("yeni-seri").value.trim();
    const durum = document.getElementById("yeni-durum").value;
    const aciklama = document.getElementById("yeni-aciklama").value.trim();

    if (!musteri || !cihaz) return alert("Müşteri ve Cihaz bilgilerini giriniz.");

    const takipNo = "DES-" + Math.floor(1000 + Math.random() * 9000);

    db.collection("cihazlar").add({
        takipNo, musteri, cihaz, seriNo, durum, aciklama,
        tarih: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Cihaz eklendi: " + takipNo);
        document.getElementById("yeni-musteri").value = "";
        document.getElementById("yeni-cihaz").value = "";
        document.getElementById("yeni-seri").value = "";
        document.getElementById("yeni-aciklama").value = "";
    });
}

// 50x30mm ETİKET YAZDIRMA VE QR KOD OLUŞTURMA
function cihazEtiketYazdir(id) {
    db.collection("cihazlar").doc(id).get().then((doc) => {
        if (!doc.exists) return;
        const data = doc.data();

        // 1. Verileri Doldur
        document.getElementById("printServisNo").innerText = data.takipNo || "DES-0000";
        document.getElementById("printMusteriAd").innerText = data.musteri || "-";
        document.getElementById("printCihazModel").innerText = data.cihaz || "-";
        document.getElementById("printSeriNo").innerText = data.seriNo || "-";
        document.getElementById("printAriza").innerText = data.aciklama || "-";

        const tarihObj = data.tarih ? data.tarih.toDate() : new Date();
        document.getElementById("printTarih").innerText = tarihObj.toLocaleDateString("tr-TR");

        // 2. QR Kodu Hazırla
        const qrContainer = document.getElementById("qrcode");
        qrContainer.innerHTML = "";

        const qrMetni = `https://desnetteknik-66527.web.app/?sorgu=${data.takipNo}`;

        new QRCode(qrContainer, {
            text: qrMetni,
            width: 128,
            height: 128,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });

        // 3. Çizim için bekleyip yazdır
        setTimeout(() => {
            window.print();
        }, 250);
    });
}

// KARGO İŞLEMLERİ
function yeniKargoEkle() {
    const firma = document.getElementById("kargo-firma").value.trim();
    const takipNo = document.getElementById("kargo-takip-no").value.trim();
    const gonderen = document.getElementById("kargo-gonderen").value.trim();
    const tip = document.getElementById("kargo-tipi").value;

    if (!firma || !takipNo) return alert("Kargo firması ve Takip numarasını giriniz.");

    db.collection("kargolar").add({
        firma, takipNo, gonderen, tip,
        tarih: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Kargo kaydı eklendi!");
        document.getElementById("kargo-firma").value = "";
        document.getElementById("kargo-takip-no").value = "";
        document.getElementById("kargo-gonderen").value = "";
    });
}

function kargolariGetir() {
    const tabloBody = document.getElementById("kargo-tablo-body");
    db.collection("kargolar").orderBy("tarih", "desc").onSnapshot((snapshot) => {
        tabloBody.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><span class="badge ${data.tip === 'Gelen Kargo' ? 'badge-warning' : 'badge-success'}">${data.tip}</span></td>
                <td>${data.firma}</td>
                <td><b>${data.takipNo}</b></td>
                <td>${data.gonderen || '-'}</td>
                <td>${data.tarih ? new Date(data.tarih.toDate()).toLocaleDateString("tr-TR") : '-'}</td>
            `;
            tabloBody.appendChild(tr);
        });
    });
}

// STOK İŞLEMLERİ
function yeniStokEkle() {
    const ad = document.getElementById("stok-ad").value.trim();
    const kod = document.getElementById("stok-kod").value.trim();
    const adet = parseInt(document.getElementById("stok-adet").value) || 0;
    const raf = document.getElementById("stok-raf").value.trim();

    if (!ad || !kod) return alert("Ürün adı ve Stok kodunu giriniz.");

    db.collection("stoklar").add({
        ad, kod, adet, raf,
        tarih: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Stok parçası eklendi!");
        document.getElementById("stok-ad").value = "";
        document.getElementById("stok-kod").value = "";
        document.getElementById("stok-adet").value = "";
        document.getElementById("stok-raf").value = "";
    });
}

function stoklariGetir() {
    const tabloBody = document.getElementById("stok-tablo-body");
    db.collection("stoklar").orderBy("tarih", "desc").onSnapshot((snapshot) => {
        tabloBody.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><b>${data.kod}</b></td>
                <td>${data.ad}</td>
                <td><span class="badge ${data.adet > 0 ? 'badge-success' : 'badge-danger'}">${data.adet} Adet</span></td>
                <td>${data.raf || '-'}</td>
                <td>
                    ${mevcutKullaniciRol === "admin" ? `<button type="button" class="btn-sil" onclick="stokSil('${doc.id}')">Sil</button>` : ''}
                </td>
            `;
            tabloBody.appendChild(tr);
        });
    });
}

function stokSil(id) {
    if (confirm("Bu stok kaydını silmek istediğinize emin misiniz?")) {
        db.collection("stoklar").doc(id).delete();
    }
}

function cihazSil(id) {
    if (confirm("Silmek istediğinize emin misiniz?")) {
        db.collection("cihazlar").doc(id).delete();
    }
}

function sorgulaCihaz() {
    const kod = document.getElementById("sorgu-kod").value.trim();
    const sonucAlan = document.getElementById("sorgu-sonuc");
    if (!kod) return alert("Takip nosu giriniz.");

    db.collection("cihazlar").where("takipNo", "==", kod).get().then((snap) => {
        if (snap.empty) {
            sonucAlan.innerHTML = `<p style="color:red; font-weight:bold;">Kayıt bulunamadı.</p>`;
        } else {
            snap.forEach((doc) => {
                const d = doc.data();
                sonucAlan.innerHTML = `
                    <div style="border:1px solid #0284c7; padding:15px; border-radius:8px; background:#f0f9ff;">
                        <h3>Cihaz Durumu: ${d.durum}</h3>
                        <p><strong>Müşteri:</strong> ${d.musteri}</p>
                        <p><strong>Cihaz:</strong> ${d.cihaz}</p>
                        <p><strong>Seri No:</strong> ${d.seriNo}</p>
                        <p><strong>Açıklama:</strong> ${d.aciklama}</p>
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
