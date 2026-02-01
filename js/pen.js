/**
 * Pen.js - 画笔工具模块
 * 支持铅笔、钢笔、荧光笔、粉笔等多种笔型
 * 包含颜色选择器和粗细调节
 */

class PenTool {
    constructor() {
        this.type = 'pencil'; // pencil, pen, marker, chalk, highlighter
        this.color = '#ffffff';
        this.size = 3;
        this.isActive = false;
        this.lastPoint = null;

        // 预设颜色（7种不可删除）
        this.presetColors = [
            '#ffffff', // 白色
            '#000000', // 黑色
            '#ff0000', // 红色
            '#00ff00', // 绿色
            '#0000ff', // 蓝色
            '#ffff00', // 黄色
            '#ff00ff'  // 紫色
        ];

        // 用户自定义颜色
        this.customColors = [];

        // 笔型配置
        this.penTypes = {
            pencil: { name: '铅笔', size: 2, opacity: 1 },
            pen: { name: '钢笔', size: 3, opacity: 1 },
            marker: { name: '记号笔', size: 8, opacity: 1 },
            chalk: { name: '粉笔', size: 5, opacity: 0.8 },
            highlighter: { name: '荧光笔', size: 15, opacity: 0.3 }
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
            if (window.canvasManager.getTool() === 'pen') {
                this.startDrawing(e.detail.x, e.detail.y, e.detail.ctx);
            }
        });

        document.addEventListener('canvas:drawing', (e) => {
            if (window.canvasManager.getTool() === 'pen') {
                this.draw(e.detail.x, e.detail.y, e.detail.ctx);
            }
        });

        document.addEventListener('canvas:endDrawing', (e) => {
            if (window.canvasManager.getTool() === 'pen') {
                this.endDrawing();
            }
        });
    }

    createPopup() {
        this.popup = document.createElement('div');
        this.popup.id = 'pen-popup';
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
            gap: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 200;
            transition: transform 0.2s ease;
            min-width: 280px;
        `;

        this.popup.innerHTML = `
            <!-- 笔型选择 -->
            <div class="pen-types">
                <div class="popup-label">笔型</div>
                <div class="pen-type-list" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${Object.entries(this.penTypes).map(([key, config]) => `
                        <div class="pen-type-item ${key === this.type ? 'active' : ''}" data-type="${key}" style="
                            padding: 8px 12px;
                            background: ${key === this.type ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'};
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 12px;
                            color: white;
                            border: ${key === this.type ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent'};
                            transition: all 0.2s;
                        ">${config.name}</div>
                    `).join('')}
                </div>
            </div>

            <!-- 颜色选择 -->
            <div class="pen-colors">
                <div class="popup-label">颜色</div>
                <div class="color-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
                    ${this.presetColors.map((color, index) => `
                        <div class="color-item ${color === this.color ? 'active' : ''}" 
                             data-color="${color}" 
                             data-preset="true"
                             style="
                                width: 28px;
                                height: 28px;
                                background: ${color};
                                border-radius: 50%;
                                cursor: pointer;
                                border: ${color === this.color ? '3px solid rgba(255,255,255,0.8)' : '2px solid rgba(255,255,255,0.3)'};
                                transition: all 0.2s;
                                position: relative;
                            "></div>
                    `).join('')}
                    ${this.customColors.map((color) => `
                        <div class="color-item custom ${color === this.color ? 'active' : ''}" 
                             data-color="${color}"
                             style="
                                width: 28px;
                                height: 28px;
                                background: ${color};
                                border-radius: 50%;
                                cursor: pointer;
                                border: ${color === this.color ? '3px solid rgba(255,255,255,0.8)' : '2px solid rgba(255,255,255,0.3)'};
                                transition: all 0.2s;
                                position: relative;
                            ">
                            <span class="delete-color" style="
                                position: absolute;
                                top: -4px;
                                right: -4px;
                                width: 12px;
                                height: 12px;
                                background: #ff4444;
                                border-radius: 50%;
                                font-size: 8px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                opacity: 0;
                                transition: opacity 0.2s;
                            ">×</span>
                        </div>
                    `).join('')}
                    <div class="add-color-btn" style="
                        width: 28px;
                        height: 28px;
                        border: 2px dashed rgba(255,255,255,0.4);
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: rgba(255,255,255,0.6);
                        font-size: 18px;
                        transition: all 0.2s;
                    ">+</div>
                </div>
                <input type="color" id="color-picker" style="display: none;">
            </div>

            <!-- 粗细调节 -->
            <div class="pen-size">
                <div class="popup-label" style="display: flex; justify-content: space-between;">
                    <span>粗细</span>
                    <span id="size-value">${this.size}px</span>
                </div>
                <div class="size-slider-container" style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 12px; color: #999;">细</span>
                    <input type="range" id="size-slider" min="1" max="50" value="${this.size}" 
                           style="flex: 1; accent-color: #4CAF50;">
                    <span style="font-size: 12px; color: #999;">粗</span>
                </div>
                <div class="size-preview" style="
                    height: 50px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 8px;
                ">
                    <div id="size-preview-dot" style="
                        width: ${this.size}px;
                        height: ${this.size}px;
                        background: ${this.color};
                        border-radius: 50%;
                        transition: all 0.2s;
                    "></div>
                </div>
            </div>
        `;

        document.body.appendChild(this.popup);
        this.setupPopupEvents();
    }

    setupPopupEvents() {
        // 笔型选择
        this.popup.querySelectorAll('.pen-type-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.setType(e.target.dataset.type);
                this.updatePopupUI();
            });
        });

        // 颜色选择
        this.popup.querySelectorAll('.color-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-color')) {
                    e.stopPropagation();
                    this.removeCustomColor(e.target.parentElement.dataset.color);
                } else {
                    this.setColor(e.currentTarget.dataset.color);
                    this.updatePopupUI();
                }
            });

            // 长按显示删除按钮
            let pressTimer;
            item.addEventListener('mousedown', () => {
                if (item.classList.contains('custom')) {
                    pressTimer = setTimeout(() => {
                        const deleteBtn = item.querySelector('.delete-color');
                        if (deleteBtn) deleteBtn.style.opacity = '1';
                    }, 500);
                }
            });
            item.addEventListener('mouseup', () => clearTimeout(pressTimer));
            item.addEventListener('mouseleave', () => {
                clearTimeout(pressTimer);
                const deleteBtn = item.querySelector('.delete-color');
                if (deleteBtn) deleteBtn.style.opacity = '0';
            });
        });

        // 添加颜色
        const addBtn = this.popup.querySelector('.add-color-btn');
        const colorPicker = this.popup.querySelector('#color-picker');
        addBtn.addEventListener('click', () => colorPicker.click());
        colorPicker.addEventListener('change', (e) => {
            this.addCustomColor(e.target.value);
            this.updatePopupUI();
        });

        // 粗细滑块
        const sizeSlider = this.popup.querySelector('#size-slider');
        sizeSlider.addEventListener('input', (e) => {
            this.setSize(parseInt(e.target.value));
        });
    }

    updatePopupUI() {
        // 更新笔型
        this.popup.querySelectorAll('.pen-type-item').forEach(item => {
            const isActive = item.dataset.type === this.type;
            item.style.background = isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)';
            item.style.border = isActive ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent';
            item.classList.toggle('active', isActive);
        });

        // 更新颜色
        this.popup.querySelectorAll('.color-item').forEach(item => {
            const isActive = item.dataset.color === this.color;
            item.style.border = isActive ? '3px solid rgba(255,255,255,0.8)' : '2px solid rgba(255,255,255,0.3)';
            item.classList.toggle('active', isActive);
        });

        // 更新粗细显示
        this.popup.querySelector('#size-value').textContent = `${this.size}px`;
        const previewDot = this.popup.querySelector('#size-preview-dot');
        previewDot.style.width = `${this.size}px`;
        previewDot.style.height = `${this.size}px`;
        previewDot.style.background = this.color;
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

    setType(type) {
        if (this.penTypes[type]) {
            this.type = type;
        }
    }

    setColor(color) {
        this.color = color;
    }

    setSize(size) {
        this.size = Math.max(1, Math.min(50, size));
        this.updatePopupUI();
    }

    addCustomColor(color) {
        if (!this.customColors.includes(color) && !this.presetColors.includes(color)) {
            this.customColors.push(color);
            this.setColor(color);
            this.refreshColorGrid();
        }
    }

    removeCustomColor(color) {
        const index = this.customColors.indexOf(color);
        if (index > -1) {
            this.customColors.splice(index, 1);
            this.refreshColorGrid();
        }
    }

    refreshColorGrid() {
        const colorGrid = this.popup.querySelector('.color-grid');
        const addBtn = colorGrid.querySelector('.add-color-btn');

        // 移除旧的自定义颜色
        colorGrid.querySelectorAll('.color-item.custom').forEach(item => item.remove());

        // 添加新的自定义颜色
        this.customColors.forEach(color => {
            const colorItem = document.createElement('div');
            colorItem.className = `color-item custom ${color === this.color ? 'active' : ''}`;
            colorItem.dataset.color = color;
            colorItem.style.cssText = `
                width: 28px;
                height: 28px;
                background: ${color};
                border-radius: 50%;
                cursor: pointer;
                border: ${color === this.color ? '3px solid rgba(255,255,255,0.8)' : '2px solid rgba(255,255,255,0.3)'};
                transition: all 0.2s;
                position: relative;
            `;
            colorItem.innerHTML = `
                <span class="delete-color" style="
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    width: 12px;
                    height: 12px;
                    background: #ff4444;
                    border-radius: 50%;
                    font-size: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    opacity: 0;
                    transition: opacity 0.2s;
                ">×</span>
            `;
            colorGrid.insertBefore(colorItem, addBtn);
        });

        this.setupPopupEvents();
    }

    // 绘制方法
    startDrawing(x, y, ctx) {
        this.lastPoint = { x, y };
        ctx.beginPath();
        ctx.moveTo(x, y);

        const penConfig = this.penTypes[this.type];
        ctx.lineWidth = this.size;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = penConfig.opacity;

        if (this.type === 'highlighter') {
            ctx.globalCompositeOperation = 'multiply';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }

        if (this.type === 'chalk') {
            ctx.shadowBlur = 2;
            ctx.shadowColor = this.color;
        } else {
            ctx.shadowBlur = 0;
        }
    }

    draw(x, y, ctx) {
        if (!this.lastPoint) return;

        const dx = x - this.lastPoint.x;
        const dy = y - this.lastPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 如果距离太大，使用线性插值填充中间点
        if (distance > this.size) {
            const steps = Math.ceil(distance / (this.size * 0.5));
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const interpX = this.lastPoint.x + dx * t;
                const interpY = this.lastPoint.y + dy * t;
                ctx.lineTo(interpX, interpY);
            }
        } else {
            ctx.lineTo(x, y);
        }

        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);

        this.lastPoint = { x, y };
    }

    endDrawing() {
        this.lastPoint = null;
        // 重置画布状态
        const ctx = window.canvasManager.ctx;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowBlur = 0;
    }
}

// 导出单例
window.penTool = new PenTool();
