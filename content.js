const PAD_SIZES = [
    { name: 'S', inch: '11.8x15.7"', cm: '30x40cm', ratio: 40/30 },
    { name: 'M', inch: '11.8x23.6"', cm: '30x60cm', ratio: 60/30 },
    { name: 'L', inch: '11.8x27.5"', cm: '30x70cm', ratio: 70/30 },
    { name: 'XL', inch: '11.8x31.5"', cm: '30x80cm', ratio: 80/30 },
    { name: 'XXL', inch: '15.7x35.4"', cm: '40x90cm', ratio: 90/40 },
    { name: '3XL', inch: '23.6x35.4"', cm: '60x90cm', ratio: 90/60 },
    { name: '4XL', inch: '19.7x39.4"', cm: '50x100cm', ratio: 100/50 },
    { name: '5XL', inch: '23.6x47.2"', cm: '60x120cm', ratio: 120/60 },
];

let currentImage = null;
let currentZoom = 1;
let isDragging = false;
let startX, startY;
let posX = 50; 
let posY = 50; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showPreview") {
    createPadloomModal(request.imageUrl, request.pageTitle);
  }
});

// GÜNCELLENMİŞ KELİME AYIKLAMA MOTORU
function extractKeywords(title) {
    let cleanTitle = title.toLowerCase();
    
    // Gereksiz kelimeleri temizle (Google, Ara, Search, Wallpaper vb.)
    const ignoreList = [
      "google", "google'da", "ara", "search", "images", "resimleri", 
      "wallpaper", "hd", "4k", "background", "masaüstü", "duvar", "kağıdı", "-", "|"
    ];

    ignoreList.forEach(word => {
        cleanTitle = cleanTitle.replaceAll(word, "");
    });

    // Boşlukları temizle ve en uzun/anlamlı kelime grubunu al
    const words = cleanTitle.split(" ").filter(w => w.length > 2);
    
    // Eğer hiç kelime kalmazsa "Gaming" döndür, yoksa ilk 2 kelimeyi al
    return words.length > 0 ? words.slice(0, 2).join(" ") : "Gaming";
}

function createPadloomModal(imageUrl, pageTitle) {
  const existingModal = document.getElementById('padloom-extension-root');
  if (existingModal) existingModal.remove();

  // Reset
  currentZoom = 1; posX = 50; posY = 50;

  const searchKeyword = extractKeywords(pageTitle || "");
  const root = document.createElement('div');
  root.id = 'padloom-extension-root';
  const defaultSize = PAD_SIZES[4]; // XXL Varsayılan

  root.innerHTML = `
    <div class="pl-overlay">
      <div class="pl-modal">
        
        <div class="pl-header">
          <div class="pl-brand">PADLOOM <span class="pl-accent">// VISUALIZER</span></div>
          <div class="pl-close" id="pl-close-btn">✕</div>
        </div>

        <div class="pl-body-split">
            <div class="pl-preview-side">
                 <div class="pl-preview-wrapper">
                     <div class="pl-preview-container" id="pl-preview-box" style="aspect-ratio: ${defaultSize.ratio};">
                        <div class="pl-mousepad" id="pl-mousepad-bg" style="background-image: url('${imageUrl}'); background-position: 50% 50%; background-size: cover;">
                            <div class="pl-texture-overlay"></div>
                        </div>
                     </div>
                     <div class="pl-controls-hint">
                        🖱️ Drag to Move • 🔍 Scroll to Zoom
                     </div>
                 </div>
                 <div class="pl-info-bar">
                    <div id="pl-size-info">${defaultSize.cm} (${defaultSize.inch})</div>
                    <div class="pl-badge success">✅ AI Enhanced Quality Ready</div>
                 </div>
            </div>

            <div class="pl-options-side">
                
                <div class="pl-scroll-area">
                    <div class="pl-section-title">1. SELECT SIZE</div>
                    <div class="pl-size-grid">
                        ${PAD_SIZES.map((size, index) => `
                            <div class="pl-size-mini ${index === 4 ? 'active' : ''}" 
                                data-ratio="${size.ratio}" 
                                data-info="${size.cm} (${size.inch})">
                                ${size.name}
                            </div>
                        `).join('')}
                    </div>

                    <div class="pl-related-section" id="pl-related-area">
                        <div class="pl-section-title" style="margin-top:20px; font-size:12px; color:#888;">
                            Interest in "${searchKeyword}"?
                        </div>
                        <div class="pl-related-list">
                             <a href="https://padloom.com/search?q=${searchKeyword}+mouse+pad" target="_blank" class="pl-related-card-dummy">
                                <div class="pl-r-icon">🔍</div>
                                <div class="pl-r-text">
                                    Search for <b>"${searchKeyword} Mouse Pad"</b><br>
                                    on Padloom Store
                                </div>
                             </a>
                        </div>
                    </div>
                </div>

                <div class="pl-actions-sticky">
                    <div class="pl-coupon-box" id="pl-coupon-trigger">
                        <div class="pl-c-text">Exclusive Code: <span class="pl-code">WELCOME10</span></div>
                        <div class="pl-c-copy">COPY</div>
                    </div>

                    <button id="pl-btn-download" class="pl-neon-btn full-width">
                        DOWNLOAD DESIGN
                    </button>
                    <a href="https://padloom.com/collections/custom-mouse-pads" target="_blank" id="pl-btn-create" class="pl-neon-btn outline full-width hidden">
                        UPLOAD & BUY →
                    </a>
                </div>
            </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);
  setupInteractions(root, imageUrl);
}

function setupInteractions(root, imageUrl) {
  // Kapatma
  document.getElementById('pl-close-btn').addEventListener('click', () => root.remove());
  root.querySelector('.pl-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) root.remove();
  });

  // Kupon Kopyalama
  const couponBox = document.getElementById('pl-coupon-trigger');
  couponBox.addEventListener('click', () => {
      navigator.clipboard.writeText('WELCOME10');
      const copyText = couponBox.querySelector('.pl-c-copy');
      const originalText = copyText.innerText;
      copyText.innerText = "COPIED!";
      copyText.style.color = "#39FF14";
      setTimeout(() => {
          copyText.innerText = originalText;
          copyText.style.color = "#888";
      }, 2000);
  });

  const previewBox = document.getElementById('pl-preview-box');
  const mousepadBg = document.getElementById('pl-mousepad-bg');
  const sizeInfo = document.getElementById('pl-size-info');
  const sizeBtns = root.querySelectorAll('.pl-size-mini');

  // Beden Seçimi
  sizeBtns.forEach(btn => {
      btn.addEventListener('click', function() {
          sizeBtns.forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          previewBox.style.aspectRatio = this.getAttribute('data-ratio');
          sizeInfo.innerText = this.getAttribute('data-info');
      });
  });

  // Drag & Zoom
  previewBox.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      currentZoom = Math.min(Math.max(1, currentZoom + delta), 3);
      mousepadBg.style.backgroundSize = `${currentZoom * 100}%`;
  });

  previewBox.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      previewBox.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', () => {
      isDragging = false;
      if(previewBox) previewBox.style.cursor = 'grab';
  });

  window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const xDiff = (e.clientX - startX) * 0.1;
      const yDiff = (e.clientY - startY) * 0.1;
      posX = Math.min(Math.max(0, posX - xDiff), 100);
      posY = Math.min(Math.max(0, posY - yDiff), 100);
      mousepadBg.style.backgroundPosition = `${posX}% ${posY}%`;
      startX = e.clientX;
      startY = e.clientY;
  });

  // İndirme
  const btnDownload = document.getElementById('pl-btn-download');
  const btnCreate = document.getElementById('pl-btn-create');

  btnDownload.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: "downloadImage", url: imageUrl });
      btnDownload.innerText = "Downloaded!";
      setTimeout(() => {
        btnDownload.classList.add('hidden');
        btnCreate.classList.remove('hidden');
      }, 1000);
  });
}