document.addEventListener('DOMContentLoaded', () => {
    // =========================
    // ЕЛЕМЕНТИ ІНТЕРФЕЙСУ
    // =========================
    const inputField = document.getElementById('mainInput');
    const sendBtn = document.querySelector('.return-btn');
    const clipBtn = document.querySelector('.clip-btn');
    const actionMenu = document.querySelector('.glass-actions-menu');
    const notesStream = document.getElementById('notesStream');

    // Кнопки дій
    const btnImage = document.getElementById('btnImage');
    const btnFile = document.getElementById('btnFile');
    const btnImport = document.getElementById('btnImport');

    // Приховані поля
    const hiddenImageInput = document.getElementById('hiddenImageInput');
    const hiddenFileInput = document.getElementById('hiddenFileInput');

    // Превʼю
    const previewArea = document.getElementById('preview-area');
    const previewImg = document.getElementById('preview-img');
    const previewText = document.getElementById('preview-text');
    const clearPreviewBtn = document.getElementById('clear-preview');

    let pendingAttachment = null;

    // =========================
    // 1. МЕНЮ СКРІПКИ
    // =========================
    clipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        actionMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!clipBtn.contains(e.target) && !actionMenu.contains(e.target)) {
            actionMenu.classList.remove('active');
        }
    });

    // =========================
    // 2. КАРТИНКИ
    // =========================
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

    // =========================
    // 3. ФАЙЛИ
    // =========================
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

    // =========================
    // 4. ІМПОРТ
    // =========================
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

    // =========================
    // 5. ОЧИЩЕННЯ ПРЕВʼЮ
    // =========================
    clearPreviewBtn.addEventListener('click', () => {
        pendingAttachment = null;
        hiddenImageInput.value = '';
        hiddenFileInput.value = '';
        previewArea.classList.add('hidden');
    });

    // =========================
    // 6. LOCALSTORAGE
    // =========================
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

    // =========================
    // 7. СТВОРЕННЯ НОТАТКИ
    // =========================
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

    // =========================
    // 8. ПОШУК НОТАТОК
    // =========================
    const searchInput = document.querySelector('.search input');

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const notes = notesStream.querySelectorAll('.note-container');

        notes.forEach(note => {
            const text = note.innerText.toLowerCase();
            note.style.display = text.includes(query) ? '' : 'none';
        });
    });
// =========================
// КОНТЕКСТНЕ МЕНЮ (DOUBLE CLICK)
// =========================
const copyMenu = document.getElementById('copy-menu');
let selectedText = '';

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

    // Автоматично ховаємо меню через 2 секунди
    setTimeout(() => {
        copyMenu.classList.remove('show');
        setTimeout(() => copyMenu.classList.add('hidden'), 150);
    }, 1500);
});

copyMenu.addEventListener('click', () => {
    navigator.clipboard.writeText(selectedText);
    copyMenu.classList.remove('show');
    setTimeout(() => copyMenu.classList.add('hidden'), 200);
});

});

