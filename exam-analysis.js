const state = {
    currentStep: 1,
    uploadedFile: null,
    fileContent: '',
    selectedVersion: '',
    subject: '',
    analysisResults: {
        overall: '',
        typeAnalysis: ''
    },
    htmlReport: ''
};

const KIMI_API_KEY = 'sk-26z1tOxDo3xt1dmFNaVu5OpCVcgsCZTxpyF18sYEOMHG3Ays';
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

const ZHIPU_API_KEY = 'c460138604724e6590549fc11287ec74.4ZQY2YnR9LzyC01U';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const DEEPSEEK_API_KEY = 'sk-b91a4c7eee1642e19f0e6378464e9d2e';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

let analysisCarouselTimer = null;
let reportCarouselTimer = null;

const analysisCarouselMessages = [
    '🔍 小睿同学正在仔细阅读试卷内容...',
    '🧠 小睿同学正在深度分析知识点...',
    '📐 小睿同学正在拆解题型结构...',
    '📊 小睿同学正在评估难度梯度...',
    '💡 小睿同学正在提炼考向规律...',
    '📝 小睿同学正在撰写分析报告...',
    '🎯 小睿同学正在总结命题特点...',
    '⚡ 小睿同学正在努力分析中ing...'
];

const reportCarouselMessages = [
    '🎨 小睿同学正在设计精美排版...',
    '📊 小睿同学正在绘制数据图表...',
    '🌈 小睿同学正在调配渐变配色...',
    '✨ 小睿同学正在添加动画效果...',
    '📱 小睿同学正在适配移动端...',
    '🖼️ 小睿同学正在生成可视化卡片...',
    '🔧 小睿同学正在优化代码结构...',
    '⚡ 小睿同学正在努力生成中ing...'
];

const elements = {
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3'),
    step4: document.getElementById('step4'),

    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    pdfWarning: document.getElementById('pdfWarning'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    fileIcon: document.getElementById('fileIcon'),
    removeFile: document.getElementById('removeFile'),
    filePreview: document.getElementById('filePreview'),
    previewContent: document.getElementById('previewContent'),
    subjectSection: document.getElementById('subjectSection'),
    subjectSelect: document.getElementById('subjectSelect'),
    toStep2: document.getElementById('toStep2'),

    versionCards: document.querySelectorAll('.exam-version-card'),
    backToStep1: document.getElementById('backToStep1'),
    toStep3: document.getElementById('toStep3'),

    analysisLoading: document.getElementById('analysisLoading'),
    analysisResults: document.getElementById('analysisResults'),
    analysisCarousel: document.getElementById('analysisCarousel'),
    overallAnalysis: document.getElementById('overallAnalysis'),
    typeAnalysis: document.getElementById('typeAnalysis'),
    versionBadge: document.getElementById('versionBadge'),
    backToStep2: document.getElementById('backToStep2'),
    toStep4: document.getElementById('toStep4'),
    regenerateReport: document.getElementById('regenerateReport'),

    reportLoading: document.getElementById('reportLoading'),
    reportCarousel: document.getElementById('reportCarousel'),
    reportPreview: document.getElementById('reportPreview'),
    reportFrame: document.getElementById('reportFrame'),
    downloadReport: document.getElementById('downloadReport'),
    backToStep3: document.getElementById('backToStep3'),
    startNew: document.getElementById('startNew'),

    reportModal: document.getElementById('reportModal'),
    modalContent: document.getElementById('modalContent'),
    closeModal: document.getElementById('closeModal')
};

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

function initializeEventListeners() {
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.removeFile.addEventListener('click', removeFile);

    elements.subjectSelect.addEventListener('change', (e) => {
        state.subject = e.target.value;
        updateNextButton();
    });

    elements.toStep2.addEventListener('click', () => goToStep(2));
    elements.backToStep1.addEventListener('click', () => goToStep(1));
    elements.toStep3.addEventListener('click', startAnalysis);
    elements.backToStep2.addEventListener('click', () => goToStep(2));
    elements.toStep4.addEventListener('click', handleToStep4);
    elements.regenerateReport.addEventListener('click', generateReport);
    elements.backToStep3.addEventListener('click', () => goToStep(3));
    elements.startNew.addEventListener('click', resetApplication);

    elements.versionCards.forEach(card => {
        card.addEventListener('click', () => selectVersion(card.dataset.version));
    });

    elements.downloadReport.addEventListener('click', downloadReport);
    elements.closeModal.addEventListener('click', closeReportModal);
    elements.reportModal.addEventListener('click', (e) => {
        if (e.target === elements.reportModal) closeReportModal();
    });
}

function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `exam-notification exam-notification-${type}`;
    notification.innerHTML = `
        <div class="exam-notification-content">
            <i class="fas ${type === 'info' ? 'fa-info-circle' : type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="exam-notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 添加关闭按钮事件
    const closeBtn = notification.querySelector('.exam-notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // 自动消失
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

function startCarousel(messages, element, interval) {
    let index = 0;
    element.textContent = messages[0];
    const timer = setInterval(() => {
        index = (index + 1) % messages.length;
        element.textContent = messages[index];
    }, interval);
    return timer;
}

function stopCarousel(timerRef) {
    if (timerRef) {
        clearInterval(timerRef);
    }
    return null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadArea.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function processFile(file) {
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
        alert('请上传 PDF 或 Word 文档！');
        return;
    }

    state.uploadedFile = file;

    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatFileSize(file.size);
    elements.fileInfo.style.display = 'block';
    elements.subjectSection.style.display = 'block';

    if (fileExtension === '.pdf') {
        elements.pdfWarning.style.display = 'flex';
        elements.fileIcon.className = 'fas fa-file-pdf';
        elements.fileIcon.style.color = '#e74c3c';
    } else {
        elements.pdfWarning.style.display = 'none';
        elements.fileIcon.className = 'fas fa-file-word';
        elements.fileIcon.style.color = '#4a6fa5';
    }
    elements.fileIcon.style.fontSize = '1.8rem';
    elements.fileIcon.style.marginRight = '15px';

    extractFileContent(file);
}

function extractFileContent(file) {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (fileExtension === '.pdf') {
        extractPDFContent(file);
    } else {
        extractWordContent(file);
    }
}

async function extractPDFContent(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            text += textContent.items.map(item => item.str).join(' ') + '\n';
        }

        state.fileContent = text;
        showPreview(text);
    } catch (error) {
        console.error('PDF extraction error:', error);
        alert('PDF 内容提取失败，请确保文件格式正确');
    }
}

async function extractWordContent(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        state.fileContent = result.value;
        showPreview(result.value);
    } catch (error) {
        console.error('Word extraction error:', error);
        alert('Word 文档内容提取失败，请确保文件格式正确');
    }
}

function showPreview(content) {
    const truncated = content.length > 1000 ? content.substring(0, 1000) + '...' : content;
    elements.previewContent.textContent = truncated;
    elements.filePreview.style.display = 'block';
}

function removeFile(e) {
    e.stopPropagation();
    state.uploadedFile = null;
    state.fileContent = '';
    elements.fileInput.value = '';
    elements.fileInfo.style.display = 'none';
    elements.pdfWarning.style.display = 'none';
    elements.subjectSection.style.display = 'none';
    elements.subjectSelect.value = '';
    state.subject = '';
    updateNextButton();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateNextButton() {
    elements.toStep2.disabled = !(state.uploadedFile && state.subject);
}

function selectVersion(version) {
    state.selectedVersion = version;

    elements.versionCards.forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.version === version) {
            card.classList.add('selected');
        }
    });

    elements.toStep3.disabled = false;
}

function goToStep(step) {
    elements.step1.style.display = 'none';
    elements.step2.style.display = 'none';
    elements.step3.style.display = 'none';
    elements.step4.style.display = 'none';

    document.getElementById(`step${step}`).style.display = 'block';
    updateProgressIndicators(step);

    if (step === 3) {
        updateStep3Buttons();
    }

    state.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStep3Buttons() {
    if (state.htmlReport) {
        elements.toStep4.innerHTML = '查看已生成报告 <i class="fas fa-eye" style="margin-left:8px"></i>';
        elements.regenerateReport.style.display = 'inline-block';
    } else {
        elements.toStep4.innerHTML = '生成HTML报告 <i class="fas fa-file-alt" style="margin-left:8px"></i>';
        elements.regenerateReport.style.display = 'none';
    }
}

function handleToStep4() {
    if (state.htmlReport) {
        goToStep(4);
        elements.reportLoading.style.display = 'none';
        elements.reportPreview.style.display = 'block';
        displayReport(state.htmlReport);
    } else {
        generateReport();
    }
}

function updateProgressIndicators(currentStep) {
    document.querySelectorAll('.exam-step-circle').forEach(circle => {
        const step = parseInt(circle.parentElement.dataset.step);
        circle.classList.remove('active', 'completed');

        if (step === currentStep) {
            circle.classList.add('active');
        } else if (step < currentStep) {
            circle.classList.add('completed');
        }
    });
}

async function startAnalysis() {
    goToStep(3);

    elements.analysisLoading.style.display = 'block';
    elements.analysisResults.style.display = 'none';
    elements.overallAnalysis.innerHTML = '';
    elements.typeAnalysis.innerHTML = '';

    analysisCarouselTimer = startCarousel(analysisCarouselMessages, elements.analysisCarousel, 3000);

    try {
        let completedCount = 0;
        const totalTasks = 2;
        let hasError = false;

        const overallPromise = callKimiAPI(generateOverallAnalysisPrompt()).then(result => {
            state.analysisResults.overall = cleanContent(result);
            completedCount++;
            showPartialResults();
            if (completedCount === totalTasks) {
                analysisCarouselTimer = stopCarousel(analysisCarouselTimer);
                checkAndShowIncompleteWarning();
            }
            return result;
        }).catch(error => {
            console.error('整体特征分析错误:', error);
            hasError = true;
            completedCount++;
            // 如果整体分析失败，仍然显示部分结果（题型分析可能成功）
            showPartialResults();
            if (completedCount === totalTasks) {
                analysisCarouselTimer = stopCarousel(analysisCarouselTimer);
                checkAndShowIncompleteWarning();
                // 如果两个都失败，显示错误
                if (hasError && !state.analysisResults.typeAnalysis) {
                    throw error;
                }
            }
        });

        const typePromise = callKimiAPI(generateTypeAnalysisPrompt()).then(result => {
            state.analysisResults.typeAnalysis = cleanContent(result);
            completedCount++;
            showPartialResults();
            if (completedCount === totalTasks) {
                analysisCarouselTimer = stopCarousel(analysisCarouselTimer);
                checkAndShowIncompleteWarning();
            }
            return result;
        }).catch(error => {
            console.error('题型板块分析错误:', error);
            hasError = true;
            completedCount++;
            // 如果题型分析失败，仍然显示部分结果（整体分析可能成功）
            showPartialResults();
            if (completedCount === totalTasks) {
                analysisCarouselTimer = stopCarousel(analysisCarouselTimer);
                checkAndShowIncompleteWarning();
                // 如果两个都失败，显示错误
                if (hasError && !state.analysisResults.overall) {
                    throw error;
                }
            }
        });

        // 不等待Promise.all，让它们独立完成
        // 只需要等待足够长的时间以确保错误被捕获
        await Promise.race([
            overallPromise,
            typePromise,
            new Promise(resolve => setTimeout(resolve, 180000)) // 3分钟超时
        ]);

    } catch (error) {
        console.error('Analysis error:', error);
        analysisCarouselTimer = stopCarousel(analysisCarouselTimer);
        // 只有两个都失败时才显示错误
        if (!state.analysisResults.overall && !state.analysisResults.typeAnalysis) {
            alert('分析过程中出现错误：' + error.message);
            elements.analysisLoading.style.display = 'none';
        }
    }
}

function checkAndShowIncompleteWarning() {
    const overallComplete = isContentComplete(state.analysisResults.overall, 'overall');
    const typeComplete = isContentComplete(state.analysisResults.typeAnalysis, 'type');

    // 移除已存在的警告
    const existingWarning = document.getElementById('incompleteWarning');
    if (existingWarning) existingWarning.remove();

    if (!overallComplete || !typeComplete) {
        let warningHtml = `
            <div id="incompleteWarning" style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:15px;margin:15px 0;">
                <p style="color:#856404;margin-bottom:10px;"><i class="fas fa-exclamation-triangle"></i> 检测到以下内容可能不完整，建议重新生成：</p>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
        `;

        // 为每个不完整的问题添加单独的重新生成按钮
        if (!overallComplete) {
            warningHtml += `
                <button id="retryOverallBtn" class="exam-btn-primary" style="padding:8px 16px;font-size:14px;background:linear-gradient(135deg, #e67e22, #f39c12);">
                    <i class="fas fa-redo"></i> 重新生成：整体特征分析
                </button>
            `;
        }

        if (!typeComplete) {
            warningHtml += `
                <button id="retryTypeBtn" class="exam-btn-primary" style="padding:8px 16px;font-size:14px;background:linear-gradient(135deg, #9b59b6, #8e44ad);">
                    <i class="fas fa-redo"></i> 重新生成：题型板块分析
                </button>
            `;
        }

        warningHtml += `</div></div>`;

        // 插入到结果区域顶部
        const resultsHeader = document.querySelector('.exam-results-header');
        if (resultsHeader) {
            resultsHeader.insertAdjacentHTML('afterend', warningHtml);

            // 绑定整体特征分析重新生成按钮事件
            const retryOverallBtn = document.getElementById('retryOverallBtn');
            if (retryOverallBtn) {
                retryOverallBtn.addEventListener('click', () => {
                    retrySingleAnalysis('overall');
                });
            }

            // 绑定题型板块分析重新生成按钮事件
            const retryTypeBtn = document.getElementById('retryTypeBtn');
            if (retryTypeBtn) {
                retryTypeBtn.addEventListener('click', () => {
                    retrySingleAnalysis('type');
                });
            }
        }
    }
}

async function retrySingleAnalysis(type) {
    // 移除警告
    const warning = document.getElementById('incompleteWarning');
    if (warning) warning.remove();

    // 根据类型显示对应的等待动画
    if (type === 'overall') {
        elements.overallAnalysis.innerHTML = `
            <div style="text-align:center;padding:30px;">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#4a6fa5;margin-bottom:15px;"></i>
                <p style="color:#666;">小睿同学正在重新生成整体特征分析...</p>
                <p style="color:#999;font-size:0.9rem;margin-top:10px;">预计完成时间约3分钟，请耐心等待</p>
            </div>
        `;
    } else if (type === 'type') {
        elements.typeAnalysis.innerHTML = `
            <div style="text-align:center;padding:30px;">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#9b59b6;margin-bottom:15px;"></i>
                <p style="color:#666;">小睿同学正在重新生成题型板块分析...</p>
                <p style="color:#999;font-size:0.9rem;margin-top:10px;">预计完成时间约3分钟，请耐心等待</p>
            </div>
        `;
    }

    try {
        let result;
        if (type === 'overall') {
            result = await callKimiAPI(generateOverallAnalysisPrompt());
            state.analysisResults.overall = cleanContent(result);
            elements.overallAnalysis.innerHTML = formatAnalysisContent(state.analysisResults.overall);
        } else if (type === 'type') {
            result = await callKimiAPI(generateTypeAnalysisPrompt());
            state.analysisResults.typeAnalysis = cleanContent(result);
            elements.typeAnalysis.innerHTML = formatAnalysisContent(state.analysisResults.typeAnalysis);
        }

        // 重新检查是否还有不完整的内容
        checkAndShowIncompleteWarning();

        // 显示成功提示
        showNotification(`${type === 'overall' ? '整体特征分析' : '题型板块分析'}重新生成成功！`, 'success');

    } catch (error) {
        console.error(`重新生成${type === 'overall' ? '整体特征' : '题型板块'}分析错误:`, error);

        // 显示错误信息在对应板块
        const errorHtml = `
            <div style="background:#fee;border:1px solid #fcc;border-radius:8px;padding:20px;text-align:center;">
                <i class="fas fa-exclamation-circle" style="color:#e74c3c;font-size:2rem;margin-bottom:10px;"></i>
                <p style="color:#c33;margin-bottom:15px;">重新生成失败：${error.message}</p>
                <button onclick="retrySingleAnalysis('${type}')" class="exam-btn-primary" style="padding:8px 16px;font-size:14px;">
                    <i class="fas fa-redo"></i> 再次尝试
                </button>
            </div>
        `;

        if (type === 'overall') {
            elements.overallAnalysis.innerHTML = errorHtml;
        } else if (type === 'type') {
            elements.typeAnalysis.innerHTML = errorHtml;
        }

        showNotification(`重新生成失败：${error.message}`, 'error');
    }
}

function showPartialResults() {
    if (state.analysisResults.overall || state.analysisResults.typeAnalysis) {
        elements.analysisLoading.style.display = 'none';
        elements.analysisResults.style.display = 'block';

        const versionNames = {
            'teaching': '教学参考版',
            'marketing': '营销家长版'
        };
        elements.versionBadge.textContent = versionNames[state.selectedVersion];
        elements.versionBadge.className = 'exam-version-badge ' + (state.selectedVersion === 'teaching' ? 'badge-teaching' : 'badge-marketing');

        if (state.analysisResults.overall) {
            elements.overallAnalysis.innerHTML = formatAnalysisContent(state.analysisResults.overall);
        } else {
            elements.overallAnalysis.innerHTML = '<p style="color:#999;text-align:center;padding:20px"><i class="fas fa-spinner fa-spin"></i> 整体特征分析生成中...</p>';
        }

        if (state.analysisResults.typeAnalysis) {
            elements.typeAnalysis.innerHTML = formatAnalysisContent(state.analysisResults.typeAnalysis);
        } else {
            elements.typeAnalysis.innerHTML = '<p style="color:#999;text-align:center;padding:20px"><i class="fas fa-spinner fa-spin"></i> 题型板块分析生成中...</p>';
        }
    }
}

function cleanContent(content) {
    return content
        .replace(/\n\s*\n/g, '\n')
        .replace(/^\s*\n/gm, '')
        .replace(/\n+/g, '\n')
        .trim();
}

function generateOverallAnalysisPrompt() {
    const versionConfig = getVersionConfig();
    const subjectName = getSubjectName();

    return `你是一位资深的${subjectName}教育分析专家，拥有20年教学与命题研究经验。请对以下试卷的【整体特征】进行深入分析。

【版本类型】
${versionConfig.name}
${versionConfig.description}

【核心要求】
1. 只分析试卷的整体特征，不要分析具体题型
2. 分析必须深入细致，每个维度至少200字
3. 输出字数控制在3000字以内，确保完整输出

【分析内容要求】
${versionConfig.overallRequirements}

【试卷内容】
${state.fileContent.substring(0, 12000)}

请直接输出试卷整体特征分析，不要输出题型分析：`;
}

function generateTypeAnalysisPrompt() {
    const versionConfig = getVersionConfig();
    const subjectName = getSubjectName();

    return `你是一位资深的${subjectName}教育分析专家。请对以下试卷的【题型板块考向】进行分析。

【版本类型】
${versionConfig.name}
${versionConfig.description}

【核心要求】
1. 只分析各题型板块的考向，不要分析整体特征
2. 必须覆盖试卷中的每一种题型，不允许遗漏任何题型
3. 每种题型精简分析：题型名+题量+分值+核心考点列表即可
4. 逐题考点每题控制在30字以内，只写考查的知识点名称
5. 输出字数控制在2000字以内，确保完整输出不截断

【分析内容要求】
${versionConfig.typeRequirements}

【试卷内容】
${state.fileContent.substring(0, 12000)}

请直接输出题型板块考向分析，不要输出整体特征分析：`;
}

function getVersionConfig() {
    if (state.selectedVersion === 'teaching') {
        return {
            name: '教学参考版',
            description: '面向教师与教研人员，需要专业、详细、深入的分析，用词严谨专业',
            overallRequirements: `请从以下维度进行深入分析（每个维度至少200字）：
1. 试卷结构：总分、考试时间、题型分布及分值配比
2. 知识覆盖：涉及的知识模块、章节分布、重难点把握
3. 难度评估：整体难度系数、各题型难度梯度设计、区分度分析
4. 命题特点：命题思路、创新点、与课标/考纲的契合度
5. 能力考查：识记、理解、应用、分析、综合、评价各层级占比
6. 教学导向：对教学的启示、能力培养方向、复习策略建议`,
            typeRequirements: `请按试卷中出现的每一种题型进行分析，每种题型包含：
1. 题型概述：题量、分值、占比
2. 难度评估：该题型整体难度（易/中/难）
3. 核心考点：列出该题型涉及的知识点（简洁列表）
4. 逐题考点：每题只写题号、考查知识点、难度（30字以内）`
        };
    } else {
        return {
            name: '营销家长版',
            description: '面向家长与营销人员，需要通俗易懂、直观明了、重点突出的分析，用大白话讲清楚',
            overallRequirements: `请用通俗易懂的大白话进行分析（每个维度至少150字）：
1. 试卷概况：总分多少、考多长时间、大概考些什么
2. 重点内容：这次考试主要考哪些知识，哪些是重点
3. 难度说明：整体难不难，适合什么水平的孩子
4. 得分关键：哪些地方容易拿分，哪些地方容易丢分
5. 学习建议：孩子需要重点掌握什么，接下来怎么复习
6. 家长关注：家长最应该关注的几个点`,
            typeRequirements: `请按试卷中出现的每一种题型进行分析，每种题型包含：
1. 题型介绍：题型名、几道题、占多少分
2. 难度怎么样：简单还是难
3. 考什么：用大白话说明考的是什么
4. 逐题考点：每题只写考什么知识点、难度（30字以内，大白话）`
        };
    }
}

function getSubjectName() {
    const subjects = {
        'math': '数学',
        'chinese': '语文',
        'english': '英语',
        'physics': '物理',
        'chemistry': '化学',
        'biology': '生物',
        'history': '历史',
        'geography': '地理',
        'politics': '政治'
    };
    return subjects[state.subject] || '学科';
}

async function callKimiAPI(prompt) {
    const controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), 180000);

    function resetTimeout() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => controller.abort(), 180000);
    }

    try {
        const response = await fetch(KIMI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KIMI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'kimi-k2.5',
                messages: [
                    {
                        role: 'system',
                        content: '你是一位资深的试卷分析专家，拥有20年教学与命题研究经验。你的分析必须全面、深入、细致，覆盖试卷中的每一道题目和每一个考点。你的输出没有长度限制，必须完整输出所有内容。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 1,
                stream: true
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            clearTimeout(timeoutId);
            let errorDetail = '';
            try {
                const errorData = await response.json();
                errorDetail = errorData.error?.message || JSON.stringify(errorData);
            } catch (e) {
                errorDetail = await response.text().catch(() => '');
            }
            throw new Error(`Kimi API请求失败 (HTTP ${response.status})${errorDetail ? '：' + errorDetail : ''}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            resetTimeout();

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;

                try {
                    const json = JSON.parse(trimmed.slice(6));
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) {
                        fullContent += delta;
                    }
                } catch (e) {
                    // skip malformed chunks
                }
            }
        }

        clearTimeout(timeoutId);

        if (fullContent) {
            return fullContent;
        }
        throw new Error('Kimi API返回数据格式异常');

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Kimi API请求超时，请稍后重试');
        }
        // 检查是否为服务器超载错误
        if (error.message && error.message.toLowerCase().includes('currently overloaded')) {
            // 显示切换提示
            showNotification('小睿同学使用火爆，已为您切换简易模式，如果分析不全面，请稍后重试', 'info');
            // 自动切换到DeepSeek API
            return await callDeepSeekAPI(prompt);
        }
        throw error;
    }
}

async function callDeepSeekAPI(prompt) {
    const controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), 180000);

    function resetTimeout() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => controller.abort(), 180000);
    }

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一位资深的试卷分析专家，拥有20年教学与命题研究经验。你的分析必须全面、深入、细致，覆盖试卷中的每一道题目和每一个考点。你的输出没有长度限制，必须完整输出所有内容。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 1,
                stream: true,
                max_tokens: 8192
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            clearTimeout(timeoutId);
            let errorDetail = '';
            try {
                const errorData = await response.json();
                errorDetail = errorData.error?.message || JSON.stringify(errorData);
            } catch (e) {
                errorDetail = await response.text().catch(() => '');
            }
            throw new Error(`DeepSeek API请求失败 (HTTP ${response.status})${errorDetail ? '：' + errorDetail : ''}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            resetTimeout();

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;

                try {
                    const json = JSON.parse(trimmed.slice(6));
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) {
                        fullContent += delta;
                    }
                } catch (e) {
                    // skip malformed chunks
                }
            }
        }

        clearTimeout(timeoutId);

        if (fullContent) {
            return fullContent;
        }
        throw new Error('DeepSeek API返回数据格式异常');

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('DeepSeek API请求超时，请稍后重试');
        }
        throw error;
    }
}

function isContentComplete(content, type) {
    if (!content || content.length < 100) {
        return false;
    }

    const hasQuestionTypes = content.includes('题型') || content.includes('选择题') || content.includes('填空题') || content.includes('解答题');

    if (type === 'type') {
        if (!hasQuestionTypes) {
            return false;
        }

        const sectionMatches = content.match(/[一二三四五六七八九十][、.．]/g);
        if (!sectionMatches || sectionMatches.length < 2) {
            return false;
        }

        const lines = content.split('\n').filter(line => line.trim().length > 0);
        if (lines.length < 10) {
            return false;
        }
    }

    if (type === 'overall') {
        const keyElements = ['试卷', '难度', '知识点', '考查'].filter(keyword => content.includes(keyword));
        if (keyElements.length < 2) {
            return false;
        }
    }

    const endPatterns = ['教学建议', '复习策略', '总结', '家长', '建议'];
    const hasEnding = endPatterns.some(pattern => content.includes(pattern));

    return hasEnding || content.length > 500;
}

async function callZhipuAPI(prompt) {
    const controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), 300000);

    function resetTimeout() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => controller.abort(), 300000);
    }

    try {
        const response = await fetch(ZHIPU_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ZHIPU_API_KEY}`
            },
            body: JSON.stringify({
                model: 'glm-5',
                messages: [
                    {
                        role: 'system',
                        content: '你是一位世界顶级的HTML报告设计师和前端工程师。你擅长生成极其精美、现代化、数据可视化丰富的试卷分析报告。你必须输出完整、可运行的HTML代码，所有内容必须完整输出，绝不能截断。图表必须使用内联SVG或CSS绘制，不依赖外部JS库初始化。【强制品牌要求】1. 报告大标题必须包含"青岛睿花苑"字样，格式为"青岛睿花苑·XXX分析报告"；2. 页脚必须包含三行信息：主文字"小睿同学·智能试卷分析系统"、版权信息"©️版权所有·青岛睿花苑教育科技有限公司"、企业标语"打造最适合人才发展的教育平台，为所到地区带去最优质的教育"。以上品牌信息为强制要求，不可省略。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                thinking: {
                    type: 'enabled'
                },
                temperature: 1.0,
                max_tokens: 65536,
                stream: true
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            clearTimeout(timeoutId);
            let errorDetail = '';
            try {
                const errorData = await response.json();
                errorDetail = errorData.error?.message || JSON.stringify(errorData);
            } catch (e) {
                errorDetail = await response.text().catch(() => '');
            }
            throw new Error(`智谱API请求失败 (HTTP ${response.status})${errorDetail ? '：' + errorDetail : ''}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            resetTimeout();

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;

                try {
                    const json = JSON.parse(trimmed.slice(6));
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) {
                        fullContent += delta;
                    }
                } catch (e) {
                    // skip malformed chunks
                }
            }
        }

        clearTimeout(timeoutId);

        if (fullContent) {
            return fullContent;
        }
        throw new Error('智谱API返回数据格式异常');

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('智谱API请求超时，报告生成失败');
        }
        throw error;
    }
}

function displayAnalysisResults() {
    elements.analysisLoading.style.display = 'none';
    elements.analysisResults.style.display = 'block';

    const versionNames = {
        'teaching': '教学参考版',
        'marketing': '营销家长版'
    };
    elements.versionBadge.textContent = versionNames[state.selectedVersion];
    elements.versionBadge.className = 'exam-version-badge ' + (state.selectedVersion === 'teaching' ? 'badge-teaching' : 'badge-marketing');

    if (state.analysisResults.overall) {
        elements.overallAnalysis.innerHTML = formatAnalysisContent(state.analysisResults.overall);
    }
    if (state.analysisResults.typeAnalysis) {
        elements.typeAnalysis.innerHTML = formatAnalysisContent(state.analysisResults.typeAnalysis);
    }
}

function formatAnalysisContent(content) {
    return content
        .replace(/^#{3}\s+(.*)/gm, '<h4 style="font-weight:bold;color:#2c3e50;margin:12px 0 6px">$1</h4>')
        .replace(/^#{2}\s+(.*)/gm, '<h3 style="font-weight:bold;font-size:1.1rem;color:#2c3e50;margin:16px 0 8px">$1</h3>')
        .replace(/^#{1}\s+(.*)/gm, '<h2 style="font-weight:bold;font-size:1.2rem;color:#4a6fa5;margin:20px 0 10px">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^-\s+(.*)/gm, '<li style="margin-left:20px;margin-bottom:4px">$1</li>')
        .replace(/^(\d+)\.\s+(.*)/gm, '<li style="margin-left:20px;margin-bottom:4px"><span style="font-weight:600">$1.</span> $2</li>')
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

function injectBranding(html) {
    const subjectName = getSubjectName();
    const brandTitle = '青岛睿花苑';
    const footerHTML = `
<div style="text-align:center;padding:30px 20px 20px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;margin-top:40px;border-radius:0 0 12px 12px;">
    <p style="font-size:16px;font-weight:bold;margin-bottom:8px;">小睿同学·智能试卷分析系统</p>
    <p style="font-size:13px;margin-bottom:6px;">©️版权所有·青岛睿花苑教育科技有限公司</p>
    <p style="font-size:12px;opacity:0.9;">打造最适合人才发展的教育平台，为所到地区带去最优质的教育</p>
</div>`;

    if (!html.includes(brandTitle)) {
        html = html.replace(/(<h1[^>]*>)([\s\S]*?)(<\/h1>)/i, function(match, open, content, close) {
            return open + brandTitle + '·' + content + close;
        });
        if (!html.includes(brandTitle)) {
            html = html.replace(/(<title[^>]*>)([\s\S]*?)(<\/title>)/i, function(match, open, content, close) {
                return open + brandTitle + '·' + content + close;
            });
        }
    }

    const footerKeywords = ['青岛睿花苑教育科技', '版权所有'];
    const hasFooter = footerKeywords.some(kw => html.includes(kw));
    if (!hasFooter) {
        if (html.includes('</body>')) {
            html = html.replace('</body>', footerHTML + '\n</body>');
        } else if (html.includes('</html>')) {
            html = html.replace('</html>', footerHTML + '\n</html>');
        } else {
            html += footerHTML;
        }
    }

    return html;
}

async function generateReport() {
    state.analysisResults.overall = elements.overallAnalysis.innerText;
    state.analysisResults.typeAnalysis = elements.typeAnalysis.innerText;

    goToStep(4);

    elements.reportLoading.style.display = 'block';
    elements.reportPreview.style.display = 'none';

    reportCarouselTimer = startCarousel(reportCarouselMessages, elements.reportCarousel, 3000);

    try {
        const reportPrompt = generateReportPrompt();
        let htmlContent = await callZhipuAPI(reportPrompt);

        reportCarouselTimer = stopCarousel(reportCarouselTimer);

        const htmlMatch = htmlContent.match(/```html\n?([\s\S]*)```/);
        if (htmlMatch) {
            htmlContent = htmlMatch[1].trim();
        }

        htmlContent = htmlContent.replace(/^```\w*\n?/, '').replace(/\n?```$/,'');

        htmlContent = injectBranding(htmlContent);

        state.htmlReport = htmlContent;
        displayReport(htmlContent);

    } catch (error) {
        console.error('Report generation error:', error);
        reportCarouselTimer = stopCarousel(reportCarouselTimer);
        alert('报告生成失败：' + error.message);
        elements.reportLoading.style.display = 'none';
    }
}

function generateReportPrompt() {
    const subjectName = getSubjectName();
    const isTeaching = state.selectedVersion === 'teaching';
    
    if (isTeaching) {
        return `请基于以下试卷分析内容，生成一份精美的HTML格式教学分析报告。

【学科】${subjectName}

【核心要求 - 教学参考版侧重】
1. ⚠️ 重点关注题型板块考向分析，这是报告的核心内容，必须详细展开
2. 整体特征分析简明扼要，作为背景介绍即可
3. 突出各题型的：
   - 考查知识点详解（每个考点都要有）
   - 难度分布与梯度设计
   - 能力层级要求（识记/理解/应用/分析/综合）
   - 教学策略建议（针对该题型的复习重点）
4. 不要体现"教师版"、"教学参考版"等版本标识
5. 不要出现年份信息

【样式要求 - 精美丰富】
1. 配色：主色#667eea→#764ba2渐变，难度色：易#10b981/中#f59e0b/难#ef4444，背景#f8fafc
2. 使用Tailwind CSS CDN + Font Awesome 6，字体使用系统字体栈：font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif
3. 图表丰富：题型分值分布条形图、难度分布饼图、能力层级雷达图（纯CSS/SVG）
   - ⚠️ SVG路径必须使用有效的path数据格式，禁止在path的d属性中包含非数字字符
   - 确保所有SVG路径数据完整，不要截断或混入其他文本
4. 卡片设计：大圆角(12px)、柔和阴影(0 8px 30px rgba)、悬停上浮效果
5. 排版美观：适当留白、标题装饰线、图标点缀、色块区分
6. 每种题型独立卡片，含题型图标、难度标签、考点标签云
7. ⚠️ 【强制要求 - 字体颜色】绝对禁止白色字体！
   - 所有文字必须使用深色：正文#333/#444，标题#1a1a1a/#2c3e50
   - 严禁使用#fff、#ffffff、white、rgba(255,255,255等白色值
   - 严禁使用#eee、#ddd、#ccc等浅色字体
   - 背景为白色/浅灰时，文字必须是深色，确保清晰可见
   - 违规将导致文字看不见，必须严格遵守！
8. ⚠️ 【禁止外部字体】严禁引用Google Fonts或其他外部字体服务，必须使用系统字体！

【内容结构】
一、封面：青岛睿花苑·学科名称+试卷分析报告（大标题居中，简约大气，必须包含"青岛睿花苑"字样，无版本标识）
二、试卷概览：总分/时长/题量（一行卡片展示）
三、整体特征（简明1-2段）：知识覆盖+难度总评
四、📚 题型板块深度分析（重点展开）：
    - 每种题型独立卡片，详细展示考点+难度+能力要求
    - 含该题型的教学建议
五、📊 数据可视化：分值分布图+难度饼图+能力雷达图
六、📝 教学策略总结：复习重点+能力培养方向
七、页脚：必须包含以下内容（无年份）：
    - 主文字："小睿同学·智能试卷分析系统"
    - 版权信息："©️版权所有·青岛睿花苑教育科技有限公司"
    - 企业标语："打造最适合人才发展的教育平台，为所到地区带去最优质的教育"

【整体特征分析】
${state.analysisResults.overall}

【题型板块考向分析 - 重点关注】
${state.analysisResults.typeAnalysis}

【输出规则】
1. 直接输出完整HTML代码，不要\`\`\`html包裹
2. 包含<!DOCTYPE html>到</html>
3. 所有题型必须完整展示，不得遗漏
4. 语言专业严谨，适合教研使用
5. ⚠️ 【自查要求】生成完成后必须检查：
   - 所有板块都有实际内容，禁止出现空白板块或只有标题的板块
   - 每种题型的考点列表必须具体充实，不能空洞
   - 图表必须有真实数据支撑，不能是占位符
   - 如果检查发现空白或内容不足，必须补充完整后再输出

请立即生成精美报告：`;
    } else {
        return `请基于以下试卷分析内容，生成一份精美的HTML格式家长指导报告。

【学科】${subjectName}

【核心要求 - 家长版侧重】
1. ⚠️ 重点关注整体特征分析，突出：
   - 试卷整体难度说明（孩子能否应对）
   - 重点考查内容（孩子需要掌握什么）
   - 得分关键点（哪里容易拿分/丢分）
   - 给家长的具体建议（如何帮助孩子）
2. 题型板块简明扼要，作为数据支撑
3. 突出家长最关心的：孩子的能力现状+后续学习方向
4. 不要体现"家长版"、"营销版"等版本标识
5. 不要出现年份信息

【样式要求 - 精美丰富】
1. 配色：温暖色调，主色#667eea→#764ba2渐变，易#10b981/中#f59e0b/难#ef4444，背景#f8fafc
2. 使用Tailwind CSS CDN + Font Awesome 6，字体使用系统字体栈：font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif
3. 多用emoji图标增加亲和力：📊📚✅⚠️💡🎯
   - ⚠️ SVG路径必须使用有效的path数据格式，禁止在path的d属性中包含非数字字符
   - 确保所有SVG路径数据完整，不要截断或混入其他文本
4. 卡片设计：大圆角(12px)、柔和阴影、悬停效果
5. 重点信息用彩色标签、高亮背景突出
6. 通俗易懂，避免专业术语，多用大白话
7. ⚠️ 【强制要求 - 字体颜色】绝对禁止白色字体！
   - 所有文字必须使用深色：正文#333/#444，标题#1a1a1a/#2c3e50
   - 严禁使用#fff、#ffffff、white、rgba(255,255,255等白色值
   - 严禁使用#eee、#ddd、#ccc等浅色字体
   - 背景为白色/浅灰时，文字必须是深色，确保清晰可见
   - 违规将导致文字看不见，必须严格遵守！
8. ⚠️ 【禁止外部字体】严禁引用Google Fonts或其他外部字体服务，必须使用系统字体！

【内容结构】
一、封面：青岛睿花苑·学科名称+学习分析报告（大标题，温馨风格，必须包含"青岛睿花苑"字样，无版本标识）
二、📋 试卷速览：总分/时长/题型数量（卡片展示）
三、💡 给家长的核心解读（重点展开）：
    - 这次考试考什么（重点知识）
    - 难度怎么样（孩子能不能应对）
    - 得分关键点（哪里容易拿分，哪里要小心）
四、📚 题型情况一览（简明展示各题型分值和难度）
五、📊 数据图表：分值分布+难度占比（直观图表）
六、🎯 家长行动指南：
    - 孩子需要重点学什么
    - 家长怎么帮助孩子
    - 接下来怎么复习
七、页脚：必须包含以下内容（无年份）：
    - 主文字："小睿同学·智能试卷分析系统"
    - 版权信息："©️版权所有·青岛睿花苑教育科技有限公司"
    - 企业标语："打造最适合人才发展的教育平台，为所到地区带去最优质的教育"

【整体特征分析 - 重点关注】
${state.analysisResults.overall}

【题型板块分析 - 数据支撑】
${state.analysisResults.typeAnalysis}

【输出规则】
1. 直接输出完整HTML代码，不要\`\`\`html包裹
2. 包含<!DOCTYPE html>到</html>
3. 语言通俗易懂，多用emoji，适合家长阅读
4. ⚠️ 【自查要求】生成完成后必须检查：
   - 所有板块都有实际内容，禁止出现空白板块或只有标题的板块
   - 给家长的核心解读必须具体实用，不能空洞
   - 图表必须有真实数据支撑，不能是占位符
   - 如果检查发现空白或内容不足，必须补充完整后再输出

请立即生成精美报告：`;
    }
}

function displayReport(htmlContent) {
    elements.reportLoading.style.display = 'none';
    elements.reportPreview.style.display = 'block';

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    elements.reportFrame.src = url;
}

function openReportModal() {
    elements.modalContent.innerHTML = state.htmlReport;
    elements.reportModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeReportModal() {
    elements.reportModal.style.display = 'none';
    document.body.style.overflow = '';
}

function downloadReport() {
    const blob = new Blob([state.htmlReport], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getSubjectName()}试卷分析报告_${new Date().toLocaleDateString()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function resetApplication() {
    state.currentStep = 1;
    state.uploadedFile = null;
    state.fileContent = '';
    state.selectedVersion = '';
    state.subject = '';
    state.analysisResults = { overall: '', typeAnalysis: '' };
    state.htmlReport = '';

    elements.fileInput.value = '';
    elements.fileInfo.style.display = 'none';
    elements.pdfWarning.style.display = 'none';
    elements.subjectSection.style.display = 'none';
    elements.subjectSelect.value = '';
    elements.toStep2.disabled = true;

    elements.versionCards.forEach(card => card.classList.remove('selected'));
    elements.toStep3.disabled = true;

    goToStep(1);
}

function toggleFeedback() {
    const popup = document.getElementById('feedbackPopup');
    popup.classList.toggle('show');
}