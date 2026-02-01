/**
 * Settings.js - 设置功能模块
 * 负责白板的全局设置管理，包含常规、超能力、关于三个标签页
 */

class SettingsManager {
    constructor() {
        this.currentTab = 'general';
        this.settings = {
            // 常规设置
            general: {
                theme: 'system', // system, light, dark, glass
                background: {
                    type: 'color', // color, image
                    color: '#0d2b20',
                    image: null
                },
                grid: {
                    enabled: false,
                    type: 'none', // none, dot, line, cross
                    spacing: 20
                },
                animation: {
                    enabled: true,
                    type: 'smooth' // smooth, simple, none
                }
            },
            // 超能力设置
            superpowers: {
                smartFollow: {
                    enabled: true,
                    autoScroll: true,
                    scrollPosition: 'center' // center, top, custom
                },
                smartShape: {
                    enabled: true,
                    autoCorrect: true
                },
                aiAssistant: {
                    enabled: false,
                    provider: 'default', // default, openai, custom
                    apiKey: '',
                    model: 'gpt-3.5-turbo',
                    character: {
                        name: 'AI助教',
                        style: 'friendly' // friendly, professional, casual
                    },
                    memory: true
                }
            },
            // 存储设置
            storage: {
                autoSave: true,
                autoSaveInterval: 30000,
                saveLocation: 'default' // default, custom
            }
        };

        this.storageKey = 'superboard_settings';
        this.init();
    }

    init() {
        this.loadSettings();
        this.applySettings();
    }

    /**
     * 从本地存储加载设置
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = this.deepMerge(this.settings, parsed);
            }
        } catch (err) {
            console.warn('加载设置失败:', err);
        }
    }

    /**
     * 保存设置到本地存储
     */
    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (err) {
            console.warn('保存设置失败:', err);
        }
    }

    /**
     * 获取设置值
     */
    get(path) {
        const keys = path.split('.');
        let value = this.settings;
        for (const key of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[key];
        }
        return value;
    }

    /**
     * 设置设置值
     */
    set(path, value) {
        const keys = path.split('.');
        let target = this.settings;
        for (let i = 0; i < keys.length - 1; i++) {
            if (target[keys[i]] === undefined) {
                target[keys[i]] = {};
            }
            target = target[keys[i]];
        }
        target[keys[keys.length - 1]] = value;
        this.saveSettings();
        this.applySetting(path, value);
    }

    /**
     * 应用所有设置
     */
    applySettings() {
        this.applyTheme();
        this.applyBackground();
        this.applyGrid();
    }

    /**
     * 应用单个设置
     */
    applySetting(path, value) {
        if (path.startsWith('general.theme')) {
            this.applyTheme();
        } else if (path.startsWith('general.background')) {
            this.applyBackground();
        } else if (path.startsWith('general.grid')) {
            this.applyGrid();
        }
    }

    /**
     * 应用主题
     */
    applyTheme() {
        const theme = this.settings.general.theme;
        document.body.classList.remove('theme-system', 'theme-light', 'theme-dark', 'theme-glass');
        document.body.classList.add(`theme-${theme}`);

        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.style.backgroundColor = '#0d2b20';
        } else if (theme === 'light') {
            document.body.style.backgroundColor = '#f5f5f5';
        } else if (theme === 'glass') {
            document.body.style.background = 'linear-gradient(135deg, rgba(13,43,32,0.9) 0%, rgba(30,30,30,0.9) 100%)';
        }
    }

    /**
     * 应用背景
     */
    applyBackground() {
        const bg = this.settings.general.background;
        const canvas = document.getElementById('main-canvas');
        if (!canvas) return;

        if (bg.type === 'color') {
            canvas.style.backgroundColor = bg.color;
            canvas.style.backgroundImage = 'none';
        } else if (bg.type === 'image' && bg.image) {
            canvas.style.backgroundImage = `url(${bg.image})`;
            canvas.style.backgroundSize = 'cover';
            canvas.style.backgroundPosition = 'center';
        }
    }

    /**
     * 应用网格
     */
    applyGrid() {
        const grid = this.settings.general.grid;
        const canvas = document.getElementById('main-canvas');
        if (!canvas) return;

        // 移除现有网格
        const existingGrid = document.getElementById('canvas-grid');
        if (existingGrid) {
            existingGrid.remove();
        }

        if (!grid.enabled || grid.type === 'none') return;

        const gridLayer = document.createElement('div');
        gridLayer.id = 'canvas-grid';
        gridLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;

        const spacing = grid.spacing;
        let backgroundImage = '';

        switch (grid.type) {
            case 'dot':
                backgroundImage = `radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)`;
                gridLayer.style.backgroundImage = backgroundImage;
                gridLayer.style.backgroundSize = `${spacing}px ${spacing}px`;
                break;
            case 'line':
                backgroundImage = `
                    linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                `;
                gridLayer.style.backgroundImage = backgroundImage;
                gridLayer.style.backgroundSize = `${spacing}px ${spacing}px`;
                break;
            case 'cross':
                backgroundImage = `
                    repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent ${spacing - 1}px,
                        rgba(255,255,255,0.1) ${spacing - 1}px,
                        rgba(255,255,255,0.1) ${spacing}px
                    ),
                    repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent ${spacing - 1}px,
                        rgba(255,255,255,0.1) ${spacing - 1}px,
                        rgba(255,255,255,0.1) ${spacing}px
                    )
                `;
                gridLayer.style.backgroundImage = backgroundImage;
                break;
        }

        canvas.parentElement.style.position = 'relative';
        canvas.parentElement.appendChild(gridLayer);
    }

    /**
     * 显示设置面板
     */
    showSettingsPanel() {
        const existingPanel = document.getElementById('settings-panel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'settings-panel';
        panel.style.cssText = `
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

        panel.innerHTML = `
            <div style="
                background: rgba(40,40,40,0.98);
                backdrop-filter: blur(20px);
                border-radius: 16px;
                width: 480px;
                max-height: 80vh;
                overflow: hidden;
                border: 1px solid rgba(255,255,255,0.1);
                transform: scale(0.9);
                transition: transform 0.3s;
                display: flex;
                flex-direction: column;
            ">
                <!-- 标题栏 -->
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                ">
                    <h2 style="color: white; margin: 0; font-size: 18px; font-weight: 500;">设置</h2>
                    <button class="settings-close" style="
                        background: none;
                        border: none;
                        color: rgba(255,255,255,0.5);
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 6px;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <!-- 标签页 -->
                <div style="
                    display: flex;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding: 0 20px;
                ">
                    <button class="settings-tab active" data-tab="general" style="
                        padding: 12px 16px;
                        background: none;
                        border: none;
                        color: white;
                        font-size: 14px;
                        cursor: pointer;
                        border-bottom: 2px solid #4CAF50;
                        transition: all 0.2s;
                    ">常规</button>
                    <button class="settings-tab" data-tab="superpowers" style="
                        padding: 12px 16px;
                        background: none;
                        border: none;
                        color: rgba(255,255,255,0.5);
                        font-size: 14px;
                        cursor: pointer;
                        border-bottom: 2px solid transparent;
                        transition: all 0.2s;
                    ">超能力</button>
                    <button class="settings-tab" data-tab="about" style="
                        padding: 12px 16px;
                        background: none;
                        border: none;
                        color: rgba(255,255,255,0.5);
                        font-size: 14px;
                        cursor: pointer;
                        border-bottom: 2px solid transparent;
                        transition: all 0.2s;
                    ">关于</button>
                </div>

                <!-- 内容区域 -->
                <div class="settings-content" style="
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    max-height: 400px;
                ">
                    ${this.getGeneralTabContent()}
                </div>

                <!-- 底部按钮 -->
                <div style="
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    padding: 16px 20px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                ">
                    <button class="settings-reset" style="
                        padding: 8px 16px;
                        background: rgba(255,255,255,0.1);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 13px;
                        transition: background 0.2s;
                    ">恢复默认</button>
                    <button class="settings-save" style="
                        padding: 8px 16px;
                        background: #4CAF50;
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 13px;
                        transition: background 0.2s;
                    ">保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // 动画显示
        requestAnimationFrame(() => {
            panel.style.opacity = '1';
            panel.querySelector('div').style.transform = 'scale(1)';
        });

        // 事件绑定
        this.bindPanelEvents(panel);
    }

    /**
     * 获取常规标签页内容
     */
    getGeneralTabContent() {
        const general = this.settings.general;
        return `
            <div class="tab-panel" data-panel="general">
                <!-- 主题设置 -->
                <div style="margin-bottom: 24px;">
                    <label style="display: block; color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">主题</label>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="theme-option ${general.theme === 'system' ? 'active' : ''}" data-theme="system" style="
                            padding: 8px 16px;
                            background: ${general.theme === 'system' ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.05)'};
                            border: 1px solid ${general.theme === 'system' ? '#4CAF50' : 'rgba(255,255,255,0.1)'};
                            border-radius: 8px;
                            color: white;
                            font-size: 13px;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">跟随系统</button>
                        <button class="theme-option ${general.theme === 'light' ? 'active' : ''}" data-theme="light" style="
                            padding: 8px 16px;
                            background: ${general.theme === 'light' ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.05)'};
                            border: 1px solid ${general.theme === 'light' ? '#4CAF50' : 'rgba(255,255,255,0.1)'};
                            border-radius: 8px;
                            color: white;
                            font-size: 13px;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">白昼</button>
                        <button class="theme-option ${general.theme === 'dark' ? 'active' : ''}" data-theme="dark" style="
                            padding: 8px 16px;
                            background: ${general.theme === 'dark' ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.05)'};
                            border: 1px solid ${general.theme === 'dark' ? '#4CAF50' : 'rgba(255,255,255,0.1)'};
                            border-radius: 8px;
                            color: white;
                            font-size: 13px;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">黑夜</button>
                        <button class="theme-option ${general.theme === 'glass' ? 'active' : ''}" data-theme="glass" style="
                            padding: 8px 16px;
                            background: ${general.theme === 'glass' ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.05)'};
                            border: 1px solid ${general.theme === 'glass' ? '#4CAF50' : 'rgba(255,255,255,0.1)'};
                            border-radius: 8px;
                            color: white;
                            font-size: 13px;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">玻璃</button>
                    </div>
                </div>

                <!-- 背景设置 -->
                <div style="margin-bottom: 24px;">
                    <label style="display: block; color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">背景</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="bg-option ${general.background.type === 'color' ? 'active' : ''}" data-bgtype="color" style="
                            width: 40px;
                            height: 40px;
                            background: ${general.background.color};
                            border: 2px solid ${general.background.type === 'color' ? '#4CAF50' : 'rgba(255,255,255,0.2)'};
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                        <button class="bg-option" style="
                            width: 40px;
                            height: 40px;
                            background: #1a1a1a;
                            border: 2px solid rgba(255,255,255,0.2);
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                        <button class="bg-option" style="
                            width: 40px;
                            height: 40px;
                            background: #2d3748;
                            border: 2px solid rgba(255,255,255,0.2);
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                        <button class="bg-option" style="
                            width: 40px;
                            height: 40px;
                            background: rgba(255,255,255,0.1);
                            border: 2px dashed rgba(255,255,255,0.3);
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- 网格设置 -->
                <div style="margin-bottom: 24px;">
                    <label style="display: block; color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">网格</label>
                    <div style="display: flex; gap: 8px;">
                        <button class="grid-option ${general.grid.type === 'none' ? 'active' : ''}" data-grid="none" style="
                            width: 48px;
                            height: 48px;
                            background: rgba(255,255,255,0.05);
                            border: 2px solid ${general.grid.type === 'none' ? '#4CAF50' : 'rgba(255,255,255,0.2)'};
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s;
                        ">
                            <span style="color: rgba(255,255,255,0.5); font-size: 12px;">无</span>
                        </button>
                        <button class="grid-option ${general.grid.type === 'dot' ? 'active' : ''}" data-grid="dot" style="
                            width: 48px;
                            height: 48px;
                            background: rgba(255,255,255,0.05);
                            border: 2px solid ${general.grid.type === 'dot' ? '#4CAF50' : 'rgba(255,255,255,0.2)'};
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s;
                            background-image: radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px);
                            background-size: 8px 8px;
                        "></button>
                        <button class="grid-option ${general.grid.type === 'line' ? 'active' : ''}" data-grid="line" style="
                            width: 48px;
                            height: 48px;
                            background: rgba(255,255,255,0.05);
                            border: 2px solid ${general.grid.type === 'line' ? '#4CAF50' : 'rgba(255,255,255,0.2)'};
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s;
                            background-image: linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
                                              linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px);
                            background-size: 12px 12px;
                        "></button>
                        <button class="grid-option ${general.grid.type === 'cross' ? 'active' : ''}" data-grid="cross" style="
                            width: 48px;
                            height: 48px;
                            background: rgba(255,255,255,0.05);
                            border: 2px solid ${general.grid.type === 'cross' ? '#4CAF50' : 'rgba(255,255,255,0.2)'};
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s;
                            background-image: repeating-linear-gradient(0deg, transparent, transparent 11px, rgba(255,255,255,0.2) 11px, rgba(255,255,255,0.2) 12px),
                                              repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(255,255,255,0.2) 11px, rgba(255,255,255,0.2) 12px);
                        "></button>
                    </div>
                </div>

                <!-- 动画设置 -->
                <div style="margin-bottom: 8px;">
                    <label style="display: block; color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">动画效果</label>
                    <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                        <span style="color: white; font-size: 14px;">启用动画</span>
                        <div class="toggle-switch ${general.animation.enabled ? 'active' : ''}" style="
                            width: 44px;
                            height: 24px;
                            background: ${general.animation.enabled ? '#4CAF50' : 'rgba(255,255,255,0.2)'};
                            border-radius: 12px;
                            position: relative;
                            cursor: pointer;
                            transition: background 0.2s;
                        ">
                            <div style="
                                width: 20px;
                                height: 20px;
                                background: white;
                                border-radius: 50%;
                                position: absolute;
                                top: 2px;
                                left: ${general.animation.enabled ? '22px' : '2px'};
                                transition: left 0.2s;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            "></div>
                        </div>
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * 获取超能力标签页内容
     */
    getSuperpowersTabContent() {
        const superpowers = this.settings.superpowers;
        return `
            <div class="tab-panel" data-panel="superpowers">
                <!-- 智能跟随 -->
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div>
                            <div style="color: white; font-size: 14px; font-weight: 500;">智能跟随</div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 2px;">在书写触底时自动向上滚动到中间</div>
                        </div>
                        <div class="toggle-switch ${superpowers.smartFollow.enabled ? 'active' : ''}" data-setting="superpowers.smartFollow.enabled" style="
                            width: 44px;
                            height: 24px;
                            background: ${superpowers.smartFollow.enabled ? '#4CAF50' : 'rgba(255,255,255,0.2)'};
                            border-radius: 12px;
                            position: relative;
                            cursor: pointer;
                            transition: background 0.2s;
                            flex-shrink: 0;
                        ">
                            <div style="
                                width: 20px;
                                height: 20px;
                                background: white;
                                border-radius: 50%;
                                position: absolute;
                                top: 2px;
                                left: ${superpowers.smartFollow.enabled ? '22px' : '2px'};
                                transition: left 0.2s;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            "></div>
                        </div>
                    </div>
                    ${superpowers.smartFollow.enabled ? `
                        <div style="padding-left: 16px; border-left: 2px solid rgba(76,175,80,0.3);">
                            <label style="display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.7); font-size: 13px; margin-bottom: 8px;">
                                <input type="radio" name="scrollPos" value="center" ${superpowers.smartFollow.scrollPosition === 'center' ? 'checked' : ''} style="cursor: pointer;">
                                滚动到中间
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.7); font-size: 13px;">
                                <input type="radio" name="scrollPos" value="custom" ${superpowers.smartFollow.scrollPosition === 'custom' ? 'checked' : ''} style="cursor: pointer;">
                                自定义位置
                            </label>
                        </div>
                    ` : ''}
                </div>

                <!-- 智能图形 -->
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="color: white; font-size: 14px; font-weight: 500;">智能图形</div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 2px;">自动拉直图形</div>
                        </div>
                        <div class="toggle-switch ${superpowers.smartShape.enabled ? 'active' : ''}" data-setting="superpowers.smartShape.enabled" style="
                            width: 44px;
                            height: 24px;
                            background: ${superpowers.smartShape.enabled ? '#4CAF50' : 'rgba(255,255,255,0.2)'};
                            border-radius: 12px;
                            position: relative;
                            cursor: pointer;
                            transition: background 0.2s;
                            flex-shrink: 0;
                        ">
                            <div style="
                                width: 20px;
                                height: 20px;
                                background: white;
                                border-radius: 50%;
                                position: absolute;
                                top: 2px;
                                left: ${superpowers.smartShape.enabled ? '22px' : '2px'};
                                transition: left 0.2s;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            "></div>
                        </div>
                    </div>
                </div>

                <!-- AI助教 -->
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div>
                            <div style="color: white; font-size: 14px; font-weight: 500;">AI 助教</div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 2px;">智能辅助书写和解答</div>
                        </div>
                        <div class="toggle-switch ${superpowers.aiAssistant.enabled ? 'active' : ''}" data-setting="superpowers.aiAssistant.enabled" style="
                            width: 44px;
                            height: 24px;
                            background: ${superpowers.aiAssistant.enabled ? '#4CAF50' : 'rgba(255,255,255,0.2)'};
                            border-radius: 12px;
                            position: relative;
                            cursor: pointer;
                            transition: background 0.2s;
                            flex-shrink: 0;
                        ">
                            <div style="
                                width: 20px;
                                height: 20px;
                                background: white;
                                border-radius: 50%;
                                position: absolute;
                                top: 2px;
                                left: ${superpowers.aiAssistant.enabled ? '22px' : '2px'};
                                transition: left 0.2s;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            "></div>
                        </div>
                    </div>
                    ${superpowers.aiAssistant.enabled ? `
                        <div style="padding-left: 16px; border-left: 2px solid rgba(76,175,80,0.3);">
                            <div style="margin-bottom: 12px;">
                                <label style="display: block; color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 6px;">角色设定</label>
                                <input type="text" value="${superpowers.aiAssistant.character.name}" placeholder="AI名称" style="
                                    width: 100%;
                                    padding: 8px 12px;
                                    background: rgba(255,255,255,0.05);
                                    border: 1px solid rgba(255,255,255,0.1);
                                    border-radius: 6px;
                                    color: white;
                                    font-size: 13px;
                                    outline: none;
                                    margin-bottom: 8px;
                                ">
                                <select style="
                                    width: 100%;
                                    padding: 8px 12px;
                                    background: rgba(255,255,255,0.05);
                                    border: 1px solid rgba(255,255,255,0.1);
                                    border-radius: 6px;
                                    color: white;
                                    font-size: 13px;
                                    outline: none;
                                    cursor: pointer;
                                ">
                                    <option value="friendly" ${superpowers.aiAssistant.character.style === 'friendly' ? 'selected' : ''} style="background: #333;">友好</option>
                                    <option value="professional" ${superpowers.aiAssistant.character.style === 'professional' ? 'selected' : ''} style="background: #333;">专业</option>
                                    <option value="casual" ${superpowers.aiAssistant.character.style === 'casual' ? 'selected' : ''} style="background: #333;">随意</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 6px;">API 提供商</label>
                                <select style="
                                    width: 100%;
                                    padding: 8px 12px;
                                    background: rgba(255,255,255,0.05);
                                    border: 1px solid rgba(255,255,255,0.1);
                                    border-radius: 6px;
                                    color: white;
                                    font-size: 13px;
                                    outline: none;
                                    cursor: pointer;
                                    margin-bottom: 8px;
                                ">
                                    <option value="default" ${superpowers.aiAssistant.provider === 'default' ? 'selected' : ''} style="background: #333;">默认</option>
                                    <option value="openai" ${superpowers.aiAssistant.provider === 'openai' ? 'selected' : ''} style="background: #333;">OpenAI</option>
                                    <option value="custom" ${superpowers.aiAssistant.provider === 'custom' ? 'selected' : ''} style="background: #333;">自定义</option>
                                </select>
                                <input type="password" placeholder="API Key (可选)" style="
                                    width: 100%;
                                    padding: 8px 12px;
                                    background: rgba(255,255,255,0.05);
                                    border: 1px solid rgba(255,255,255,0.1);
                                    border-radius: 6px;
                                    color: white;
                                    font-size: 13px;
                                    outline: none;
                                ">
                            </div>
                            <label style="display: flex; align-items: center; gap: 8px; margin-top: 12px; cursor: pointer;">
                                <input type="checkbox" ${superpowers.aiAssistant.memory ? 'checked' : ''} style="cursor: pointer;">
                                <span style="color: rgba(255,255,255,0.7); font-size: 13px;">启用记忆功能</span>
                            </label>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 获取关于标签页内容
     */
    getAboutTabContent() {
        return `
            <div class="tab-panel" data-panel="about" style="text-align: center; padding: 20px;">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #4CAF50 0%, #2196F3 100%);
                    border-radius: 20px;
                    margin: 0 auto 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 32px rgba(76,175,80,0.3);
                ">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="4"/>
                        <path d="M8 12l3 3 5-6"/>
                    </svg>
                </div>
                <h3 style="color: white; font-size: 24px; margin: 0 0 8px 0; font-weight: 600;">Super Board</h3>
                <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0 0 24px 0;">版本 1.0.0</p>
                
                <div style="
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 20px;
                ">
                    <p style="color: rgba(255,255,255,0.7); font-size: 13px; line-height: 1.6; margin: 0;">
                        Super Board 是一款功能强大的数字白板应用，<br>
                        支持手写、智能识别、AI辅助等多种功能。<br>
                        让创意表达更加自由流畅。
                    </p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <a href="#" style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        padding: 10px;
                        background: rgba(255,255,255,0.05);
                        border-radius: 8px;
                        color: rgba(255,255,255,0.8);
                        text-decoration: none;
                        font-size: 13px;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                        </svg>
                        GitHub: github.com/superboard
                    </a>
                    <a href="#" style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        padding: 10px;
                        background: rgba(255,255,255,0.05);
                        border-radius: 8px;
                        color: rgba(255,255,255,0.8);
                        text-decoration: none;
                        font-size: 13px;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4M12 8h.01"/>
                        </svg>
                        使用帮助
                    </a>
                </div>

                <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin-top: 24px;">
                    © 2026 Super Board. All rights reserved.
                </p>
            </div>
        `;
    }

    /**
     * 绑定面板事件
     */
    bindPanelEvents(panel) {
        // 关闭按钮
        panel.querySelector('.settings-close').addEventListener('click', () => {
            this.closeSettingsPanel(panel);
        });

        // 保存按钮
        panel.querySelector('.settings-save').addEventListener('click', () => {
            this.saveSettingsFromPanel(panel);
        });

        // 恢复默认按钮
        panel.querySelector('.settings-reset').addEventListener('click', () => {
            this.resetSettings();
        });

        // 标签页切换
        panel.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(panel, tabName);
            });
        });

        // 点击背景关闭
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                this.closeSettingsPanel(panel);
            }
        });

        // 绑定动态内容事件
        this.bindDynamicEvents(panel);
    }

    /**
     * 绑定动态内容事件
     */
    bindDynamicEvents(panel) {
        // 主题选项
        panel.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('.theme-option').forEach(b => {
                    b.style.background = 'rgba(255,255,255,0.05)';
                    b.style.borderColor = 'rgba(255,255,255,0.1)';
                    b.classList.remove('active');
                });
                btn.style.background = 'rgba(76,175,80,0.2)';
                btn.style.borderColor = '#4CAF50';
                btn.classList.add('active');
                this.settings.general.theme = btn.dataset.theme;
            });
        });

        // 背景选项
        panel.querySelectorAll('.bg-option').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('.bg-option').forEach(b => {
                    b.style.borderColor = 'rgba(255,255,255,0.2)';
                    b.classList.remove('active');
                });
                btn.style.borderColor = '#4CAF50';
                btn.classList.add('active');
            });
        });

        // 网格选项
        panel.querySelectorAll('.grid-option').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('.grid-option').forEach(b => {
                    b.style.borderColor = 'rgba(255,255,255,0.2)';
                    b.classList.remove('active');
                });
                btn.style.borderColor = '#4CAF50';
                btn.classList.add('active');
                this.settings.general.grid.type = btn.dataset.grid;
                this.settings.general.grid.enabled = btn.dataset.grid !== 'none';
            });
        });

        // 开关切换
        panel.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const isActive = toggle.classList.contains('active');
                const setting = toggle.dataset.setting;

                if (isActive) {
                    toggle.classList.remove('active');
                    toggle.style.background = 'rgba(255,255,255,0.2)';
                    toggle.querySelector('div').style.left = '2px';
                } else {
                    toggle.classList.add('active');
                    toggle.style.background = '#4CAF50';
                    toggle.querySelector('div').style.left = '22px';
                }

                if (setting) {
                    this.set(setting, !isActive);
                    // 重新渲染当前标签页以显示/隐藏子选项
                    const currentTab = panel.querySelector('.settings-tab.active').dataset.tab;
                    this.updateTabContent(panel, currentTab);
                }
            });
        });
    }

    /**
     * 切换标签页
     */
    switchTab(panel, tabName) {
        // 更新标签样式
        panel.querySelectorAll('.settings-tab').forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
                tab.style.color = 'white';
                tab.style.borderBottomColor = '#4CAF50';
            } else {
                tab.classList.remove('active');
                tab.style.color = 'rgba(255,255,255,0.5)';
                tab.style.borderBottomColor = 'transparent';
            }
        });

        // 更新内容
        this.updateTabContent(panel, tabName);
    }

    /**
     * 更新标签页内容
     */
    updateTabContent(panel, tabName) {
        const content = panel.querySelector('.settings-content');
        switch (tabName) {
            case 'general':
                content.innerHTML = this.getGeneralTabContent();
                break;
            case 'superpowers':
                content.innerHTML = this.getSuperpowersTabContent();
                break;
            case 'about':
                content.innerHTML = this.getAboutTabContent();
                break;
        }
        // 重新绑定事件
        this.bindDynamicEvents(panel);
    }

    /**
     * 关闭设置面板
     */
    closeSettingsPanel(panel) {
        panel.style.opacity = '0';
        panel.querySelector('div').style.transform = 'scale(0.9)';
        setTimeout(() => panel.remove(), 300);
    }

    /**
     * 从面板保存设置
     */
    saveSettingsFromPanel(panel) {
        this.saveSettings();
        this.applySettings();
        this.closeSettingsPanel(panel);

        // 使用通知横幅显示保存成功
        if (window.noticeManager) {
            window.noticeManager.success('设置已成功保存');
        }
    }

    /**
     * 恢复默认设置
     */
    resetSettings() {
        if (confirm('确定要恢复默认设置吗？所有自定义设置将被清除。')) {
            localStorage.removeItem(this.storageKey);
            location.reload();
        }
    }

    /**
     * 深度合并对象
     */
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }
}

// 导出单例
window.settingsManager = new SettingsManager();
