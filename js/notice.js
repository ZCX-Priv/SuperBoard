/**
 * Notice.js - 通知横幅模块
 * 负责显示可关闭的通知消息横幅
 */

class NoticeManager {
    constructor() {
        this.notices = [];
        this.maxNotices = 3;
        this.defaultDuration = 3000;
        this.init();
    }

    init() {
        this.createContainer();
        this.addStyles();
    }

    /**
     * 创建通知容器
     */
    createContainer() {
        let container = document.getElementById('notice-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notice-container';
            container.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10001;
                display: flex;
                flex-direction: column;
                gap: 8px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        this.container = container;
    }

    /**
     * 添加通知样式
     */
    addStyles() {
        if (document.getElementById('notice-styles')) return;

        const style = document.createElement('style');
        style.id = 'notice-styles';
        style.textContent = `
            @keyframes noticeSlideDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes noticeSlideUp {
                from {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
            }

            @keyframes noticeProgress {
                from {
                    width: 100%;
                }
                to {
                    width: 0%;
                }
            }

            .notice-banner {
                pointer-events: auto;
                background: rgba(40, 40, 40, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 12px 16px;
                min-width: 280px;
                max-width: 400px;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                animation: noticeSlideDown 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .notice-banner.closing {
                animation: noticeSlideUp 0.3s ease forwards;
            }

            .notice-banner.success {
                border-left: 4px solid #4CAF50;
            }

            .notice-banner.error {
                border-left: 4px solid #f44336;
            }

            .notice-banner.warning {
                border-left: 4px solid #FF9800;
            }

            .notice-banner.info {
                border-left: 4px solid #2196F3;
            }

            .notice-icon {
                width: 24px;
                height: 24px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .notice-icon svg {
                width: 20px;
                height: 20px;
            }

            .notice-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .notice-title {
                color: white;
                font-size: 14px;
                font-weight: 500;
                margin: 0;
            }

            .notice-message {
                color: rgba(255, 255, 255, 0.7);
                font-size: 13px;
                margin: 0;
            }

            .notice-close {
                width: 24px;
                height: 24px;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .notice-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .notice-close svg {
                width: 14px;
                height: 14px;
                stroke: rgba(255, 255, 255, 0.7);
            }

            .notice-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px;
                background: rgba(255, 255, 255, 0.3);
                animation: noticeProgress linear forwards;
            }

            .notice-banner.success .notice-progress {
                background: rgba(76, 175, 80, 0.5);
            }

            .notice-banner.error .notice-progress {
                background: rgba(244, 67, 54, 0.5);
            }

            .notice-banner.warning .notice-progress {
                background: rgba(255, 152, 0, 0.5);
            }

            .notice-banner.info .notice-progress {
                background: rgba(33, 150, 243, 0.5);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 显示成功通知
     */
    success(message, title = '成功') {
        return this.show({
            type: 'success',
            title,
            message,
            icon: this.getSuccessIcon()
        });
    }

    /**
     * 显示错误通知
     */
    error(message, title = '错误') {
        return this.show({
            type: 'error',
            title,
            message,
            icon: this.getErrorIcon(),
            duration: 5000
        });
    }

    /**
     * 显示警告通知
     */
    warning(message, title = '警告') {
        return this.show({
            type: 'warning',
            title,
            message,
            icon: this.getWarningIcon(),
            duration: 4000
        });
    }

    /**
     * 显示信息通知
     */
    info(message, title = '提示') {
        return this.show({
            type: 'info',
            title,
            message,
            icon: this.getInfoIcon()
        });
    }

    /**
     * 显示通知
     */
    show(options) {
        const {
            type = 'info',
            title,
            message,
            icon,
            duration = this.defaultDuration,
            closable = true
        } = options;

        // 限制通知数量
        if (this.notices.length >= this.maxNotices) {
            this.removeNotice(this.notices[0]);
        }

        const notice = document.createElement('div');
        notice.className = `notice-banner ${type}`;

        notice.innerHTML = `
            <div class="notice-icon">${icon}</div>
            <div class="notice-content">
                ${title ? `<div class="notice-title">${title}</div>` : ''}
                ${message ? `<div class="notice-message">${message}</div>` : ''}
            </div>
            ${closable ? `
                <button class="notice-close" title="关闭">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            ` : ''}
            <div class="notice-progress" style="animation-duration: ${duration}ms;"></div>
        `;

        this.container.appendChild(notice);
        this.notices.push(notice);

        // 关闭按钮事件
        if (closable) {
            const closeBtn = notice.querySelector('.notice-close');
            closeBtn.addEventListener('click', () => {
                this.removeNotice(notice);
            });
        }

        // 自动关闭
        const autoCloseTimer = setTimeout(() => {
            this.removeNotice(notice);
        }, duration);

        // 鼠标悬停时暂停计时
        notice.addEventListener('mouseenter', () => {
            const progress = notice.querySelector('.notice-progress');
            if (progress) {
                progress.style.animationPlayState = 'paused';
            }
        });

        notice.addEventListener('mouseleave', () => {
            const progress = notice.querySelector('.notice-progress');
            if (progress) {
                progress.style.animationPlayState = 'running';
            }
        });

        // 存储定时器引用
        notice._autoCloseTimer = autoCloseTimer;

        return notice;
    }

    /**
     * 移除通知
     */
    removeNotice(notice) {
        if (!notice || notice._isClosing) return;

        notice._isClosing = true;

        // 清除自动关闭定时器
        if (notice._autoCloseTimer) {
            clearTimeout(notice._autoCloseTimer);
        }

        notice.classList.add('closing');

        setTimeout(() => {
            if (notice.parentNode) {
                notice.parentNode.removeChild(notice);
            }
            const index = this.notices.indexOf(notice);
            if (index > -1) {
                this.notices.splice(index, 1);
            }
        }, 300);
    }

    /**
     * 清除所有通知
     */
    clearAll() {
        [...this.notices].forEach(notice => {
            this.removeNotice(notice);
        });
    }

    /**
     * 获取成功图标
     */
    getSuccessIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>`;
    }

    /**
     * 获取错误图标
     */
    getErrorIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>`;
    }

    /**
     * 获取警告图标
     */
    getWarningIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#FF9800" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>`;
    }

    /**
     * 获取信息图标
     */
    getInfoIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#2196F3" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>`;
    }
}

// 导出单例
window.noticeManager = new NoticeManager();
