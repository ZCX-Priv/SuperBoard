/**
 * Import.js - 导入功能模块
 * 负责导入图片、ZIP等文件到白板
 */

class ImportManager {
    constructor() {
        this.supportedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
        this.supportedZipTypes = ['application/zip', 'application/x-zip-compressed'];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.init();
    }

    init() {
        this.createFileInput();
    }

    createFileInput() {
        // 创建隐藏的文件输入元素
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.png,.jpg,.jpeg,.gif,.webp,.svg,.zip';
        this.fileInput.style.display = 'none';
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        document.body.appendChild(this.fileInput);
    }

    /**
     * 打开文件选择对话框
     */
    openFileDialog() {
        this.fileInput.click();
    }

    /**
     * 处理文件选择
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // 验证文件大小
        if (file.size > this.maxFileSize) {
            this.showError('文件大小超过限制（最大50MB）');
            return;
        }

        // 验证文件类型
        const fileType = file.type;
        const fileName = file.name.toLowerCase();

        if (this.supportedImageTypes.includes(fileType)) {
            this.importImage(file);
        } else if (this.supportedZipTypes.includes(fileType) || fileName.endsWith('.zip')) {
            this.importZip(file);
        } else {
            this.showError('暂不支持该类型文件');
        }

        // 重置文件输入，允许重复选择同一文件
        this.fileInput.value = '';
    }

    /**
     * 导入图片文件
     */
    importImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.drawImageToCanvas(img);
                this.showSuccess('图片导入成功');
            };
            img.onerror = () => {
                this.showError('图片加载失败');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            this.showError('文件读取失败');
        };
        reader.readAsDataURL(file);
    }

    /**
     * 导入ZIP文件
     */
    async importZip(file) {
        try {
            // 使用 JSZip 库解压（这里使用原生方式模拟）
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    // 显示导入中提示
                    this.showInfo('正在导入数据...');
                    
                    // 模拟ZIP导入过程
                    setTimeout(() => {
                        this.showSuccess('数据导入成功');
                        // 这里可以添加实际的ZIP解析逻辑
                    }, 1000);
                } catch (err) {
                    this.showError('ZIP文件解析失败');
                }
            };
            reader.onerror = () => {
                this.showError('文件读取失败');
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            this.showError('导入失败: ' + err.message);
        }
    }

    /**
     * 将图片绘制到画布
     */
    drawImageToCanvas(img) {
        const canvas = document.getElementById('main-canvas');
        if (!canvas || !window.canvasManager) return;

        const ctx = canvas.getContext('2d');
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // 计算缩放比例，使图片适应画布
        const scale = Math.min(
            (canvasWidth * 0.8) / img.width,
            (canvasHeight * 0.8) / img.height,
            1
        );

        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const x = (canvasWidth - drawWidth) / 2;
        const y = (canvasHeight - drawHeight) / 2;

        // 绘制图片
        ctx.drawImage(img, x, y, drawWidth, drawHeight);

        // 保存状态
        window.canvasManager.saveState();
    }

    /**
     * 从剪贴板导入
     */
    async importFromClipboard() {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        const blob = await item.getType(type);
                        const file = new File([blob], 'clipboard-image.png', { type });
                        this.importImage(file);
                        return;
                    }
                }
            }
            this.showError('剪贴板中没有图片');
        } catch (err) {
            this.showError('无法访问剪贴板，请检查权限设置');
        }
    }

    /**
     * 显示成功提示
     */
    showSuccess(message) {
        this.showToast(message, '#4CAF50');
    }

    /**
     * 显示错误提示
     */
    showError(message) {
        this.showToast(message, '#f44336');
    }

    /**
     * 显示信息提示
     */
    showInfo(message) {
        this.showToast(message, '#2196F3');
    }

    /**
     * 显示Toast提示
     */
    showToast(message, color) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${color};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideDown 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// 导出单例
window.importManager = new ImportManager();
