document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('mainInput');
    const sendBtn = document.querySelector('.return-btn');
    const clipBtn = document.querySelector('.clip-btn');
    const actionMenu = document.querySelector('.glass-actions-menu');
    const notesStream = document.getElementById('notesStream');

    const btnImage = document.getElementById('btnImage');
    const btnFile = document.getElementById('btnFile');
    const btnImport = document.getElementById('btnImport');

    const hiddenImageInput = document.getElementById('hiddenImageInput');
    const hiddenFileInput = document.getElementById('hiddenFileInput');

    const previewArea = document.getElementById('preview-area');
    const previewImg = document.getElementById('preview-img');
    const previewText = document.getElementById('preview-text');
    const clearPreviewBtn = document.getElementById('clear-preview');

    let pendingAttachment = null;

    clipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        actionMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!clipBtn.contains(e.target) && !actionMenu.contains(e.target)) {
            actionMenu.classList.remove('active');
        }
    });

    btnImage.addEventListener('click', () => hiddenImageInput.click());

    hiddenImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            pendingAttachment = {
                type: 'image',
                data: ev.target.result,
                name: file.name
            };
            previewImg.src = ev.target.result;
            previewImg.style.display = 'block';
            previewText.textContent = file.name;
            previewArea.classList.remove('hidden');
        };
        reader.readAsDataURL(file);

        actionMenu.classList.remove('active');
    });

    btnFile.addEventListener('click', () => hiddenFileInput.click());

    hiddenFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        pendingAttachment = {
            type: 'file',
            url: URL.createObjectURL(file),
            name: file.name
        };

        previewImg.style.display = 'none';
        previewText.innerHTML = `📎 ${file.name}`;
        previewArea.classList.remove('hidden');

        actionMenu.classList.remove('active');
    });

    btnImport.addEventListener('click', () => {
        const url = prompt('Google Doc URL:');
        if (!url) return;

        pendingAttachment = {
            type: 'gdoc',
            url
        };

        previewImg.style.display = 'none';
        previewText.innerHTML = `📄 Google Doc`;
        previewArea.classList.remove('hidden');

        actionMenu.classList.remove('active');
    });

    clearPreviewBtn.addEventListener('click', () => {
        pendingAttachment = null;
        hiddenImageInput.value = '';
        hiddenFileInput.value = '';
        previewArea.classList.add('hidden');
    });

    function saveNotes() {
        const notes = [...notesStream.querySelectorAll('.note-container')]
            .map(n => n.outerHTML);
        localStorage.setItem('savedNotes', JSON.stringify(notes));
    }

    function restoreNotes() {
        const saved = JSON.parse(localStorage.getItem('savedNotes') || '[]');
        notesStream.innerHTML = '';

        saved.forEach(html => {
            notesStream.insertAdjacentHTML('beforeend', html);
        });

        notesStream.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = () => {
                const parent = btn.closest('.note-container');
                parent.style.opacity = '0';
                parent.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    parent.remove();
                    saveNotes();
                }, 300);
            };
        });
    }

    restoreNotes();

    function createNote() {
        const text = inputField.value.trim();
        if (!text && !pendingAttachment) return;

        const now = new Date();
        const dateStr = now.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-container';

        let textHTML = text ? `<div>${text}</div>` : '';
        let attachmentHTML = '';

        if (pendingAttachment) {
            if (pendingAttachment.type === 'image') {
                attachmentHTML = `
                    <div class="media-container">
                        <a href="${pendingAttachment.data}" download="${pendingAttachment.name}">
                            <img src="${pendingAttachment.data}" class="note-image">
                        </a>
                    </div>`;
            } else if (pendingAttachment.type === 'file') {
                attachmentHTML = `
                    <a href="${pendingAttachment.url}" download="${pendingAttachment.name}" class="note-file">
                        📎 ${pendingAttachment.name}
                    </a>`;
            } else if (pendingAttachment.type === 'gdoc') {
                attachmentHTML = `
                    <a href="${pendingAttachment.url}" target="_blank" class="note-file" style="color:#4dabf7;">
                        📄 Google Doc
                    </a>`;
            }
        }

        noteDiv.innerHTML = `
            <div class="note-date">${dateStr}</div>
            <div class="note-card">
                <button class="delete-btn">✕</button>
                ${textHTML}
                ${attachmentHTML}
            </div>
        `;

        if (pendingAttachment?.type === 'table') {
            noteDiv.querySelector('.note-card').appendChild(pendingAttachment.element);
            lockTable(pendingAttachment.element);
        }

        noteDiv.querySelector('.delete-btn').onclick = () => {
            noteDiv.style.opacity = '0';
            noteDiv.style.transform = 'scale(0.9)';
            setTimeout(() => {
                noteDiv.remove();
                saveNotes();
            }, 300);
        };

        notesStream.appendChild(noteDiv);
        notesStream.scrollTo({ top: notesStream.scrollHeight, behavior: 'smooth' });

        inputField.value = '';
        clearPreviewBtn.click();
        saveNotes();
    }

    sendBtn.addEventListener('click', createNote);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createNote();
    });

    function lockTable(container) {
        container.querySelectorAll('td').forEach(td => {
            td.contentEditable = 'false';
            td.style.cursor = 'default';
        });
    }

    inputField.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();

            const tableContainer = document.createElement('div');
            tableContainer.style.marginTop = '10px';
            tableContainer.style.padding = '6px';
            tableContainer.style.display = 'inline-block';
            tableContainer.style.color = '#FFF';

            const table = document.createElement('table');
            table.style.borderCollapse = 'separate';
            table.style.borderSpacing = '0';
            table.style.overflow = 'hidden';

            for (let i = 0; i < 10; i++) {
                const tr = document.createElement('tr');
                for (let j = 0; j < 10; j++) {
                    const td = document.createElement('td');
                    td.contentEditable = 'true';
                    td.style.width = '26px';
                    td.style.height = '26px';
                    td.style.textAlign = 'center';
                    td.style.color = '#FFF';
                    td.style.border = '0.3px solid rgba(255,255,255,0.3)';
                    tr.appendChild(td);
                }
                table.appendChild(tr);
            }

            tableContainer.appendChild(table);
            previewArea.innerHTML = '';
            previewArea.appendChild(tableContainer);
            previewArea.classList.remove('hidden');

            pendingAttachment = {
                type: 'table',
                element: tableContainer
            };
        }
    });

    const copyMenu = document.getElementById('copy-menu');
    let selectedText = '';
    let hideTimeout; // ← ДОДАНО
    
    document.addEventListener('dblclick', (e) => {
        const note = e.target.closest('.note-card');
        if (!note) return;
    
        selectedText = note.innerText.replace('✕', '').trim();
    
        copyMenu.classList.remove('hidden');
        copyMenu.style.left = e.pageX + 'px';
        copyMenu.style.top = e.pageY + 'px';
    
        requestAnimationFrame(() => {
            copyMenu.classList.add('show');
        });
    
        // 🔥 АВТОЗНИКНЕННЯ ЧЕРЕЗ 1.5 С
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            copyMenu.classList.remove('show');
            setTimeout(() => copyMenu.classList.add('hidden'), 200);
        }, 1500);
    });
    
    copyMenu.addEventListener('click', () => {
        navigator.clipboard.writeText(selectedText);
        copyMenu.classList.remove('show');
        setTimeout(() => copyMenu.classList.add('hidden'), 200);
    });
// =========================
// СИСТЕМА ПАПОК (СПЛИВАЮЧИЙ ФРЕЙМ)
// =========================

// контейнер папок
const folderContainer = document.querySelector('.folder_div');

// заголовок "Мої папки"
const folderTitle = folderContainer.querySelector('.infolder_h3');

// створюємо кнопку "+"
const addFolderBtn = document.createElement('span');
addFolderBtn.textContent = '+';
addFolderBtn.style.cursor = 'pointer';
addFolderBtn.style.marginLeft = '8px';
addFolderBtn.style.fontSize = '20px';
addFolderBtn.title = 'Створити папку';
folderTitle.appendChild(addFolderBtn);

// створюємо спливаючий фрейм (модальне вікно)
const modal = document.createElement('div');
modal.style.position = 'fixed';
modal.style.top = '0';
modal.style.left = '0';
modal.style.width = '100%';
modal.style.height = '100%';
modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
modal.style.display = 'none';
modal.style.justifyContent = 'center';
modal.style.alignItems = 'center';
modal.style.zIndex = '1000';

const modalContent = document.createElement('div');
modalContent.classList.add('glass-panel'); // додаємо клас
modalContent.style.padding = '20px';
modalContent.style.borderRadius = '30px'; // radius 30
modalContent.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
modalContent.style.textAlign = 'center';
modalContent.style.minWidth = '250px';


const input = document.createElement('input');
input.type = 'text';
input.placeholder = 'Назва папки';
input.style.width = '80%';
input.style.padding = '5px';
input.style.marginBottom = '10px';

const btnCreate = document.createElement('button');
btnCreate.textContent = 'Створити';
btnCreate.style.marginRight = '10px';

const btnCancel = document.createElement('button');
btnCancel.textContent = 'Відмінити';

modalContent.appendChild(input);
modalContent.appendChild(document.createElement('br'));
modalContent.appendChild(btnCreate);
modalContent.appendChild(btnCancel);
modal.appendChild(modalContent);
document.body.appendChild(modal);

// функція створення папки
function createFolder(name) {
    const div = document.createElement('div');
    div.className = 'glass-panel folder';

    const p = document.createElement('p');
    p.textContent = name;

    div.appendChild(p);
    folderContainer.appendChild(div);
}

// завантаження папок
function loadFolders() {
    const saved = JSON.parse(localStorage.getItem('folders') || '[]');
    saved.forEach(name => createFolder(name));
}

// відкриття модалки
addFolderBtn.addEventListener('click', () => {
    input.value = '';
    modal.style.display = 'flex';
    input.focus();
});

// створення папки через модалку
btnCreate.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) return;

    createFolder(name);

    const saved = JSON.parse(localStorage.getItem('folders') || '[]');
    saved.push(name);
    localStorage.setItem('folders', JSON.stringify(saved));

    modal.style.display = 'none';
});

// закриття модалки
btnCancel.addEventListener('click', () => {
    modal.style.display = 'none';
});

// закриття при кліку поза контентом
modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
});

// старт
loadFolders();
/* =========================================================
   ДОДАТКОВО: ВИДАЛЕННЯ ПАПОК
   ========================================================= */

// додаємо хрестик видалення для всіх папок
function injectFolderDeleteButtons() {
    document.querySelectorAll('.folder').forEach(folderDiv => {
        if (folderDiv.querySelector('.delete-folder-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'delete-folder-btn';
        btn.textContent = '✕';
        btn.style.position = 'absolute';
        btn.style.top = '4px';
        btn.style.right = '8px';
        btn.style.border = 'none';
        btn.style.background = 'transparent';
        btn.style.color = 'white';
        btn.style.fontSize = '16px';
        btn.style.cursor = 'pointer';
        btn.onclick = e => {
            e.stopPropagation();
            deleteFolder(folderDiv);
        };

        folderDiv.style.position = 'relative';
        folderDiv.appendChild(btn);
    });
}

// функція видалення папки
function deleteFolder(folderDiv) {
    const folderName = folderDiv.querySelector('p').innerText.trim();

    // видаляємо з localStorage
    let saved = JSON.parse(localStorage.getItem('folders') || '[]');
    saved = saved.filter(name => name !== folderName);
    localStorage.setItem('folders', JSON.stringify(saved));

    // видаляємо нотатки з цієї папки з noteFolderMap
    let noteFolderMap = JSON.parse(localStorage.getItem('noteFolderMap') || '{}');
    delete noteFolderMap[folderName];
    localStorage.setItem('noteFolderMap', JSON.stringify(noteFolderMap));

    // видаляємо елемент з DOM
    folderDiv.remove();
}

// викликаємо функцію після рендера
injectFolderDeleteButtons();

// слідкуємо за новими папками
const folderObs = new MutationObserver(() => injectFolderDeleteButtons());
folderObs.observe(document.querySelector('.folder_div'), { childList: true });
/* =========================================================
   ДОДАТКОВО: СИСТЕМА ПОШУКУ НОТАТОК
   ========================================================= */

const searchInput = document.querySelector('.search input');

if (searchInput) {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();

        const allNotes = document.querySelectorAll('.note-container');

        allNotes.forEach(note => {
            const text = note.innerText.replace('✕', '').trim().toLowerCase();
            
            if (!query) {
                // якщо поле пусте, показуємо всі нотатки
                note.style.display = '';
            } else {
                // якщо нотатка містить запит, показуємо її, інакше ховаємо
                note.style.display = text.includes(query) ? '' : 'none';
            }
        });
    });
}
/* =========================================================
   СИСТЕМА ПРИВ'ЯЗКИ НОТАТОК ДО ПАПОК (ДОДАТОК)
   ========================================================= */

// 1. Додаємо унікальні ID нотаткам, щоб база знала, що куди додавати
function assignNoteIds() {
    const notes = document.querySelectorAll('.note-container');
    notes.forEach((note, index) => {
        if (!note.dataset.id) {
            note.dataset.id = 'note-' + Date.now() + '-' + index;
        }
    });
    // Оновлюємо збереження в базі, щоб ID зафіксувалися
    const notesHTML = [...document.getElementById('notesStream').querySelectorAll('.note-container')]
        .map(n => n.outerHTML);
    localStorage.setItem('savedNotes', JSON.stringify(notesHTML));
}

// 2. Створюємо вікно вибору нотаток (Фрейм)
const selectModal = document.createElement('div');
selectModal.id = 'noteSelectionModal';
selectModal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.6); display: none; justify-content: center;
    align-items: center; z-index: 2000; backdrop-filter: blur(5px);
`;

const selectContent = document.createElement('div');
selectContent.classList.add('glass-panel');
selectContent.style.cssText = `
    padding: 25px; border-radius: 15px; width: 300px; max-height: 60vh; 
    overflow-y: auto; text-align: center; color: white; border: 1px solid rgba(255,255,255,0.1);
`;
selectModal.appendChild(selectContent);
document.body.appendChild(selectModal);

// 3. Функція для відображення нотаток всередині папки (Зменшені картки)
function renderSidebarNotes(folderDiv, folderName) {
    // Видаляємо старі, щоб не дублювались при оновленні
    folderDiv.querySelectorAll('.mini-note-card').forEach(el => el.remove());

    const mapping = JSON.parse(localStorage.getItem('folderNoteMapping') || '{}');
    const noteIds = mapping[folderName] || [];

    noteIds.forEach(id => {
        // Шукаємо текст оригінальної нотатки
        const originalNote = document.querySelector(`.note-container[data-id="${id}"]`);
        let text = "📎 Медіа/Файл";
        if (originalNote) {
            const noteText = originalNote.querySelector('.note-card div');
            if (noteText) text = noteText.innerText.substring(0, 20) + '...';
        }

        const miniCard = document.createElement('div');
        miniCard.className = 'glass-panel folder mini-note-card'; // Твої класи
        miniCard.style.cssText = `
            font-size: 12px; margin-top: 8px; height: auto; padding: 10px;
            padding-bottom: 10px; cursor: default; position: relative; width: 90%; margin-left: 5%;
        `;
        miniCard.innerHTML = `<span>${text}</span>`;

        // Хрестик для видалення з папки
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '✕';
        removeBtn.style.cssText = `
            position: absolute; right: 8px; top: 8px; background: none; border: none;
            color: #ff4d4d; cursor: pointer; font-size: 10px;
        `;
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeNoteFromFolder(folderName, id);
        };

        miniCard.appendChild(removeBtn);
        folderDiv.appendChild(miniCard);
    });
}

// 4. Додаємо кнопку "+" до кожної папки
function injectPlusButtons() {
    document.querySelectorAll('.folder').forEach(folderDiv => {
        // Якщо це вже міні-картка або кнопка вже є — пропускаємо
        if (folderDiv.classList.contains('mini-note-card') || folderDiv.querySelector('.add-note-to-f')) return;

        const folderName = folderDiv.querySelector('p')?.innerText.trim();
        if (!folderName) return;

        const plusBtn = document.createElement('button');
        plusBtn.className = 'add-note-to-f';
        plusBtn.innerHTML = '+';
        plusBtn.style.cssText = `
            position: absolute; top: 2px; right: 35px; background: none; border: none;
            color: #ffffffff; cursor: pointer; font-size: 20px; font-weight: bold;
        `;

        plusBtn.onclick = (e) => {
            e.stopPropagation();
            openNoteSelector(folderName);
        };

        folderDiv.appendChild(plusBtn);
        // Відразу малюємо вкладені нотатки при завантаженні
        renderSidebarNotes(folderDiv, folderName);
    });
}

// 5. Логіка вибору нотатки
function openNoteSelector(folderName) {
    assignNoteIds(); // Гарантуємо, що у нотаток є ID
    selectContent.innerHTML = `<h4 style="margin-bottom:15px;">Додати до "${folderName}"</h4>`;
    
    const allNotes = document.querySelectorAll('.note-container');
    if (allNotes.length === 0) {
        selectContent.innerHTML += '<p style="font-size:12px; opacity:0.6;">Немає нотаток</p>';
    }

    allNotes.forEach(note => {
        const id = note.dataset.id;
        const text = note.querySelector('.note-card div')?.innerText.substring(0, 25) || "📎 Медіа нотатка";
        
        const item = document.createElement('div');
        item.style.cssText = 'padding: 10px; margin-bottom: 5px; background: rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer; font-size: 13px;';
        item.innerText = text + '...';
        
        item.onclick = () => {
            saveNoteToFolder(folderName, id);
            selectModal.style.display = 'none';
        };
        selectContent.appendChild(item);
    });

    const close = document.createElement('button');
    close.innerText = 'Закрити';
    close.style.cssText = 'margin-top: 15px; background: none; border: 1px solid white; color: white; padding: 5px 10px; border-radius: 10px; cursor: pointer;';
    close.onclick = () => selectModal.style.display = 'none';
    selectContent.appendChild(close);

    selectModal.style.display = 'flex';
}

// 6. Збереження та Видалення (База даних)
function saveNoteToFolder(folderName, noteId) {
    let mapping = JSON.parse(localStorage.getItem('folderNoteMapping') || '{}');
    if (!mapping[folderName]) mapping[folderName] = [];
    if (!mapping[folderName].includes(noteId)) mapping[folderName].push(noteId);
    localStorage.setItem('folderNoteMapping', JSON.stringify(mapping));
    refreshFolders();
}

function removeNoteFromFolder(folderName, noteId) {
    let mapping = JSON.parse(localStorage.getItem('folderNoteMapping') || '{}');
    if (mapping[folderName]) {
        mapping[folderName] = mapping[folderName].filter(id => id !== noteId);
        localStorage.setItem('folderNoteMapping', JSON.stringify(mapping));
    }
    refreshFolders();
}

function refreshFolders() {
    document.querySelectorAll('.folder').forEach(folderDiv => {
        const name = folderDiv.querySelector('p')?.innerText.trim();
        if (name) renderSidebarNotes(folderDiv, name);
    });
}

// Запуск системи через MutationObserver (щоб працювало і для нових папок)
const plusObs = new MutationObserver(() => injectPlusButtons());
plusObs.observe(document.querySelector('.folder_div'), { childList: true });
injectPlusButtons(); 
assignNoteIds();
});





