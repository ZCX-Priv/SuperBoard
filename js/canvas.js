/**
 * Canvas.js - 画布核心模块
 * 负责画布的初始化、渲染、历史记录管理
 */

class CanvasManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.history = [];
        this.historyStep = -1;
        this.maxHistory = 50;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        // 笔画数据存储
        this.strokes = [];
        this.currentStroke = null;

        // 默认配置
        this.config = {
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: '#0d2b20'
        };

        this.init();
    }

    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.saveState();
    }

    createCanvas() {
        // 移除旧的画布
        const oldCanvas = document.getElementById('main-canvas');
        if (oldCanvas) {
            oldCanvas.remove();
        }

        // 创建新画布
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'main-canvas';
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            cursor: crosshair;
            touch-action: none;
        `;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // 插入到 body 开头，确保在最底层
        document.body.insertBefore(this.canvas, document.body.firstChild);

        // 清空占位符内容
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.style.display = 'none';
        }
    }

    setupEventListeners() {
        // 在 window 级别捕获事件，确保工具栏区域也能绘画
        window.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // 触摸事件
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleMouseUp.bind(this));

        // 窗口大小变化
        window.addEventListener('resize', this.handleResize.bind(this));

        // 滚轮缩放
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    }

    getPoint(e) {
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        // 如果事件在canvas上，直接计算
        if (this.canvas && this.canvas.contains(e.target)) {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: (clientX - rect.left - this.offsetX) / this.scale,
                y: (clientY - rect.top - this.offsetY) / this.scale
            };
        }

        // 如果事件不在canvas上（可能在工具栏下方），使用window坐标
        return {
            x: (clientX - this.offsetX) / this.scale,
            y: (clientY - this.offsetY) / this.scale
        };
    }

    handleMouseDown(e) {
        if (e.button !== 0) return;

        if (e.target.closest('.toolbar-group') || e.target.closest('.tool-popup') ||
            e.target.closest('.floating-controls') || e.target.closest('.dynamic-island') ||
            e.target.closest('.selected-content') || e.target.closest('.selection-handle')) {
            return;
        }

        this.isDrawing = true;
        const point = this.getPoint(e);

        // 开始新笔画
        this.currentStroke = {
            points: [{ x: point.x, y: point.y }],
            tool: this.currentTool,
            bounds: { minX: point.x, minY: point.y, maxX: point.x, maxY: point.y }
        };

        const event = new CustomEvent('canvas:startDrawing', {
            detail: { x: point.x, y: point.y, ctx: this.ctx }
        });
        document.dispatchEvent(event);
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;
        const point = this.getPoint(e);

        // 更新当前笔画的点和边界
        if (this.currentStroke) {
            this.currentStroke.points.push({ x: point.x, y: point.y });
            this.currentStroke.bounds.minX = Math.min(this.currentStroke.bounds.minX, point.x);
            this.currentStroke.bounds.minY = Math.min(this.currentStroke.bounds.minY, point.y);
            this.currentStroke.bounds.maxX = Math.max(this.currentStroke.bounds.maxX, point.x);
            this.currentStroke.bounds.maxY = Math.max(this.currentStroke.bounds.maxY, point.y);
        }

        const event = new CustomEvent('canvas:drawing', {
            detail: { x: point.x, y: point.y, ctx: this.ctx }
        });
        document.dispatchEvent(event);
    }

    handleMouseUp() {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        // 保存完成的笔画
        if (this.currentStroke && this.currentStroke.points.length > 1) {
            this.strokes.push(this.currentStroke);
        }
        this.currentStroke = null;

        const event = new CustomEvent('canvas:endDrawing', {
            detail: { ctx: this.ctx }
        });
        document.dispatchEvent(event);

        // 笔画完成后保存状态，实现步步撤销
        this.saveState();
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.handleMouseDown(e);
    }

    handleTouchMove(e) {
        e.preventDefault();
        this.handleMouseMove(e);
    }

    handleResize() {
        // 保存当前画布内容
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        tempCtx.drawImage(this.canvas, 0, 0);

        // 调整画布大小
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // 恢复内容
        this.ctx.drawImage(tempCanvas, 0, 0);
    }

    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.setScale(this.scale * delta);
    }

    setScale(newScale) {
        this.scale = Math.max(0.1, Math.min(5, newScale));
        this.updateTransform();
        this.updateZoomDisplay();
    }

    updateTransform() {
        this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    }

    updateZoomDisplay() {
        const zoomDisplay = document.querySelector('.zoom-control span:nth-child(2)');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${Math.round(this.scale * 100)}%`;
        }
    }

    // 获取与选择框相交的笔画
    getStrokesInRect(rect) {
        return this.strokes.filter(stroke => {
            // 检查笔画边界框是否与选择框相交
            return !(stroke.bounds.maxX < rect.left ||
                     stroke.bounds.minX > rect.right ||
                     stroke.bounds.maxY < rect.top ||
                     stroke.bounds.minY > rect.bottom);
        });
    }

    // 删除指定笔画
    deleteStrokes(strokesToDelete) {
        this.strokes = this.strokes.filter(stroke => !strokesToDelete.includes(stroke));
        this.redrawCanvas();
        this.saveState();
    }

    // 重绘画布
    redrawCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // 这里需要重新绘制所有笔画，但当前笔画数据只包含点，没有样式信息
        // 简化处理：依赖历史记录恢复
    }

    // 历史记录管理
    saveState() {
        // 删除当前步骤之后的历史
        if (this.historyStep < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyStep + 1);
        }

        // 保存当前状态
        this.history.push(this.canvas.toDataURL());

        // 限制历史记录数量
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyStep++;
        }

        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.restoreState();
        }
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.restoreState();
        }
    }

    restoreState() {
        const img = new Image();
        img.src = this.history[this.historyStep];
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        this.updateUndoRedoButtons();
    }

    updateUndoRedoButtons() {
        const undoBtn = document.querySelector('[title="撤销"]');
        const redoBtn = document.querySelector('[title="重做"]');

        if (undoBtn) {
            undoBtn.style.opacity = this.historyStep > 0 ? '1' : '0.3';
        }
        if (redoBtn) {
            redoBtn.style.opacity = this.historyStep < this.history.length - 1 ? '1' : '0.3';
        }
    }

    // 清屏功能
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.strokes = [];
        this.saveState();
    }

    // 设置当前工具
    setTool(toolName) {
        this.currentTool = toolName;
    }

    // 获取当前工具
    getTool() {
        return this.currentTool;
    }
}

// 导出单例
window.canvasManager = new CanvasManager();
