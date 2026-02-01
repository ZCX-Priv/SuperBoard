/**
 * Eraser.js - 板擦工具模块
 * 支持小/中/大三种擦除尺寸
 * 包含清屏滑块功能（从左滑到右清屏）
 */

class EraserTool {
    constructor() {
        this.size = 'medium'; // small, medium, large
        this.isActive = false;
        this.lastPoint = null;
        this.isClearing = false;

        // 擦除尺寸配置
        this.sizes = {
            small: { name: '小', radius: 15, icon: '□' },
            medium: { name: '中', radius: 30, icon: '□' },
            large: { name: '大', radius: 60, icon: '□' }
        };

        this.popup = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createPopup();
    }

    setupEventListeners() {
        // 监听画布绘制事件
        document.addEventListener('canvas:startDrawing', (e) => {
            if (window.canvasManager.getTool() === 'eraser') {
                this.startErasing(e.detail.x, e.detail.y, e.detail.ctx);
            }
        });

        document.addEventListener('canvas:drawing', (e) => {
            if (window.canvasManager.getTool() === 'eraser') {
                this.erase(e.detail.x, e.detail.y, e.detail.ctx);
            }
        });

        document.addEventListener('canvas:endDrawing', (e) => {
            if (window.canvasManager.getTool() === 'eraser') {
                this.endErasing();
            }
        });
    }

    createPopup() {
        this.popup = document.createElement('div');
        this.popup.id = 'eraser-popup';
        this.popup.className = 'tool-popup';
        this.popup.style.cssText = `
            position: absolute;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%) scale(0);
            background: rgba(40, 40, 40, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 200;
            transition: transform 0.2s ease;
            min-width: 260px;
        `;

        this.popup.innerHTML = `
            <!-- 擦除尺寸选择 -->
            <div class="eraser-sizes">
                <div class="popup-label">擦除尺寸</div>
                <div class="size-list" style="display: flex; gap: 12px; justify-content: center; align-items: flex-end;">
                    ${Object.entries(this.sizes).map(([key, config]) => `
                        <div class="size-item ${key === this.size ? 'active' : ''}" data-size="${key}" style="
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 6px;
                            cursor: pointer;
                            padding: 8px 16px;
                            background: ${key === this.size ? 'rgba(255,255,255,0.15)' : 'transparent'};
                            border-radius: 10px;
                            transition: all 0.2s;
                            border: ${key === this.size ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent'};
                        ">
                            <div class="size-icon" style="
                                width: ${config.radius}px;
                                height: ${config.radius}px;
                                border: 2px solid rgba(255,255,255,0.6);
                                border-radius: 4px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                background: ${key === this.size ? 'rgba(255,255,255,0.2)' : 'transparent'};
                                transition: all 0.2s;
                            "></div>
                            <span style="font-size: 12px; color: rgba(255,255,255,0.8);">${config.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 清屏滑块 -->
            <div class="clear-screen-section">
                <div class="popup-label" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>清屏</span>
                    <span id="clear-hint" style="font-size: 11px; color: #999;">从左滑到右清屏</span>
                </div>
                <div class="clear-slider-container" style="
                    background: rgba(0,0,0,0.3);
                    border-radius: 25px;
                    height: 44px;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    padding: 0 4px;
                ">
                    <div class="clear-slider-track" style="
                        position: absolute;
                        left: 0;
                        top: 0;
                        height: 100%;
                        width: 0%;
                        background: linear-gradient(90deg, rgba(255,100,100,0.3), rgba(255,100,100,0.6));
                        transition: width 0.1s;
                    "></div>
                    <div class="clear-slider-thumb" style="
                        width: 36px;
                        height: 36px;
                        background: #ff6b6b;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: grab;
                        position: relative;
                        z-index: 2;
                        box-shadow: 0 2px 8px rgba(255,107,107,0.4);
                        transition: transform 0.2s, left 0.3s ease;
                    ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </div>
                    <span class="clear-text" style="
                        position: absolute;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 13px;
                        color: rgba(255,255,255,0.5);
                        pointer-events: none;
                        white-space: nowrap;
                    ">滑动清屏 →</span>
                </div>
            </div>
        `;

        document.body.appendChild(this.popup);
        this.setupPopupEvents();
    }

    setupPopupEvents() {
        // 尺寸选择
        this.popup.querySelectorAll('.size-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const sizeKey = e.currentTarget.dataset.size;
                this.setSize(sizeKey);
                this.updatePopupUI();
            });
        });

        // 清屏滑块
        this.setupClearSlider();
    }

    setupClearSlider() {
        const container = this.popup.querySelector('.clear-slider-container');
        const thumb = this.popup.querySelector('.clear-slider-thumb');
        const track = this.popup.querySelector('.clear-slider-track');
        const clearText = this.popup.querySelector('.clear-text');

        let isDragging = false;
        let startX = 0;
        let containerWidth = 0;

        const updateSlider = (clientX) => {
            const rect = container.getBoundingClientRect();
            let progress = (clientX - rect.left - 20) / (rect.width - 44);
            progress = Math.max(0, Math.min(1, progress));

            thumb.style.left = `${progress * (rect.width - 44)}px`;
            track.style.width = `${progress * 100}%`;

            // 隐藏提示文字
            if (progress > 0.1) {
                clearText.style.opacity = '0';
            } else {
                clearText.style.opacity = '1';
            }

            return progress;
        };

        const startDrag = (e) => {
            isDragging = true;
            thumb.style.cursor = 'grabbing';
            thumb.style.transition = 'none';
            track.style.transition = 'none';
            containerWidth = container.getBoundingClientRect().width;
        };

        const moveDrag = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const progress = updateSlider(clientX);

            // 滑动到最右侧时清屏
            if (progress >= 0.95) {
                this.clearCanvas();
                resetSlider();
            }
        };

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            thumb.style.cursor = 'grab';

            // 检查是否需要重置
            const rect = container.getBoundingClientRect();
            const thumbRect = thumb.getBoundingClientRect();
            const progress = (thumbRect.left - rect.left) / (rect.width - 44);

            if (progress < 0.95) {
                resetSlider();
            }
        };

        const resetSlider = () => {
            thumb.style.transition = 'left 0.3s ease';
            track.style.transition = 'width 0.3s ease';
            thumb.style.left = '0px';
            track.style.width = '0%';
            clearText.style.opacity = '1';
        };

        thumb.addEventListener('mousedown', startDrag);
        thumb.addEventListener('touchstart', startDrag, { passive: false });

        document.addEventListener('mousemove', moveDrag);
        document.addEventListener('touchmove', moveDrag, { passive: false });

        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }

    updatePopupUI() {
        this.popup.querySelectorAll('.size-item').forEach(item => {
            const isActive = item.dataset.size === this.size;
            item.style.background = isActive ? 'rgba(255,255,255,0.15)' : 'transparent';
            item.style.border = isActive ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent';
            item.classList.toggle('active', isActive);

            const icon = item.querySelector('.size-icon');
            icon.style.background = isActive ? 'rgba(255,255,255,0.2)' : 'transparent';
        });
    }

    showPopup() {
        this.popup.style.transform = 'translateX(-50%) scale(1)';
        this.isActive = true;
    }

    hidePopup() {
        this.popup.style.transform = 'translateX(-50%) scale(0)';
        this.isActive = false;
    }

    togglePopup() {
        if (this.isActive) {
            this.hidePopup();
        } else {
            this.showPopup();
        }
    }

    setSize(size) {
        if (this.sizes[size]) {
            this.size = size;
        }
    }

    clearCanvas() {
        if (window.canvasManager) {
            window.canvasManager.clear();
        }

        // 显示清屏成功提示
        this.showClearSuccess();
    }

    showClearSuccess() {
        const hint = this.popup.querySelector('#clear-hint');
        const originalText = hint.textContent;
        hint.textContent = '清屏成功！';
        hint.style.color = '#4CAF50';

        setTimeout(() => {
            hint.textContent = originalText;
            hint.style.color = '#999';
        }, 1500);
    }

    // 擦除方法
    startErasing(x, y, ctx) {
        this.lastPoint = { x, y };
        this.erase(x, y, ctx);
    }

    erase(x, y, ctx) {
        const radius = this.sizes[this.size].radius;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();

        if (this.lastPoint) {
            // 使用圆形擦除，连续擦除形成线条
            const distance = Math.hypot(x - this.lastPoint.x, y - this.lastPoint.y);
            const angle = Math.atan2(y - this.lastPoint.y, x - this.lastPoint.x);

            for (let i = 0; i < distance; i += radius / 2) {
                const px = this.lastPoint.x + Math.cos(angle) * i;
                const py = this.lastPoint.y + Math.sin(angle) * i;
                ctx.moveTo(px + radius, py);
                ctx.arc(px, py, radius, 0, Math.PI * 2);
            }
        }

        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        this.lastPoint = { x, y };
    }

    endErasing() {
        this.lastPoint = null;
        // 重置画布状态
        const ctx = window.canvasManager.ctx;
        ctx.globalCompositeOperation = 'source-over';
    }
}

// 导出单例
window.eraserTool = new EraserTool();
