let draggedItem = null;
let itemCounter = 0;
let showFileName = false;
const STORAGE_KEY = 'ranking-tool-data';

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const poolItems = document.getElementById('poolItems');
    const tierContainers = document.querySelectorAll('.tier-items');
    const toggleBtn = document.getElementById('toggleFileName');
    const resetBtn = document.getElementById('resetBtn');

    loadFromStorage();

    fileInput.addEventListener('change', handleFileUpload);

    poolItems.addEventListener('dragover', handleDragOver);
    poolItems.addEventListener('dragleave', handleDragLeave);
    poolItems.addEventListener('drop', handleDrop);

    tierContainers.forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('drop', handleDrop);
    });

    toggleBtn.addEventListener('click', toggleFileNameDisplay);
    resetBtn.addEventListener('click', handleReset);
});

function removeFileExtension(fileName) {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex > 0) {
        return fileName.substring(0, lastDotIndex);
    }
    return fileName;
}

function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            processImage(file);
        }
    });
    event.target.value = '';
}

function processImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = Math.min(img.width, img.height);
            const x = (img.width - size) / 2;
            const y = (img.height - size) / 2;
            
            canvas.width = 300;
            canvas.height = 300;
            
            ctx.drawImage(img, x, y, size, size, 0, 0, 300, 300);
            
            const item = createItem(canvas.toDataURL('image/png'), removeFileExtension(file.name));
            document.getElementById('poolItems').appendChild(item);
            saveToStorage();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function createItem(imageUrl, fileName, existingId = null) {
    const item = document.createElement('div');
    item.className = 'item';
    item.draggable = true;
    if (existingId) {
        item.id = existingId;
        const idNum = parseInt(existingId.replace('item-', ''));
        if (idNum >= itemCounter) {
            itemCounter = idNum + 1;
        }
    } else {
        item.id = `item-${itemCounter++}`;
    }
    
    if (showFileName) {
        item.classList.add('show-file-name');
    }

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'item-image-wrapper';

    const img = document.createElement('img');
    img.src = imageUrl;
    imageWrapper.appendChild(img);
    item.appendChild(imageWrapper);

    const fileNameEl = document.createElement('div');
    fileNameEl.className = 'item-file-name';
    fileNameEl.textContent = fileName;
    item.appendChild(fileNameEl);

    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);

    return item;
}

function toggleFileNameDisplay() {
    showFileName = !showFileName;
    const toggleBtn = document.getElementById('toggleFileName');
    const allItems = document.querySelectorAll('.item');
    
    allItems.forEach(item => {
        if (showFileName) {
            item.classList.add('show-file-name');
        } else {
            item.classList.remove('show-file-name');
        }
    });
    
    toggleBtn.textContent = showFileName ? '隐藏文件名' : '显示文件名';
    localStorage.setItem('ranking-tool-show-filename', showFileName);
}

function handleReset(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const confirmed = confirm('确定要重置吗？所有图片和数据将被清空。');
    
    if (!confirmed) {
        return;
    }
    
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('ranking-tool-show-filename');
    
    const poolItems = document.getElementById('poolItems');
    poolItems.innerHTML = '';
    
    const tierContainers = document.querySelectorAll('.tier-items');
    tierContainers.forEach(container => {
        container.innerHTML = '';
    });
    
    itemCounter = 0;
    showFileName = false;
    
    const toggleBtn = document.getElementById('toggleFileName');
    toggleBtn.textContent = '显示文件名';
}

function getParentItem(element) {
    let current = element;
    while (current && !current.classList.contains('item')) {
        current = current.parentElement;
    }
    return current;
}

function handleDragStart(event) {
    const item = getParentItem(event.target);
    if (item) {
        draggedItem = item;
        item.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', item.id);
    }
}

function handleDragEnd(event) {
    const item = getParentItem(event.target) || draggedItem;
    if (item) {
        item.classList.remove('dragging');
    }
    draggedItem = null;
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');

    let item = draggedItem;
    if (!item) {
        const id = event.dataTransfer.getData('text/plain');
        item = document.getElementById(id);
    }

    if (item) {
        const afterElement = getDragAfterElement(event.currentTarget, event.clientX, event.clientY);
        if (afterElement == null) {
            event.currentTarget.appendChild(item);
        } else {
            event.currentTarget.insertBefore(item, afterElement);
        }
        saveToStorage();
    }
}

function getDragAfterElement(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveToStorage() {
    const data = {
        showFileName: showFileName,
        itemCounter: itemCounter,
        items: []
    };

    const poolItems = document.getElementById('poolItems');
    const poolChildren = poolItems.querySelectorAll('.item');
    poolChildren.forEach(item => {
        data.items.push({
            id: item.id,
            imageUrl: item.querySelector('img').src,
            fileName: item.querySelector('.item-file-name').textContent,
            location: 'pool'
        });
    });

    const tierContainers = document.querySelectorAll('.tier-items');
    tierContainers.forEach(container => {
        const tier = container.getAttribute('data-tier');
        const items = container.querySelectorAll('.item');
        items.forEach(item => {
            data.items.push({
                id: item.id,
                imageUrl: item.querySelector('img').src,
                fileName: item.querySelector('.item-file-name').textContent,
                location: tier
            });
        });
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
    const savedShowFileName = localStorage.getItem('ranking-tool-show-filename');
    if (savedShowFileName !== null) {
        showFileName = savedShowFileName === 'true';
        const toggleBtn = document.getElementById('toggleFileName');
        toggleBtn.textContent = showFileName ? '隐藏文件名' : '显示文件名';
    }

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return;

    try {
        const data = JSON.parse(savedData);
        showFileName = data.showFileName || false;
        itemCounter = data.itemCounter || 0;

        const toggleBtn = document.getElementById('toggleFileName');
        toggleBtn.textContent = showFileName ? '隐藏文件名' : '显示文件名';

        data.items.forEach(itemData => {
            const item = createItem(itemData.imageUrl, itemData.fileName, itemData.id);
            if (itemData.location === 'pool') {
                document.getElementById('poolItems').appendChild(item);
            } else {
                const container = document.querySelector(`.tier-items[data-tier="${itemData.location}"]`);
                if (container) {
                    container.appendChild(item);
                } else {
                    document.getElementById('poolItems').appendChild(item);
                }
            }
        });
    } catch (e) {
        console.error('Failed to load saved data:', e);
    }
}
