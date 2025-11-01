(function() {
  
  // =============================================
  // == DATA POIN CHIEF CHARMS (BERDASARKAN GAMBAR) ==
  // =============================================
  const CHARM_POINTS = {
    1: 625,    //
    2: 1250,   //
    3: 3125,   //
    4: 8750,   //
    5: 11250,  //
    6: 12500,  //
    7: 12500,  //
    8: 13000,  //
    9: 14000,  //
    10: 15000, //
    11: 16000  //
  };
  // =============================================

  // =============================================
  // == DATA POIN TROOPS (BERDASARKAN GAMBAR) ==
  // =============================================
  const TROOP_POINTS = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 6,
    6: 9,
    7: 12,
    8: 17,
    9: 22,
    10: 30,
    11: 37
  };
  // =============================================


  // --- Ambil Elemen DOM ---
  const staticRows = [...document.querySelectorAll('#calcTable tr')]
    .filter(r => r.querySelector('[data-point]')); // Baris statis (shard, training)
  const totalDisplay = document.getElementById('grandTotal');
  const resetBtn = document.getElementById('resetBtn');
  const allInputs = document.querySelectorAll('.amountInput:not(.promoAmount)'); // Input statis + charm (akan terisi nanti)
  const promoFrom = document.querySelector('.fromLvl');
  const promoTo = document.querySelector('.toLvl');
  const themeToggle = document.getElementById('themeToggle');
  
  // Elemen baru untuk Charm
  const addCharmBtn = document.getElementById('addCharmRow');
  const removeCharmBtn = document.getElementById('removeCharmRow');
  const charmControlsRow = document.getElementById('charmControls');
  let charmRowCount = 0;
  const MAX_CHARM_ROWS = 18;

  // --- Fungsi bantu ---
  const num = v => Number(String(v).replace(/\./g, '')) || 0;
  const format = v => v.toLocaleString();

  // === Fungsi untuk Membuat Baris Charm Baru ===
  function createCharmRow(level = 1, amount = 0) {
    if (charmRowCount >= MAX_CHARM_ROWS) return;

    const tr = document.createElement('tr');
    tr.className = 'charm-row'; // Kelas untuk identifikasi

    // 1. Kolom "Item" (Dropdown Level)
    const itemCell = document.createElement('td');
    const levelSelect = document.createElement('select');
    levelSelect.className = 'charm-level-select';
    for (let i = 1; i <= 11; i++) {
      levelSelect.options.add(new Option(`Level ${i}`, i));
    }
    levelSelect.value = level;
    itemCell.appendChild(levelSelect);

    // 2. Kolom "Point" (Tampilan Poin)
    const pointCell = document.createElement('td');
    pointCell.className = 'charmPointCell';
    pointCell.dataset.point = ''; // Tanda pengenal

    // 3. Kolom "Amount" (Input Jumlah)
    const amountCell = document.createElement('td');
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.min = '0';
    amountInput.value = amount;
    amountInput.className = 'amountInput charmAmountInput'; // Kelas ganda
    amountCell.appendChild(amountInput);

    // 4. Kolom "Total" (Tampilan Total)
    const totalCell = document.createElement('td');
    totalCell.className = 'totalCell';

    // Tambahkan semua sel ke baris
    tr.appendChild(itemCell);
    tr.appendChild(pointCell);
    tr.appendChild(amountCell);
    tr.appendChild(totalCell);

    // Tambahkan event listener agar kalkulasi berjalan
    levelSelect.addEventListener('change', updateTotals);
    amountInput.addEventListener('input', updateTotals);

    // Masukkan baris baru ke tabel, tepat sebelum tombol +/-
    charmControlsRow.before(tr);
    charmRowCount++;
  }

  // === Hitung selisih POIN promo (LOGIKA BARU) ===
  function getPromoPointDiff() {
    const fromLevel = num(promoFrom.value);
    const toLevel = num(promoTo.value);
    
    // Ambil poin dari data TROOP_POINTS
    const fromPoints = TROOP_POINTS[fromLevel] || 0;
    const toPoints = TROOP_POINTS[toLevel] || 0;
    
    // Kembalikan selisih poinnya
    return Math.max(0, toPoints - fromPoints);
  }

  // === Hitung total keseluruhan ===
  function updateTotals() {
    let grandTotal = 0;

    // 1. Hitung semua baris statis (shard, training)
    staticRows.forEach(row => {
      const p = num(row.querySelector('[data-point]').textContent);
      const a = num(row.querySelector('.amountInput').value);
      const total = p * a;
      row.querySelector('.totalCell').textContent = format(total);
      grandTotal += total;
    });

    // 2. Hitung semua baris charm (LOGIKA LAMA - SUDAH BENAR)
    const CHARM_MULTIPLIER = 70; // <-- Aturan "70 Poin"
    
    document.querySelectorAll('.charm-row').forEach(row => {
      const level = num(row.querySelector('.charm-level-select').value);
      const basePoints = CHARM_POINTS[level] || 0; // e.g., 13.000
      
      // ==== PERUBAHAN DI SINI ====
      // Tampilkan poin dasar (13.000) di kolom "Point"
      row.querySelector('.charmPointCell').textContent = format(basePoints);
      // ===========================

      // Hitung total akhir
      const pointsPerItem = basePoints * CHARM_MULTIPLIER; // e.g., 13.000 * 70 = 910.000
      const amount = num(row.querySelector('.charmAmountInput').value); // e.g., user inputs 1
      const total = pointsPerItem * amount; // e.g., 910.000 * 1
      
      row.querySelector('.totalCell').textContent = format(total);
      grandTotal += total;
    });

    // 3. Hitung baris promo (LOGIKA BARU - SELISIH POIN)
    const promoRow = document.querySelector('.promotion-select')?.closest('tr');
    if (promoRow) {
      const pointDifference = getPromoPointDiff(); // <-- Menggunakan fungsi baru (selisih poin)
      promoRow.querySelector('.diffCell').textContent = pointDifference; // <-- Menampilkan selisih POIN
      
      const a = num(promoRow.querySelector('.promoAmount').value);
      const promoTotal = pointDifference * a; // <-- Total = (Selisih Poin * Jumlah)
      
      promoRow.querySelector('.totalCell').textContent = format(promoTotal);
      grandTotal += promoTotal;
    }

    // 4. Update Grand Total
    totalDisplay.textContent = format(grandTotal);
    saveState();
  }
  
  // === Simpan data ke localStorage ===
  function saveState() {
    // Simpan data baris statis
    const staticValues = [...document.querySelectorAll('#calcTable tr')]
      .filter(r => r.querySelector('[data-point]')) // Ambil hanya baris statis
      .map(r => r.querySelector('.amountInput').value);

    // Simpan data baris charm
    const charmData = [...document.querySelectorAll('.charm-row')].map(row => {
      return {
        level: row.querySelector('.charm-level-select').value,
        amount: row.querySelector('.charmAmountInput').value
      };
    });

    const state = {
      staticValues,
      promoFrom: promoFrom.value,
      promoTo: promoTo.value,
      charmData: charmData // Data baru
    };
    localStorage.setItem('officerCalc', JSON.stringify(state));
  }

  // === Load data tersimpan ===
  function loadState() {
    const saved = JSON.parse(localStorage.getItem('officerCalc') || '{}');
    
    // Load data statis
    if (saved.staticValues) {
      staticRows.forEach((row, i) => {
         row.querySelector('.amountInput').value = saved.staticValues[i] ?? 0;
      });
    }
    if (saved.promoFrom) promoFrom.value = saved.promoFrom;
    if (saved.promoTo) promoTo.value = saved.promoTo;

    // Load data charm
    if (saved.charmData && Array.isArray(saved.charmData)) {
      saved.charmData.forEach(data => {
        createCharmRow(data.level, data.amount);
      });
    }
  }

  // === Tombol Reset ===
  resetBtn.addEventListener('click', () => {
    // Reset input statis
    staticRows.forEach(row => {
         row.querySelector('.amountInput').value = 0;
    });
    promoFrom.value = '0';
    promoTo.value = '0';
    document.querySelector('.promoAmount').value = 0;
    
    // Hapus semua baris charm
    document.querySelectorAll('.charm-row').forEach(row => row.remove());
    charmRowCount = 0;

    // Hapus data & update
    localStorage.removeItem('officerCalc');
    updateTotals();
  });

  // === Event Listener Tombol +/- ===
  addCharmBtn.addEventListener('click', () => {
    createCharmRow(); // Buat baris baru dengan nilai default
    updateTotals(); // Hitung ulang
  });

  removeCharmBtn.addEventListener('click', () => {
    const charmRows = document.querySelectorAll('.charm-row');
    if (charmRows.length > 0) {
      charmRows[charmRows.length - 1].remove(); // Hapus baris terakhir
      charmRowCount--;
      updateTotals(); // Hitung ulang
    }
  });
  
  // ===============================================
  // === BAGIAN YANG DIUBAH (MODAL DONASI) ===
  // ===============================================
  
  // --- Ambil Elemen Modal ---
  // (Pastikan Anda sudah menambahkan HTML-nya di index.html)
  const customAlertOverlay = document.getElementById('customAlertOverlay');
  const customAlertMessage = document.getElementById('customAlertMessage');
  const customAlertClose = document.getElementById('customAlertClose');

  // --- Fungsi untuk menampilkan modal ---
  function showCustomAlert(message) {
    if (customAlertMessage) {
      customAlertMessage.innerHTML = message; // Gunakan innerHTML agar <br> berfungsi
    }
    if (customAlertOverlay) {
      customAlertOverlay.style.display = 'flex';
    }
  }

  // --- Fungsi untuk menutup modal ---
  if (customAlertClose) {
    customAlertClose.addEventListener('click', () => {
      if (customAlertOverlay) {
        customAlertOverlay.style.display = 'none';
      }
    });
  }
  // Menutup jika klik di luar box
  if (customAlertOverlay) {
    customAlertOverlay.addEventListener('click', (e) => {
      if (e.target === customAlertOverlay) { // Hanya jika klik overlay, bukan box-nya
          customAlertOverlay.style.display = 'none';
      }
    });
  }

  // === UBAHAN Event Listener Back button ===
  const backBtn = document.querySelector('.back-btn');
  backBtn?.addEventListener('click', e => {
    e.preventDefault();
    
    // Ganti dengan info Anda
    showCustomAlert(
  'Every small support brings warmth in a frozen world ❄️<br><br>' +
  'Thank you for using this calculator.<br>' +
  'I’ll keep improving this page to make it even more useful for all players.<br><br>' +
  'If you’d like to share your spirit and support the development of this page, you can do so through the link below:<br>' + '↓<br>' +
  '<a href="https://buymeacoffee.com/voyavivirel" target="_blank" style="color:#00bfff;text-decoration:none;font-weight:bold;">❤️‍🔥 Support This Page’s Development ❤️‍🔥</a>'
);
  });
  
  // ===============================================
  // === AKHIR BAGIAN YANG DIUBAH ===
  // ===============================================

  // === Tema Gelap/Terang ===
  const savedTheme = localStorage.getItem('officerTheme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    themeToggle.textContent = '☀️';
  }
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    themeToggle.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('officerTheme', isLight ? 'light' : 'dark');
  });

  // === Event Listener Statis ===
  // Input statis
  staticRows.forEach(row => {
    row.querySelector('.amountInput').addEventListener('input', updateTotals);
  });
  // Input promo
  document.querySelector('.promoAmount').addEventListener('input', updateTotals);
  promoFrom.addEventListener('change', updateTotals);
  promoTo.addEventListener('change', updateTotals);

  // === Inisialisasi ===
  loadState();  // Load dulu
  updateTotals(); // Baru hitung total awal
})();

    // 4. Kolom "Total" (Tampilan Total)
    const totalCell = document.createElement('td');
    totalCell.className = 'totalCell';

    // Tambahkan semua sel ke baris
    tr.appendChild(itemCell);
    tr.appendChild(pointCell);
    tr.appendChild(amountCell);
    tr.appendChild(totalCell);

    // Tambahkan event listener agar kalkulasi berjalan
    levelSelect.addEventListener('change', updateTotals);
    amountInput.addEventListener('input', updateTotals);

    // Masukkan baris baru ke tabel, tepat sebelum tombol +/-
    charmControlsRow.before(tr);
    charmRowCount++;
  }

  // === Hitung selisih level promo ===
  function promoDiff() {
    const from = num(promoFrom.value);
    const to = num(promoTo.value);
    return Math.max(0, to - from);
  }

  // === Hitung total keseluruhan ===
  function updateTotals() {
    let grandTotal = 0;

    // 1. Hitung semua baris statis (shard, training)
    staticRows.forEach(row => {
      const p = num(row.querySelector('[data-point]').textContent);
      const a = num(row.querySelector('.amountInput').value);
      const total = p * a;
      row.querySelector('.totalCell').textContent = format(total);
      grandTotal += total;
    });

    // 2. Hitung semua baris charm (LOGIKA BARU)
    const CHARM_MULTIPLIER = 70; // <-- Aturan "70 Poin"
    
    document.querySelectorAll('.charm-row').forEach(row => {
      const level = num(row.querySelector('.charm-level-select').value);
      const basePoints = CHARM_POINTS[level] || 0; // e.g., 13.000
      
      // ==== PERUBAHAN DI SINI ====
      // Tampilkan poin dasar (13.000) di kolom "Point"
      row.querySelector('.charmPointCell').textContent = format(basePoints);
      // ===========================

      // Hitung total akhir
      const pointsPerItem = basePoints * CHARM_MULTIPLIER; // e.g., 13.000 * 70 = 910.000
      const amount = num(row.querySelector('.charmAmountInput').value); // e.g., user inputs 1
      const total = pointsPerItem * amount; // e.g., 910.000 * 1
      
      row.querySelector('.totalCell').textContent = format(total);
      grandTotal += total;
    });

    // 3. Hitung baris promo
    const promoRow = document.querySelector('.promotion-select')?.closest('tr');
    if (promoRow) {
      const diff = promoDiff();
      promoRow.querySelector('.diffCell').textContent = diff;
      const a = num(promoRow.querySelector('.promoAmount').value);
      const promoTotal = diff * a;
      promoRow.querySelector('.totalCell').textContent = format(promoTotal);
      grandTotal += promoTotal;
    }

    // 4. Update Grand Total
    totalDisplay.textContent = format(grandTotal);
    saveState();
  }
  
  // === Simpan data ke localStorage ===
  function saveState() {
    // Simpan data baris statis
    const staticValues = [...document.querySelectorAll('#calcTable tr')]
      .filter(r => r.querySelector('[data-point]')) // Ambil hanya baris statis
      .map(r => r.querySelector('.amountInput').value);

    // Simpan data baris charm
    const charmData = [...document.querySelectorAll('.charm-row')].map(row => {
      return {
        level: row.querySelector('.charm-level-select').value,
        amount: row.querySelector('.charmAmountInput').value
      };
    });

    const state = {
      staticValues,
      promoFrom: promoFrom.value,
      promoTo: promoTo.value,
      charmData: charmData // Data baru
    };
    localStorage.setItem('officerCalc', JSON.stringify(state));
  }

  // === Load data tersimpan ===
  function loadState() {
    const saved = JSON.parse(localStorage.getItem('officerCalc') || '{}');
    
    // Load data statis
    if (saved.staticValues) {
      staticRows.forEach((row, i) => {
         row.querySelector('.amountInput').value = saved.staticValues[i] ?? 0;
      });
    }
    if (saved.promoFrom) promoFrom.value = saved.promoFrom;
    if (saved.promoTo) promoTo.value = saved.promoTo;

    // Load data charm
    if (saved.charmData && Array.isArray(saved.charmData)) {
      saved.charmData.forEach(data => {
        createCharmRow(data.level, data.amount);
      });
    }
  }

  // === Tombol Reset ===
  resetBtn.addEventListener('click', () => {
    // Reset input statis
    staticRows.forEach(row => {
         row.querySelector('.amountInput').value = 0;
    });
    promoFrom.value = '0';
    promoTo.value = '0';
    document.querySelector('.promoAmount').value = 0;
    
    // Hapus semua baris charm
    document.querySelectorAll('.charm-row').forEach(row => row.remove());
    charmRowCount = 0;

    // Hapus data & update
    localStorage.removeItem('officerCalc');
    updateTotals();
  });

  // === Event Listener Tombol +/- ===
  addCharmBtn.addEventListener('click', () => {
    createCharmRow(); // Buat baris baru dengan nilai default
    updateTotals(); // Hitung ulang
  });

  removeCharmBtn.addEventListener('click', () => {
    const charmRows = document.querySelectorAll('.charm-row');
    if (charmRows.length > 0) {
      charmRows[charmRows.length - 1].remove(); // Hapus baris terakhir
      charmRowCount--;
      updateTotals(); // Hitung ulang
    }
  });
  
  // ===============================================
  // === BAGIAN YANG DIUBAH (MODAL DONASI) ===
  // ===============================================
  
  // --- Ambil Elemen Modal ---
  // (Pastikan Anda sudah menambahkan HTML-nya di index.html)
  const customAlertOverlay = document.getElementById('customAlertOverlay');
  const customAlertMessage = document.getElementById('customAlertMessage');
  const customAlertClose = document.getElementById('customAlertClose');

  // --- Fungsi untuk menampilkan modal ---
  function showCustomAlert(message) {
    if (customAlertMessage) {
      customAlertMessage.innerHTML = message; // Gunakan innerHTML agar <br> berfungsi
    }
    if (customAlertOverlay) {
      customAlertOverlay.style.display = 'flex';
    }
  }

  // --- Fungsi untuk menutup modal ---
  if (customAlertClose) {
    customAlertClose.addEventListener('click', () => {
      if (customAlertOverlay) {
        customAlertOverlay.style.display = 'none';
      }
    });
  }
  // Menutup jika klik di luar box
  if (customAlertOverlay) {
    customAlertOverlay.addEventListener('click', (e) => {
      if (e.target === customAlertOverlay) { // Hanya jika klik overlay, bukan box-nya
          customAlertOverlay.style.display = 'none';
      }
    });
  }

  // === UBAHAN Event Listener Back button ===
  const backBtn = document.querySelector('.back-btn');
  backBtn?.addEventListener('click', e => {
    e.preventDefault();
    
    // Ganti dengan info Anda
    showCustomAlert(
  'Every small support brings warmth in a frozen world ❄️<br><br>' +
  'Thank you for using this calculator.<br>' +
  'I’ll keep improving this page to make it even more useful for all players.<br><br>' +
  'If you’d like to share your spirit and support the development of this page, you can do so through the link below:<br>' + '↓<br>' +
  '<a href="https://buymeacoffee.com/voyavivirel" target="_blank" style="color:#00bfff;text-decoration:none;font-weight:bold;">❤️‍🔥 Support This Page’s Development ❤️‍🔥</a>'
);
  });
  
  // ===============================================
  // === AKHIR BAGIAN YANG DIUBAH ===
  // ===============================================

  // === Tema Gelap/Terang ===
  const savedTheme = localStorage.getItem('officerTheme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    themeToggle.textContent = '☀️';
  }
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    themeToggle.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('officerTheme', isLight ? 'light' : 'dark');
  });

  // === Event Listener Statis ===
  // Input statis
  staticRows.forEach(row => {
    row.querySelector('.amountInput').addEventListener('input', updateTotals);
  });
  // Input promo
  document.querySelector('.promoAmount').addEventListener('input', updateTotals);
  promoFrom.addEventListener('change', updateTotals);
  promoTo.addEventListener('change', updateTotals);

  // === Inisialisasi ===
  loadState();  // Load dulu
  updateTotals(); // Baru hitung total awal
})();
