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

        // 页面管理
        this.pages = [];
        this.currentPageIndex = 0;
        this.hasUnsavedChanges = false;

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
                if (window.closeManager) {
                    window.closeManager.startCloseProcess();
                } else {
                    this.closeWhiteboard();
                }
            });
        }
    }

    setupZoomControls() {
        // 确保 zoomManager 已初始化
        if (!window.zoomManager) {
            window.zoomManager = new ZoomManager();
        }

        // 确保 backManager 已初始化
        if (!window.backManager) {
            window.backManager = new BackManager();
        }

        // 手动触发一次更新
        if (window.zoomManager) {
            window.zoomManager.updateControlVisibility();
        }
    }

    setupPageNav() {
        const prevBtn = document.querySelector('.page-nav .icon-btn:first-child');
        const nextBtn = document.querySelector('.page-nav .icon-btn:last-child');
        const pageInfo = document.querySelector('.page-info');

        // 初始化页面
        this.initializePages();

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.goToPrevPage();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.goToNextPage();
            });
        }

        // 长按浏览按钮打开页面浏览器
        if (pageInfo) {
            let pressTimer;
            pageInfo.addEventListener('mousedown', () => {
                pressTimer = setTimeout(() => {
                    this.showPageBrowser();
                }, 500);
            });
            pageInfo.addEventListener('mouseup', () => clearTimeout(pressTimer));
            pageInfo.addEventListener('mouseleave', () => clearTimeout(pressTimer));
            
            // 触摸设备支持
            pageInfo.addEventListener('touchstart', () => {
                pressTimer = setTimeout(() => {
                    this.showPageBrowser();
                }, 500);
            });
            pageInfo.addEventListener('touchend', () => clearTimeout(pressTimer));
        }
    }

    /**
     * 初始化页面系统
     */
    initializePages() {
        // 加载已保存的页面
        const savedPages = localStorage.getItem('superboard_pages');
        if (savedPages) {
            this.pages = JSON.parse(savedPages);
        } else {
            // 创建第一页
            this.pages = [{
                id: Date.now(),
                name: '第1页',
                thumbnail: null,
                data: null
            }];
        }
        this.currentPageIndex = 0;
        this.updatePageInfo();
    }

    /**
     * 前往上一页
     */
    goToPrevPage() {
        if (this.currentPageIndex > 0) {
            this.saveCurrentPage();
            this.currentPageIndex--;
            this.loadPage(this.currentPageIndex);
            this.updatePageInfo();
        } else {
            // 第一页时禁用效果
            this.showToast('已经是第一页了', '#666');
        }
    }

    /**
     * 前往下一页
     */
    goToNextPage() {
        this.saveCurrentPage();
        
        if (this.currentPageIndex < this.pages.length - 1) {
            // 有下一页
            this.currentPageIndex++;
            this.loadPage(this.currentPageIndex);
        } else {
            // 创建新页
            this.createNewPage();
        }
        this.updatePageInfo();
    }

    /**
     * 创建新页面
     */
    createNewPage() {
        const newPage = {
            id: Date.now(),
            name: `第${this.pages.length + 1}页`,
            thumbnail: null,
            data: null
        };
        this.pages.push(newPage);
        this.currentPageIndex = this.pages.length - 1;
        
        // 清空画布
        if (window.canvasManager) {
            window.canvasManager.clear();
        }
    }

    /**
     * 保存当前页面
     */
    saveCurrentPage() {
        if (window.canvasManager) {
            const canvas = document.getElementById('main-canvas');
            if (canvas) {
                this.pages[this.currentPageIndex].thumbnail = canvas.toDataURL('image/png');
                this.pages[this.currentPageIndex].data = canvas.toDataURL('image/png');
                this.savePagesToStorage();
            }
        }
    }

    /**
     * 加载指定页面
     */
    loadPage(index) {
        const page = this.pages[index];
        if (page && page.data && window.canvasManager) {
            const img = new Image();
            img.onload = () => {
                const canvas = document.getElementById('main-canvas');
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = page.data;
        }
    }

    /**
     * 保存所有页面到本地存储
     */
    savePagesToStorage() {
        try {
            localStorage.setItem('superboard_pages', JSON.stringify(this.pages));
        } catch (err) {
            console.warn('保存页面失败:', err);
        }
    }

    /**
     * 显示页面浏览器
     */
    showPageBrowser() {
        // 保存当前页面
        this.saveCurrentPage();

        const modal = document.createElement('div');
        modal.id = 'page-browser';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            padding: 40px;
            opacity: 0;
            transition: opacity 0.3s;
        `;

        let pagesHtml = this.pages.map((page, index) => `
            <div class="page-thumbnail ${index === this.currentPageIndex ? 'selected' : ''}" data-index="${index}" style="
                width: 200px;
                height: 150px;
                background: ${page.thumbnail ? `url(${page.thumbnail})` : 'rgba(255,255,255,0.1)'};
                background-size: cover;
                background-position: center;
                border-radius: 12px;
                cursor: pointer;
                position: relative;
                border: 3px solid ${index === this.currentPageIndex ? '#4CAF50' : 'transparent'};
                transition: all 0.2s;
            ">
                <div style="
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 8px;
                    background: rgba(0,0,0,0.7);
                    border-radius: 0 0 9px 9px;
                    color: white;
                    font-size: 14px;
                    text-align: center;
                ">${page.name}</div>
                ${index === this.currentPageIndex ? '<div style="position: absolute; top: 8px; right: 8px; background: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">当前</div>' : ''}
            </div>
        `).join('');

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h2 style="color: white; margin: 0;">页面浏览</h2>
                <button id="browser-close" style="
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    padding: 8px 16px;
                    cursor: pointer;
                    font-size: 14px;
                ">返回</button>
            </div>
            <div style="flex: 1; overflow-y: auto;">
                <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
                    ${pagesHtml}
                </div>
            </div>
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 30px; padding: 20px;">
                <button id="browser-select-all" style="
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    padding: 12px 24px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <path d="M9 12l2 2 4-4"/>
                    </svg>
                    全选
                </button>
                <button id="browser-delete" style="
                    background: rgba(244,67,54,0.8);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    padding: 12px 24px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    删除
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // 动画显示
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
        });

        // 事件绑定
        modal.querySelector('#browser-close').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        });

        // 点击缩略图切换页面
        modal.querySelectorAll('.page-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                const index = parseInt(thumb.dataset.index);
                this.currentPageIndex = index;
                this.loadPage(index);
                this.updatePageInfo();
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 300);
            });
        });

        // 全选按钮
        modal.querySelector('#browser-select-all').addEventListener('click', () => {
            modal.querySelectorAll('.page-thumbnail').forEach(thumb => {
                thumb.style.border = '3px solid #2196F3';
            });
        });

        // 删除按钮
        modal.querySelector('#browser-delete').addEventListener('click', () => {
            if (this.pages.length <= 1) {
                this.showToast('至少保留一页', '#f44336');
                return;
            }
            if (confirm('确定要删除当前页面吗？')) {
                this.pages.splice(this.currentPageIndex, 1);
                if (this.currentPageIndex >= this.pages.length) {
                    this.currentPageIndex = this.pages.length - 1;
                }
                this.savePagesToStorage();
                this.loadPage(this.currentPageIndex);
                this.updatePageInfo();
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 300);
            }
        });
    }

    updatePageInfo() {
        const pageInfo = document.querySelector('.page-info');
        if (pageInfo) {
            pageInfo.textContent = `${this.currentPageIndex + 1}/${this.pages.length}`;
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
        // 如果菜单已存在，则关闭
        const existingMenu = document.getElementById('more-menu');
        if (existingMenu) {
            existingMenu.style.transform = 'translateX(-50%) scale(0)';
            setTimeout(() => existingMenu.remove(), 200);
            return;
        }

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
            <div class="menu-item" data-action="import" style="
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
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                导入
            </div>
            <div class="menu-item" data-action="export" style="
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
                导出
            </div>
            <div class="menu-item" data-action="settings" style="
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
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleMoreMenuAction(action);
                // 关闭菜单
                menu.style.transform = 'translateX(-50%) scale(0)';
                setTimeout(() => menu.remove(), 200);
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

    /**
     * 处理更多菜单的选项点击
     */
    handleMoreMenuAction(action) {
        switch (action) {
            case 'import':
                if (window.importManager) {
                    window.importManager.openFileDialog();
                }
                break;
            case 'export':
                if (window.exportManager) {
                    // 直接显示导出弹窗
                    window.exportManager.showExportDialog();
                }
                break;
            case 'settings':
                if (window.settingsManager) {
                    window.settingsManager.showSettingsPanel();
                }
                break;
        }
    }

    showToolsMenu() {
        // 如果菜单已存在，则关闭
        const existingMenu = document.getElementById('tools-menu');
        if (existingMenu) {
            existingMenu.style.transform = 'scale(0)';
            setTimeout(() => existingMenu.remove(), 200);
            return;
        }

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
            <div class="menu-item" data-tool="screenshot" style="
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
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
                </svg>
                截图
            </div>
            <div class="menu-item" data-tool="shape" style="
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
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                形状工具
            </div>
            <div class="menu-item" data-tool="text" style="
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
                    <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
                </svg>
                文本工具
            </div>
            <div class="menu-item" data-tool="laser" style="
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
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                    <path d="M13 13l6 6"/>
                </svg>
                激光笔
            </div>
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
            item.addEventListener('click', () => {
                const tool = item.dataset.tool;
                this.handleToolsMenuAction(tool);
                // 关闭菜单
                menu.style.transform = 'scale(0)';
                setTimeout(() => menu.remove(), 200);
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

    /**
     * 处理工具菜单的选项点击
     */
    handleToolsMenuAction(tool) {
        switch (tool) {
            case 'screenshot':
                if (window.screenshotManager) {
                    window.screenshotManager.startScreenshot();
                }
                break;
            case 'shape':
                this.showToast('形状工具开发中', '#2196F3');
                break;
            case 'text':
                this.showToast('文本工具开发中', '#2196F3');
                break;
            case 'laser':
                this.showToast('激光笔开发中', '#2196F3');
                break;
        }
    }

    closeWhiteboard() {
        // 检查是否有内容或内容更改
        const hasContent = this.checkHasContent();
        
        if (hasContent) {
            // 有内容，显示保存确认弹窗
            this.showSaveConfirmDialog();
        } else {
            // 无内容，直接显示退出确认
            this.showExitConfirmDialog();
        }
    }

    /**
     * 检查是否有内容
     */
    checkHasContent() {
        // 检查画布是否有内容
        if (window.canvasManager) {
            const canvas = document.getElementById('main-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                // 检查是否有非透明像素
                for (let i = 3; i < imageData.data.length; i += 4) {
                    if (imageData.data[i] > 0) {
                        return true;
                    }
                }
            }
        }
        // 检查是否有多个页面
        if (this.pages.length > 1) {
            return true;
        }
        return false;
    }

    /**
     * 显示保存确认弹窗（有内容时）
     */
    showSaveConfirmDialog() {
        const modal = document.createElement('div');
        modal.id = 'close-confirm-modal';
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
                max-width: 400px;
                width: 90%;
                border: 1px solid rgba(255,255,255,0.1);
                text-align: center;
                transform: scale(0.9);
                transition: transform 0.3s;
            ">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2" style="margin-bottom: 16px;">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                <h3 style="color: white; margin: 0 0 12px 0;">关闭白板</h3>
                <p style="color: rgba(255,255,255,0.7); margin: 0 0 24px 0; font-size: 14px;">
                    是否保存笔记？
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="save-btn" style="
                        padding: 12px 20px;
                        background: #4CAF50;
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                    ">保存</button>
                    <button class="dont-save-btn" style="
                        padding: 12px 20px;
                        background: rgba(255,255,255,0.1);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                    ">不保存</button>
                    <button class="cancel-btn" style="
                        padding: 12px 20px;
                        background: rgba(255,255,255,0.1);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                    ">取消</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 动画显示
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.querySelector('div').style.transform = 'scale(1)';
        });

        // 保存按钮
        modal.querySelector('.save-btn').addEventListener('click', () => {
            this.saveCurrentPage();
            this.showSavingDialog();
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        });

        // 不保存按钮
        modal.querySelector('.dont-save-btn').addEventListener('click', () => {
            this.showExitConfirmDialog();
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        });

        // 取消按钮
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        });

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                modal.querySelector('div').style.transform = 'scale(0.9)';
                setTimeout(() => modal.remove(), 300);
            }
        });
    }

    /**
     * 显示保存中弹窗
     */
    showSavingDialog() {
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
            z-index: 1001;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(40,40,40,0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 40px;
                text-align: center;
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 3px solid rgba(255,255,255,0.1);
                    border-top-color: #4CAF50;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p style="color: white; margin: 0; font-size: 16px;">保存中...</p>
            </div>
        `;

        document.body.appendChild(modal);

        // 模拟保存过程
        setTimeout(() => {
            modal.remove();
            this.showToast('保存成功', '#4CAF50');
            // 显示最终退出确认
            setTimeout(() => {
                this.showFinalExitDialog();
            }, 500);
        }, 1500);
    }

    /**
     * 显示退出确认弹窗（无内容时）
     */
    showExitConfirmDialog() {
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
            opacity: 0;
            transition: opacity 0.3s;
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
                transform: scale(0.9);
                transition: transform 0.3s;
            ">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2" style="margin-bottom: 16px;">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <h3 style="color: white; margin: 0 0 12px 0;">关闭白板</h3>
                <p style="color: rgba(255,255,255,0.7); margin: 0 0 24px 0; font-size: 14px;">
                    退出而不保存？
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="confirm-exit" style="
                        padding: 12px 24px;
                        background: #ff6b6b;
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">确定</button>
                    <button class="cancel-exit" style="
                        padding: 12px 24px;
                        background: rgba(255,255,255,0.1);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">取消</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 动画显示
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.querySelector('div').style.transform = 'scale(1)';
        });

        // 确定退出
        modal.querySelector('.confirm-exit').addEventListener('click', () => {
            this.performExit();
        });

        // 取消
        modal.querySelector('.cancel-exit').addEventListener('click', () => {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        });

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                modal.querySelector('div').style.transform = 'scale(0.9)';
                setTimeout(() => modal.remove(), 300);
            }
        });
    }

    /**
     * 显示最终退出确认
     */
    showFinalExitDialog() {
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
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" style="margin-bottom: 16px;">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h3 style="color: white; margin: 0 0 12px 0;">保存成功</h3>
                <p style="color: rgba(255,255,255,0.7); margin: 0 0 24px 0; font-size: 14px;">
                    笔记已保存，是否退出？
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="final-exit" style="
                        padding: 12px 24px;
                        background: #4CAF50;
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">退出</button>
                    <button class="final-cancel" style="
                        padding: 12px 24px;
                        background: rgba(255,255,255,0.1);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">取消</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 退出
        modal.querySelector('.final-exit').addEventListener('click', () => {
            this.performExit();
        });

        // 取消
        modal.querySelector('.final-cancel').addEventListener('click', () => {
            modal.remove();
        });

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * 执行退出操作
     */
    performExit() {
        // 清理本地存储（可选）
        // localStorage.removeItem('superboard_pages');
        
        // 刷新页面或跳转到首页
        window.location.reload();
        // 或者: window.location.href = '/';
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
window.toolbarManager = new ToolbarManager();
