/**
 * Toolbar.js - 工具栏管理模块
 * 管理所有工具按钮的交互、工具切换、撤销重做等功能
 */

class ToolbarManager {
    constructor() {
        this.currentTool = 'pen';
        this.tools = {
            pen: { name: '画笔', icon: 'pen', hasPopup: true },
            eraser: { name: '板擦', icon: 'eraser', hasPopup: true },
            select: { name: '选择', icon: 'select', hasPopup: false },
            undo: { name: '撤销', icon: 'undo', hasPopup: false },
            redo: { name: '重做', icon: 'redo', hasPopup: false },
            ai: { name: 'AI助教', icon: 'ai', hasPopup: false },
            more: { name: '更多', icon: 'more', hasPopup: false },
            tools: { name: '工具', icon: 'tools', hasPopup: false },
            close: { name: '关闭白板', icon: 'close', hasPopup: false }
        };

        this.popups = {
            pen: null,
            eraser: null
        };

        this.init();
    }

    init() {
        this.setupToolButtons();
        this.setupZoomControls();
        this.setupPageNav();
        this.setupKeyboardShortcuts();
    }

    setupToolButtons() {
        // 画笔按钮
        const penBtn = document.querySelector('[title="画笔"]');
        if (penBtn) {
            penBtn.addEventListener('click', () => {
                this.switchTool('pen');
                if (window.penTool) {
                    window.penTool.togglePopup();
                }
            });
        }

        // 板擦按钮
        const eraserBtn = document.querySelector('[title="板擦"]');
        if (eraserBtn) {
            eraserBtn.addEventListener('click', () => {
                this.switchTool('eraser');
                if (window.eraserTool) {
                    window.eraserTool.togglePopup();
                }
            });
        }

        // 选择按钮
        const selectBtn = document.querySelector('[title="选择"]');
        if (selectBtn) {
            selectBtn.addEventListener('click', () => {
                this.switchTool('select');
                this.hideAllPopups();
            });
        }

        // 撤销按钮
        const undoBtn = document.querySelector('[title="撤销"]');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                if (window.canvasManager) {
                    window.canvasManager.undo();
                }
            });
        }

        // 重做按钮
        const redoBtn = document.querySelector('[title="重做"]');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                if (window.canvasManager) {
                    window.canvasManager.redo();
                }
            });
        }

        // AI助教按钮
        const aiBtn = document.querySelector('[title="AI助教"]');
        if (aiBtn) {
            aiBtn.addEventListener('click', () => {
                this.showAIModal();
            });
        }

        // 更多按钮
        const moreBtn = document.querySelector('[title="更多"]');
        if (moreBtn) {
            moreBtn.addEventListener('click', () => {
                this.showMoreMenu();
            });
        }

        // 工具按钮（右侧）
        const toolsBtn = document.querySelector('[title="工具"]');
        if (toolsBtn) {
            toolsBtn.addEventListener('click', () => {
                this.showToolsMenu();
            });
        }

        // 关闭白板按钮
        const closeBtn = document.querySelector('[title="关闭白板"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeWhiteboard();
            });
        }
    }

    setupZoomControls() {
        const zoomControl = document.querySelector('.zoom-control');
        if (!zoomControl) return;

        const zoomOut = zoomControl.querySelector('span:first-child');
        const zoomIn = zoomControl.querySelector('span:last-child');

        if (zoomOut) {
            zoomOut.addEventListener('click', () => {
                if (window.canvasManager) {
                    window.canvasManager.setScale(window.canvasManager.scale * 0.9);
                }
            });
        }

        if (zoomIn) {
            zoomIn.addEventListener('click', () => {
                if (window.canvasManager) {
                    window.canvasManager.setScale(window.canvasManager.scale * 1.1);
                }
            });
        }

        // 回到底部按钮
        const backToBottom = document.querySelector('.back-to-bottom');
        if (backToBottom) {
            backToBottom.addEventListener('click', () => {
                if (window.canvasManager) {
                    window.canvasManager.offsetX = 0;
                    window.canvasManager.offsetY = 0;
                    window.canvasManager.updateTransform();
                }
            });
        }
    }

    setupPageNav() {
        const prevBtn = document.querySelector('.page-nav .icon-btn:first-child');
        const nextBtn = document.querySelector('.page-nav .icon-btn:last-child');
        const pageInfo = document.querySelector('.page-info');

        let currentPage = 1;
        let totalPages = 1;

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    this.updatePageInfo(pageInfo, currentPage, totalPages);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentPage++;
                if (currentPage > totalPages) {
                    totalPages = currentPage;
                }
                this.updatePageInfo(pageInfo, currentPage, totalPages);
            });
        }
    }

    updatePageInfo(element, current, total) {
        if (element) {
            element.textContent = `${current}/${total}`;
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Z 撤销
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (window.canvasManager) {
                    window.canvasManager.undo();
                }
            }

            // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y 重做
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                if (window.canvasManager) {
                    window.canvasManager.redo();
                }
            }

            // 数字键切换工具
            if (!e.ctrlKey && !e.metaKey) {
                switch(e.key) {
                    case '1':
                        this.switchTool('pen');
                        break;
                    case '2':
                        this.switchTool('eraser');
                        break;
                    case '3':
                        this.switchTool('select');
                        break;
                }
            }
        });
    }

    switchTool(toolName) {
        this.currentTool = toolName;

        // 更新按钮状态
        document.querySelectorAll('.icon-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 激活当前工具按钮
        const toolBtn = document.querySelector(`[title="${this.tools[toolName]?.name}"]`);
        if (toolBtn) {
            toolBtn.classList.add('active');
        }

        // 更新画布工具
        if (window.canvasManager) {
            window.canvasManager.setTool(toolName);
        }

        // 隐藏其他弹窗
        if (toolName !== 'pen') {
            if (window.penTool) window.penTool.hidePopup();
        }
        if (toolName !== 'eraser') {
            if (window.eraserTool) window.eraserTool.hidePopup();
        }

        // 更新光标样式
        this.updateCursor(toolName);
    }

    updateCursor(toolName) {
        const canvas = document.getElementById('main-canvas');
        if (!canvas) return;

        switch(toolName) {
            case 'pen':
                canvas.style.cursor = 'crosshair';
                break;
            case 'eraser':
                canvas.style.cursor = 'cell';
                break;
            case 'select':
                canvas.style.cursor = 'default';
                break;
            default:
                canvas.style.cursor = 'default';
        }
    }

    hideAllPopups() {
        if (window.penTool) window.penTool.hidePopup();
        if (window.eraserTool) window.eraserTool.hidePopup();
    }

    showAIModal() {
        // 创建 AI 助教弹窗
        const modal = document.createElement('div');
        modal.id = 'ai-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(40,40,40,0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                border: 1px solid rgba(255,255,255,0.1);
                transform: scale(0.9);
                transition: transform 0.3s;
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2">
                        <path d="M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5Z"/>
                    </svg>
                    <h2 style="color: white; margin: 0; font-size: 24px;">AI 助教</h2>
                </div>
                <p style="color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 20px;">
                    AI 助教功能即将上线！它将帮助您：<br>
                    • 自动识别手写内容并转换为文字<br>
                    • 解答白板上的数学问题<br>
                    • 提供绘图建议和修正
                </p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="ai-modal-close" style="
                        padding: 10px 24px;
                        background: rgba(255,255,255,0.1);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                    ">关闭</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 动画显示
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.querySelector('div').style.transform = 'scale(1)';
        });

        // 关闭事件
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('ai-modal-close')) {
                modal.style.opacity = '0';
                modal.querySelector('div').style.transform = 'scale(0.9)';
                setTimeout(() => modal.remove(), 300);
            }
        });
    }

    showMoreMenu() {
        // 创建更多菜单
        const menu = document.createElement('div');
        menu.id = 'more-menu';
        menu.style.cssText = `
            position: absolute;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%) scale(0);
            background: rgba(40,40,40,0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 200;
            transition: transform 0.2s ease;
            min-width: 180px;
        `;

        menu.innerHTML = `
            <div class="menu-item" style="
                padding: 12px 16px;
                color: white;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                gap: 12px;
            ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                导出图片
            </div>
            <div class="menu-item" style="
                padding: 12px 16px;
                color: white;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                gap: 12px;
            ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 6.34L2.1 2.1m17.8 17.8l-4.24-4.24M6.34 17.66l-4.24 4.24"/>
                </svg>
                设置
            </div>
            <div class="menu-item" style="
                padding: 12px 16px;
                color: white;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                gap: 12px;
            ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                </svg>
                关于
            </div>
        `;

        document.body.appendChild(menu);

        // 显示动画
        requestAnimationFrame(() => {
            menu.style.transform = 'translateX(-50%) scale(1)';
        });

        // 菜单项事件
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(255,255,255,0.1)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
        });

        // 点击其他地方关闭
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && !e.target.closest('[title="更多"]')) {
                menu.style.transform = 'translateX(-50%) scale(0)';
                setTimeout(() => menu.remove(), 200);
                document.removeEventListener('click', closeMenu);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    showToolsMenu() {
        // 创建工具菜单
        const menu = document.createElement('div');
        menu.id = 'tools-menu';
        menu.style.cssText = `
            position: absolute;
            bottom: 90px;
            right: 24px;
            transform: scale(0);
            transform-origin: bottom right;
            background: rgba(40,40,40,0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 200;
            transition: transform 0.2s ease;
            min-width: 160px;
        `;

        menu.innerHTML = `
            <div class="menu-item" style="
                padding: 12px 16px;
                color: white;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
            ">形状工具</div>
            <div class="menu-item" style="
                padding: 12px 16px;
                color: white;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
            ">文本工具</div>
            <div class="menu-item" style="
                padding: 12px 16px;
                color: white;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
            ">插入图片</div>
            <div class="menu-item" style="
                padding: 12px 16px;
                color: white;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
            ">激光笔</div>
        `;

        document.body.appendChild(menu);

        // 显示动画
        requestAnimationFrame(() => {
            menu.style.transform = 'scale(1)';
        });

        // 菜单项事件
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(255,255,255,0.1)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
        });

        // 点击其他地方关闭
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && !e.target.closest('[title="工具"]')) {
                menu.style.transform = 'scale(0)';
                setTimeout(() => menu.remove(), 200);
                document.removeEventListener('click', closeMenu);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    closeWhiteboard() {
        // 创建确认弹窗
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(40,40,40,0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                border: 1px solid rgba(255,255,255,0.1);
                text-align: center;
            ">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2" style="margin-bottom: 16px;">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <h3 style="color: white; margin: 0 0 12px 0;">确认关闭白板？</h3>
                <p style="color: rgba(255,255,255,0.6); margin: 0 0 24px 0; font-size: 14px;">
                    关闭后未保存的内容将会丢失
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="cancel-close" style="
                        padding: 12px 24px;
                        background: rgba(255,255,255,0.1);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">取消</button>
                    <button class="confirm-close" style="
                        padding: 12px 24px;
                        background: #ff6b6b;
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">确认关闭</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 事件处理
        modal.querySelector('.cancel-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.confirm-close').addEventListener('click', () => {
            // 这里可以添加关闭白板的逻辑
            modal.remove();
            // 例如：返回首页或刷新页面
            // window.location.href = '/';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// 导出单例
window.toolbarManager = new ToolbarManager();
