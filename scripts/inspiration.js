function renderInspirations() {
    const inspirations = Storage.inspirations.getAll();
    inspirations.sort((a, b) => b.createdAt - a.createdAt);
    
    let html = '';
    
    inspirations.forEach(inspiration => {
        const title = inspiration.title || '无标题';
        const displayTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;
        const dateStr = new Date(inspiration.createdAt).toLocaleDateString('zh-CN');
        
        html += `
            <div class="inspiration-card" onclick="editInspiration('${inspiration.id}')">
                <button class="inspiration-delete" onclick="event.stopPropagation(); deleteInspiration('${inspiration.id}')">✕</button>
                <div class="inspiration-title">${displayTitle}</div>
                <div class="inspiration-date">${dateStr}</div>
            </div>
        `;
    });
    
    if (inspirations.length === 0) {
        html = `<div class="empty-state">暂无灵感记录，点击上方按钮记录灵感</div>`;
    }
    
    document.getElementById('inspiration-grid').innerHTML = html;
}

function showInspirationEditor(inspirationId = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    const inspiration = inspirationId ? Storage.inspirations.getById(inspirationId) : null;
    
    modalTitle.textContent = inspiration ? '编辑灵感' : '记录灵感';
    modalBody.innerHTML = `
        <div class="editor-container">
            <div class="editor-toolbar">
                <button class="toolbar-btn" onclick="execFormat('bold')" title="加粗">B</button>
                <button class="toolbar-btn" onclick="execFormat('italic')" title="斜体">I</button>
                <button class="toolbar-btn" onclick="execFormat('underline')" title="下划线">U</button>
                <button class="toolbar-btn" onclick="execFormat('strikeThrough')" title="删除线">S</button>
                <div style="width: 1px; height: 24px; background: #ddd; margin: 0 5px;"></div>
                <button class="toolbar-btn" onclick="execFormat('insertUnorderedList')" title="无序列表">☰</button>
                <button class="toolbar-btn" onclick="execFormat('insertOrderedList')" title="有序列表">☷</button>
                <button class="toolbar-btn" onclick="execFormat('outdent')" title="减少缩进">⇦</button>
                <button class="toolbar-btn" onclick="execFormat('indent')" title="增加缩进">⇨</button>
                <div style="width: 1px; height: 24px; background: #ddd; margin: 0 5px;"></div>
                <button class="toolbar-btn" onclick="execFormat('justifyLeft')" title="左对齐">↺</button>
                <button class="toolbar-btn" onclick="execFormat('justifyCenter')" title="居中">↻</button>
                <button class="toolbar-btn" onclick="execFormat('justifyRight')" title="右对齐">↻</button>
                <div style="width: 1px; height: 24px; background: #ddd; margin: 0 5px;"></div>
                <button class="toolbar-btn" onclick="insertLink()" title="插入链接">🔗</button>
                <button class="toolbar-btn" onclick="insertImage()" title="插入图片">🖼️</button>
                <button class="toolbar-btn" onclick="insertAudio()" title="插入音频">🎵</button>
            </div>
            <div class="editor-content" id="inspiration-editor" contenteditable="true">${inspiration ? inspiration.content : ''}</div>
            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
                <button type="button" class="btn-primary" onclick="saveInspiration('${inspirationId || ''}')">保存</button>
            </div>
        </div>
    `;
    
    document.getElementById('modal-overlay').classList.add('show');
}

function execFormat(command) {
    document.execCommand(command, false, null);
    document.getElementById('inspiration-editor').focus();
}

function insertLink() {
    const url = prompt('请输入链接地址：', 'https://');
    if (url) {
        document.execCommand('createLink', false, url);
    }
    document.getElementById('inspiration-editor').focus();
}

function insertImage() {
    const url = prompt('请输入图片地址：', 'https://');
    if (url) {
        document.execCommand('insertImage', false, url);
    }
    document.getElementById('inspiration-editor').focus();
}

function insertAudio() {
    const url = prompt('请输入音频地址：', 'https://');
    if (url) {
        const editor = document.getElementById('inspiration-editor');
        const audio = document.createElement('audio');
        audio.src = url;
        audio.controls = true;
        audio.style.width = '100%';
        editor.appendChild(audio);
    }
    document.getElementById('inspiration-editor').focus();
}

function saveInspiration(inspirationId) {
    const editor = document.getElementById('inspiration-editor');
    const content = editor.innerHTML;
    
    let title = '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.innerText || '';
    const lines = textContent.split('\n');
    
    for (let line of lines) {
        line = line.trim();
        if (line) {
            title = line;
            break;
        }
    }
    
    if (!title) {
        title = '无标题';
    }
    
    if (inspirationId) {
        Storage.inspirations.update(inspirationId, { title, content });
    } else {
        Storage.inspirations.add({ title, content });
    }
    
    closeModal();
    renderInspirations();
}

function editInspiration(inspirationId) {
    showInspirationEditor(inspirationId);
}

function deleteInspiration(inspirationId) {
    if (!confirm('确定要删除这条灵感吗？')) return;
    Storage.inspirations.delete(inspirationId);
    renderInspirations();
}