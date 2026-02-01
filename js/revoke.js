/**
 * Revoke.js - 撤销功能模块
 * 实现撤销操作/笔迹功能
 */

class RevokeTool {
    constructor() {
        this.init();
    }

    init() {
        this.setupButton();
        this.setupKeyboardShortcuts();
    }

    setupButton() {
        const revokeBtn = document.querySelector('[title="撤销"]');
        if (revokeBtn) {
            revokeBtn.addEventListener('click', () => {
                this.undo();
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
        });
    }

    undo() {
        if (window.canvasManager) {
            window.canvasManager.undo();
        }
    }
}

window.revokeTool = new RevokeTool();
