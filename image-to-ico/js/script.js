// 全局变量
let selectedFiles = [];
let currentImage = null;
let generatedIcoBlob = null;

// DOM元素
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const customFilename = document.getElementById('customFilename');
const convertButton = document.getElementById('convertButton');
const originalCanvas = document.getElementById('originalCanvas');
const icoCanvas = document.getElementById('icoCanvas');

const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const downloadButton = document.getElementById('downloadButton');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');
const closeModal = document.querySelector('.close-modal');

// 初始化
function init() {
    setupEventListeners();
    updateDownloadButton();
    convertButton.disabled = false;
}

// 设置事件监听器
function setupEventListeners() {
    // 拖放上传
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    
    // 文件输入
    fileInput.addEventListener('change', handleFileInputChange);
    
    // 转换按钮
    convertButton.addEventListener('click', handleConvert);
    
    // 下载按钮
    downloadButton.addEventListener('click', handleDownload);
    
    // 错误模态框
    closeModal.addEventListener('click', hideError);
    window.addEventListener('click', (e) => {
        if (e.target === errorModal) hideError();
    });
}

// 处理拖放事件
function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    // 只处理第一个拖放的文件
    if (e.dataTransfer.files.length > 0) {
        const files = [e.dataTransfer.files[0]];
        processFiles(files);
    }
}

// 处理文件输入变化
function handleFileInputChange(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

// 处理文件列表
function processFiles(files) {
    if (files.length === 0) return;
    
    // 只处理第一个文件
    const file = files[0];
    
    // 验证文件
    if (!validateFile(file)) return;
    
    // 替换为新文件
    selectedFiles = [file];
    updateFileList();
    
    // 加载文件进行预览
    loadImage(file);
}

// 验证文件
function validateFile(file) {
    // 检查文件类型
    const validTypes = ['.png', '.jpg', '.jpeg', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
        showError(`不支持的文件类型: ${fileExtension}`);
        return false;
    }
    
    // 检查文件大小
    if (file.size > 10 * 1024 * 1024) {
        showError(`文件大小超过限制: ${formatFileSize(file.size)} > 10MB`);
        return false;
    }
    
    return true;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 更新文件列表
function updateFileList() {
    fileList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button class="remove-file" data-index="${index}">×</button>
        `;
        fileList.appendChild(fileItem);
    });
    
    // 添加删除文件事件监听器
    document.querySelectorAll('.remove-file').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            removeFile(index);
        });
    });
}

// 删除文件
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    
    // 如果删除的是当前显示的文件，加载下一个文件
    if (index === 0 && selectedFiles.length > 0) {
        loadImage(selectedFiles[0]);
    } else if (selectedFiles.length === 0) {
        currentImage = null;
        clearCanvases();
    }
}

// 加载图像
function loadImage(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            drawOriginalImage();
            updateICOPreview(256);
        };
        img.src = e.target.result;
    };
    
    reader.onerror = () => {
        showError('无法读取文件');
    };
    
    reader.readAsDataURL(file);
}



// 绘制原始图像
function drawOriginalImage() {
    if (!currentImage) return;
    
    const ctx = originalCanvas.getContext('2d');
    const canvasWidth = originalCanvas.parentElement.clientWidth;
    const canvasHeight = originalCanvas.parentElement.clientHeight;
    
    originalCanvas.width = canvasWidth;
    originalCanvas.height = canvasHeight;
    
    // 计算绘制位置和大小，保持比例
    const aspectRatio = currentImage.width / currentImage.height;
    let drawWidth, drawHeight;
    
    if (aspectRatio > 1) {
        drawWidth = Math.min(canvasWidth, canvasHeight * aspectRatio) * 0.9;
        drawHeight = drawWidth / aspectRatio;
    } else {
        drawHeight = Math.min(canvasHeight, canvasWidth / aspectRatio) * 0.9;
        drawWidth = drawHeight * aspectRatio;
    }
    
    const x = (canvasWidth - drawWidth) / 2;
    const y = (canvasHeight - drawHeight) / 2;
    
    // 绘制图像
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(currentImage, x, y, drawWidth, drawHeight);
}



// 处理转换
async function handleConvert() {
    if (!currentImage) {
        showError('请先选择一个图像文件');
        return;
    }
    
    const selectedSizes = [256];
    
    try {
        updateProgress(0, '开始转换...');
        const icoBlob = await generateICO(selectedSizes);
        generatedIcoBlob = icoBlob;
        updateProgress(100, '转换完成');
        updateDownloadButton();
        updateICOPreview(selectedSizes[selectedSizes.length - 1]);
    } catch (error) {
        console.error('转换错误:', error);
        showError('转换失败: ' + error.message);
        updateProgress(0, '转换失败');
    }
}

// 更新进度
function updateProgress(percentage, text) {
    progressBar.style.width = percentage + '%';
    progressText.textContent = text;
}

// 生成ICO文件
async function generateICO(sizes) {
    // ICO文件格式实现
    // 这里使用简化的实现，实际项目中可能需要更复杂的处理
    
    // 计算总大小
    let totalSize = 6 + sizes.length * 16; // 文件头 + 目录项
    const imageDataList = [];
    
    // 生成每个尺寸的图像数据
    for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i];
        updateProgress((i / sizes.length) * 80, `处理 ${size}×${size} 尺寸...`);
        
        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const ctx = tempCanvas.getContext('2d');
        
        // 绘制裁剪后的图像
        // 使用填充模式处理非1:1图像
        const aspectRatio = currentImage.width / currentImage.height;
        let drawWidth, drawHeight, drawX, drawY;
        
        if (aspectRatio > 1) {
            // 宽大于高，垂直居中
            drawHeight = size;
            drawWidth = size * aspectRatio;
            drawX = (size - drawWidth) / 2;
            drawY = 0;
        } else {
            // 高大于宽，水平居中
            drawWidth = size;
            drawHeight = size / aspectRatio;
            drawX = 0;
            drawY = (size - drawHeight) / 2;
        }
        
        // 填充背景为透明
        ctx.clearRect(0, 0, size, size);
        
        // 绘制图像
        ctx.drawImage(
            currentImage,
            0, 0, currentImage.width, currentImage.height,
            drawX, drawY, drawWidth, drawHeight
        );
        
        // 获取图像数据
        const imageData = await new Promise((resolve) => {
            tempCanvas.toBlob(resolve, 'image/png');
        });
        
        const imageBuffer = await imageData.arrayBuffer();
        imageDataList.push(imageBuffer);
        totalSize += imageBuffer.byteLength;
        
        // 模拟处理延迟
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 创建ICO文件缓冲区
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    // 写入文件头
    view.setUint16(0, 0, true); // 保留字
    view.setUint16(2, 1, true); // ICO类型
    view.setUint16(4, sizes.length, true); // 图像数量
    
    // 写入目录项和图像数据
    let offset = 6 + sizes.length * 16;
    
    for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i];
        const imageBuffer = imageDataList[i];
        
        // 写入目录项
        const dirOffset = 6 + i * 16;
        view.setUint8(dirOffset, size === 256 ? 0 : size); // 宽度
        view.setUint8(dirOffset + 1, size === 256 ? 0 : size); // 高度
        view.setUint8(dirOffset + 2, 0); // 颜色数
        view.setUint8(dirOffset + 3, 0); // 保留字
        view.setUint16(dirOffset + 4, 1, true); // 颜色平面
        view.setUint16(dirOffset + 6, 32, true); // 位深度
        view.setUint32(dirOffset + 8, imageBuffer.byteLength, true); // 大小
        view.setUint32(dirOffset + 12, offset, true); // 偏移
        
        // 写入图像数据
        const imageView = new Uint8Array(buffer, offset, imageBuffer.byteLength);
        imageView.set(new Uint8Array(imageBuffer));
        
        offset += imageBuffer.byteLength;
    }
    
    return new Blob([buffer], { type: 'image/x-icon' });
}

// 更新ICO预览
function updateICOPreview(size) {
    if (!currentImage) return;
    
    // 首先创建256×256的临时画布，模拟实际转换效果
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 256;
    tempCanvas.height = 256;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 使用填充模式处理非1:1图像（保持1:1比例，就像实际ICO文件）
    const aspectRatio = currentImage.width / currentImage.height;
    let drawWidth, drawHeight, drawX, drawY;
    
    if (aspectRatio > 1) {
        // 宽大于高，垂直居中
        drawHeight = 256;
        drawWidth = 256 * aspectRatio;
        drawX = (256 - drawWidth) / 2;
        drawY = 0;
    } else {
        // 高大于宽，水平居中
        drawWidth = 256;
        drawHeight = 256 / aspectRatio;
        drawX = 0;
        drawY = (256 - drawHeight) / 2;
    }
    
    // 填充背景为透明
    tempCtx.clearRect(0, 0, 256, 256);
    
    // 绘制图像到256×256画布
    tempCtx.drawImage(
        currentImage,
        0, 0, currentImage.width, currentImage.height,
        drawX, drawY, drawWidth, drawHeight
    );
    
    // 现在将256×256的画布绘制到预览区域
    const ctx = icoCanvas.getContext('2d');
    const canvasWidth = icoCanvas.parentElement.clientWidth;
    const canvasHeight = icoCanvas.parentElement.clientHeight;
    
    icoCanvas.width = canvasWidth;
    icoCanvas.height = canvasHeight;
    
    // 计算显示大小
    const displaySize = Math.min(canvasWidth, canvasHeight) * 0.8;
    const x = (canvasWidth - displaySize) / 2;
    const y = (canvasHeight - displaySize) / 2;
    
    // 绘制ICO预览（填充白色背景）
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, displaySize, displaySize);
    
    // 绘制256×256的图像
    ctx.drawImage(tempCanvas, x, y, displaySize, displaySize);
}

// 更新下载按钮
function updateDownloadButton() {
    downloadButton.disabled = !generatedIcoBlob;
}

// 处理下载
function handleDownload() {
    if (!generatedIcoBlob) return;
    
    // 生成文件名
    const filename = generateFilename();
    
    // 创建下载链接
    const url = URL.createObjectURL(generatedIcoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 生成文件名
function generateFilename() {
    if (customFilename.value.trim()) {
        return customFilename.value.trim() + '.ico';
    }
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `icon_${year}${month}${day}_${hours}${minutes}${seconds}.ico`;
}

// 显示错误
function showError(message) {
    errorMessage.textContent = message;
    errorModal.classList.add('show');
}

// 隐藏错误
function hideError() {
    errorModal.classList.remove('show');
}

// 清除画布
function clearCanvases() {
    const originalCtx = originalCanvas.getContext('2d');
    const icoCtx = icoCanvas.getContext('2d');
    
    originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    icoCtx.clearRect(0, 0, icoCanvas.width, icoCanvas.height);
}

// 初始化应用
window.addEventListener('DOMContentLoaded', init);

// 窗口大小变化时重绘
window.addEventListener('resize', drawOriginalImage);

// 实现Service Worker（离线功能）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(error => {
            console.log('Service Worker 注册失败:', error);
        });
    });
}
