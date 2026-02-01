/**
 * Change.js - 切换位置功能模块
 * 实现工具栏三个分组的左右位置调换
 * 同时让切换按钮的图标旋转180度
 */

class PositionChanger {
    constructor() {
        this.isSwapped = false;
        this.init();
    }

    init() {
        this.setupButton();
    }

    setupButton() {
        const changeBtn = document.querySelector('[title^="切换位置"]');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => {
                this.swapPositions();
            });
        }
    }

    swapPositions() {
        const toolbarContainer = document.querySelector('.toolbar-container');
        if (!toolbarContainer) return;

        const groups = toolbarContainer.querySelectorAll('.toolbar-group');
        if (groups.length !== 3) return;

        this.isSwapped = !this.isSwapped;

        if (this.isSwapped) {
            // 三个 toolbar-group 位置调换
            groups[0].style.order = '3';
            groups[0].style.justifySelf = 'end';
            groups[1].style.order = '2';
            groups[1].style.justifySelf = 'center';
            groups[2].style.order = '1';
            groups[2].style.justifySelf = 'start';

            // 右侧 toolbar-group 内部元素调换：关闭按钮移到左边，工具按钮移到右边
            const rightGroup = groups[2];
            const toolsBtn = rightGroup.querySelector('[title="工具"]');
            const closeBtn = rightGroup.querySelector('[title="关闭白板"]');
            const pageNav = rightGroup.querySelector('.page-nav');

            if (toolsBtn && closeBtn && pageNav) {
                toolsBtn.style.order = '3';
                pageNav.style.order = '2';
                closeBtn.style.order = '1';
            }
        } else {
            // 恢复原始位置
            groups[0].style.order = '1';
            groups[0].style.justifySelf = 'start';
            groups[1].style.order = '2';
            groups[1].style.justifySelf = 'center';
            groups[2].style.order = '3';
            groups[2].style.justifySelf = 'end';

            // 右侧 toolbar-group 内部恢复原始顺序
            const rightGroup = groups[2];
            const toolsBtn = rightGroup.querySelector('[title="工具"]');
            const closeBtn = rightGroup.querySelector('[title="关闭白板"]');
            const pageNav = rightGroup.querySelector('.page-nav');

            if (toolsBtn && closeBtn && pageNav) {
                toolsBtn.style.order = '1';
                pageNav.style.order = '2';
                closeBtn.style.order = '3';
            }
        }

        this.updateArrowIcon();

        const event = new CustomEvent('positionSwapped', {
            detail: { isSwapped: this.isSwapped }
        });
        document.dispatchEvent(event);
    }

    updateArrowIcon() {
        const changeBtn = document.querySelector('[title^="切换位置"]');
        if (!changeBtn) return;

        const svg = changeBtn.querySelector('svg');
        if (!svg) return;

        const rotation = this.isSwapped ? 180 : 0;
        svg.style.transition = 'transform 0.3s ease';
        svg.style.transform = `rotate(${rotation}deg)`;

        changeBtn.title = this.isSwapped ? '切换位置 (恢复)' : '切换位置 (调换)';
    }

    isPositionSwapped() {
        return this.isSwapped;
    }

    setSwapped(swapped) {
        if (this.isSwapped !== swapped) {
            this.swapPositions();
        }
    }
}

window.positionChanger = new PositionChanger();
