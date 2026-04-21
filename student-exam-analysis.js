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

document.addEventListener('DOMContentLoaded', () => {
    initSeaEventListeners();
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

请你根据上述内容给${studentName}的${examName}做题情况做一个分析，分析这次的做题情况和后面需要努力的点。要求：
1. 切合实际一些，不要每日提分计划之类不切实际的内容
2. 说出问题和需要注意的点
3. 多鼓励一下学生
4. 表述不要太人机，要像一个真实的老师在和学生聊天一样自然
5. 结合${examSubject}学科特色进行分析，比如${subjectFeature}等方面
6. 分析要具体到知识点，不要泛泛而谈`;

    const prompt2 = `你是一位经验丰富的${examSubject}教师和学业规划师，请根据以下学生信息，为${studentName}同学制定接下来的学习方案。

${studentInfoBlock}

请你根据学生现在的情况，制定接下来的学习方案。要求：
1. 方案要切合实际，不要"每日提分计划"之类不切实际的内容
2. 要有阶段性目标（短期、中期），但不要过于死板
3. 重点指出接下来应该优先攻克的知识点和能力
4. 给出具体可执行的学习方法和建议
5. 结合${examSubject}学科特色，比如${subjectFeature}等方面
6. 语气要像一个真实的老师在和学生聊天，不要太人机
7. 适当鼓励学生，让学生有信心`;

    let completedCount = 0;

    function onOneComplete() {
        completedCount++;
        if (completedCount === 2) {
            seaStopCarousel();
            setTimeout(() => seaGoToStep(3), 600);
        }
    }

    const promise1 = (async () => {
        try {
            const response = await fetch(SEA_KIMI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SEA_KIMI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'kimi-k2.5',
                    messages: [{ role: 'user', content: prompt1 }],
                    temperature: 1
                })
            });

            if (!response.ok) throw new Error('API请求失败：' + response.status);
            const data = await response.json();
            seaState.generatedAnalysis = data.choices[0].message.content;
        } catch (error) {
            console.error('生成考情分析时出错：', error);
            seaState.generatedAnalysis = seaGenerateFallbackAnalysis(studentName, studentGrade, examSubject, examName, actualScore, fullScore, errorDescription, weakPoints, classroomPerformance, classroomPerformanceDesc);
        }

        document.getElementById('seaDualResult').style.display = 'grid';
        document.getElementById('seaResultCard1').style.display = 'block';
        document.getElementById('seaStatus1').textContent = '✅ 已完成';
        document.getElementById('seaStatus1').style.color = '#27ae60';
        document.getElementById('seaPreview1').textContent = seaState.generatedAnalysis.substring(0, 300) + '...';
        document.getElementById('seaAnalysisText').innerText = seaState.generatedAnalysis;
        onOneComplete();
    })();

    const promise2 = (async () => {
        try {
            const response = await fetch(SEA_KIMI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SEA_KIMI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'kimi-k2.5',
                    messages: [{ role: 'user', content: prompt2 }],
                    temperature: 1
                })
            });

            if (!response.ok) throw new Error('API请求失败：' + response.status);
            const data = await response.json();
            seaState.generatedPlan = data.choices[0].message.content;
        } catch (error) {
            console.error('生成学习方案时出错：', error);
            seaState.generatedPlan = seaGenerateFallbackPlan(studentName, examSubject, examName, actualScore, fullScore, weakPoints);
        }

        document.getElementById('seaDualResult').style.display = 'grid';
        document.getElementById('seaResultCard2').style.display = 'block';
        document.getElementById('seaStatus2').textContent = '✅ 已完成';
        document.getElementById('seaStatus2').style.color = '#27ae60';
        document.getElementById('seaPreview2').textContent = seaState.generatedPlan.substring(0, 300) + '...';
        document.getElementById('seaPlanText').innerText = seaState.generatedPlan;
        onOneComplete();
    })();

    await Promise.all([promise1, promise2]);
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

    const prompt = `你是一位世界顶尖的排版大师和前端工程师，擅长将文字内容转化为视觉震撼的HTML页面。请将以下考情分析和学习方案内容转换为一份极其精美、现代化的HTML报告。

【内容结构要求 - 必须严格按此顺序组织】
一、封面：青岛睿花苑·${examSubject}考情分析报告（大标题居中，简约大气，必须包含"青岛睿花苑"字样，无版本标识）
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

    try {
        const response = await fetch(SEA_ZHIPU_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SEA_ZHIPU_API_KEY}`
            },
            body: JSON.stringify({
                model: 'glm-4-flash',
                messages: [
                    {
                        role: 'system',
                        content: '你是一位世界顶级的HTML报告设计师和前端工程师。你擅长生成极其精美、现代化、数据可视化丰富的考情分析报告。你必须输出完整、可运行的HTML代码，所有内容必须完整输出，绝不能截断。图表必须使用内联SVG或CSS绘制，不依赖外部JS库初始化。【强制品牌要求】1. 报告大标题必须包含"青岛睿花苑"字样，格式为"青岛睿花苑·XXX考情分析报告"；2. 页脚必须包含三行信息：主文字"小睿同学·智能考情分析系统"、版权信息"©版权所有·青岛睿花苑教育科技有限公司"、企业标语"打造最适合人才发展的教育平台，为所到地区带去最优质的教育"。以上品牌信息为强制要求，不可省略。【学习方案重点展示要求】报告中包含考情分析和学习方案两部分内容，学习方案是报告的核心亮点，必须在视觉上重点突出：使用更醒目的视觉风格（渐变背景、特殊边框、图标装饰），学习方案的视觉面积应与考情分析相当或更大，阶段性目标用时间线或步骤卡片展示。'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 8192
            })
        });

        if (!response.ok) throw new Error('API请求失败：' + response.status);

        const data = await response.json();
        let htmlContent = data.choices[0].message.content;
        htmlContent = htmlContent.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
        htmlContent = seaInjectBranding(htmlContent);
        seaState.beautifiedHtml = htmlContent;
        seaDisplayBeautifiedResult();
    } catch (error) {
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
