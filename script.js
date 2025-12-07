document.addEventListener('DOMContentLoaded', () => {
    // Елементи інтерфейсу
    const inputField = document.getElementById('mainInput');
    const sendBtn = document.querySelector('.return-btn');
    const clipBtn = document.querySelector('.clip-btn');
    const actionMenu = document.querySelector('.glass-actions-menu');
    const notesStream = document.getElementById('notesStream');
    
    // Кнопки дій (кліп)
    const btnImage = document.getElementById('btnImage');
    const btnFile = document.getElementById('btnFile');
    const btnImport = document.getElementById('btnImport');

    // Приховані поля
    const hiddenImageInput = document.getElementById('hiddenImageInput');
    const hiddenFileInput = document.getElementById('hiddenFileInput');
    
    // Зона прев'ю
    const previewArea = document.getElementById('preview-area');
    const previewImg = document.getElementById('preview-img');
    const previewText = document.getElementById('preview-text');
    const clearPreviewBtn = document.getElementById('clear-preview');

    let pendingAttachment = null; 

    // --- 1. Меню скріпки ---
    clipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        actionMenu.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
        if (!clipBtn.contains(e.target) && !actionMenu.contains(e.target)) {
            actionMenu.classList.remove('active');
        }
    });

    // --- 2. Обробка картинок ---
    btnImage.addEventListener('click', () => hiddenImageInput.click());
    hiddenImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                pendingAttachment = { type: 'image', data: readerEvent.target.result, name: file.name };
                previewImg.src = readerEvent.target.result;
                previewImg.style.display = 'block';
                previewText.textContent = file.name;
                previewArea.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
        actionMenu.classList.remove('active');
    });

    // --- 3. Обробка файлів ---
    btnFile.addEventListener('click', () => hiddenFileInput.click());
    hiddenFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileUrl = URL.createObjectURL(file);
            pendingAttachment = { type: 'file', url: fileUrl, name: file.name };
            previewImg.style.display = 'none';
            previewText.innerHTML = `📎 ${file.name}`;
            previewArea.classList.remove('hidden');
        }
        actionMenu.classList.remove('active');
    });

    // --- 4. Імпорт (заглушка) ---
    btnImport.addEventListener('click', () => {
        const url = prompt("Google Doc URL:");
        if (url) {
            pendingAttachment = { type: 'gdoc', url: url };
            previewImg.style.display = 'none';
            previewText.innerHTML = `📄 Link`;
            previewArea.classList.remove('hidden');
        }
        actionMenu.classList.remove('active');
    });

    // Очищення прев'ю
    clearPreviewBtn.addEventListener('click', () => {
        pendingAttachment = null;
        hiddenImageInput.value = "";
        hiddenFileInput.value = "";
        previewArea.classList.add('hidden');
    });

    // --- 5. ВІДПРАВКА ТА ВИДАЛЕННЯ ---
    function sendNote() {
        const text = inputField.value.trim();
        if (!text && !pendingAttachment) return;

        const now = new Date();
        const dateStr = now.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
        
        // Створення головного контейнера
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-container';

        let attachmentHTML = '';
        let textHTML = text ? `<div>${text}</div>` : '';

        // Генерація HTML для вкладень
        if (pendingAttachment) {
            if (pendingAttachment.type === 'image') {
                attachmentHTML = `
                    <div class="media-container">
                        <a href="${pendingAttachment.data}" download="${pendingAttachment.name}" class="download-link">
                            <img src="${pendingAttachment.data}" class="note-image">
                        </a>
                    </div>`;
            } else if (pendingAttachment.type === 'file') {
                attachmentHTML = `
                    <a href="${pendingAttachment.url}" download="${pendingAttachment.name}" class="note-file">
                        <span>📎</span>
                        <span>${pendingAttachment.name}</span>
                    </a>`;
            } else if (pendingAttachment.type === 'gdoc') {
                attachmentHTML = `
                    <a href="${pendingAttachment.url}" target="_blank" class="note-file" style="color:#4dabf7;">
                        <span>📄</span>
                        <span>Google Doc</span>
                    </a>`;
            }
        }

        // Заповнюємо HTML. 
        // ЗВЕРНИ УВАГУ: Додано <button class="delete-btn">
        noteDiv.innerHTML = `
            <div class="note-date">${dateStr}</div>
            <div class="note-card">
                <button class="delete-btn" title="Видалити">✕</button>
                ${textHTML}
                ${attachmentHTML}
            </div>
        `;

        // --- ЛОГІКА ВИДАЛЕННЯ ---
        // Знаходимо кнопку всередині тільки що створеної нотатки і вішаємо подію
        const deleteButton = noteDiv.querySelector('.delete-btn');
        deleteButton.addEventListener('click', () => {
            // Ефект зникнення перед видаленням (опціонально)
            noteDiv.style.opacity = '0';
            noteDiv.style.transform = 'scale(0.9)';
            setTimeout(() => {
                noteDiv.remove();
            }, 300); // Час має співпадати з CSS transition, якщо він є, або просто видаляємо
        });

        // Додаємо нотатку в стрічку
        notesStream.appendChild(noteDiv);
        notesStream.scrollTo({ top: notesStream.scrollHeight, behavior: 'smooth' });

        // Скидання полів
        inputField.value = '';
        clearPreviewBtn.click();
        
        const emptyState = document.querySelector('.empty-placeholder');
        if (emptyState) emptyState.remove();
    }

    sendBtn.addEventListener('click', sendNote);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendNote();
    });
});
