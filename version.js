const APP_VERSION = '3.0';

const UPDATE_HISTORY = [
    {
        version: '2.9',
        date: '2026-04-20',
        changes: [
            '试卷分析系统功能优化与稳定性提升',
            '修复已知问题，改善用户体验'
        ]
    },
    {
        version: '3.0',
        date: '2026-04-21',
        changes: [
            '首页布局重构为落地项目/努力开发中/等待开发三区域',
            '新增一对一学情分析系统（内测中）',
            '添加部门主推标签（学管部主推/教学部主推）',
            '试卷分析报告强制注入青岛睿花苑品牌防伪标志',
            '报告大标题加入"青岛睿花苑"字样',
            '报告页脚添加版权信息和企业标语',
            '报告预览窗口自适应填充，消除空白区域',
            '新增版本更新通知系统'
        ]
    }
];

function showUpdateNotification() {
    const lastSeenVersion = localStorage.getItem('app_last_seen_version');
    if (lastSeenVersion === APP_VERSION) return;

    const startIndex = lastSeenVersion
        ? UPDATE_HISTORY.findIndex(u => u.version === lastSeenVersion) + 1
        : 0;

    if (startIndex >= UPDATE_HISTORY.length) return;

    const newUpdates = UPDATE_HISTORY.slice(startIndex);
    if (newUpdates.length === 0) return;

    let updatesHTML = '';
    newUpdates.forEach(update => {
        let changesHTML = '';
        update.changes.forEach(change => {
            changesHTML += `<li>${change}</li>`;
        });
        updatesHTML += `
            <div class="update-version-block">
                <div class="update-version-header">
                    <span class="update-version-tag">v${update.version}</span>
                    <span class="update-version-date">${update.date}</span>
                </div>
                <ul class="update-changes-list">${changesHTML}</ul>
            </div>
        `;
    });

    const modal = document.createElement('div');
    modal.id = 'updateNotificationModal';
    modal.innerHTML = `
        <div class="update-overlay"></div>
        <div class="update-modal">
            <div class="update-modal-header">
                <div class="update-modal-icon">🎉</div>
                <h3>系统更新通知</h3>
                <p class="update-modal-subtitle">小睿同学又进化啦！</p>
            </div>
            <div class="update-modal-body">${updatesHTML}</div>
            <div class="update-modal-footer">
                <button class="update-confirm-btn" id="updateConfirmBtn">我知道了</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('updateConfirmBtn').addEventListener('click', () => {
        localStorage.setItem('app_last_seen_version', APP_VERSION);
        modal.classList.add('update-fade-out');
        setTimeout(() => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
        }, 300);
    });

    modal.querySelector('.update-overlay').addEventListener('click', () => {
        localStorage.setItem('app_last_seen_version', APP_VERSION);
        modal.classList.add('update-fade-out');
        setTimeout(() => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
        }, 300);
    });
}

document.addEventListener('DOMContentLoaded', showUpdateNotification);
