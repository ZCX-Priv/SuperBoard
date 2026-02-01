/**
 * Export.js - 导出功能模块
 * 负责将白板内容导出为图片、PDF等格式
 */

class ExportManager {
    constructor() {
        this.supportedFormats = ['png', 'jpg', 'pdf', 'zip'];
        this.defaultQuality = 0.9;
    }

    /**
     * 显示导出选项菜单（兼容旧版调用）
     */
    showExportMenu(x, y) {
        // 移除已存在的菜单
        const existingMenu = document.getElementById('export-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const menu = document.createElement('div');
        menu.id = 'export-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: rgba(40,40,40,0.95);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 8px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 1000;
            min-width: 150px;
            animation: fadeIn 0.2s ease;
        `;

        menu.innerHTML = `
            <div class="export-option" data-format="png" style="
                padding: 10px 16px;
                color: white;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
            ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                导出为 PNG
            </div>
            <div class="export-option" data-format="jpg" style="
                padding: 10px 16px;
                color: white;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
            ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                导出为 JPG
            </div>
            <div class="export-option" data-format="dialog" style="
                padding: 10px 16px;
                color: white;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
            ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <path d="M8 12h8M12 8v8"/>
                </svg>
                更多选项...
            </div>
        `;

        document.body.appendChild(menu);

        // 菜单项事件
        menu.querySelectorAll('.export-option').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(255,255,255,0.1)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
            item.addEventListener('click', () => {
                const format = item.dataset.format;
                if (format === 'dialog') {
                    menu.remove();
                    this.showExportDialog();
                } else {
                    this.handleExportOption(format);
                    menu.remove();
                }
            });
        });

        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    /**
     * 显示导出弹窗
     */
    showExportDialog() {
        // 移除已存在的弹窗
        const existingDialog = document.getElementById('export-dialog');
        if (existingDialog) {
            existingDialog.remove();
            return;
        }

        const dialog = document.createElement('div');
        dialog.id = 'export-dialog';
        dialog.style.cssText = `
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

        dialog.innerHTML = `
            <div style="
                background: rgba(40,40,40,0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 30px;
                max-width: 450px;
                width: 90%;
                border: 1px solid rgba(255,255,255,0.1);
                transform: scale(0.9);
                transition: transform 0.3s;
            ">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <h2 style="color: white; margin: 0; font-size: 20px;">导出</h2>
                    <button class="export-close" style="
                        background: none;
                        border: none;
                        color: rgba(255,255,255,0.6);
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        transition: all 0.2s;
                    ">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 8px;">文件名称</label>
                    <input type="text" id="export-filename" value="白板笔记_${new Date().toLocaleDateString().replace(/\//g, '-')}" style="
                        width: 100%;
                        padding: 10px 12px;
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 8px;
                        color: white;
                        font-size: 14px;
                        outline: none;
                    ">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 8px;">保存位置</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="export-location" value="下载文件夹" readonly style="
                            flex: 1;
                            padding: 10px 12px;
                            background: rgba(255,255,255,0.05);
                            border: 1px solid rgba(255,255,255,0.2);
                            border-radius: 8px;
                            color: white;
                            font-size: 14px;
                            outline: none;
                        ">
                        <button id="export-browse" style="
                            padding: 10px 16px;
                            background: rgba(255,255,255,0.1);
                            border: none;
                            border-radius: 8px;
                            color: white;
                            cursor: pointer;
                            font-size: 14px;
                            white-space: nowrap;
                        ">浏览</button>
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <label style="display: block; color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 12px;">导出格式</label>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <label class="format-option" style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 10px 16px;
                            background: rgba(255,255,255,0.1);
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                            color: white;
                            font-size: 14px;
                        ">
                            <input type="radio" name="export-format" value="zip" checked style="cursor: pointer;">
                            <span>ZIP</span>
                        </label>
                        <label class="format-option" style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 10px 16px;
                            background: rgba(255,255,255,0.1);
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                            color: white;
                            font-size: 14px;
                        ">
                            <input type="radio" name="export-format" value="pdf" style="cursor: pointer;">
                            <span>PDF</span>
                        </label>
                        <label class="format-option" style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 10px 16px;
                            background: rgba(255,255,255,0.1);
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                            color: white;
                            font-size: 14px;
                        ">
                            <input type="radio" name="export-format" value="png" style="cursor: pointer;">
                            <span>PNG</span>
                        </label>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="export-cancel" style="
                        padding: 10px 20px;
                        background: rgba(255,255,255,0.1);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                    ">取消</button>
                    <button class="export-confirm" style="
                        padding: 10px 20px;
                        background: #4CAF50;
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                    ">导出</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // 动画显示
        requestAnimationFrame(() => {
            dialog.style.opacity = '1';
            dialog.querySelector('div').style.transform = 'scale(1)';
        });

        // 事件绑定
        dialog.querySelector('.export-close').addEventListener('click', () => {
            this.closeExportDialog(dialog);
        });

        dialog.querySelector('.export-cancel').addEventListener('click', () => {
            this.closeExportDialog(dialog);
        });

        dialog.querySelector('.export-confirm').addEventListener('click', () => {
            this.performExport(dialog);
        });

        dialog.querySelector('#export-browse').addEventListener('click', () => {
            this.showBrowseLocation(dialog);
        });

        // 格式选择样式
        dialog.querySelectorAll('input[name="export-format"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                dialog.querySelectorAll('.format-option').forEach(option => {
                    option.style.background = 'rgba(255,255,255,0.1)';
                    option.style.border = 'none';
                });
                e.target.closest('.format-option').style.background = 'rgba(76,175,80,0.3)';
                e.target.closest('.format-option').style.border = '1px solid #4CAF50';
            });
        });

        // 默认选中第一个
        const firstOption = dialog.querySelector('.format-option');
        if (firstOption) {
            firstOption.style.background = 'rgba(76,175,80,0.3)';
            firstOption.style.border = '1px solid #4CAF50';
        }

        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                this.closeExportDialog(dialog);
            }
        });
    }

    /**
     * 关闭导出弹窗
     */
    closeExportDialog(dialog) {
        dialog.style.opacity = '0';
        dialog.querySelector('div').style.transform = 'scale(0.9)';
        setTimeout(() => dialog.remove(), 300);
    }

    /**
     * 显示浏览位置（模拟）
     */
    showBrowseLocation(dialog) {
        // 模拟浏览位置选择
        const locations = ['下载文件夹', '桌面', '文档', '图片'];
        const currentLocation = dialog.querySelector('#export-location');
        
        // 循环切换位置
        const currentIndex = locations.indexOf(currentLocation.value);
        const nextIndex = (currentIndex + 1) % locations.length;
        currentLocation.value = locations[nextIndex];
    }

    /**
     * 执行导出
     */
    performExport(dialog) {
        const filename = dialog.querySelector('#export-filename').value || '白板笔记';
        const format = dialog.querySelector('input[name="export-format"]:checked').value;

        // 关闭导出弹窗
        this.closeExportDialog(dialog);

        // 显示导出中
        this.showExportingDialog();

        // 模拟导出过程
        setTimeout(() => {
            switch (format) {
                case 'png':
                    this.exportAsPNG(`${filename}.png`);
                    break;
                case 'jpg':
                    this.exportAsJPG(`${filename}.jpg`);
                    break;
                case 'pdf':
                    this.exportAsPDF(`${filename}.pdf`);
                    break;
                case 'zip':
                    this.exportAsZIP(`${filename}.zip`);
                    break;
            }
            
            // 移除导出中弹窗
            const exportingDialog = document.getElementById('exporting-dialog');
            if (exportingDialog) {
                exportingDialog.remove();
            }

            // 显示已保存弹窗
            this.showSavedDialog(filename, format);
        }, 1500);
    }

    /**
     * 显示导出中弹窗
     */
    showExportingDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'exporting-dialog';
        dialog.style.cssText = `
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

        dialog.innerHTML = `
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
                <p style="color: white; margin: 0; font-size: 16px;">正在导出...</p>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    /**
     * 显示已保存弹窗
     */
    showSavedDialog(filename, format) {
        const dialog = document.createElement('div');
        dialog.id = 'saved-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
            opacity: 0;
            transition: opacity 0.3s;
        `;

        dialog.innerHTML = `
            <div style="
                background: rgba(40,40,40,0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                max-width: 350px;
                transform: scale(0.9);
                transition: transform 0.3s;
            ">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: #4CAF50;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                ">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                <h3 style="color: white; margin: 0 0 8px 0;">已保存</h3>
                <p style="color: rgba(255,255,255,0.7); margin: 0 0 24px 0; font-size: 14px;">
                    ${filename}.${format}
                </p>
                <button class="saved-ok" style="
                    padding: 12px 32px;
                    background: #4CAF50;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
                ">确定</button>
            </div>
        `;

        document.body.appendChild(dialog);

        // 动画显示
        requestAnimationFrame(() => {
            dialog.style.opacity = '1';
            dialog.querySelector('div').style.transform = 'scale(1)';
        });

        // 确定按钮
        dialog.querySelector('.saved-ok').addEventListener('click', () => {
            dialog.style.opacity = '0';
            dialog.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => dialog.remove(), 300);
        });

        // 自动关闭
        setTimeout(() => {
            if (dialog.parentNode) {
                dialog.style.opacity = '0';
                dialog.querySelector('div').style.transform = 'scale(0.9)';
                setTimeout(() => dialog.remove(), 300);
            }
        }, 3000);
    }

    /**
     * 导出为PNG图片
     */
    exportAsPNG(filename = 'whiteboard.png') {
        const canvas = document.getElementById('main-canvas');
        if (!canvas) {
            this.showError('画布不存在');
            return;
        }

        try {
            const dataURL = canvas.toDataURL('image/png');
            this.downloadFile(dataURL, filename);
        } catch (err) {
            this.showError('导出失败: ' + err.message);
        }
    }

    /**
     * 导出为JPG图片
     */
    exportAsJPG(filename = 'whiteboard.jpg', quality = 0.9) {
        const canvas = document.getElementById('main-canvas');
        if (!canvas) {
            this.showError('画布不存在');
            return;
        }

        try {
            const dataURL = canvas.toDataURL('image/jpeg', quality);
            this.downloadFile(dataURL, filename);
        } catch (err) {
            this.showError('导出失败: ' + err.message);
        }
    }

    /**
     * 导出为PDF（模拟）
     */
    exportAsPDF(filename = 'whiteboard.pdf') {
        // 实际项目中需要使用 PDF 库如 jsPDF
        // 这里先导出为 PNG 作为模拟
        this.exportAsPNG(filename.replace('.pdf', '.png'));
    }

    /**
     * 导出为ZIP（模拟）
     */
    exportAsZIP(filename = 'whiteboard.zip') {
        // 实际项目中需要使用 JSZip 库
        // 这里先导出为 PNG 作为模拟
        this.exportAsPNG(filename.replace('.zip', '.png'));
    }

    /**
     * 下载文件
     */
    downloadFile(dataURL, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * 显示错误提示
     */
    showError(message) {
        this.showToast(message, '#f44336');
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
window.exportManager = new ExportManager();
