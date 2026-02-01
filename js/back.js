/**
 * Back.js - 返回顶部/底部模块
 * 负责返回页面笔迹底部等功能
 */

class BackManager {
    constructor() {
        this.backToBottomBtn = null;
        // 延迟初始化，等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.setupBackToBottom();
    }

    /**
     * 设置返回底部按钮
     */
    setupBackToBottom() {
        const backToBottom = document.querySelector('.back-to-bottom');
        if (!backToBottom) return;

        this.backToBottomBtn = backToBottom;

        backToBottom.addEventListener('click', () => {
            this.backToBottom();
        });

        // 根据缩放控制栏状态更新按钮显示
        this.updateButtonVisibility();
    }

    /**
     * 返回页面笔迹底部
     */
    backToBottom() {
        const canvas = document.getElementById('main-canvas');
        if (!canvas || !window.canvasManager) return;

        // 获取笔迹的边界
        const bounds = this.getStrokesBounds();
        
        if (bounds) {
            // 有笔迹，移动到底部
            const canvasHeight = canvas.height;
            const scale = window.canvasManager.scale || 1;
            
            // 计算需要移动的距离，使笔迹底部可见
            const targetY = -(bounds.maxY - canvasHeight / scale + 100);
            
            window.canvasManager.offsetY = targetY;
            window.canvasManager.updateTransform();
            
            this.showToast('已返回笔迹底部', '#4CAF50');
        } else {
            // 没有笔迹，返回画布中心
            window.canvasManager.offsetX = 0;
            window.canvasManager.offsetY = 0;
            window.canvasManager.updateTransform();
            
            this.showToast('已返回中心位置', '#2196F3');
        }
    }

    /**
     * 获取所有笔迹的边界
     */
    getStrokesBounds() {
        if (window.canvasManager && window.canvasManager.strokes) {
            const strokes = window.canvasManager.strokes;
            if (strokes.length === 0) return null;

            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            strokes.forEach(stroke => {
                if (stroke.bounds) {
                    minX = Math.min(minX, stroke.bounds.minX);
                    minY = Math.min(minY, stroke.bounds.minY);
                    maxX = Math.max(maxX, stroke.bounds.maxX);
                    maxY = Math.max(maxY, stroke.bounds.maxY);
                }
            });

            if (minX === Infinity) return null;

            return { minX, minY, maxX, maxY };
        }
        return null;
    }

    /**
     * 更新按钮显示状态
     * 显示"缩放控制栏"时仅显示箭头
     */
    updateButtonVisibility() {
        if (!this.backToBottomBtn) return;

        // 监听缩放变化
        const checkZoom = () => {
            if (window.zoomManager) {
                const zoom = window.zoomManager.getZoom();
                if (zoom !== 100) {
                    // 非100%时只显示箭头图标
                    this.backToBottomBtn.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 5v14M19 12l-7 7-7-7"/>
                        </svg>
                    `;
                    this.backToBottomBtn.title = '返回底部';
                } else {
                    // 100%时显示完整按钮
                    this.backToBottomBtn.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 5v14M19 12l-7 7-7-7"/>
                        </svg>
                    `;
                    this.backToBottomBtn.title = '返回底部';
                }
            }
        };

        // 定期检查缩放状态
        setInterval(checkZoom, 500);
    }

    /**
     * 返回顶部
     */
    backToTop() {
        if (window.canvasManager) {
            window.canvasManager.offsetX = 0;
            window.canvasManager.offsetY = 0;
            window.canvasManager.updateTransform();
            this.showToast('已返回顶部', '#4CAF50');
        }
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
window.backManager = new BackManager();
