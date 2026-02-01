/**
 * Screenshot.js - 截图功能模块
 * 负责屏幕截图、区域选择、截图保存等功能
 */

class ScreenshotManager {
    constructor() {
        this.isSelecting = false;
        this.startPoint = null;
        this.selectionBox = null;
        this.overlay = null;
        this.toolbar = null;
        this.selectedRect = null;
    }

    /**
     * 开始截图模式
     */
    startScreenshot() {
        // 隐藏工具栏
        this.hideToolbar();
        
        // 创建遮罩层
        this.createOverlay();
        
        // 创建选择框
        this.createSelectionBox();
        
        // 创建底部工具栏
        this.createToolbar();
        
        // 绑定事件
        this.bindEvents();
    }

    /**
     * 隐藏工具栏
     */
    hideToolbar() {
        const toolbar = document.querySelector('.toolbar-container');
        if (toolbar) {
            toolbar.style.opacity = '0';
            toolbar.style.pointerEvents = 'none';
        }
        
        // 隐藏浮动控件
        const floatingControls = document.querySelector('.floating-controls');
        if (floatingControls) {
            floatingControls.style.opacity = '0';
            floatingControls.style.pointerEvents = 'none';
        }
        
        // 隐藏动态岛
        const dynamicIsland = document.querySelector('.dynamic-island');
        if (dynamicIsland) {
            dynamicIsland.style.opacity = '0';
        }
    }

    /**
     * 显示工具栏
     */
    showToolbar() {
        const toolbar = document.querySelector('.toolbar-container');
        if (toolbar) {
            toolbar.style.opacity = '1';
            toolbar.style.pointerEvents = 'auto';
        }
        
        const floatingControls = document.querySelector('.floating-controls');
        if (floatingControls) {
            floatingControls.style.opacity = '1';
            floatingControls.style.pointerEvents = 'auto';
        }
        
        const dynamicIsland = document.querySelector('.dynamic-island');
        if (dynamicIsland) {
            dynamicIsland.style.opacity = '1';
        }
    }

    /**
     * 创建遮罩层
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            cursor: crosshair;
        `;
        document.body.appendChild(this.overlay);
    }

    /**
     * 创建选择框
     */
    createSelectionBox() {
        this.selectionBox = document.createElement('div');
        this.selectionBox.style.cssText = `
            position: fixed;
            border: 2px solid #4CAF50;
            background: rgba(76, 175, 80, 0.1);
            z-index: 1001;
            display: none;
            pointer-events: none;
        `;
        document.body.appendChild(this.selectionBox);
    }

    /**
     * 创建底部工具栏
     */
    createToolbar() {
        this.toolbar = document.createElement('div');
        this.toolbar.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(40, 40, 40, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 12px 24px;
            display: flex;
            gap: 16px;
            z-index: 1002;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1);
        `;

        this.toolbar.innerHTML = `
            <button id="screenshot-cancel" style="
                padding: 8px 16px;
                background: rgba(255,255,255,0.1);
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            ">取消</button>
            <button id="screenshot-confirm" style="
                padding: 8px 16px;
                background: #4CAF50;
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
                opacity: 0.5;
                pointer-events: none;
            ">确认</button>
        `;

        document.body.appendChild(this.toolbar);

        // 绑定工具栏事件
        this.toolbar.querySelector('#screenshot-cancel').addEventListener('click', () => {
            this.cancelScreenshot();
        });

        this.toolbar.querySelector('#screenshot-confirm').addEventListener('click', () => {
            this.confirmScreenshot();
        });
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        this.onMouseDown = (e) => {
            if (e.target === this.overlay) {
                this.isSelecting = true;
                this.startPoint = { x: e.clientX, y: e.clientY };
                this.selectionBox.style.display = 'block';
                this.selectionBox.style.left = e.clientX + 'px';
                this.selectionBox.style.top = e.clientY + 'px';
                this.selectionBox.style.width = '0px';
                this.selectionBox.style.height = '0px';
            }
        };

        this.onMouseMove = (e) => {
            if (!this.isSelecting || !this.startPoint) return;

            const currentX = e.clientX;
            const currentY = e.clientY;

            const left = Math.min(this.startPoint.x, currentX);
            const top = Math.min(this.startPoint.y, currentY);
            const width = Math.abs(currentX - this.startPoint.x);
            const height = Math.abs(currentY - this.startPoint.y);

            this.selectionBox.style.left = left + 'px';
            this.selectionBox.style.top = top + 'px';
            this.selectionBox.style.width = width + 'px';
            this.selectionBox.style.height = height + 'px';

            // 保存选中区域
            if (width > 10 && height > 10) {
                this.selectedRect = { left, top, width, height };
                const confirmBtn = this.toolbar.querySelector('#screenshot-confirm');
                confirmBtn.style.opacity = '1';
                confirmBtn.style.pointerEvents = 'auto';
            }
        };

        this.onMouseUp = () => {
            this.isSelecting = false;
        };

        this.overlay.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);

        // ESC键取消
        this.onKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.cancelScreenshot();
            }
        };
        document.addEventListener('keydown', this.onKeyDown);
    }

    /**
     * 取消截图
     */
    cancelScreenshot() {
        this.cleanup();
        this.showToolbar();
    }

    /**
     * 确认截图
     */
    confirmScreenshot() {
        if (!this.selectedRect) return;

        // 截取选中区域
        this.captureArea(this.selectedRect);
        this.cleanup();
        this.showToolbar();
    }

    /**
     * 截取指定区域
     */
    captureArea(rect) {
        const canvas = document.getElementById('main-canvas');
        if (!canvas) return;

        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = rect.width;
        tempCanvas.height = rect.height;

        // 考虑画布的缩放和偏移
        const canvasManager = window.canvasManager;
        const scale = canvasManager ? canvasManager.scale : 1;
        const offsetX = canvasManager ? canvasManager.offsetX : 0;
        const offsetY = canvasManager ? canvasManager.offsetY : 0;

        // 绘制选中区域
        tempCtx.drawImage(
            canvas,
            (rect.left - offsetX) / scale,
            (rect.top - offsetY) / scale,
            rect.width / scale,
            rect.height / scale,
            0,
            0,
            rect.width,
            rect.height
        );

        // 下载图片
        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `screenshot_${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('截图已保存', '#4CAF50');
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        if (this.toolbar) {
            this.toolbar.remove();
            this.toolbar = null;
        }

        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('keydown', this.onKeyDown);

        this.isSelecting = false;
        this.startPoint = null;
        this.selectedRect = null;
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
window.screenshotManager = new ScreenshotManager();
