/**
 * Point.js - 选择工具模块
 * 实现选择功能：
 * 1. 单指/鼠标 => 圈选+选择笔迹
 * 2. 双指 => 缩放
 * 3. 二指/多指 => 移动内容
 * 4. 双击白板 => 新建下页
 */

class PointTool {
    constructor() {
        this.isActive = false;
        this.isSelecting = false;
        this.isPanning = false;
        this.isZooming = false;
        this.isDragging = false;
        this.startPoint = null;
        this.selectionBox = null;
        this.selectedStrokes = [];
        this.selectedStrokeElements = [];
        this.lastTouchDistance = 0;
        this.lastTouchCenter = null;
        this.touchCount = 0;
        this.dragStartPos = null;
        this.dragOffset = { x: 0, y: 0 };

        this.init();
    }

    init() {
        this.setupButton();
        this.setupCanvasEvents();
        this.setupDoubleClick();
    }

    setupButton() {
        const selectBtn = document.querySelector('[title="选择"]');
        if (selectBtn) {
            selectBtn.addEventListener('click', () => {
                if (this.isActive) {
                    this.deactivate();
                } else {
                    this.activate();
                }
            });
        }

        document.addEventListener('tool:switched', (e) => {
            if (e.detail.tool !== 'select') {
                this.deactivate();
            }
        });
    }

    setupCanvasEvents() {
        const canvas = document.getElementById('main-canvas');
        if (!canvas) return;

        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));

        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    setupDoubleClick() {
        const canvas = document.getElementById('main-canvas');
        if (!canvas) return;

        canvas.addEventListener('dblclick', (e) => {
            if (!this.isActive) return;

            if (e.target.closest('.toolbar-group') ||
                e.target.closest('.floating-controls') ||
                e.target.closest('.dynamic-island')) {
                return;
            }

            this.createNewPage();
        });
    }

    activate() {
        this.isActive = true;
        this.updateCursor();

        const selectBtn = document.querySelector('[title="选择"]');
        if (selectBtn) {
            selectBtn.classList.add('active');
        }

        const event = new CustomEvent('tool:switched', { detail: { tool: 'select' } });
        document.dispatchEvent(event);
    }

    deactivate() {
        this.isActive = false;
        this.clearSelection();
        this.removeSelectionBox();

        const selectBtn = document.querySelector('[title="选择"]');
        if (selectBtn) {
            selectBtn.classList.remove('active');
        }

        this.updateCursor();
    }

    updateCursor() {
        const canvas = document.getElementById('main-canvas');
        if (canvas) {
            canvas.style.cursor = this.isActive ? 'default' : 'crosshair';
        }
    }

    handleMouseDown(e) {
        if (!this.isActive) return;
        if (e.button !== 0) return;

        if (e.target.closest('.toolbar-group') ||
            e.target.closest('.floating-controls') ||
            e.target.closest('.dynamic-island') ||
            e.target.closest('.stroke-selection-border')) {
            return;
        }

        // 如果已有选中笔画，检查是否点击在选中区域内开始拖动
        if (this.selectedStrokes.length > 0) {
            const canvas = document.getElementById('main-canvas');
            const canvasRect = canvas.getBoundingClientRect();
            const scale = window.canvasManager.scale;
            const offsetX = window.canvasManager.offsetX;
            const offsetY = window.canvasManager.offsetY;

            const clickX = (e.clientX - canvasRect.left - offsetX) / scale;
            const clickY = (e.clientY - canvasRect.top - offsetY) / scale;

            // 检查点击是否在任一选中笔画的边界内
            const clickedOnSelected = this.selectedStrokes.some(stroke => {
                return clickX >= stroke.bounds.minX && clickX <= stroke.bounds.maxX &&
                       clickY >= stroke.bounds.minY && clickY <= stroke.bounds.maxY;
            });

            if (clickedOnSelected) {
                this.isDragging = true;
                this.dragStartPos = { x: e.clientX, y: e.clientY };
                this.dragOffset = { x: 0, y: 0 };
                return;
            }
        }

        // 否则开始新的选择
        this.clearSelection();
        this.isSelecting = true;
        this.startPoint = { x: e.clientX, y: e.clientY };
        this.createSelectionBox(e.clientX, e.clientY);
    }

    handleMouseMove(e) {
        if (!this.isActive) return;

        if (this.isDragging && this.selectedStrokes.length > 0) {
            this.handleDragMove(e);
        } else if (this.isSelecting && this.startPoint) {
            this.updateSelectionBox(e.clientX, e.clientY);
        }
    }

    handleMouseUp(e) {
        if (!this.isActive) return;

        if (this.isDragging) {
            this.isDragging = false;
            this.dragStartPos = null;
            // 应用拖动偏移到笔画数据
            this.applyDragOffset();
        } else if (this.isSelecting) {
            this.isSelecting = false;
            this.selectStrokesInBox();
        }
    }

    handleTouchStart(e) {
        if (!this.isActive) return;

        this.touchCount = e.touches.length;

        if (this.touchCount === 1) {
            e.preventDefault();
            const touch = e.touches[0];

            // 如果已有选中笔画，检查是否点击在选中区域内
            if (this.selectedStrokes.length > 0) {
                const canvas = document.getElementById('main-canvas');
                const canvasRect = canvas.getBoundingClientRect();
                const scale = window.canvasManager.scale;
                const offsetX = window.canvasManager.offsetX;
                const offsetY = window.canvasManager.offsetY;

                const clickX = (touch.clientX - canvasRect.left - offsetX) / scale;
                const clickY = (touch.clientY - canvasRect.top - offsetY) / scale;

                const clickedOnSelected = this.selectedStrokes.some(stroke => {
                    return clickX >= stroke.bounds.minX && clickX <= stroke.bounds.maxX &&
                           clickY >= stroke.bounds.minY && clickY <= stroke.bounds.maxY;
                });

                if (clickedOnSelected) {
                    this.isDragging = true;
                    this.dragStartPos = { x: touch.clientX, y: touch.clientY };
                    this.dragOffset = { x: 0, y: 0 };
                    return;
                }
            }

            this.clearSelection();
            this.isSelecting = true;
            this.startPoint = { x: touch.clientX, y: touch.clientY };
            this.createSelectionBox(touch.clientX, touch.clientY);
        } else if (this.touchCount === 2) {
            e.preventDefault();
            this.isZooming = true;
            this.isSelecting = false;
            this.isDragging = false;
            this.removeSelectionBox();

            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            this.lastTouchDistance = this.getTouchDistance(touch1, touch2);
            this.lastTouchCenter = this.getTouchCenter(touch1, touch2);
        } else if (this.touchCount >= 3) {
            e.preventDefault();
            this.isPanning = true;
            this.isSelecting = false;
            this.isDragging = false;
            this.removeSelectionBox();

            const touch = e.touches[0];
            this.lastPanPoint = { x: touch.clientX, y: touch.clientY };
        }
    }

    handleTouchMove(e) {
        if (!this.isActive) return;

        if (this.touchCount === 1) {
            if (this.isDragging && this.selectedStrokes.length > 0) {
                e.preventDefault();
                const touch = e.touches[0];
                this.handleDragMove({ clientX: touch.clientX, clientY: touch.clientY });
            } else if (this.isSelecting) {
                e.preventDefault();
                const touch = e.touches[0];
                this.updateSelectionBox(touch.clientX, touch.clientY);
            }
        } else if (this.touchCount === 2 && this.isZooming) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = this.getTouchDistance(touch1, touch2);
            const center = this.getTouchCenter(touch1, touch2);

            if (this.lastTouchDistance > 0) {
                const scale = distance / this.lastTouchDistance;
                this.handleZoom(scale, center);
            }

            this.lastTouchDistance = distance;
            this.lastTouchCenter = center;
        } else if (this.touchCount >= 3 && this.isPanning) {
            e.preventDefault();
            const touch = e.touches[0];
            this.handlePanMove({ clientX: touch.clientX, clientY: touch.clientY });
            this.lastPanPoint = { x: touch.clientX, y: touch.clientY };
        }
    }

    handleTouchEnd(e) {
        if (!this.isActive) return;

        this.touchCount = e.touches.length;

        if (this.touchCount === 0) {
            if (this.isSelecting) {
                this.selectStrokesInBox();
            } else if (this.isDragging) {
                this.applyDragOffset();
            }
            this.isSelecting = false;
            this.isDragging = false;
            this.isZooming = false;
            this.isPanning = false;
            this.lastTouchDistance = 0;
            this.lastPanPoint = null;
            this.dragStartPos = null;
        } else if (this.touchCount === 1) {
            this.isZooming = false;
            this.isPanning = false;
            this.lastTouchDistance = 0;
        }
    }

    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getTouchCenter(touch1, touch2) {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }

    handleZoom(scale, center) {
        if (window.canvasManager) {
            const newScale = window.canvasManager.scale * scale;
            window.canvasManager.setScale(newScale);
        }
    }

    handlePanMove(e) {
        if (!this.lastPanPoint || !window.canvasManager) return;

        const dx = e.clientX - this.lastPanPoint.x;
        const dy = e.clientY - this.lastPanPoint.y;

        window.canvasManager.offsetX += dx;
        window.canvasManager.offsetY += dy;
        window.canvasManager.updateTransform();

        this.lastPanPoint = { x: e.clientX, y: e.clientY };
    }

    handleDragMove(e) {
        if (!this.dragStartPos || this.selectedStrokes.length === 0 || !window.canvasManager) return;

        const dx = e.clientX - this.dragStartPos.x;
        const dy = e.clientY - this.dragStartPos.y;

        this.dragOffset = {
            x: dx / window.canvasManager.scale,
            y: dy / window.canvasManager.scale
        };

        // 更新选中边框的位置
        this.updateSelectionBordersPosition();
    }

    updateSelectionBordersPosition() {
        const canvas = document.getElementById('main-canvas');
        if (!canvas || !window.canvasManager) return;

        const canvasRect = canvas.getBoundingClientRect();
        const scale = window.canvasManager.scale;
        const offsetX = window.canvasManager.offsetX;
        const offsetY = window.canvasManager.offsetY;

        this.selectedStrokeElements.forEach((element, index) => {
            const stroke = this.selectedStrokes[index];
            const bounds = stroke.bounds;

            const left = canvasRect.left + (bounds.minX + this.dragOffset.x) * scale + offsetX;
            const top = canvasRect.top + (bounds.minY + this.dragOffset.y) * scale + offsetY;
            const width = (bounds.maxX - bounds.minX) * scale;
            const height = (bounds.maxY - bounds.minY) * scale;

            element.style.left = `${left}px`;
            element.style.top = `${top}px`;
            element.style.width = `${width}px`;
            element.style.height = `${height}px`;
        });
    }

    applyDragOffset() {
        if (this.dragOffset.x === 0 && this.dragOffset.y === 0) return;

        // 更新笔画数据中的点坐标
        this.selectedStrokes.forEach(stroke => {
            stroke.points.forEach(point => {
                point.x += this.dragOffset.x;
                point.y += this.dragOffset.y;
            });
            stroke.bounds.minX += this.dragOffset.x;
            stroke.bounds.minY += this.dragOffset.y;
            stroke.bounds.maxX += this.dragOffset.x;
            stroke.bounds.maxY += this.dragOffset.y;
        });

        // 重新绘制画布
        this.redrawCanvasWithOffset();

        this.dragOffset = { x: 0, y: 0 };
        this.clearSelection();
    }

    redrawCanvasWithOffset() {
        // 触发保存状态，让画布更新
        if (window.canvasManager) {
            window.canvasManager.saveState();
        }
    }

    createSelectionBox(x, y) {
        this.removeSelectionBox();

        this.selectionBox = document.createElement('div');
        this.selectionBox.style.cssText = `
            position: fixed;
            border: 2px dashed rgba(255, 255, 255, 0.8);
            background-color: rgba(255, 255, 255, 0.05);
            pointer-events: none;
            z-index: 50;
            left: ${x}px;
            top: ${y}px;
            width: 0px;
            height: 0px;
        `;
        document.body.appendChild(this.selectionBox);
    }

    updateSelectionBox(x, y) {
        if (!this.selectionBox || !this.startPoint) return;

        const left = Math.min(this.startPoint.x, x);
        const top = Math.min(this.startPoint.y, y);
        const width = Math.abs(x - this.startPoint.x);
        const height = Math.abs(y - this.startPoint.y);

        this.selectionBox.style.left = `${left}px`;
        this.selectionBox.style.top = `${top}px`;
        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;
    }

    removeSelectionBox() {
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
    }

    selectStrokesInBox() {
        if (!this.selectionBox) return;

        const rect = this.selectionBox.getBoundingClientRect();

        if (rect.width < 10 && rect.height < 10) {
            this.removeSelectionBox();
            return;
        }

        if (window.canvasManager && window.canvasManager.canvas) {
            const canvas = window.canvasManager.canvas;
            const canvasRect = canvas.getBoundingClientRect();

            const selectionRect = {
                left: (rect.left - canvasRect.left - window.canvasManager.offsetX) / window.canvasManager.scale,
                top: (rect.top - canvasRect.top - window.canvasManager.offsetY) / window.canvasManager.scale,
                right: (rect.right - canvasRect.left - window.canvasManager.offsetX) / window.canvasManager.scale,
                bottom: (rect.bottom - canvasRect.top - window.canvasManager.offsetY) / window.canvasManager.scale
            };

            // 获取与选择框相交的笔画（检查实际轨迹点）
            this.selectedStrokes = window.canvasManager.getStrokesInRect(selectionRect);

            // 过滤：只选择那些实际轨迹点在选择框内的笔画
            this.selectedStrokes = this.selectedStrokes.filter(stroke => {
                // 检查笔画的任意点是否在选择框内
                return stroke.points.some(point => {
                    return point.x >= selectionRect.left && point.x <= selectionRect.right &&
                           point.y >= selectionRect.top && point.y <= selectionRect.bottom;
                });
            });

            if (this.selectedStrokes.length > 0) {
                this.showStrokeSelections();
            }
        }

        this.removeSelectionBox();
    }

    showStrokeSelections() {
        const canvas = document.getElementById('main-canvas');
        if (!canvas || !window.canvasManager) return;

        const canvasRect = canvas.getBoundingClientRect();
        const scale = window.canvasManager.scale;
        const offsetX = window.canvasManager.offsetX;
        const offsetY = window.canvasManager.offsetY;

        this.selectedStrokes.forEach((stroke, index) => {
            const bounds = stroke.bounds;

            const left = canvasRect.left + bounds.minX * scale + offsetX;
            const top = canvasRect.top + bounds.minY * scale + offsetY;
            const width = (bounds.maxX - bounds.minX) * scale;
            const height = (bounds.maxY - bounds.minY) * scale;

            const borderEl = document.createElement('div');
            borderEl.className = 'stroke-selection-border';
            borderEl.style.cssText = `
                position: fixed;
                left: ${left}px;
                top: ${top}px;
                width: ${width}px;
                height: ${height}px;
                border: 2px dashed rgba(255, 255, 255, 0.8);
                pointer-events: none;
                z-index: 51;
            `;

            // 第一个笔画显示删除按钮
            if (index === 0) {
                const deleteBtn = document.createElement('div');
                deleteBtn.innerHTML = '×';
                deleteBtn.style.cssText = `
                    position: absolute;
                    top: -20px;
                    right: -20px;
                    width: 24px;
                    height: 24px;
                    background: #ff6b6b;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    pointer-events: auto;
                `;
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteSelectedStrokes();
                });
                borderEl.appendChild(deleteBtn);
            }

            document.body.appendChild(borderEl);
            this.selectedStrokeElements.push(borderEl);
        });
    }

    deleteSelectedStrokes() {
        if (this.selectedStrokes.length > 0 && window.canvasManager) {
            window.canvasManager.deleteStrokes(this.selectedStrokes);
            this.clearSelection();
        }
    }

    clearSelection() {
        this.selectedStrokeElements.forEach(el => el.remove());
        this.selectedStrokeElements = [];
        this.selectedStrokes = [];
        this.dragOffset = { x: 0, y: 0 };
    }

    createNewPage() {
        const event = new CustomEvent('page:new');
        document.dispatchEvent(event);
        this.showNotification('已创建新页面');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(40, 40, 40, 0.95);
            backdrop-filter: blur(10px);
            color: white;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 16px;
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        requestAnimationFrame(() => {
            notification.style.opacity = '1';
        });

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 1500);
    }
}

window.pointTool = new PointTool();
