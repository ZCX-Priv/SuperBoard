/**
 * Zoom.js - 页面缩放控制模块
 * 负责页面缩放、缩放控制栏显示/隐藏等功能
 */

class ZoomManager {
    constructor() {
        this.minZoom = 10;   // 最小10%
        this.maxZoom = 1000; // 最大1000%
        this.defaultZoom = 100; // 默认100%
        this.currentZoom = 100;
        this.zoomControl = null;
        this.zoomDisplay = null;
        this.isEditing = false;
        // 延迟初始化，等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.setupZoomControl();
        this.updateZoomDisplay();
        this.updateControlVisibility();
    }

    /**
     * 设置缩放控制
     */
    setupZoomControl() {
        const zoomControl = document.querySelector('.zoom-control');
        if (!zoomControl) return;

        this.zoomControl = zoomControl;
        const zoomOut = zoomControl.querySelector('span:first-child');
        const zoomIn = zoomControl.querySelector('span:last-child');
        this.zoomDisplay = zoomControl.querySelector('span:nth-child(2)');

        // 缩小按钮
        if (zoomOut) {
            zoomOut.addEventListener('click', () => {
                this.zoomOut();
            });
        }

        // 放大按钮
        if (zoomIn) {
            zoomIn.addEventListener('click', () => {
                this.zoomIn();
            });
        }

        // 单击编辑数字
        if (this.zoomDisplay) {
            this.zoomDisplay.style.cursor = 'pointer';
            this.zoomDisplay.addEventListener('click', () => {
                this.enableEditMode();
            });

            // 双击恢复100%
            this.zoomDisplay.addEventListener('dblclick', () => {
                this.setZoom(this.defaultZoom);
            });
        }

        // 初始化显示状态
        this.updateControlVisibility();
    }

    /**
     * 缩小
     */
    zoomOut() {
        const newZoom = Math.max(this.minZoom, this.currentZoom - 10);
        this.setZoom(newZoom);
    }

    /**
     * 放大
     */
    zoomIn() {
        const newZoom = Math.min(this.maxZoom, this.currentZoom + 10);
        this.setZoom(newZoom);
    }

    /**
     * 设置缩放比例
     */
    setZoom(zoom) {
        // 限制范围
        zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        this.currentZoom = zoom;

        // 应用到画布
        if (window.canvasManager) {
            window.canvasManager.setScale(zoom / 100);
        }

        this.updateZoomDisplay();
        this.updateControlVisibility();
    }

    /**
     * 更新缩放显示
     */
    updateZoomDisplay() {
        if (this.zoomDisplay) {
            this.zoomDisplay.textContent = `${this.currentZoom}%`;
        }
    }

    /**
     * 更新控制栏显示状态
     */
    updateControlVisibility() {
        if (!this.zoomControl) return;

        const zoomOut = this.zoomControl.querySelector('span:first-child');
        const zoomIn = this.zoomControl.querySelector('span:last-child');

        // 始终显示缩放控制栏
        if (zoomOut) zoomOut.style.display = 'inline';
        if (zoomIn) zoomIn.style.display = 'inline';
        if (this.zoomDisplay) {
            this.zoomDisplay.style.display = 'inline';
        }
    }

    /**
     * 显示返回箭头
     */
    showBackArrow() {
        if (!this.zoomControl) return;
        
        let backArrow = this.zoomControl.querySelector('.zoom-back-arrow');
        if (!backArrow) {
            backArrow = document.createElement('span');
            backArrow.className = 'zoom-back-arrow';
            backArrow.innerHTML = '↩';
            backArrow.style.cssText = `
                cursor: pointer;
                font-size: 16px;
                padding: 0 8px;
            `;
            backArrow.title = '双击恢复100%';
            backArrow.addEventListener('dblclick', () => {
                this.setZoom(100);
            });
            this.zoomControl.insertBefore(backArrow, this.zoomControl.firstChild);
        }
        backArrow.style.display = 'inline';
    }

    /**
     * 隐藏返回箭头
     */
    hideBackArrow() {
        if (!this.zoomControl) return;
        
        const backArrow = this.zoomControl.querySelector('.zoom-back-arrow');
        if (backArrow) {
            backArrow.style.display = 'none';
        }
    }

    /**
     * 启用编辑模式
     */
    enableEditMode() {
        if (this.isEditing || !this.zoomDisplay) return;
        
        this.isEditing = true;
        const currentValue = this.currentZoom;
        
        // 创建输入框
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentValue;
        input.min = this.minZoom;
        input.max = this.maxZoom;
        input.style.cssText = `
            width: 60px;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 4px;
            color: white;
            text-align: center;
            font-size: 14px;
            padding: 2px;
        `;

        // 替换显示为输入框
        this.zoomDisplay.style.display = 'none';
        this.zoomDisplay.parentNode.insertBefore(input, this.zoomDisplay.nextSibling);
        input.focus();
        input.select();

        // 确认编辑
        const confirmEdit = () => {
            const value = parseInt(input.value);
            if (!isNaN(value)) {
                this.setZoom(value);
            }
            this.disableEditMode(input);
        };

        // 事件绑定
        input.addEventListener('blur', confirmEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                confirmEdit();
            } else if (e.key === 'Escape') {
                this.disableEditMode(input);
            }
        });
    }

    /**
     * 禁用编辑模式
     */
    disableEditMode(input) {
        if (input && input.parentNode) {
            input.parentNode.removeChild(input);
        }
        if (this.zoomDisplay) {
            this.zoomDisplay.style.display = 'inline';
        }
        this.isEditing = false;
    }

    /**
     * 获取当前缩放比例
     */
    getZoom() {
        return this.currentZoom;
    }

    /**
     * 重置为默认缩放
     */
    resetZoom() {
        this.setZoom(this.defaultZoom);
    }
}

// 导出单例
window.zoomManager = new ZoomManager();
