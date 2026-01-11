// Photo Judge Logic - App.js

// Global Error Handler
window.onerror = function (msg, url, line) {
    console.error("Global Error:", msg, "Line:", line);
    return false;
};

const FILES = [
    "0Z3Z2773-2A-Z5.jpg",
    "GJ4C6832h-Z5.jpg",
    "IMG_1322g-Z5.jpg",
    "JRC_4660-A1.jpg",
    "OrleeNinon - spidey.jpg",
    "ocninon_macro_07.jpg"
];

const PHOTO_BASE_PATH = "../OCN-Selected Photos (PhotoChoice AI)/";
const STORAGE_KEY = 'photoJudgeData';

let state = {
    photos: [],
    timestamp: null,
    ratings: {},
    isFinalized: false
};

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    loadState();
    if (!state.timestamp) {
        startNewSession();
    } else {
        render();
    }
    bindEvents();
}

function loadState() {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (json) {
            state = JSON.parse(json);
            if (!state.timestamp) state.timestamp = new Date().toLocaleString();
        }
    } catch (e) {
        console.error("Load Error", e);
        startNewSession();
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function startNewSession() {
    const shuffled = [...FILES];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    state.photos = shuffled;
    state.timestamp = new Date().toLocaleString();
    state.ratings = {};
    state.photos.forEach(f => {
        state.ratings[f] = { theme: null, creativity: null, impact: null };
    });
    state.isFinalized = false;
    saveState();
    render();
    window.scrollTo(0, 0);
}

// --- UI Helpers ---

function showMessage(title, text) {
    const modal = document.getElementById('message-modal');
    const titleEl = document.getElementById('msg-title');
    const bodyEl = document.getElementById('msg-body');
    const okBtn = document.getElementById('msg-ok-btn');

    if (modal && titleEl && bodyEl) {
        titleEl.textContent = title;
        bodyEl.innerHTML = text;
        modal.classList.remove('hidden');

        if (okBtn) {
            okBtn.onclick = () => modal.classList.add('hidden');
        }
    } else {
        // Fallback
        alert(title + "\n\n" + text);
    }
}

function render() {
    const timestampDisplay = document.getElementById('timestamp-display');
    if (timestampDisplay) timestampDisplay.textContent = `Session Started: ${state.timestamp}`;

    const finishBtn = document.getElementById('finish-btn');
    if (finishBtn) {
        if (state.isFinalized) {
            document.body.classList.add('locked-mode');
            finishBtn.textContent = "View Rankings";
        } else {
            document.body.classList.remove('locked-mode');
            finishBtn.textContent = "Finish Judging & Rank";
        }
    }

    const completeCount = state.photos.reduce((count, filename) => {
        const r = state.ratings[filename] || {};
        if (r.theme != null && r.creativity != null && r.impact != null) return count + 1;
        return count;
    }, 0);

    const progressEl = document.getElementById('progress-display');
    if (progressEl) {
        progressEl.textContent = `${completeCount} / ${state.photos.length} Scored`;
        if (completeCount === state.photos.length && state.photos.length > 0) {
            progressEl.classList.add('complete');
            progressEl.textContent = "All Scored ✨";
        } else {
            progressEl.classList.remove('complete');
        }
    }

    const photoGrid = document.getElementById('photo-grid');
    if (!photoGrid) return;
    photoGrid.innerHTML = '';

    state.photos.forEach(filename => {
        const r = state.ratings[filename] || { theme: null, creativity: null, impact: null };
        const rTheme = r.theme == null ? 0 : r.theme;
        const rCreativity = r.creativity == null ? 0 : r.creativity;
        const rImpact = r.impact == null ? 0 : r.impact;
        const total = (rTheme + rCreativity + rImpact).toFixed(3);
        const isComplete = r.theme != null && r.creativity != null && r.impact != null;

        const card = document.createElement('div');
        card.className = `photo-card ${isComplete ? 'completed' : ''}`;

        card.innerHTML = `
            ${isComplete ? '<div class="check-overlay" style="opacity: 1; transform: scale(1);">✓</div>' : '<div class="check-overlay">✓</div>'}
            <div class="photo-thumbnail-container" onclick="openImageModal('${filename}')">
                <img src="${PHOTO_BASE_PATH}${filename}" class="photo-thumbnail" loading="lazy">
            </div>
            <div class="rating-section">
                ${createDualControl(filename, 'theme', 'Relevance', r.theme == null ? '' : r.theme)}
                ${createDualControl(filename, 'creativity', 'Creativity', r.creativity == null ? '' : r.creativity)}
                ${createDualControl(filename, 'impact', 'Impact', r.impact == null ? '' : r.impact)}
                <div style="text-align: right; margin-top: 10px; font-size: 0.9rem; color:#888;">
                    Total: <span style="color:white; font-weight:bold;">${total}</span>
                </div>
            </div>
        `;
        photoGrid.appendChild(card);
    });
}

function createDualControl(filename, key, label, value) {
    const safeVal = value === '' ? 0 : value;
    return `
        <div class="input-group dual-control">
            <label>${label}</label>
            <div class="controls-wrapper">
                <input type="range" class="score-slider" min="0" max="10" step="0.001" 
                    value="${safeVal}" 
                    oninput="window.syncInput('${filename}', '${key}', this.value)"
                    onchange="window.saveVal('${filename}', '${key}', this.value)">
                <input type="number" class="score-input" id="input-${filename}-${key}" 
                    min="0" max="10" step="0.001" placeholder="0.000"
                    value="${value}" 
                    oninput="window.syncSlider('${filename}', '${key}', this.value)"
                    onchange="window.saveVal('${filename}', '${key}', this.value)">
            </div>
        </div>
    `;
}

window.syncInput = (filename, key, value) => {
    const input = document.getElementById(`input-${filename}-${key}`);
    if (input) input.value = value;
};

window.syncSlider = (filename, key, value) => { };

window.saveVal = (filename, key, value) => {
    if (state.isFinalized) return;
    let val = parseFloat(value);
    if (value === '' || isNaN(val)) {
        val = null;
    } else {
        if (val < 0) val = 0;
        if (val > 10) val = 10;
    }
    if (!state.ratings[filename]) state.ratings[filename] = {};
    state.ratings[filename][key] = val;
    saveState();
    render();
};

window.openImageModal = (filename) => {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const magnifier = document.getElementById('magnifier');
    if (modal && modalImg) {
        modalImg.src = `${PHOTO_BASE_PATH}${filename}`;
        if (magnifier) magnifier.style.backgroundImage = `url('${PHOTO_BASE_PATH}${filename}')`;
        modal.classList.remove('hidden');
    }
};

window.switchTab = (tab) => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tab)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    updateRankingView(tab);
};

function updateRankingView(tab) {
    const rankingBody = document.getElementById('ranking-body');
    const scoreHeader = document.getElementById('score-header');
    const winnerDisplay = document.getElementById('winner-display');

    if (!rankingBody || !state.photos.length) return;

    const data = state.photos.map(f => {
        const r = state.ratings[f] || {};
        const th = r.theme || 0;
        const cr = r.creativity || 0;
        const im = r.impact || 0;
        return {
            filename: f,
            theme: th,
            creativity: cr,
            impact: im,
            total: th + cr + im
        };
    });

    let sorted = [];
    let key = 'total';
    let max = 30;
    let label = 'Total Score';

    if (tab === 'all') {
        sorted = data.sort((a, b) => b.total - a.total);
    } else {
        key = tab;
        max = 10;
        label = tab.charAt(0).toUpperCase() + tab.slice(1);
        if (tab === 'theme') label = 'Relevance';
        sorted = data.sort((a, b) => b[key] - a[key]);
    }

    if (scoreHeader) scoreHeader.textContent = label;

    const winner = sorted[0];
    if (winner && winnerDisplay) {
        winnerDisplay.innerHTML = `
            <h3 style="margin-top:0; color:#fbbf24;">🏆 ${label} Winner</h3>
            <img src="${PHOTO_BASE_PATH}${winner.filename}" style="width:100px; height:100px; object-fit:cover; border-radius:50%; border:2px solid #fbbf24; margin: 10px auto; display:block;">
            <div style="font-size:1.2rem; font-weight:bold;">${winner[key].toFixed(3)} / ${max.toFixed(3)}</div>
        `;
    }

    rankingBody.innerHTML = sorted.map((item, idx) => `
        <tr>
            <td>#${idx + 1}</td>
            <td><img src="${PHOTO_BASE_PATH}${item.filename}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
            <td style="font-weight:bold;">${item[key].toFixed(3)}</td>
        </tr>
    `).join('');
}

function showRanking() {
    const rankingModal = document.getElementById('ranking-modal');
    const rankingTime = document.getElementById('ranking-time');

    if (rankingTime && state.timestamp) rankingTime.textContent = `Session: ${state.timestamp}`;
    if (rankingModal) rankingModal.classList.remove('hidden');

    launchConfetti();
    window.switchTab('all');
}

function launchConfetti() {
    const colors = ['#f44336', '#e91e63', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800'];
    for (let i = 0; i < 60; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        c.style.left = Math.random() * 100 + 'vw';
        c.style.animation = `confettiFall ${Math.random() * 2 + 2}s linear forwards`;
        c.style.position = 'fixed';
        c.style.top = '-10px';
        c.style.width = '10px'; c.style.height = '10px'; c.style.zIndex = '2000';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 4000);
    }
}

function bindEvents() {
    const resetBtn = document.getElementById('reset-btn');
    const finishBtn = document.getElementById('finish-btn');
    const exportBtn = document.getElementById('export-btn');

    const finalizeModal = document.getElementById('finalize-modal');
    const confirmFinalize = document.getElementById('confirm-finalize-btn');
    const cancelFinalize = document.getElementById('cancel-finalize-btn');

    if (finishBtn) {
        finishBtn.onclick = () => {
            if (state.isFinalized) {
                showRanking();
                return;
            }

            // Loose equality check for null/undefined
            const incomplete = state.photos.filter(f => {
                const r = state.ratings[f] || {};
                return (r.theme == null) || (r.creativity == null) || (r.impact == null);
            });

            if (incomplete.length > 0) {
                // Build HTML for images
                const htmlContent = "Please finalize scoring for the following photos:<br><br>" +
                    "<div style='display:flex; flex-wrap:wrap; justify-content:center; gap:10px;'>" +
                    incomplete.map(f => `
                        <div style='text-align:center;'>
                            <img src='${PHOTO_BASE_PATH}${f}' style='width:60px; height:60px; object-fit:cover; border-radius:6px; border:1px solid #555;'>
                        </div>
                    `).join('') +
                    "</div>";

                // Use Custom Modal instead of alert
                showMessage(
                    "Incomplete Scores",
                    htmlContent
                );
                return;
            }

            // Show Confirm Modal
            if (finalizeModal) {
                finalizeModal.classList.remove('hidden');
            } else {
                // Fallback
                if (confirm("Finalize Results? Scores will be locked.")) {
                    state.isFinalized = true;
                    saveState();
                    render();
                    showRanking();
                }
            }
        };
    }

    if (cancelFinalize) cancelFinalize.onclick = () => finalizeModal && finalizeModal.classList.add('hidden');
    if (confirmFinalize) confirmFinalize.onclick = () => {
        finalizeModal && finalizeModal.classList.add('hidden');
        state.isFinalized = true;
        saveState();
        render();
        showRanking();
    };

    // Other events
    const resetModal = document.getElementById('reset-modal');
    const confirmReset = document.getElementById('confirm-reset-btn');
    const cancelReset = document.getElementById('cancel-reset-btn');

    if (resetBtn) resetBtn.onclick = () => resetModal && resetModal.classList.remove('hidden');
    if (cancelReset) cancelReset.onclick = () => resetModal && resetModal.classList.add('hidden');
    if (confirmReset) confirmReset.onclick = () => {
        resetModal && resetModal.classList.add('hidden');
        startNewSession();
    };

    const rankingModal = document.getElementById('ranking-modal');
    const closeRanking = document.getElementById('close-ranking');
    const closeRankingX = document.getElementById('close-ranking-x');
    if (closeRanking) closeRanking.onclick = () => rankingModal.classList.add('hidden');
    if (closeRankingX) closeRankingX.onclick = () => rankingModal.classList.add('hidden');

    const imageModal = document.getElementById('image-modal');
    const closeModal = document.getElementById('close-modal');
    if (closeModal) closeModal.onclick = () => imageModal && imageModal.classList.add('hidden');

    if (exportBtn) exportBtn.onclick = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = "scores.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    // User Guide (Contest Mechanics)
    const guideBtn = document.getElementById('guide-btn');
    const mechanicsBtn = document.getElementById('mechanics-btn'); // Landing page button
    const guideModal = document.getElementById('guide-modal');
    const closeGuideX = document.getElementById('close-guide-x');
    const closeGuideBtn = document.getElementById('close-guide-btn');

    const openGuide = () => guideModal && guideModal.classList.remove('hidden');
    const closeGuide = () => guideModal && guideModal.classList.add('hidden');

    if (guideBtn) guideBtn.onclick = openGuide;
    if (mechanicsBtn) mechanicsBtn.onclick = openGuide;
    if (closeGuideX) closeGuideX.onclick = closeGuide;
    if (closeGuideBtn) closeGuideBtn.onclick = closeGuide;

    const container = document.getElementById('modal-image-container');
    const magnifier = document.getElementById('magnifier');
    const modalImg = document.getElementById('modal-image');
    if (container && magnifier && modalImg) {
        container.onmousemove = (e) => {
            magnifier.style.display = 'block';
            const rect = modalImg.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (x < 0 || y < 0 || x > rect.width || y > rect.height) { magnifier.style.display = 'none'; return; }
            const size = 150;
            magnifier.style.left = (x - size / 2) + 'px';
            magnifier.style.top = (y - size / 2) + 'px';
            const zoom = 2.5;
            magnifier.style.backgroundSize = `${rect.width * zoom}px ${rect.height * zoom}px`;
            magnifier.style.backgroundPosition = `${-x * zoom + size / 2}px ${-y * zoom + size / 2}px`;
        };
        container.onmouseleave = () => magnifier.style.display = 'none';
    }

    // Landing Page Transition
    const startBtn = document.getElementById('start-btn');
    const landingPage = document.getElementById('landing-page');
    const appContainer = document.getElementById('app-container');

    if (startBtn) {
        startBtn.onclick = () => {
            if (landingPage) {
                landingPage.classList.add('slide-up');
                setTimeout(() => {
                    landingPage.style.display = 'none';
                    if (appContainer) {
                        appContainer.classList.remove('hidden');
                        appContainer.style.opacity = 0;
                        appContainer.animate([
                            { opacity: 0, transform: 'scale(0.98)' },
                            { opacity: 1, transform: 'scale(1)' }
                        ], {
                            duration: 500,
                            easing: 'ease-out',
                            fill: 'forwards'
                        });
                    }
                }, 600);
            }
        };
    }
}
