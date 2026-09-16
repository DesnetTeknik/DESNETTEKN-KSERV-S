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
    
    // SEKME YÖNETİMİ
    const btnPanel = document.getElementById("btn-panel-sekme");
    const btnKargo = document.getElementById("btn-kargo-sekme");
    const btnStok = document.getElementById("btn-stok-sekme");
    const btnSorgula = document.getElementById("btn-sorgula-sekme");

    const sorguSayfasi = document.getElementById("sorgulama-sayfasi");
    const panelSayfasi = document.getElementById("panel-sayfasi");

    const sekmeServis = document.getElementById("sekme-servis-icerik");
    const sekmeKargo = document.getElementById("sekme-kargo-icerik");
    const sekmeStok = document.getElementById("sekme-stok-icerik");

    function sekmeleriSifirla() {
        btnPanel.classList.remove("active");
        btnKargo.classList.remove("active");
        btnStok.classList.remove("active");
        btnSorgula.classList.remove("active");
    }

    btnPanel.addEventListener("click", () => {
        sekmeleriSifirla();
        btnPanel.classList.add("active");
        sorguSayfasi.style.display = "none";
        panelSayfasi.style.display = "block";
        sekmeServis.style.display = "block";
        sekmeKargo.style.display = "none";
        sekmeStok.style.display = "none";
    });

    btnKargo.addEventListener("click", () => {
        sekmeleriSifirla();
        btnKargo.classList.add("active");
        sorguSayfasi.style.display = "none";
        panelSayfasi.style.display = "block";
        sekmeServis.style.display = "none";
        sekmeKargo.style.display = "block";
        sekmeStok.style.display = "none";
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
        stoklariGetir();
    });

    btnSorgula.addEventListener("click", () => {
        sekmeleriSifirla();
        btnSorgula.classList.add("active");
        sorguSayfasi.style.display = "block";
        panelSayfasi.style.display = "none";
    });

    // BUTON KONTROLLERİ
    document.getElementById("btn-giris-yap")?.addEventListener("click", girisYap);
    document.getElementById("btn-cikis-yap")?.addEventListener("click", () => auth.signOut());
    document.getElementById("btn-cihaz-ekle")?.addEventListener("click", yeniCihazEkle);
    document.getElementById("btn-kargo-ekle")?.addEventListener("click", yeniKargoEkle);
    document.getElementById("btn-stok-ekle")?.addEventListener("click", yeniStokEkle);
    document.getElementById("btn-sorgula")?.addEventListener("click", sorgulaCihaz);
});

// GİRİŞ YAP
function girisYap() {
    const email = document.getElementById("giris-kullanici").value.trim();
    const sifre = document.getElementById("giris-sifre").value.trim();
    if (!email || !sifre) return alert("E-posta ve şifre giriniz.");

    auth.signInWithEmailAndPassword(email, sifre)
        .then(() => alert("Giriş Başarılı!"))
        .catch(err => alert("Hata: " + err.message));
}

// OTURUM DURUMU
auth.onAuthStateChanged((user) => {
    const girisEkrani = document.getElementById("giris-ekrani");
    const panelIcerigi = document.getElementById("panel-icerigi");
    const rolRozet = document.getElementById("aktif-rol-bilgisi");

    if (user) {
        if (girisEkrani) girisEkrani.style.display = "none";
        if (panelIcerigi) panelIcerigi.style.display = "block";
        
        mevcutKullaniciRol = (user.email === "admin@desnet.com" || user.email.includes("admin")) ? "admin" : "personel";
        if (rolRozet) rolRozet.innerText = `Oturum Açık: ${user.email} (${mevcutKullaniciRol.toUpperCase()})`;

        cihazlariGetir();
    } else {
        if (girisEkrani) girisEkrani.style.display = "block";
        if (panelIcerigi) panelIcerigi.style.display = "none";
    }
});

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
                    <button type="button" class="btn-print" onclick="cihazYazdir('${doc.id}')">Fiş</button>
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

function cihazYazdir(id) {
    db.collection("cihazlar").doc(id).get().then((doc) => {
        if (!doc.exists) return;
        const data = doc.data();
        const win = window.open('', '_blank', 'width=600,height=600');
        win.document.write(`
            <html>
            <head><title>Servis Fişi - ${data.takipNo}</title></head>
            <body style="font-family: sans-serif; padding:20px;">
                <h2>DESNET TEKNİK SERVİS FİŞİ</h2>
                <hr>
                <p><strong>Takip No:</strong> ${data.takipNo}</p>
                <p><strong>Müşteri:</strong> ${data.musteri}</p>
                <p><strong>Cihaz:</strong> ${data.cihaz}</p>
                <p><strong>Seri No:</strong> ${data.seriNo}</p>
                <p><strong>Durum:</strong> ${data.durum}</p>
                <p><strong>Açıklama:</strong> ${data.aciklama}</p>
            </body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    });
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
