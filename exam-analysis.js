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

    reportLoading: document.getElementById('reportLoading'),
    reportCarousel: document.getElementById('reportCarousel'),
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
    elements.overallAnalysis.innerHTML = '';
    elements.typeAnalysis.innerHTML = '';

    analysisCarouselTimer = startCarousel(analysisCarouselMessages, elements.analysisCarousel, 3000);

    try {
        const overallPromise = callKimiAPI(generateOverallAnalysisPrompt()).then(result => {
            state.analysisResults.overall = cleanContent(result);
            showPartialResults();
        });

        const typePromise = callKimiAPI(generateTypeAnalysisPrompt()).then(result => {
            state.analysisResults.typeAnalysis = cleanContent(result);
            showPartialResults();
        });

        await Promise.all([overallPromise, typePromise]);

        analysisCarouselTimer = stopCarousel(analysisCarouselTimer);

        setTimeout(() => {
            displayAnalysisResults();
        }, 300);

    } catch (error) {
        console.error('Analysis error:', error);
        analysisCarouselTimer = stopCarousel(analysisCarouselTimer);
        alert('分析过程中出现错误：' + error.message);
        elements.analysisLoading.style.display = 'none';
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
                max_tokens: 8192,
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
                        content: '你是一位世界顶级的HTML报告设计师和前端工程师。你擅长生成极其精美、现代化、数据可视化丰富的试卷分析报告。你必须输出完整、可运行的HTML代码，所有内容必须完整输出，绝不能截断。图表必须使用内联SVG或CSS绘制，不依赖外部JS库初始化。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 8192,
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
            throw new Error('DeepSeek API请求超时，报告生成失败');
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

async function generateReport() {
    state.analysisResults.overall = elements.overallAnalysis.innerText;
    state.analysisResults.typeAnalysis = elements.typeAnalysis.innerText;

    goToStep(4);

    elements.reportLoading.style.display = 'block';
    elements.reportPreview.style.display = 'none';

    reportCarouselTimer = startCarousel(reportCarouselMessages, elements.reportCarousel, 3000);

    try {
        const reportPrompt = generateReportPrompt();
        let htmlContent = await callDeepSeekAPI(reportPrompt);

        reportCarouselTimer = stopCarousel(reportCarouselTimer);

        const htmlMatch = htmlContent.match(/```html\n?([\s\S]*)```/);
        if (htmlMatch) {
            htmlContent = htmlMatch[1].trim();
        }

        htmlContent = htmlContent.replace(/^```\w*\n?/, '').replace(/\n?```$/,'');

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
    const versionConfig = getVersionConfig();
    const subjectName = getSubjectName();
    const versionName = state.selectedVersion === 'teaching' ? '教师与教研人员' : '家长与营销人员';

    return `请基于以下试卷分析内容，生成一份HTML格式的分析报告。

【基本信息】版本：${versionConfig.name}，受众：${versionName}，学科：${subjectName}

【最高优先级 - 内容完整性】
⚠️ 你必须在8192 token内输出完整报告！为此必须：
1. 优先保证所有题型板块都出现，宁可样式简单也不能遗漏任何题型
2. 布局紧凑：减少padding/margin，卡片间距缩小，不要大面积留白
3. 每种题型的详解精简为：题型名+分值+核心考点（表格形式，每行一个考点）
4. 封面和总结部分尽量简短，把token留给核心的题型详解部分
5. 不要写逐题考点表格，改为按考点归类汇总

【样式要求 - 简洁高效】
1. 配色：主色#667eea→#764ba2渐变，易#10b981，中#f59e0b，难#ef4444，背景#f8fafc
2. 使用Tailwind CSS CDN + Font Awesome 6 + Noto Sans SC字体
3. 图表用纯CSS横向条形图（div宽度百分比），不用Chart.js
4. 卡片圆角阴影，悬停微浮起效果

【内容结构 - 必须全部输出】
一、封面：标题+副标题+时间+基本信息卡片（极简）
二、整体特征：结构概览+难度评估（简明扼要）
三、各题型板块详解：⚠️必须覆盖所有题型！每种题型一个紧凑卡片（题型名+分值占比+考点汇总）
四、数据图表：题型分值分布条形图+难度分布条
五、总结建议：${state.selectedVersion === 'teaching' ? '教学建议' : '给家长的建议'}（简短）
六、页脚："小睿同学·智能试卷分析系统"+时间

【分析内容】
${state.analysisResults.overall}

${state.analysisResults.typeAnalysis}

【关键规则】
1. 直接输出HTML代码，不要前缀说明，不要用\`\`\`html包裹
2. 必须包含完整<!DOCTYPE html>到</html>
3. ⚠️ 所有题型必须全部出现，这是最重要的要求！如果token不够，压缩样式和封面，绝不能省略题型
4. ${state.selectedVersion === 'marketing' ? '语言通俗易懂，多用emoji' : '语言专业严谨'}

请立即生成：`;
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