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

let carouselTimer = null;

const carouselMessages = [
    '🔍 小睿同学正在仔细阅读试卷内容...',
    '🧠 小睿同学正在深度分析知识点...',
    '📐 小睿同学正在拆解题型结构...',
    '📊 小睿同学正在评估难度梯度...',
    '💡 小睿同学正在提炼考向规律...',
    '📝 小睿同学正在撰写分析报告...',
    '🎯 小睿同学正在总结命题特点...',
    '⚡ 小睿同学正在努力分析中ing...'
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

    reportLoading: document.getElementById('reportLoading'),
    reportPreview: document.getElementById('reportPreview'),
    reportFrame: document.getElementById('reportFrame'),
    htmlCode: document.getElementById('htmlCode'),
    previewReport: document.getElementById('previewReport'),
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
    elements.toStep4.addEventListener('click', generateReport);
    elements.backToStep3.addEventListener('click', () => goToStep(3));
    elements.startNew.addEventListener('click', resetApplication);

    elements.versionCards.forEach(card => {
        card.addEventListener('click', () => selectVersion(card.dataset.version));
    });

    elements.previewReport.addEventListener('click', openReportModal);
    elements.downloadReport.addEventListener('click', downloadReport);
    elements.closeModal.addEventListener('click', closeReportModal);
    elements.reportModal.addEventListener('click', (e) => {
        if (e.target === elements.reportModal) closeReportModal();
    });
}

function startCarousel() {
    let index = 0;
    elements.analysisCarousel.textContent = carouselMessages[0];
    carouselTimer = setInterval(() => {
        index = (index + 1) % carouselMessages.length;
        elements.analysisCarousel.textContent = carouselMessages[index];
    }, 3000);
}

function stopCarousel() {
    if (carouselTimer) {
        clearInterval(carouselTimer);
        carouselTimer = null;
    }
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

    state.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    startCarousel();

    try {
        const overallPrompt = generateOverallAnalysisPrompt();
        const typePrompt = generateTypeAnalysisPrompt();

        const [overallResult, typeResult] = await Promise.all([
            callKimiAPI(overallPrompt, false),
            callKimiAPI(typePrompt, false)
        ]);

        state.analysisResults.overall = cleanContent(overallResult);
        state.analysisResults.typeAnalysis = cleanContent(typeResult);

        stopCarousel();

        setTimeout(() => {
            displayAnalysisResults();
        }, 500);

    } catch (error) {
        console.error('Analysis error:', error);
        stopCarousel();
        alert('分析过程中出现错误：' + error.message);
        elements.analysisLoading.style.display = 'none';
    }
}

function cleanContent(content) {
    return content
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s*\n/gm, '')
        .replace(/\n\s*\n/g, '\n\n')
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

    return `你是一位资深的${subjectName}教育分析专家，拥有20年教学与命题研究经验。请对以下试卷的【题型板块考向】进行详细分析。

【版本类型】
${versionConfig.name}
${versionConfig.description}

【核心要求】
1. 只分析各题型板块的考向，不要分析整体特征
2. 必须覆盖试卷中的每一种题型，不允许遗漏
3. 逐题分析必须完整，不能只分析部分题目就停止
4. 每道题的分析控制在80字以内，确保所有题目都能完整输出
5. 输出字数控制在5000字以内，确保完整输出

【分析内容要求】
${versionConfig.typeRequirements}

${versionConfig.questionDetail}

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
            typeRequirements: `请按试卷中出现的每一种题型进行详细分析，每种题型必须包含：
1. 题型概述：题量、分值、占总分百分比
2. 考查知识点：逐一列出该题型涉及的所有知识点
3. 考向分析：该题型的命题方向、考查重点
4. 难度分析：该题型整体难度、内部难度梯度
5. 逐题详解：对该题型下的每一道题目逐一分析`,
            questionDetail: `逐题详解要求（每道题精简为以下内容，控制在80字以内）：
- 题号与分值
- 考查知识点
- 难度等级（易/中/难/极难）
- 解题关键与易错点`
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
            typeRequirements: `请按试卷中出现的每一种题型进行详细分析，每种题型必须包含：
1. 题型介绍：这是什么题型，有几道题，占多少分
2. 考什么内容：用大白话说明这种题型考的是什么
3. 难度怎么样：简单还是难
4. 怎么拿分：答题技巧和注意事项
5. 逐题分析：把每道题都讲清楚`,
            questionDetail: `逐题分析要求（用家长能听懂的话，每道题控制在60字以内）：
- 第几题，几分
- 这道题考什么
- 难度怎么样
- 容易在哪里出错`
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

async function callKimiAPI(prompt, isHtmlReport = false, continueFrom = '') {
    const maxTokens = isHtmlReport ? 65536 : 8192;

    const messages = [
        {
            role: 'system',
            content: isHtmlReport
                ? '你是一位世界顶级的HTML报告设计师和前端工程师。你擅长生成极其精美、现代化、数据可视化丰富的试卷分析报告。你必须输出完整、可运行的HTML代码，所有内容必须完整输出，绝不能截断。图表必须使用内联SVG或CSS绘制，不依赖外部JS库初始化。你的输出没有长度限制，必须完整输出所有内容。'
                : '你是一位资深的试卷分析专家，拥有20年教学与命题研究经验。你的分析必须全面、深入、细致，覆盖试卷中的每一道题目和每一个考点。你的输出没有长度限制，必须完整输出所有内容。'
        }
    ];

    if (continueFrom) {
        messages.push({
            role: 'assistant',
            content: continueFrom
        });
        messages.push({
            role: 'user',
            content: '请继续输出，从你上次停止的地方继续，不要重复已输出的内容：'
        });
    } else {
        messages.push({
            role: 'user',
            content: prompt
        });
    }

    const response = await fetch(KIMI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIMI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'kimi-k2.5',
            messages: messages,
            temperature: 1,
            max_tokens: maxTokens
        })
    });

    if (!response.ok) {
        let errorDetail = '';
        try {
            const errorData = await response.json();
            errorDetail = errorData.error?.message || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = await response.text().catch(() => '');
        }
        const statusMessages = {
            401: 'API Key 无效或已过期，请检查密钥配置',
            403: '权限不足或余额不足，请检查账户状态',
            404: 'API 端点不存在，请检查接口地址',
            429: '请求过于频繁，请稍后重试',
            500: '服务器内部错误，请稍后重试'
        };
        const msg = statusMessages[response.status] || `请求失败 (HTTP ${response.status})`;
        throw new Error(`${msg}${errorDetail ? '：' + errorDetail : ''}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function callKimiAPIWithContinuation(prompt, isHtmlReport = false) {
    let result = await callKimiAPI(prompt, isHtmlReport);
    let continuationCount = 0;
    const maxContinuations = 3;

    while (continuationCount < maxContinuations) {
        if (isHtmlReport) {
            if (result.includes('</html>') || result.includes('</body>')) {
                break;
            }
        } else {
            if (result.trimEnd().endsWith('。') || result.trimEnd().endsWith('）') || result.trimEnd().endsWith('】') || result.trimEnd().endsWith('```')) {
                break;
            }
        }

        continuationCount++;
        const continued = await callKimiAPI(prompt, isHtmlReport, result);
        result += '\n' + continued;
    }

    return result;
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

    elements.overallAnalysis.innerHTML = formatAnalysisContent(state.analysisResults.overall);
    elements.typeAnalysis.innerHTML = formatAnalysisContent(state.analysisResults.typeAnalysis);
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

async function generateReport() {
    state.analysisResults.overall = elements.overallAnalysis.innerText;
    state.analysisResults.typeAnalysis = elements.typeAnalysis.innerText;

    goToStep(4);

    elements.reportLoading.style.display = 'block';
    elements.reportPreview.style.display = 'none';

    try {
        const reportPrompt = generateReportPrompt();
        const htmlContent = await callKimiAPIWithContinuation(reportPrompt, true);

        let finalHtml = htmlContent;
        const htmlMatch = htmlContent.match(/```html\n?([\s\S]*?)```/);
        if (htmlMatch) {
            finalHtml = htmlMatch[1].trim();
        }

        if (!finalHtml.includes('</html>')) {
            finalHtml += '\n</body>\n</html>';
        }

        state.htmlReport = finalHtml;
        displayReport(finalHtml);

    } catch (error) {
        console.error('Report generation error:', error);
        alert('报告生成失败：' + error.message);
        elements.reportLoading.style.display = 'none';
    }
}

function generateReportPrompt() {
    const versionConfig = getVersionConfig();
    const subjectName = getSubjectName();
    const versionName = state.selectedVersion === 'teaching' ? '教师与教研人员' : '家长与营销人员';

    return `你是一位世界顶级的HTML报告设计师和前端工程师。请基于以下试卷分析内容，生成一份极其精美、震撼的HTML格式分析报告。

【报告基本信息】
- 版本类型：${versionConfig.name}
- 目标受众：${versionName}
- 学科：${subjectName}

【设计要求 - 必须严格遵守】
1. **视觉设计**：使用渐变背景（紫色/蓝色系）、玻璃态卡片、柔和阴影、圆角边框
2. **配色方案**：
   - 主色：渐变紫蓝色 (#667eea → #764ba2)
   - 简单/易：绿色 (#10b981)
   - 中等：黄色/橙色 (#f59e0b)
   - 较难：橙色 (#f97316)
   - 困难：红色 (#ef4444)
   - 背景：浅灰白 (#f8fafc)
3. **字体**：使用 Google Fonts 的 Noto Sans SC
4. **图标**：使用 Font Awesome 6 图标
5. **动画**：卡片悬停有微妙的浮起效果
6. **响应式**：适配桌面和移动设备

【图表要求 - 极其重要，必须能正常显示】
⚠️ 图表必须使用纯CSS+HTML绘制，不使用Chart.js等需要JS初始化的库！
使用以下方式绘制图表：
1. **题型分值分布**：使用CSS绘制的横向条形图（div宽度百分比表示占比）
2. **难度分布**：使用CSS绘制的彩色进度条或柱状图
3. **知识点覆盖**：使用CSS绘制的标签云或热力色块
4. 每个图表必须有标题、图例、数据标签

【内容结构 - 总分总模式，必须完整输出】

一、报告封面（总）
- 大标题：${subjectName}试卷分析报告
- 副标题：${versionConfig.name}
- 生成时间
- 试卷基本信息卡片（学科、总分、题型数量、难度概览）

二、试卷整体特征（总）
- 试卷结构概览
- 知识覆盖分析
- 难度评估总结
- 命题特点点评

三、各题型板块详解（分 - 核心内容，必须完整）
⚠️ 必须覆盖分析内容中的每一种题型，不允许遗漏！
每种题型一个独立卡片，包含：
- 题型名称、题量、分值、占比
- 考查知识点列表
- 难度分析（用颜色标签）
- 逐题详解表格（题号、考点、难度、关键点）
- 答题技巧/建议

四、数据可视化图表区（分）
- 题型分值分布图（CSS横向条形图）
- 难度分布图（CSS彩色柱状图）
- 知识点覆盖图（CSS标签云）

五、总结与建议（总 - 放在页面最底部）
- 试卷整体评价
- ${state.selectedVersion === 'teaching' ? '教学建议与复习策略' : '给家长的实用建议'}
- 重点提醒事项

六、页脚
- "小睿同学·智能试卷分析系统"
- 生成时间

【分析内容 - 必须全部体现在报告中】

${state.analysisResults.overall}

${state.analysisResults.typeAnalysis}

【关键提醒 - 务必遵守】
1. 直接输出完整的HTML代码，不要任何前缀说明
2. HTML必须包含完整的<!DOCTYPE html>、<html>、<head>、<body>、</body>、</html>
3. 在<head>中引入：Tailwind CSS CDN、Font Awesome 6、Noto Sans SC字体
4. ⚠️ 不要使用Chart.js！所有图表用纯CSS+HTML绘制，确保能正常显示
5. ⚠️ 必须输出完整内容！每种题型都要有详解，不能因为篇幅截断
6. ⚠️ 内容必须翔实全面，把分析内容中的所有信息都体现在报告中
7. ${state.selectedVersion === 'marketing' ? '语言要极其通俗易懂，多用emoji，让家长一眼就能看懂' : '语言要专业严谨，适合教学研究使用'}
8. 页面最底部必须是总结与建议部分
9. ⚠️ 你没有输出长度限制！必须完整输出所有HTML代码，直到</html>标签！

请立即生成完整的HTML代码：`;
}

function displayReport(htmlContent) {
    elements.reportLoading.style.display = 'none';
    elements.reportPreview.style.display = 'block';

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    elements.reportFrame.src = url;

    elements.htmlCode.value = htmlContent;
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