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

    // --- 4. Імпорт ---
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

    // --- 5. ЗБЕРЕЖЕННЯ В localStorage ---
    function saveNotes() {
        const notes = [...notesStream.querySelectorAll('.note-container')]
            .map(n => n.outerHTML);
        localStorage.setItem("savedNotes", JSON.stringify(notes));
    }

    function restoreNotes() {
        const saved = JSON.parse(localStorage.getItem("savedNotes") || "[]");
        notesStream.innerHTML = "";
        saved.forEach(html => notesStream.insertAdjacentHTML("beforeend", html));

        // Повторна активація кнопок видалення
        notesStream.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = () => {
                const parent = btn.closest('.note-container');
                parent.style.opacity = "0";
                parent.style.transform = "scale(0.9)";
                setTimeout(() => {
                    parent.remove();
                    saveNotes();
                }, 300);
            };
        });
    }

    restoreNotes();

    // --- 6. СТВОРЕННЯ НОТАТКИ ---
    function createNote() {
        const text = inputField.value.trim();
        if (!text && !pendingAttachment) return;

        const now = new Date();
        const dateStr = now.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-container';

        let attachmentHTML = '';
        let textHTML = text ? `<div>${text}</div>` : '';

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

        noteDiv.innerHTML = `
            <div class="note-date">${dateStr}</div>
            <div class="note-card">
                <button class="delete-btn" title="Видалити">✕</button>
                ${textHTML}
                ${attachmentHTML}
            </div>
        `;

        // delete-кнопка
        noteDiv.querySelector('.delete-btn').onclick = () => {
            noteDiv.style.opacity = "0";
            noteDiv.style.transform = "scale(0.9)";
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

    // Події
    sendBtn.addEventListener('click', createNote);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createNote();
    });
});

(function(){
  const LIFESPAN = 400; // ms (0.4s)
  const SEG_FPS = 60;   // logical update frequency (used to size pool)
  const POOL_SIZE = Math.ceil((LIFESPAN/1000) * SEG_FPS) + 6; // запас
  const layer = document.getElementById('trailLayer');

  // Пул DOM-елементів (перевикористовуємо їх)
  const pool = [];
  for (let i=0;i<POOL_SIZE;i++){
    const d = document.createElement('div');
    d.className = 'trail-seg';
    d.style.opacity = '0';
    layer.appendChild(d);
    pool.push({el: d, used: false});
  }

  // Масив "частинок" — активних сегментів
  const active = [];

  let lastMouse = {x: window.innerWidth/2, y: window.innerHeight/2};
  let lastEmit = 0;
  const emitInterval = 1000 / 120; // намагатись емінтувати до 120/s при русі (але буде обмежено LIFESPAN)
  let isMoving = false;

  // Функція, що бере вільний елемент з пулу
  function acquireDOM(){
    for (const p of pool){
      if (!p.used){
        p.used = true;
        p.el.style.opacity = '1';
        p.el.style.transform = '';
        return p;
      }
    }
    // Якщо всі зайняті — переприсвоїмо найстаріший активний (щоб уникнути створення)
    if (active.length){
      const oldest = active.shift();
      return oldest.domRef;
    }
    return null;
  }

  // Звільнення елементу
  function releaseDOM(domRef){
    domRef.used = false;
    domRef.el.style.opacity = '0';
  }

  // При русі миші — оновлюємо курсор і помічаємо, що треба емінтувати
  document.addEventListener('mousemove', (e)=>{
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
    isMoving = true;
  });

  // Також емінтуємо при touch
  document.addEventListener('touchmove', (e)=>{
    const t = e.touches[0];
    if (!t) return;
    lastMouse.x = t.clientX;
    lastMouse.y = t.clientY;
    isMoving = true;
  }, {passive:true});

  // Основний цикл — emit + оновлення активних сегментів
  function loop(ts){
    // emit частинок з контролем частоти
    if (isMoving){
      if (ts - lastEmit >= emitInterval){
        emitSegment(lastMouse.x, lastMouse.y, ts);
        lastEmit = ts;
      }
    } else {
      // при відсутності руху можна повільніше емінтувати, але зазвичай нічого не робимо
    }

    // Оновлюємо кожен активний сегмент: позиція, оберт, opacity, scale
    const now = performance.now();
    for (let i = active.length - 1; i >= 0; i--){
      const p = active[i];
      const age = now - p.t0;
      if (age >= LIFESPAN){
        // видаляємо
        releaseDOM(p.domRef);
        active.splice(i,1);
        continue;
      }
      const norm = age / LIFESPAN; // 0..1
      // позиція інтерпольована між start і end (якщо є) - але ми зберігаємо direction при емісії
      const x = p.x;
      const y = p.y;
      const el = p.domRef.el;

      // масштаб і прозорість: ближче до кінця — менше і прозоріше
      const scale = 1 - 0.45 * norm; // зменшуємо до ~0.55
      const opacity = 1 - norm;      // лінійне згасання
      const width = 20 * (1 - 0.25*norm); // трохи зменшуємо ширину з віком
      const height = 8 * (1 - 0.25*norm);

      // оберт залежно від напрямку руху, щоб сегменти "лежали" по шляху
      const angle = p.angle;

      el.style.left = (x - width/2) + 'px';
      el.style.top = (y - height/2) + 'px';
      el.style.width = width + 'px';
      el.style.height = height + 'px';
      el.style.opacity = opacity;
      el.style.transform = `rotate(${angle}rad) scale(${scale})`;
    }

    // Зміна прапора руху: якщо давно не було mousemove — зрозуміємо що руху немає
    if (ts - lastEmit > 200) isMoving = false;

    requestAnimationFrame(loop);
  }

  // Функція емісії сегмента: визначає напрямок по попередньому сегменту для природнього розташування
  let lastEmitPos = {x: lastMouse.x, y: lastMouse.y};
  function emitSegment(x,y, ts){
    const dx = x - lastEmitPos.x;
    const dy = y - lastEmitPos.y;
    const dist = Math.hypot(dx,dy);

    // якщо рух дуже малий — все одно випускаємо, але з маленьким offset
    const angle = Math.atan2(dy,dx);

    // беремо DOM з пулу
    const domRef = acquireDOM();
    if (!domRef) return;

    // Невелика корекція позиції, щоб сегменти трохи розташовувались по лінії
    const offsetBack = Math.min(6, dist * 0.5);
    const px = x - Math.cos(angle) * offsetBack;
    const py = y - Math.sin(angle) * offsetBack;

    // Зберігаємо в масив активних
    active.push({
      t0: performance.now(),
      x: px,
      y: py,
      angle: angle,
      domRef: domRef
    });

    lastEmitPos.x = x;
    lastEmitPos.y = y;
  }

  // Старт циклу
  requestAnimationFrame(loop);

  // Додатково: реагуємо на resize, щоб уникнути проблем
  window.addEventListener('resize', () => {
    lastMouse.x = Math.min(lastMouse.x, window.innerWidth);
    lastMouse.y = Math.min(lastMouse.y, window.innerHeight);
  });
})();