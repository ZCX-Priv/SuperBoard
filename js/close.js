/**
 * Close.js - 关闭白板模块
 * 负责关闭白板的确认流程和保存逻辑
 */

class CloseManager {
    constructor() {
        this.hasUnsavedChanges = false;
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
        if (window.toolbarManager && window.toolbarManager.pages) {
            if (window.toolbarManager.pages.length > 1) {
                return true;
            }
        }
        return false;
    }

    /**
     * 开始关闭流程
     */
    startCloseProcess() {
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
            this.saveAndClose(modal);
        });

        // 不保存按钮
        modal.querySelector('.dont-save-btn').addEventListener('click', () => {
            this.closeModal(modal);
            setTimeout(() => {
                this.showExitConfirmDialog();
            }, 300);
        });

        // 取消按钮
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            this.closeModal(modal);
        });

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }

    /**
     * 保存并关闭
     */
    saveAndClose(modal) {
        // 保存当前页面
        if (window.toolbarManager) {
            window.toolbarManager.saveCurrentPage();
        }

        this.closeModal(modal);

        // 显示保存中
        setTimeout(() => {
            this.showSavingDialog();
        }, 300);
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
            this.closeModal(modal);
        });

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
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

        // 动画显示
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.querySelector('div').style.transform = 'scale(1)';
        });

        // 退出
        modal.querySelector('.final-exit').addEventListener('click', () => {
            this.performExit();
        });

        // 取消
        modal.querySelector('.final-cancel').addEventListener('click', () => {
            this.closeModal(modal);
        });

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }

    /**
     * 关闭弹窗
     */
    closeModal(modal) {
        modal.style.opacity = '0';
        modal.querySelector('div').style.transform = 'scale(0.9)';
        setTimeout(() => modal.remove(), 300);
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
window.closeManager = new CloseManager();
