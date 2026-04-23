const seaState = {
    uploadedFile: null,
    fileContent: '',
    generatedAnalysis: '',
    generatedPlan: '',
    beautifiedHtml: ''
};

const SEA_KIMI_API_KEY = 'sk-26z1tOxDo3xt1dmFNaVu5OpCVcgsCZTxpyF18sYEOMHG3Ays';
const SEA_KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

const SEA_ZHIPU_API_KEY = 'c460138604724e6590549fc11287ec74.4ZQY2YnR9LzyC01U';
const SEA_ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

let seaCarouselInterval = null;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const SEA_SUBJECT_WEAK_POINTS = {
    '数学': ['基础知识掌握不牢', '公式定理理解不透', '计算能力不足', '审题能力欠缺', '解题思路不清晰', '逻辑推理能力弱', '空间想象能力不足', '时间分配不合理', '粗心大意', '压轴题突破困难'],
    '语文': ['基础知识掌握不牢', '阅读理解能力弱', '文言文理解困难', '写作表达欠佳', '古诗词鉴赏能力不足', '审题立意偏差', '作文结构混乱', '语言组织能力弱', '名著阅读积累不足', '答题规范意识差'],
    '英语': ['词汇量不足', '语法知识薄弱', '阅读理解能力弱', '听力理解困难', '写作表达欠佳', '口语输出能力不足', '长难句分析困难', '完形填空失分多', '翻译能力欠缺', '时态语态混淆'],
    '物理': ['基础概念理解不透', '公式推导应用困难', '物理图像分析能力弱', '受力分析不全面', '实验探究能力弱', '电磁学模块薄弱', '力学模块薄弱', '计算过程易出错', '建模能力欠缺', '审题忽略关键条件'],
    '化学': ['基础概念理解不透', '化学方程式记忆混乱', '实验操作原理不清', '物质的量计算困难', '有机化学推断困难', '化学反应原理薄弱', '化学平衡分析困难', '电化学理解困难', '元素周期律应用弱', '实验设计能力不足'],
    '生物': ['基础概念记忆模糊', '遗传计算困难', '实验分析能力弱', '图表信息提取不全', '实验设计能力不足', '细胞代谢理解不透', '生态系统知识薄弱', '基因工程理解困难', '答题专业术语欠缺', '知识迁移应用弱'],
    '地理': ['基础概念记忆模糊', '地图读图能力弱', '区域地理定位困难', '气候类型判断错误', '地理计算能力弱', '综合题分析不全面', '人文地理答题不规范', '自然地理原理理解不透', '地理信息技术应用弱', '知识迁移应用弱']
};

const SEA_SUBJECT_CLASSROOM_PERF = {
    '数学': ['课堂参与度高', '积极回答问题', '注意力集中', '作业完成及时', '笔记记录认真', '课后提问积极', '逻辑思维敏捷', '解题思路独特', '需要老师督促', '课堂互动较少', '做题速度偏慢', '对难题有钻研精神'],
    '语文': ['课堂参与度高', '积极回答问题', '注意力集中', '作业完成及时', '笔记记录认真', '课后提问积极', '朗读声音洪亮', '写作思路活跃', '需要老师督促', '课堂互动较少', '阅读理解能力强', '对文学作品有感悟'],
    '英语': ['课堂参与度高', '积极回答问题', '注意力集中', '作业完成及时', '笔记记录认真', '课后提问积极', '口语表达积极', '听力训练认真', '需要老师督促', '课堂互动较少', '单词记忆主动', '对英语文化感兴趣'],
    '物理': ['课堂参与度高', '积极回答问题', '注意力集中', '作业完成及时', '笔记记录认真', '课后提问积极', '实验操作积极', '善于观察现象', '需要老师督促', '课堂互动较少', '动手能力较强', '对物理现象好奇'],
    '化学': ['课堂参与度高', '积极回答问题', '注意力集中', '作业完成及时', '笔记记录认真', '课后提问积极', '实验操作规范', '方程式书写认真', '需要老师督促', '课堂互动较少', '对实验现象敏感', '善于总结规律'],
    '生物': ['课堂参与度高', '积极回答问题', '注意力集中', '作业完成及时', '笔记记录认真', '课后提问积极', '实验观察细致', '画图能力较强', '需要老师督促', '课堂互动较少', '对生命现象好奇', '善于归纳总结'],
    '地理': ['课堂参与度高', '积极回答问题', '注意力集中', '作业完成及时', '笔记记录认真', '课后提问积极', '地图读图认真', '关注时事地理', '需要老师督促', '课堂互动较少', '空间思维较好', '善于联系实际']
};

function seaUpdateSubjectOptions() {
    const subject = document.getElementById('seaExamSubject').value;
    const weakContainer = document.getElementById('seaWeakPointsContainer');
    const perfContainer = document.getElementById('seaClassroomPerfContainer');

    if (!subject) {
        weakContainer.innerHTML = '<span class="sea-select-subject-hint">请先选择考试科目，系统将自动展示对应学科的薄弱环节选项</span>';
        perfContainer.innerHTML = '<span class="sea-select-subject-hint">请先选择考试科目，系统将自动展示对应学科的课堂表现选项</span>';
        return;
    }

    const weakPoints = SEA_SUBJECT_WEAK_POINTS[subject] || SEA_SUBJECT_WEAK_POINTS['数学'];
    const performances = SEA_SUBJECT_CLASSROOM_PERF[subject] || SEA_SUBJECT_CLASSROOM_PERF['数学'];

    weakContainer.innerHTML = weakPoints.map(wp =>
        `<label class="exam-checkbox-item"><input type="checkbox" class="sea-weak" value="${wp}"> ${wp}</label>`
    ).join('');

    perfContainer.innerHTML = performances.map(p =>
        `<label class="exam-checkbox-item"><input type="checkbox" class="sea-perf" value="${p}"> ${p}</label>`
    ).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    initSeaEventListeners();
    document.getElementById('seaExamSubject').addEventListener('change', seaUpdateSubjectOptions);
});

function initSeaEventListeners() {
    const uploadArea = document.getElementById('seaUploadArea');
    const fileInput = document.getElementById('seaFileInput');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) seaHandleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) seaHandleFile(e.target.files[0]);
    });

    document.getElementById('seaRemoveFile').addEventListener('click', (e) => {
        e.stopPropagation();
        seaState.uploadedFile = null;
        seaState.fileContent = '';
        fileInput.value = '';
        document.getElementById('seaFileInfo').style.display = 'none';
        document.getElementById('seaPdfWarning').style.display = 'none';
    });

    document.getElementById('seaToStep2').addEventListener('click', seaGoToStep2);
    document.getElementById('seaBackStep1').addEventListener('click', () => seaGoToStep(1));
    document.getElementById('seaToStep4').addEventListener('click', seaGoToStep4);
    document.getElementById('seaDownloadReport').addEventListener('click', seaDownloadHtml);
    document.getElementById('seaStartNew').addEventListener('click', seaStartNew);
    document.getElementById('seaBackStep3').addEventListener('click', () => seaGoToStep(3));
}

function seaHandleFile(file) {
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
        alert('请上传 PDF 或 Word 文档！');
        return;
    }

    seaState.uploadedFile = file;
    document.getElementById('seaFileName').textContent = file.name;
    document.getElementById('seaFileSize').textContent = seaFormatFileSize(file.size);

    const fileIcon = document.getElementById('seaFileIcon');
    if (fileExtension === '.pdf') {
        fileIcon.className = 'fas fa-file-pdf';
        fileIcon.style.color = '#ef4444';
        document.getElementById('seaPdfWarning').style.display = 'flex';
    } else {
        fileIcon.className = 'fas fa-file-word';
        fileIcon.style.color = '#3b82f6';
        document.getElementById('seaPdfWarning').style.display = 'none';
    }

    document.getElementById('seaFileInfo').style.display = 'block';
    seaExtractFileContent(file);
}

async function seaExtractFileContent(file) {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (fileExtension === '.pdf') {
        try {
            const formData = new FormData();
            formData.append('purpose', 'file-extract');
            formData.append('file', file);

            const uploadResponse = await fetch('https://api.moonshot.cn/v1/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SEA_KIMI_API_KEY}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `文件上传失败 (HTTP ${uploadResponse.status})`);
            }

            const uploadData = await uploadResponse.json();
            const fileId = uploadData.id;

            const contentResponse = await fetch(`https://api.moonshot.cn/v1/files/${fileId}/content`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${SEA_KIMI_API_KEY}`
                }
            });

            if (!contentResponse.ok) {
                throw new Error(`文件内容获取失败 (HTTP ${contentResponse.status})`);
            }

            const contentData = await contentResponse.json();
            const text = contentData.content || '';

            if (!text.trim()) {
                throw new Error('Kimi 文件解析返回内容为空');
            }

            seaState.fileContent = text;
        } catch (error) {
            console.error('Kimi PDF extraction error, falling back to pdf.js:', error);
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    text += textContent.items.map(item => item.str).join(' ') + '\n';
                }
                seaState.fileContent = text;
            } catch (fallbackError) {
                console.error('PDF.js fallback extraction error:', fallbackError);
                seaState.fileContent = '[PDF文件内容提取失败，将根据您提供的错题情况描述进行分析]';
            }
        }
    } else {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            seaState.fileContent = result.value;
        } catch (error) {
            console.error('Word extraction error:', error);
            seaState.fileContent = '[Word文件内容提取失败，将根据您提供的错题情况描述进行分析]';
        }
    }
}

function seaFormatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function seaGoToStep(step) {
    for (let i = 1; i <= 4; i++) {
        const section = document.getElementById('seaStep' + i);
        if (section) section.style.display = (i === step) ? 'block' : 'none';
    }

    document.querySelectorAll('.exam-step').forEach((el) => {
        const s = parseInt(el.dataset.step);
        const circle = el.querySelector('.exam-step-circle');
        const span = el.querySelector('span');
        circle.classList.remove('active', 'completed');
        if (s < step) {
            circle.classList.add('completed');
            circle.textContent = '✓';
        } else if (s === step) {
            circle.classList.add('active');
            circle.textContent = s;
        } else {
            circle.textContent = s;
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function seaGetWeakPoints() {
    const points = [];
    document.querySelectorAll('.sea-weak:checked').forEach(cb => points.push(cb.value));
    return points;
}

function seaGetClassroomPerformance() {
    const performances = [];
    document.querySelectorAll('.sea-perf:checked').forEach(cb => performances.push(cb.value));
    return performances;
}

function seaGoToStep2() {
    const studentName = document.getElementById('seaStudentName').value.trim();
    const studentGrade = document.getElementById('seaStudentGrade').value;
    const examSubject = document.getElementById('seaExamSubject').value;
    const examName = document.getElementById('seaExamName').value.trim();
    const actualScore = document.getElementById('seaActualScore').value;
    const fullScore = document.getElementById('seaFullScore').value;
    const errorDescription = document.getElementById('seaErrorDescription').value.trim();

    if (!studentName) { alert('请输入学生姓名'); return; }
    if (!studentGrade) { alert('请选择学生年级'); return; }
    if (!examSubject) { alert('请选择考试科目'); return; }
    if (!examName) { alert('请输入考试名称'); return; }
    if (!actualScore) { alert('请输入实际得分'); return; }
    if (!fullScore) { alert('请输入满分'); return; }
    if (!errorDescription) { alert('请描述错题情况'); return; }

    seaState.generatedAnalysis = '';
    seaState.generatedPlan = '';

    document.getElementById('seaDualResult').style.display = 'none';
    document.getElementById('seaResultCard1').style.display = 'none';
    document.getElementById('seaResultCard2').style.display = 'none';
    document.getElementById('seaStatus1').textContent = '⏳ 生成中...';
    document.getElementById('seaStatus2').textContent = '⏳ 生成中...';
    document.getElementById('seaPreview1').textContent = '';
    document.getElementById('seaPreview2').textContent = '';

    seaGoToStep(2);
    seaStartCarousel('seaAnalysisCarousel', [
        '🔍 小睿同学正在仔细阅读试卷内容...',
        '📊 正在分析错题原因和知识盲点...',
        '📋 正在制定学习方案...',
        '🎯 正在评估薄弱环节...',
        '✨ 即将完成分析...'
    ]);
    seaGenerateDualAnalysis();
}

async function seaGenerateDualAnalysis() {
    const studentName = document.getElementById('seaStudentName').value;
    const studentGrade = document.getElementById('seaStudentGrade').value;
    const examSubject = document.getElementById('seaExamSubject').value;
    const examName = document.getElementById('seaExamName').value;
    const actualScore = document.getElementById('seaActualScore').value;
    const fullScore = document.getElementById('seaFullScore').value;
    const errorDescription = document.getElementById('seaErrorDescription').value;
    const weakPoints = seaGetWeakPoints();
    const classroomPerformance = seaGetClassroomPerformance();
    const classroomPerformanceDesc = document.getElementById('seaClassroomPerformance').value;
    const scoreRate = ((actualScore / fullScore) * 100).toFixed(1);

    const studentInfoBlock = `学生信息：
- 姓名：${studentName}
- 年级：${studentGrade}
- 科目：${examSubject}
- 考试名称：${examName}
- 考试成绩：${actualScore}分/满分${fullScore}分（得分率${scoreRate}%）

错题情况描述：
${errorDescription}

薄弱环节：
${weakPoints.length > 0 ? weakPoints.join('、') : '未特别指定'}

日常课堂表现：
${classroomPerformance.length > 0 ? classroomPerformance.join('、') : '未特别指定'}
${classroomPerformanceDesc ? `\n课堂表现详细描述：\n${classroomPerformanceDesc}` : ''}

试卷文件内容：
${seaState.fileContent ? seaState.fileContent.substring(0, 8000) : '未上传试卷文件'}`;

    const subjectFeature = examSubject === '数学' ? '计算能力、逻辑思维、解题规范' : examSubject === '英语' ? '词汇积累、语法运用、阅读理解' : examSubject === '语文' ? '阅读理解、写作表达、基础知识' : '学科核心能力';

    const prompt1 = `你是一位经验丰富的${examSubject}教师，请根据以下信息，对${studentName}同学的${examName}做题情况做一个深入分析。

${studentInfoBlock}

请你根据上述内容给${studentName}的${examName}做题情况做一个分析。要求：
1. 切合实际，可以制定部分长期学习计划，但要切实可完成，最好是家长可以配合的
2. 说出问题和需要注意的点，此项需要稍微详细丰富一点，尤其是分析试卷出错处
3. 要认可学生存在的闪光点，适当在报告中表扬学生
4. 表述清晰明了、整体干净整洁，亲切自然，像一个真实的老师在和家长沟通
5. 结合${examSubject}学科特色进行分析，比如${subjectFeature}等方面
6. 分析要具体到知识点，不要泛泛而谈
7. 输出格式：结构化文本，分点清晰，有数据支撑
8. 这份报告是要呈现给家长看的，注意语言输出场景`;

    const prompt2 = `你是一位经验丰富的${examSubject}教师和学业规划师，请根据以下学生信息，为${studentName}同学制定接下来的学习方案。

${studentInfoBlock}

请你根据学生现在的情况，制定接下来的学习方案。要求：
1. 方案要切合实际，不要"每日提分计划"之类不切实际的内容，可以制定长期方案
2. 要有阶段性目标（短期、中期），但不要过于死板
3. 重点指出接下来应该优先攻克的知识点和需要掌握的能力
4. 给出具体可执行的学习方法和建议
5. 结合${examSubject}学科特色，比如${subjectFeature}等方面
6. 表述清晰明了、整体干净整洁，亲切自然，像一个真实的老师在和家长沟通
7. 输出格式：结构化文本，分点清晰，有数据支撑
8. 这份报告是要呈现给家长看的，注意语言输出场景`;

    let completedCount = 0;
    const TIMEOUT_MS = 180000;

    function onOneComplete() {
        completedCount++;
        if (completedCount === 2) {
            seaStopCarousel();
            setTimeout(() => seaGoToStep(3), 600);
        }
    }

    async function fetchWithTimeout(prompt) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(SEA_KIMI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SEA_KIMI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'kimi-k2.5',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 1
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('API请求失败：' + response.status);
            const data = await response.json();
            return { success: true, content: data.choices[0].message.content };
        } catch (error) {
            clearTimeout(timeoutId);
            return { success: false, error: error };
        }
    }

    const promise1 = (async () => {
        const result = await fetchWithTimeout(prompt1);

        document.getElementById('seaDualResult').style.display = 'grid';
        document.getElementById('seaResultCard1').style.display = 'block';

        if (result.success) {
            seaState.generatedAnalysis = result.content;
            document.getElementById('seaStatus1').textContent = '✅ 已完成';
            document.getElementById('seaStatus1').style.color = '#27ae60';
            document.getElementById('seaPreview1').textContent = result.content.substring(0, 300) + '...';
            document.getElementById('seaAnalysisText').innerText = result.content;
        } else {
            if (result.error.name === 'AbortError') {
                document.getElementById('seaStatus1').textContent = '⏳ 生成超时';
                document.getElementById('seaStatus1').style.color = '#f39c12';
                document.getElementById('seaPreview1').innerHTML = '<span style="color:#f39c12">AI响应超过3分钟。您可以点击下方"重新生成"按钮再次尝试，或者继续编辑备用内容。</span>';
            } else {
                document.getElementById('seaStatus1').textContent = '❌ 生成失败';
                document.getElementById('seaStatus1').style.color = '#e74c3c';
                document.getElementById('seaPreview1').innerHTML = '<span style="color:#e74c3c">AI生成失败：' + result.error.message + '。您可以点击下方"重新生成"按钮再次尝试。</span>';
            }
            document.getElementById('seaRetry1').style.display = 'block';
            seaState.generatedAnalysis = seaGenerateFallbackAnalysis(studentName, studentGrade, examSubject, examName, actualScore, fullScore, errorDescription, weakPoints, classroomPerformance, classroomPerformanceDesc);
            document.getElementById('seaAnalysisText').innerText = seaState.generatedAnalysis;
        }
        onOneComplete();
    })();

    const promise2 = (async () => {
        const result = await fetchWithTimeout(prompt2);

        document.getElementById('seaDualResult').style.display = 'grid';
        document.getElementById('seaResultCard2').style.display = 'block';

        if (result.success) {
            seaState.generatedPlan = result.content;
            document.getElementById('seaStatus2').textContent = '✅ 已完成';
            document.getElementById('seaStatus2').style.color = '#27ae60';
            document.getElementById('seaPreview2').textContent = result.content.substring(0, 300) + '...';
            document.getElementById('seaPlanText').innerText = result.content;
        } else {
            if (result.error.name === 'AbortError') {
                document.getElementById('seaStatus2').textContent = '⏳ 生成超时';
                document.getElementById('seaStatus2').style.color = '#f39c12';
                document.getElementById('seaPreview2').innerHTML = '<span style="color:#f39c12">AI响应超过3分钟。您可以点击下方"重新生成"按钮再次尝试，或者继续编辑备用内容。</span>';
            } else {
                document.getElementById('seaStatus2').textContent = '❌ 生成失败';
                document.getElementById('seaStatus2').style.color = '#e74c3c';
                document.getElementById('seaPreview2').innerHTML = '<span style="color:#e74c3c">AI生成失败：' + result.error.message + '。您可以点击下方"重新生成"按钮再次尝试。</span>';
            }
            document.getElementById('seaRetry2').style.display = 'block';
            seaState.generatedPlan = seaGenerateFallbackPlan(studentName, examSubject, examName, actualScore, fullScore, weakPoints);
            document.getElementById('seaPlanText').innerText = seaState.generatedPlan;
        }
        onOneComplete();
    })();

    await Promise.all([promise1, promise2]);
}

function seaRetryAnalysis(type) {
    const studentName = document.getElementById('seaStudentName').value;
    const studentGrade = document.getElementById('seaStudentGrade').value;
    const examSubject = document.getElementById('seaExamSubject').value;
    const examName = document.getElementById('seaExamName').value;
    const actualScore = document.getElementById('seaActualScore').value;
    const fullScore = document.getElementById('seaFullScore').value;
    const errorDescription = document.getElementById('seaErrorDescription').value;
    const weakPoints = seaGetWeakPoints();
    const classroomPerformance = seaGetClassroomPerformance();
    const classroomPerformanceDesc = document.getElementById('seaClassroomPerformance').value;
    const scoreRate = ((actualScore / fullScore) * 100).toFixed(1);

    const studentInfoBlock = `学生信息：
- 姓名：${studentName}
- 年级：${studentGrade}
- 科目：${examSubject}
- 考试名称：${examName}
- 考试成绩：${actualScore}分/满分${fullScore}分（得分率${scoreRate}%）

错题情况描述：
${errorDescription}

薄弱环节：
${weakPoints.length > 0 ? weakPoints.join('、') : '未特别指定'}

日常课堂表现：
${classroomPerformance.length > 0 ? classroomPerformance.join('、') : '未特别指定'}
${classroomPerformanceDesc ? `\n课堂表现详细描述：\n${classroomPerformanceDesc}` : ''}

试卷文件内容：
${seaState.fileContent ? seaState.fileContent.substring(0, 8000) : '未上传试卷文件'}`;

    const subjectFeature = examSubject === '数学' ? '计算能力、逻辑思维、解题规范' : examSubject === '英语' ? '词汇积累、语法运用、阅读理解' : examSubject === '语文' ? '阅读理解、写作表达、基础知识' : '学科核心能力';

    const statusId = type === 1 ? 'seaStatus1' : 'seaStatus2';
    const previewId = type === 1 ? 'seaPreview1' : 'seaPreview2';
    const retryBtnId = type === 1 ? 'seaRetry1' : 'seaRetry2';

    document.getElementById(statusId).textContent = '⏳ 重新生成中...';
    document.getElementById(statusId).style.color = '#f39c12';
    document.getElementById(retryBtnId).style.display = 'none';
    document.getElementById(previewId).textContent = '';

    const prompt = type === 1
        ? `你是一位经验丰富的${examSubject}教师，请根据以下信息，对${studentName}同学的${examName}做题情况做一个深入分析。\n\n${studentInfoBlock}\n\n请你根据上述内容给${studentName}的${examName}做题情况做一个分析。要求：\n1. 切合实际，可以制定部分长期学习计划，但要切实可完成，最好是家长可以配合的\n2. 说出问题和需要注意的点，此项需要稍微详细丰富一点，尤其是分析试卷出错处\n3. 要认可学生存在的闪光点，适当在报告中表扬学生\n4. 表述清晰明了、整体干净整洁，亲切自然，像一个真实的老师在和家长沟通\n5. 结合${examSubject}学科特色进行分析，比如${subjectFeature}等方面\n6. 分析要具体到知识点，不要泛泛而谈\n7. 输出格式：结构化文本，分点清晰，有数据支撑\n8. 这份报告是要呈现给家长看的，注意语言输出场景`
        : `你是一位经验丰富的${examSubject}教师和学业规划师，请根据以下学生信息，为${studentName}同学制定接下来的学习方案。\n\n${studentInfoBlock}\n\n请你根据学生现在的情况，制定接下来的学习方案。要求：\n1. 方案要切合实际，不要"每日提分计划"之类不切实际的内容，可以制定长期方案\n2. 要有阶段性目标（短期、中期），但不要过于死板\n3. 重点指出接下来应该优先攻克的知识点和需要掌握的能力\n4. 给出具体可执行的学习方法和建议\n5. 结合${examSubject}学科特色，比如${subjectFeature}等方面\n6. 表述清晰明了、整体干净整洁，亲切自然，像一个真实的老师在和家长沟通\n7. 输出格式：结构化文本，分点清晰，有数据支撑\n8. 这份报告是要呈现给家长看的，注意语言输出场景`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    fetch(SEA_KIMI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SEA_KIMI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'kimi-k2.5',
            messages: [{ role: 'user', content: prompt }],
            temperature: 1
        }),
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('API请求失败：' + response.status);
        return response.json();
    })
    .then(data => {
        const content = data.choices[0].message.content;
        if (type === 1) {
            seaState.generatedAnalysis = content;
            document.getElementById('seaAnalysisText').innerText = content;
        } else {
            seaState.generatedPlan = content;
            document.getElementById('seaPlanText').innerText = content;
        }
        document.getElementById(statusId).textContent = '✅ 已完成';
        document.getElementById(statusId).style.color = '#27ae60';
        document.getElementById(previewId).textContent = content.substring(0, 300) + '...';
    })
    .catch(error => {
        clearTimeout(timeoutId);
        console.error('重新生成失败：', error);
        document.getElementById(statusId).textContent = '❌ 再次失败';
        document.getElementById(statusId).style.color = '#e74c3c';
        document.getElementById(previewId).innerHTML = '<span style="color:#e74c3c">重新生成仍然失败，请检查网络后重试，或继续编辑现有内容。</span>';
    });
}

function seaStartCarousel(elementId, messages) {
    let index = 0;
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = messages[0];
    seaCarouselInterval = setInterval(() => {
        index = (index + 1) % messages.length;
        el.textContent = messages[index];
    }, 4000);
}

function seaStopCarousel() {
    if (seaCarouselInterval) {
        clearInterval(seaCarouselInterval);
        seaCarouselInterval = null;
    }
}

function seaGenerateFallbackAnalysis(studentName, studentGrade, examSubject, examName, actualScore, fullScore, errorDesc, weakPoints, classroomPerformance, classroomPerformanceDesc) {
    const scoreRate = ((actualScore / fullScore) * 100).toFixed(1);
    const weakPointsText = weakPoints.length > 0 ? weakPoints.join('、') : '基础知识掌握不够扎实';
    const performanceText = classroomPerformance.length > 0 ? classroomPerformance.join('、') : '课堂表现良好';
    let performanceLevel = '';
    if (scoreRate >= 90) performanceLevel = '优秀';
    else if (scoreRate >= 80) performanceLevel = '良好';
    else if (scoreRate >= 70) performanceLevel = '中等';
    else if (scoreRate >= 60) performanceLevel = '及格';
    else performanceLevel = '需要加强';

    return `【青岛睿花苑】${studentName}同学${examSubject}考情分析报告

考试信息：${studentGrade} · ${examName} · ${actualScore}分/满分${fullScore}分（得分率${scoreRate}%，${performanceLevel}水平）

一、总体评价
${studentName}同学在${examName}${examSubject}考试中取得了${actualScore}分（满分${fullScore}分），得分率为${scoreRate}%，整体表现${performanceLevel}。

课堂表现：${performanceText}

二、课堂表现分析
${classroomPerformanceDesc || '学生整体学习态度端正，课堂参与度有待进一步观察。'}

三、错题分析
${errorDesc.split('\n').map(line => line.trim() ? '• ' + line.trim() : '').join('\n')}

四、薄弱环节
1. ${weakPointsText}
2. 知识迁移能力需要加强
3. 应试技巧和时间管理有待提升

五、改进建议
1. 夯实基础：系统复习课本基础知识，建立完整的知识体系
2. 专项突破：针对薄弱环节进行专项训练
3. 错题整理：建立错题本，定期回顾
4. 模拟训练：增加限时训练，提高应试能力

六、后续规划
1. 短期目标（1-2周）：巩固本次考试涉及的知识点
2. 中期目标（1个月）：完成薄弱环节的专项突破
3. 长期目标（本学期）：全面提升${examSubject}学科能力

---
小睿同学智能分析系统
©青岛睿花苑教育科技有限公司
打造最适合人才发展的教育平台，为所到地区带去最优质的教育`;
}

function seaGenerateFallbackPlan(studentName, examSubject, examName, actualScore, fullScore, weakPoints) {
    const scoreRate = ((actualScore / fullScore) * 100).toFixed(1);
    const weakPointsText = weakPoints.length > 0 ? weakPoints.join('、') : '基础知识掌握不够扎实';

    let priorityFocus = '';
    if (scoreRate < 60) {
        priorityFocus = '当前成绩处于需要加强的阶段，建议优先夯实基础知识，从课本核心概念入手，逐步建立完整的知识体系。';
    } else if (scoreRate < 80) {
        priorityFocus = '当前成绩处于中等水平，建议在巩固基础的同时，重点突破薄弱环节，提升解题能力和应试技巧。';
    } else {
        priorityFocus = '当前成绩良好，建议在保持优势的基础上，攻克难点题型，提升综合运用能力，争取更高分数。';
    }

    return `【学习方案】${studentName}同学${examSubject}后续学习规划

基于${examName}考试表现（${actualScore}分/满分${fullScore}分，得分率${scoreRate}%），制定以下学习方案：

一、当前学情判断
${priorityFocus}

二、优先攻克方向
1. ${weakPointsText}：这是当前最需要提升的方面，建议集中精力突破
2. 知识迁移能力：学会举一反三，将已掌握的知识灵活运用
3. 应试技巧：合理分配答题时间，提高做题效率

三、短期目标（1-2周）
1. 针对本次考试暴露的薄弱知识点，进行专项复习和练习
2. 整理本次考试错题，分析错误原因，确保同类题目不再出错
3. 每天坚持${examSubject}基础练习，保持手感

四、中期目标（1个月）
1. 完成薄弱环节的系统性突破
2. 建立错题本，养成定期回顾的习惯
3. 适当增加限时训练，提升应试能力

五、学习方法建议
1. 课前预习：提前了解新课内容，带着问题听课
2. 课堂专注：紧跟老师思路，做好笔记
3. 课后巩固：及时复习当天所学，完成作业后再做拓展练习
4. 定期自测：每周进行一次小测验，检验学习效果

六、鼓励与期望
${studentName}，每一次考试都是成长的机会。只要找到问题、对症下药，进步一定会来的！加油！`;
}

function seaGoToStep4() {
    const analysisEl = document.getElementById('seaAnalysisText');
    const planEl = document.getElementById('seaPlanText');
    seaState.generatedAnalysis = analysisEl.innerText.trim();
    seaState.generatedPlan = planEl.innerText.trim();
    if (!seaState.generatedAnalysis) {
        alert('考情分析内容不能为空');
        return;
    }
    if (!seaState.generatedPlan) {
        alert('学习方案内容不能为空');
        return;
    }
    seaGoToStep(4);
    seaGenerateBeautifiedHtml();
}

async function seaGenerateBeautifiedHtml() {
    document.getElementById('seaReportLoading').style.display = 'block';
    document.getElementById('seaReportPreview').style.display = 'none';

    const studentName = document.getElementById('seaStudentName').value;
    const examSubject = document.getElementById('seaExamSubject').value;

    seaStartCarousel('seaReportCarousel', [
        '🎨 小睿同学正在设计精美排版...',
        '📐 正在构建报告框架...',
        '🖌️ 正在优化视觉效果...',
        '✨ 即将完成报告生成...'
    ]);

    const prompt = `你是一位世界顶级的HTML报告设计师和前端工程师。你擅长生成极其精美、现代化、数据可视化丰富的考情分析报告。你必须输出完整、可运行的HTML代码，所有内容必须完整输出，绝不能截断。图表必须使用内联SVG或CSS绘制，不依赖外部JS库初始化。

【内容结构要求 - 必须严格按此顺序组织】
一、封面：青岛睿花苑·${examSubject}考情分析报告（大标题居中，必须包含"青岛睿花苑"字样，无版本标识）
二、学生信息卡：姓名（${studentName}）、年级、考试名称、成绩等关键信息，使用卡片式布局
三、考情分析部分：将考情分析文字按逻辑分段，使用卡片/模块化布局，每段一个小标题
四、学习方案部分【重点展示区域】：这是报告的核心亮点，必须重点突出！
    - 使用与考情分析不同的、更醒目的视觉风格（如渐变背景、特殊边框、图标装饰等）
    - 学习方案应占据报告较大篇幅，视觉权重不低于考情分析
    - 将学习方案中的阶段性目标、优先攻克方向等用时间线或步骤卡片展示
    - 鼓励性语言使用特别醒目的样式（如大字号、渐变色、特殊背景）
五、总结与鼓励：突出鼓励性语言，使用醒目的样式
六、装饰元素：适当使用CSS绘制的装饰线条、渐变色块、图标等
七、配色方案：根据${examSubject}学科特色选择配色（${examSubject === '数学' ? '蓝色系，理性严谨' : examSubject === '英语' ? '绿色系，活力开放' : examSubject === '语文' ? '红棕色系，文化底蕴' : '紫色系，智慧优雅'}）
八、页脚：必须包含以下内容（无年份）：
    - 主文字："小睿同学·智能考情分析系统"
    - 版权信息："©版权所有·青岛睿花苑教育科技有限公司"
    - 企业标语："打造最适合人才发展的教育平台，为所到地区带去最优质的教育"

★★★【最高优先级-强制字体大小要求】★★★
本报告面向家长阅读，所有文字必须特别大、特别醒目！
- body基础font-size必须设为20px
- 正文段落文字不低于20px
- 小标题不低于26px
- 大标题/板块标题不低于34px
- 关键数据、分数、百分比不低于24px且加粗
- 列表项不低于20px
- 行高line-height不低于2.0
如果你生成的HTML中任何正文文字小于20px，就是不合格输出！
★★★★★★★★★★★★

【学习方案重点展示要求 - 极其重要】
- 学习方案是本报告的最大亮点，必须在视觉上与考情分析形成鲜明对比
- 建议使用不同的背景色块、更大的标题字号、更粗的边框来突出学习方案
- 学习方案中的目标、建议等条目使用步骤卡片或时间线样式
- 整体布局上，学习方案部分的视觉面积应与考情分析相当或更大

【整体特征分析 - 重点关注】
- 整体风格：现代简约，高端大气，有设计感
- 排版：内容丰富但不拥挤，留白得当
- 视觉层次：通过字号、颜色、间距建立清晰的信息层级
- 数据呈现：如有数据，使用进度条或可视化方式展示
- 响应式：适配手机和电脑
- 打印友好：添加@media print样式

【技术要求】
- 输出完整、可运行的HTML代码，绝不能截断
- 所有CSS内联在<style>标签中
- 图标使用Unicode字符或CSS绘制，不依赖外部图标库
- 不使用外部JS库，纯HTML+CSS

考情分析内容：
${seaState.generatedAnalysis}

学习方案内容：
${seaState.generatedPlan}

请直接返回完整的HTML代码，不需要Markdown代码块标记。`;

    const controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), 300000);

    function resetTimeout() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => controller.abort(), 300000);
    }

    try {
        const response = await fetch(SEA_ZHIPU_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SEA_ZHIPU_API_KEY}`
            },
            body: JSON.stringify({
                model: 'glm-5',
                messages: [
                    {
                        role: 'system',
                        content: '你是一位世界顶级的HTML报告设计师和前端工程师。你擅长生成极其精美、现代化、数据可视化丰富的考情分析报告。你必须输出完整、可运行的HTML代码，所有内容必须完整输出，绝不能截断。图表必须使用内联SVG或CSS绘制，不依赖外部JS库初始化。【强制品牌要求】1. 报告大标题必须包含"青岛睿花苑"字样，格式为"青岛睿花苑·XXX考情分析报告"；2. 页脚必须包含三行信息：主文字"小睿同学·智能考情分析系统"、版权信息"©版权所有·青岛睿花苑教育科技有限公司"、企业标语"打造最适合人才发展的教育平台，为所到地区带去最优质的教育"。以上品牌信息为强制要求，不可省略。★★★【最高优先级-强制字体大小要求】★★★ 本报告面向家长阅读，所有文字必须特别大、特别醒目！具体硬性指标：body基础font-size必须设为20px！正文段落文字不低于20px！小标题不低于26px！大标题/板块标题不低于34px！关键数据、分数、百分比不低于24px且加粗！列表项不低于20px！行高line-height不低于2.0！这是最高优先级要求，比美观更重要，绝对不允许出现14px、16px等小字号！如果你生成的HTML中任何正文文字小于20px，就是不合格输出！★★★★★★★★★★★★【学习方案重点展示要求】报告中包含考情分析和学习方案两部分内容，学习方案是报告的核心亮点，必须在视觉上重点突出：使用更醒目的视觉风格（渐变背景、特殊边框、图标装饰），学习方案的视觉面积应与考情分析相当或更大，阶段性目标用时间线或步骤卡片展示。'
                    },
                    { role: 'user', content: prompt }
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
            let htmlContent = fullContent.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
            htmlContent = seaInjectBranding(htmlContent);
            seaState.beautifiedHtml = htmlContent;
            seaDisplayBeautifiedResult();
        } else {
            throw new Error('智谱API返回数据格式异常');
        }

    } catch (error) {
        clearTimeout(timeoutId);
        console.error('生成美化HTML时出错：', error);
        seaState.beautifiedHtml = seaGenerateFallbackHtml(studentName, examSubject);
        seaDisplayBeautifiedResult();
    }
}

function seaInjectBranding(html) {
    const brandTitle = '青岛睿花苑';
    const footerHTML = `
<div style="text-align:center;padding:30px 20px 20px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;margin-top:40px;border-radius:0 0 12px 12px;">
    <p style="font-size:16px;font-weight:bold;margin-bottom:8px;">小睿同学·智能考情分析系统</p>
    <p style="font-size:13px;margin-bottom:6px;">©版权所有·青岛睿花苑教育科技有限公司</p>
    <p style="font-size:12px;opacity:0.9;">打造最适合人才发展的教育平台，为所到地区带去最优质的教育</p>
</div>`;

    if (!html.includes(brandTitle)) {
        html = html.replace(/(<h1[^>]*>)([\s\S]*?)(<\/h1>)/i, function(match, open, content, close) {
            return open + brandTitle + '·' + content + close;
        });
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

function seaDisplayBeautifiedResult() {
    seaStopCarousel();
    document.getElementById('seaReportLoading').style.display = 'none';
    document.getElementById('seaReportPreview').style.display = 'block';

    const blob = new Blob([seaState.beautifiedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    document.getElementById('seaReportFrame').src = url;
}

function seaGenerateFallbackHtml(studentName, subject) {
    const analysis = seaState.generatedAnalysis;
    const plan = seaState.generatedPlan;
    const analysisLines = analysis.split('\n').filter(line => line.trim());
    const planLines = plan.split('\n').filter(line => line.trim());
    let contentHtml = '';
    let currentSection = false;

    contentHtml += '<div class="section" style="border-left-color:#4a6fa5"><div class="section-title2">📊 考情分析</div>';
    analysisLines.forEach(line => {
        if (line.match(/^一、|^二、|^三、|^四、|^五、|^六、/)) {
            if (currentSection) contentHtml += '</div>';
            currentSection = true;
            contentHtml += `<div class="section" style="border-left-color:#4a6fa5"><div class="section-title2">${line}</div>`;
        } else if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            contentHtml += `<div class="list-item">${line.replace(/^[•-]\s*/, '')}</div>`;
        } else if (line.match(/^\d+\./)) {
            contentHtml += `<div class="numbered-item">${line}</div>`;
        } else if (line.trim()) {
            contentHtml += `<div class="paragraph">${line}</div>`;
        }
    });
    if (currentSection) contentHtml += '</div>';

    contentHtml += '<div class="section" style="border-left-color:#e67e22;background:linear-gradient(135deg,#fff8f0,#fff3e6)"><div class="section-title2" style="color:#e67e22">📋 学习方案</div>';
    planLines.forEach(line => {
        if (line.match(/^一、|^二、|^三、|^四、|^五、|^六、/)) {
            if (currentSection) contentHtml += '</div>';
            currentSection = true;
            contentHtml += `<div class="section" style="border-left-color:#e67e22;background:linear-gradient(135deg,#fff8f0,#fff3e6)"><div class="section-title2" style="color:#e67e22">${line}</div>`;
        } else if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            contentHtml += `<div class="list-item">${line.replace(/^[•-]\s*/, '')}</div>`;
        } else if (line.match(/^\d+\./)) {
            contentHtml += `<div class="numbered-item">${line}</div>`;
        } else if (line.trim()) {
            contentHtml += `<div class="paragraph">${line}</div>`;
        }
    });
    if (currentSection) contentHtml += '</div>';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>青岛睿花苑 - ${studentName}${subject}考情分析报告</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif; background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }
        .header { background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { font-size: 2rem; margin-bottom: 10px; }
        .header .subtitle { opacity: 0.9; font-size: 1.1rem; }
        .content { padding: 40px; }
        .section { background: #f8f9ff; border-radius: 15px; padding: 25px; margin-bottom: 20px; border-left: 5px solid #667eea; }
        .section-title2 { font-size: 1.2rem; color: #333; margin-bottom: 15px; font-weight: 600; }
        .paragraph { color: #555; line-height: 1.8; margin-bottom: 10px; text-align: justify; }
        .list-item { color: #555; line-height: 1.8; padding-left: 20px; position: relative; margin-bottom: 8px; }
        .list-item::before { content: "•"; color: #667eea; position: absolute; left: 0; font-weight: bold; }
        .numbered-item { color: #555; line-height: 1.8; margin-bottom: 8px; padding-left: 5px; }
        .footer { background: linear-gradient(135deg,#667eea,#764ba2); padding: 30px 20px; text-align: center; color: #fff; }
        .footer p { margin: 5px 0; }
        @media print { body { background: white; padding: 0; } .container { box-shadow: none; } }
        @media (max-width: 768px) { .content { padding: 20px; } .header { padding: 25px; } .section { padding: 15px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 青岛睿花苑·${subject}考情分析报告</h1>
            <div class="subtitle">${studentName} · ${subject}</div>
        </div>
        <div class="content">${contentHtml}</div>
        <div class="footer">
            <p style="font-weight:bold;">小睿同学·智能考情分析系统</p>
            <p>©版权所有·青岛睿花苑教育科技有限公司</p>
            <p style="opacity:0.9;">打造最适合人才发展的教育平台，为所到地区带去最优质的教育</p>
        </div>
    </div>
</body>
</html>`;
}

function seaDownloadHtml() {
    const studentName = document.getElementById('seaStudentName').value;
    const examSubject = document.getElementById('seaExamSubject').value;
    const blob = new Blob([seaState.beautifiedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `青岛睿花苑_${studentName}_${examSubject}_考情分析报告.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function seaStartNew() {
    document.getElementById('seaFileInput').value = '';
    document.getElementById('seaStudentName').value = '';
    document.getElementById('seaStudentGrade').value = '';
    document.getElementById('seaExamSubject').value = '';
    document.getElementById('seaExamName').value = '';
    document.getElementById('seaActualScore').value = '';
    document.getElementById('seaFullScore').value = '';
    document.getElementById('seaErrorDescription').value = '';
    document.getElementById('seaClassroomPerformance').value = '';
    document.querySelectorAll('.sea-weak, .sea-perf').forEach(cb => cb.checked = false);
    document.getElementById('seaFileInfo').style.display = 'none';
    document.getElementById('seaPdfWarning').style.display = 'none';
    seaState.uploadedFile = null;
    seaState.fileContent = '';
    seaState.generatedAnalysis = '';
    seaState.generatedPlan = '';
    seaState.beautifiedHtml = '';
    seaGoToStep(1);
}

function seaToggleFeedback() {
    const popup = document.getElementById('seaFeedbackPopup');
    popup.classList.toggle('show');
}
