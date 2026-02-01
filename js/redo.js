/**
 * Redo.js - 重做功能模块
 * 实现恢复操作/笔迹功能
 */

class RedoTool {
    constructor() {
        this.init();
    }

    init() {
        this.setupButton();
        this.setupKeyboardShortcuts();
    }

    setupButton() {
        const redoBtn = document.querySelector('[title="重做"]');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.redo();
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                this.redo();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        });
    }

    redo() {
        if (window.canvasManager) {
            window.canvasManager.redo();
        }
    }
}

window.redoTool = new RedoTool();
