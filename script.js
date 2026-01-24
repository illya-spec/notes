document.addEventListener('DOMContentLoaded', () => {
    
    // ПРЕСЕТИ КОЛЬОРІВ (Liquid Glass)
    const colorPresets = {
        blue: { 
            bg: 'rgba(64, 201, 255, 0.3)', 
            active: 'linear-gradient(90deg, #40c9ff, #00baee)',
            item: 'rgba(64, 201, 255, 0.2)'
        },
        pink: { 
            bg: 'rgba(255, 117, 140, 0.3)', 
            active: 'linear-gradient(90deg, #ff758c, #ff7eb3)',
            item: 'rgba(255, 117, 140, 0.2)'
        },
        green: { 
            bg: 'rgba(94, 231, 128, 0.3)', 
            active: 'linear-gradient(90deg, #42e695, #3bb2b8)',
            item: 'rgba(94, 231, 128, 0.2)'
        },
        orange: { 
            bg: 'rgba(255, 185, 99, 0.3)', 
            active: 'linear-gradient(90deg, #fccb90, #d57eeb)',
            item: 'rgba(255, 185, 99, 0.2)'
        },
        red: { 
            bg: 'rgba(255, 99, 99, 0.3)', 
            active: 'linear-gradient(90deg, #ff512f, #dd2476)',
            item: 'rgba(255, 99, 99, 0.2)'
        }
    };

    // --- ДОДАВАННЯ HTML ДЛЯ МОДАЛКИ "ПРО НАС" (Щоб не лізти в index.html) ---
    const aboutModalHTML = `
    <div id="aboutModal" class="modal-overlay">
        <div class="modal-card">
            <h1>Про додаток</h1>
            <p style="margin: 15px 0; line-height: 1.5; color: var(--text-main);">
                Це ваш персональний простір для думок, файлів та ідей.<br>
                Створено з любов'ю до мінімалізму та функціональності.<br><br>
                Версія: 1.4 Bug fix & LG
            </p>
            <button id="closeAboutModal" style="background: #40c9ff; color: #fff; border: none; padding: 8px 20px; border-radius: 15px; cursor: pointer;">Зрозуміло</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', aboutModalHTML);

    // --- ЗАВАНТАЖЕННЯ ДАНИХ З LOCALSTORAGE ---
    const savedData = JSON.parse(localStorage.getItem('notesAppData')) || {};

    let groups = savedData.groups || [];
    let folders = savedData.folders || [{ id: 1, name: 'Моя перша нотатка', groupId: null, isFavorite: false }];
    let messages = savedData.messages || []; 
    
    // Додаємо ID для старих повідомлень без ID
    messages.forEach((msg, idx) => {
        if (!msg.id) {
            msg.id = 'msg_legacy_' + idx + '_' + Date.now();
        }
    });
    let activeFolderId = savedData.activeFolderId || (folders.length > 0 ? folders[0].id : null);
    
    // Відновлення темної теми
    if (savedData.darkMode) {
        document.body.classList.add('dark-mode');
    }

    let draggedFolderId = null;
    let searchQuery = '';      
    let chatSearchQuery = '';  

    // ЕЛЕМЕНТИ
    const groupsContainer = document.getElementById('groupsContainer');
    const mainDropZone = document.getElementById('mainDropZone');
    const chatEl = document.getElementById('chatFeed');
    const input = document.getElementById('msgInput');
    const colorModal = document.getElementById('colorModal');
    const themeBtn = document.getElementById('themeToggleBtn');
    
    const globalSearchInput = document.getElementById('globalSearchInput');
    const localSearchBar = document.getElementById('localSearchBar');
    const localSearchInput = document.getElementById('localSearchInput');
    const btnSearch = document.getElementById('btnSearch');
    const closeLocalSearch = document.getElementById('closeLocalSearch');

    const attachPopup = document.getElementById('attachPopup');
    const clipBtn = document.getElementById('clipBtn');
    const fileInputImg = document.getElementById('fileInputImg');
    const fileInputAny = document.getElementById('fileInputAny');

    // Елементи для About Us
    const btnAbout = document.querySelector('.btn-about');
    const aboutModal = document.getElementById('aboutModal');
    const closeAboutModal = document.getElementById('closeAboutModal');

    // --- ЛОГІКА ABOUT US ---
    if (btnAbout) {
        btnAbout.onclick = () => aboutModal.classList.add('active');
    }
    if (closeAboutModal) {
        closeAboutModal.onclick = () => aboutModal.classList.remove('active');
    }

    // --- ФУНКЦІЯ ЗБЕРЕЖЕННЯ ДАНИХ ---
    function saveData() {
        try {
            const dataToSave = {
                groups,
                folders,
                messages,
                activeFolderId,
                darkMode: document.body.classList.contains('dark-mode')
            };
            localStorage.setItem('notesAppData', JSON.stringify(dataToSave));
        } catch (e) {
            console.error('LocalStorage error:', e);
        }
    }
    
    // --- ЛОГІКА ПОШУКУ ---
    function isMatch(folder) {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        if (folder.name.toLowerCase().includes(q)) return true;
        return messages.some(m => m.folderId === folder.id && m.type === 'text' && m.text.toLowerCase().includes(q));
    }

    globalSearchInput.oninput = (e) => { 
        searchQuery = e.target.value.toLowerCase(); 
        renderAll(); 
    };

    btnSearch.onclick = (e) => { 
        e.stopPropagation(); 
        attachPopup.classList.remove('show'); 
        localSearchBar.classList.add('active'); 
        localSearchInput.focus(); 
    };

    closeLocalSearch.onclick = () => { 
        localSearchBar.classList.remove('active'); 
        chatSearchQuery = ''; 
        localSearchInput.value = ''; 
        renderChat(); 
    };

    localSearchInput.oninput = (e) => { 
        chatSearchQuery = e.target.value.trim(); 
        renderChat(); 
    };
    
    themeBtn.onclick = () => {
        document.body.classList.toggle('dark-mode');
        saveData(); 
    };

    // --- ВІЗУАЛІЗАЦІЯ (RENDER) ---
    function renderAll() { 
        renderGroups(); 
        renderMainList(); 
        renderChat(); 
        updateInputUI();
    }

    function updateInputUI() {
        const inputBar = document.querySelector('.input-bar');
        const activeFolder = folders.find(f => f.id === activeFolderId);
        
        if (activeFolder && activeFolder.groupId) {
            const group = groups.find(g => g.id === activeFolder.groupId);
            if (group && colorPresets[group.color]) {
                inputBar.style.background = colorPresets[group.color].active;
                inputBar.classList.add('colored');
                return; 
            }
        }
        inputBar.style.background = ''; 
        inputBar.classList.remove('colored');
    }
    
    function renderGroups() {
        groupsContainer.innerHTML = '';
        groups.forEach(group => {
            const groupEl = document.createElement('div');
            groupEl.className = 'glass-group';
            groupEl.dataset.groupId = group.id;
            
            if (group.color && colorPresets[group.color]) {
                groupEl.style.setProperty('--group-color', colorPresets[group.color].bg);
                groupEl.style.setProperty('--active-color', colorPresets[group.color].active);
            }

            // Додаємо кнопку розгрупування
            const ungroupBtn = document.createElement('button');
            ungroupBtn.className = 'ungroup-btn';
            ungroupBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>';
            ungroupBtn.onclick = () => ungroup(group.id);
            groupEl.appendChild(ungroupBtn);

            // ДОДАЄМО НАЗВУ ГРУПИ
            if (group.name) {
                const groupTitle = document.createElement('h3');
                groupTitle.innerText = group.name;
                // Стилі для заголовка групи
                groupTitle.style.margin = '0 0 10px 5px';
                groupTitle.style.fontSize = '14px';
                groupTitle.style.fontWeight = '600';
                groupTitle.style.opacity = '0.7';
                groupTitle.style.color = 'inherit';
                groupEl.appendChild(groupTitle);
            }

            const innerList = document.createElement('div');
            innerList.className = 'inner-list';
            folders.filter(f => f.groupId === group.id && isMatch(f)).forEach(f => innerList.appendChild(createFolderElement(f)));
            groupEl.appendChild(innerList);
            
            setupDropZone(groupEl, group.id);
            groupsContainer.appendChild(groupEl);
        });
    }

    function renderMainList() {
        mainDropZone.innerHTML = '';
        folders.filter(f => f.groupId === null && isMatch(f)).forEach(f => mainDropZone.appendChild(createFolderElement(f)));
        setupDropZone(mainDropZone, null);
    }

    function createFolderElement(folder) {
        const el = document.createElement('div');
        let classes = `list-item`;
        if (folder.id === activeFolderId) classes += ' active';
        if (folder.groupId === null && folder.id !== activeFolderId) classes += ' orphan';
        el.className = classes;
        el.draggable = true;
        
        const favClass = folder.isFavorite ? 'is-fav' : '';

        el.innerHTML = `
            <div class="item-info">${folder.name}</div>
            <div class="item-icons">
                 <button class="folder-btn download-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>
                 <button class="folder-btn fav-btn ${favClass}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></button>
                 <button class="folder-btn delete-folder-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>
        `;

        el.onclick = (e) => { 
            if (e.target.closest('.folder-btn') || e.target.closest('.item-icons')) {
                return;
            }
            activeFolderId = folder.id; 
            saveData();
            renderAll(); 
        };

        const downloadBtn = el.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.onclick = (e) => { 
                e.stopPropagation(); 
                e.preventDefault();
                downloadNote(folder); 
            };
        }

        const favBtn = el.querySelector('.fav-btn');
        if (favBtn) {
            favBtn.onclick = (e) => { 
                e.stopPropagation(); 
                e.preventDefault();
                folder.isFavorite = !folder.isFavorite; 
                saveData();
                renderAll(); 
            };
        }

        const deleteBtn = el.querySelector('.delete-folder-btn');
        if (deleteBtn) {
            deleteBtn.onclick = (e) => { 
                e.stopPropagation(); 
                e.preventDefault();
                if (confirm('Ви впевнені, що хочете видалити цю нотатку?')) {
                    messages = messages.filter(m => m.folderId !== folder.id);
                    folders = folders.filter(f => f.id !== folder.id);
                    if (activeFolderId === folder.id) {
                        activeFolderId = folders.length > 0 ? folders[0].id : null;
                    }
                    saveData();
                    renderAll(); 
                }
            };
        }

        el.addEventListener('dragstart', (e) => { 
            draggedFolderId = folder.id; 
            el.style.opacity = '0.5'; 
        });

        el.addEventListener('dragend', () => { 
            draggedFolderId = null; 
            el.style.opacity = '1'; 
            document.querySelectorAll('.drag-over').forEach(e => e.classList.remove('drag-over')); 
        });

        return el;
    }

    function renderChat() {
        chatEl.innerHTML = '';
        const msgs = messages.filter(m => m.folderId === activeFolderId);
        const termToHighlight = chatSearchQuery.trim() || searchQuery.trim();

        if (msgs.length === 0) {
            chatEl.innerHTML = '<div style="text-align:center; color:#888; margin-top:50px;">Нотаток немає</div>';
        } else {
            msgs.forEach((m) => {
                const block = document.createElement('div');
                block.className = 'message-block';
                block.dataset.id = m.id;

                const header = document.createElement('div');
                header.className = 'message-header';
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'header-actions';

                // Копіювання
                const btnCopy = document.createElement('button');
                btnCopy.className = 'header-btn';
                btnCopy.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
                btnCopy.onclick = () => {
                    let txt = '';
                    if (m.type === 'text') txt = m.text;
                    else if (m.type === 'file') txt = `Файл: ${m.content.name}`;
                    else txt = '[Контент]';
                    navigator.clipboard.writeText(txt);
                };

                // Видалення
                const btnDelete = document.createElement('button');
                btnDelete.className = 'header-btn delete';
                btnDelete.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
                btnDelete.onclick = (e) => {
                    e.stopPropagation();
                    messages = messages.filter(msg => msg.id !== m.id);
                    saveData();
                    renderChat();
                };

                actionsDiv.appendChild(btnCopy);
                actionsDiv.appendChild(btnDelete);

                const dateSpan = document.createElement('span');
                dateSpan.innerText = m.dateStr;

                header.appendChild(actionsDiv);
                header.appendChild(dateSpan);

                const bubble = document.createElement('div');
                bubble.className = 'msg-bubble';
                let contentHtml = '';
                
                // --- РЕНДЕРИНГ РІЗНИХ ТИПІВ ---
                if (m.type === 'text') {
                    let txt = m.text;
                    if (termToHighlight) { 
                        try {
                            const regex = new RegExp(`(${termToHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'); 
                            txt = txt.replace(regex, '<span class="found-text" style="background:rgba(255,255,0,0.3); padding:0 2px; border-radius:3px;">$1</span>'); 
                        } catch(e) {}
                    }
                    contentHtml = txt;
                } else if (m.type === 'image') {
                    contentHtml = `<img src="${m.content}" class="msg-img">`;
                } else if (m.type === 'table') {
                    const tableData = m.content || `<table style="width:100%; border-collapse:collapse;"><tr><td style="border:1px solid #ccc; padding:5px;">...</td><td style="border:1px solid #ccc; padding:5px;">...</td></tr></table>`;
                    contentHtml = `<div class="table-wrapper">${tableData}</div>`;
                } else if (m.type === 'file') {
                    const fileSize = (m.content.size / 1024).toFixed(1) + ' KB';
                    contentHtml = `
                        <div style="display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.05); padding:10px; border-radius:10px;">
                            <div style="font-size:24px;">📄</div>
                            <div style="flex:1; overflow:hidden;">
                                <div style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.content.name}</div>
                                <div style="font-size:11px; opacity:0.6;">${fileSize}</div>
                            </div>
                            <a href="${m.content.data}" download="${m.content.name}" style="text-decoration:none; background:#40c9ff; color:white; padding:5px 10px; border-radius:15px; font-size:12px;">Завантажити</a>
                        </div>
                    `;
                }
                
                bubble.innerHTML = contentHtml + `<span class="msg-time">${m.timeStr || ''}</span>`;

                block.appendChild(header);
                block.appendChild(bubble);
                chatEl.appendChild(block);
            });
        }
        chatEl.scrollTop = chatEl.scrollHeight;
    }

    // --- ЗБЕРЕЖЕННЯ ТАБЛИЦІ ПРИ ВВОДІ ---
    chatEl.addEventListener('input', (e) => {
        const target = e.target;
        const block = target.closest('.message-block');
        if (!block) return;
        
        const msgId = block.dataset.id;
        const msg = messages.find(m => m.id === msgId);
        
        if (msg && msg.type === 'table') {
            const wrapper = block.querySelector('.table-wrapper');
            if (wrapper) {
                msg.content = wrapper.innerHTML; 
                saveData();
            }
        }
    });

    // --- ВІДПРАВКА ПОВІДОМЛЕННЯ ---
    function sendMsg(type='text', content=null) {
        const t = input.value.trim();
        if (!t && !content) return;
        
        if (!activeFolderId) {
            alert('Спочатку виберіть або створіть нотатку!');
            return;
        }
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messages.push({ 
            id: 'msg_' + Date.now() + '_' + Math.random(),
            folderId: activeFolderId, 
            type: type, 
            text: t, 
            content: content, 
            dateStr: dateStr, 
            timeStr: timeStr 
        });
        
        input.value = '';
        attachPopup.classList.remove('show');
        saveData(); 
        renderChat();
    }

    document.getElementById('sendBtn').onclick = () => sendMsg('text');
    input.addEventListener('keypress', e => { if (e.key === 'Enter') sendMsg('text'); });

    // --- ОБРОБКА PASTE (Вставка Ctrl+V) ---
    document.addEventListener('paste', (event) => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (let item of items) {
            if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (e) => {
                    sendMsg('image', e.target.result);
                };
                reader.readAsDataURL(blob);
            }
        }
    });

    // --- КНОПКИ ВКЛАДЕНЬ ---
    clipBtn.onclick = (e) => { 
        e.stopPropagation(); 
        attachPopup.classList.toggle('show'); 
    };
    document.addEventListener('click', (e) => { 
        if (!attachPopup.contains(e.target) && e.target !== clipBtn) attachPopup.classList.remove('show'); 
    });

    document.getElementById('btnImg').onclick = (e) => { e.stopPropagation(); fileInputImg.click(); };
    fileInputImg.onchange = (e) => { 
        const f = e.target.files[0]; 
        if (f) { 
            const r = new FileReader(); 
            r.onload = (ev) => sendMsg('image', ev.target.result); 
            r.readAsDataURL(f); 
        } 
        fileInputImg.value = ''; 
    };

    document.getElementById('btnPlus').onclick = (e) => { 
        e.stopPropagation(); 
        fileInputAny.click(); 
    };

    fileInputAny.onchange = (e) => { 
        const f = e.target.files[0]; 
        if (f) {
            if (f.size > 2 * 1024 * 1024) {
                alert('Файл занадто великий для браузера (ліміт ~2-5МБ).');
                fileInputAny.value = '';
                return;
            }
            const r = new FileReader();
            r.onload = (ev) => {
                sendMsg('file', {
                    name: f.name,
                    size: f.size,
                    type: f.type,
                    data: ev.target.result
                });
            };
            r.readAsDataURL(f); 
        } 
        fileInputAny.value = ''; 
    };

    document.getElementById('btnTable').onclick = (e) => { 
        e.stopPropagation(); 
        const rows = prompt("Введіть кількість рядків:", "3");
        const cols = prompt("Введіть кількість стовпців:", "3");
        
        if (rows && cols) {
            const r = parseInt(rows);
            const c = parseInt(cols);
            if (r > 0 && c > 0) {
                let tableHtml = '<table style="width:100%; border-collapse:collapse; border:1px solid var(--glass-border);">';
                for(let i = 0; i < r; i++) {
                    tableHtml += '<tr>';
                    for(let j = 0; j < c; j++) {
                        tableHtml += `<td style="border:1px solid rgba(128,128,128,0.3); padding:8px; min-width:30px;" contenteditable="true">...</td>`;
                    }
                    tableHtml += '</tr>';
                }
                tableHtml += '</table>';
                sendMsg('table', tableHtml);
            }
        }
    };

    // --- DRAG AND DROP ---
    function setupDropZone(el, gId) {
        el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag-over'); });
        el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
        el.addEventListener('drop', (e) => { 
            e.preventDefault(); 
            el.classList.remove('drag-over'); 
            if (draggedFolderId) { 
                const f = folders.find(x => x.id === draggedFolderId); 
                if (f) {
                    f.groupId = gId; 
                    saveData();
                    renderAll();
                } 
            } 
        });
    }

    // --- КЕРУВАННЯ ГРУПАМИ ТА ПАПКАМИ ---
    document.getElementById('createGroupBtn').onclick = () => colorModal.classList.add('active');
    document.getElementById('closeModal').onclick = () => colorModal.classList.remove('active');
    
    // ПРИ СТВОРЕННІ ГРУПИ ЗАПИТУЄМО НАЗВУ
    document.querySelectorAll('.color-option').forEach(opt => { 
        opt.onclick = () => { 
            const groupName = prompt("Введіть назву для цієї папки/групи:", "Нова папка");
            if (groupName === null) return; // Натиснули Відміна

            groups.push({ 
                id: 'g' + Date.now(), 
                color: opt.dataset.color,
                name: groupName || "Нова папка" 
            }); 
            colorModal.classList.remove('active'); 
            saveData();
            renderAll(); 
        }; 
    });

    function ungroup(gid) { 
        folders.forEach(f => { if (f.groupId === gid) f.groupId = null; }); 
        groups = groups.filter(g => g.id !== gid); 
        saveData();
        renderAll(); 
    }

    document.getElementById('createFolderBtn').onclick = (e) => { 
        e.stopPropagation();
        e.preventDefault();
        const cur = folders.find(f => f.id === activeFolderId); 
        const gid = cur ? cur.groupId : null; 
        const newId = Date.now(); 
        const name = prompt("Введіть назву нотатки:", "Нова нотатка");
        if (!name || name.trim() === '') return;
        
        folders.push({ id: newId, name: name.trim(), groupId: gid, isFavorite: false }); 
        activeFolderId = newId; 
        saveData();
        renderAll(); 
    };

    // ЗАВАНТАЖЕННЯ ЗАМІТКИ
    function downloadNote(folder) {
        const folderMessages = messages.filter(m => m.folderId === folder.id);
        let contentHtml = '';
        folderMessages.forEach(msg => { 
            if (msg.type === 'text') contentHtml += `<p>${msg.text}</p>`; 
            if (msg.type === 'image') contentHtml += `<img src="${msg.content}" style="max-width:100%"><br>`; 
            if (msg.type === 'table') contentHtml += `<div>${msg.content}</div><br>`;
            if (msg.type === 'file') contentHtml += `<p>Файл: ${msg.content.name}</p>`;
        });
        const blob = new Blob([`<h1>${folder.name}</h1>${contentHtml}`], { type: 'text/html' });
        const a = document.createElement('a'); 
        a.href = URL.createObjectURL(blob); 
        a.download = `${folder.name}.html`; 
        a.click();
    }

    // --- АНІМОВАНИЙ BACKGROUND ---
    const canvas = document.getElementById('animatedBackground');
    const ctx = canvas.getContext('2d');
    
    const particles = [];
    const particleCount = 80;
    const maxDistance = 150;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = document.body.classList.contains('dark-mode') 
                ? 'rgba(100, 200, 255, 0.8)' 
                : 'rgba(64, 201, 255, 0.6)';
            ctx.fill();
        }
    }
    
    function initParticles() {
        particles.length = 0;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    const opacity = (1 - distance / maxDistance) * 0.3;
                    ctx.strokeStyle = document.body.classList.contains('dark-mode')
                        ? `rgba(100, 200, 255, ${opacity})`
                        : `rgba(64, 201, 255, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    animate();
    renderAll();
});