const seaState = {
    uploadedFile: null,
    fileContent: '',
    generatedAnalysis: '',
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
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                text += textContent.items.map(item => item.str).join(' ') + '\n';
            }
            seaState.fileContent = text;
        } catch (error) {
            console.error('PDF extraction error:', error);
            seaState.fileContent = '[PDF文件内容提取失败，将根据您提供的错题情况描述进行分析]';
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

    seaGoToStep(2);
    seaStartCarousel('seaAnalysisCarousel', [
        '🔍 小睿同学正在仔细阅读试卷内容...',
        '📊 正在分析错题原因和知识盲点...',
        '🎯 正在评估薄弱环节...',
        '📝 正在生成考情分析报告...',
        '✨ 即将完成分析...'
    ]);
    seaGenerateAnalysis();
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

async function seaGenerateAnalysis() {
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

    const prompt = `【系统要求】你现在是小睿同学，是青岛睿花苑教育科技有限公司开发的智能分析助手。请根据以下学生考试情况，生成一份详细的考情分析报告。

【强制要求】
1. 报告大标题必须包含"青岛睿花苑"字样
2. 报告页脚必须包含以下内容：
   - 小睿同学智能分析系统
   - ©青岛睿花苑教育科技有限公司
   - 打造最适合人才发展的教育平台，为所到地区带去最优质的教育

学生信息：
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
${seaState.fileContent ? seaState.fileContent.substring(0, 8000) : '未上传试卷文件'}

请生成一份详细的考情分析报告，包含以下内容：
1. 总体评价（结合课堂表现和考试成绩进行综合评价，说明得分率${scoreRate}%所处的水平）
2. 课堂表现分析（根据课堂表现评价学生的学习态度和习惯）
3. 错题分析（分析错题原因，指出知识盲点）
4. 薄弱环节（详细分析学生的薄弱环节）
5. 改进建议（给出具体的学习建议和提升方案，结合课堂表现给出针对性建议）
6. 后续规划（制定下一步的学习计划）

要求：
- 语言专业、客观、有建设性
- 分析要具体，避免空泛的表述
- 建议要切实可行
- 整体语气积极鼓励
- 结合课堂表现和考试成绩进行全面分析
- 必须包含青岛睿花苑相关标识`;

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
            })
        });

        if (!response.ok) throw new Error('API请求失败：' + response.status);

        const data = await response.json();
        seaState.generatedAnalysis = data.choices[0].message.content;

        seaStopCarousel();
        document.getElementById('seaAnalysisText').innerText = seaState.generatedAnalysis;
        seaGoToStep(3);
    } catch (error) {
        console.error('生成考情分析时出错：', error);
        seaStopCarousel();
        seaState.generatedAnalysis = seaGenerateFallbackAnalysis(studentName, studentGrade, examSubject, examName, actualScore, fullScore, errorDescription, weakPoints, classroomPerformance, classroomPerformanceDesc);
        document.getElementById('seaAnalysisText').innerText = seaState.generatedAnalysis;
        seaGoToStep(3);
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

function seaGoToStep4() {
    const analysisEl = document.getElementById('seaAnalysisText');
    seaState.generatedAnalysis = analysisEl.innerText.trim();
    if (!seaState.generatedAnalysis) {
        alert('考情分析内容不能为空');
        return;
    }
    seaGoToStep(4);
    seaGenerateBeautifiedHtml();
}

async function seaGenerateBeautifiedHtml() {
    document.getElementById('seaReportLoading').style.display = 'flex';
    document.getElementById('seaReportPreview').style.display = 'none';

    const studentName = document.getElementById('seaStudentName').value;
    const examSubject = document.getElementById('seaExamSubject').value;

    seaStartCarousel('seaReportCarousel', [
        '🎨 小睿同学正在设计精美排版...',
        '📐 正在构建报告框架...',
        '🖌️ 正在优化视觉效果...',
        '✨ 即将完成报告生成...'
    ]);

    const prompt = `【系统要求】你现在是小睿同学，是青岛睿花苑教育科技有限公司开发的智能分析助手。请将以下考情分析报告转换为精美的HTML格式。

【强制品牌要求】
1. 报告大标题必须包含"青岛睿花苑"字样，格式为"青岛睿花苑·XXX考情分析报告"
2. 页脚必须包含三行信息：
   - 主文字"小睿同学·智能考情分析系统"
   - 版权信息"©版权所有·青岛睿花苑教育科技有限公司"
   - 企业标语"打造最适合人才发展的教育平台，为所到地区带去最优质的教育"
以上品牌信息为强制要求，不可省略。

考情分析内容：
${seaState.generatedAnalysis}

设计要求：
1. 使用现代化的CSS样式，设计美观大方
2. 包含学生姓名（${studentName}）和科目（${examSubject}）的标题
3. 使用合适的颜色搭配（建议使用蓝色、紫色渐变）
4. 内容分块清晰，使用卡片式布局
5. 添加适当的图标和装饰元素
6. 使用中文网页字体
7. 确保HTML是完整的、可以直接运行的
8. 响应式设计，适配不同屏幕尺寸
9. 添加打印样式，方便打印保存
10. 必须包含青岛睿花苑相关标识和品牌信息

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
                        content: '你是一位世界顶级的HTML报告设计师和前端工程师。你擅长生成极其精美、现代化的考情分析报告。你必须输出完整、可运行的HTML代码，所有内容必须完整输出，绝不能截断。【强制品牌要求】1. 报告大标题必须包含"青岛睿花苑"字样；2. 页脚必须包含三行信息：主文字"小睿同学·智能考情分析系统"、版权信息"©版权所有·青岛睿花苑教育科技有限公司"、企业标语"打造最适合人才发展的教育平台，为所到地区带去最优质的教育"。以上品牌信息为强制要求，不可省略。'
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
    const analysisLines = analysis.split('\n').filter(line => line.trim());
    let contentHtml = '';
    let currentSection = false;

    analysisLines.forEach(line => {
        if (line.match(/^一、|^二、|^三、|^四、|^五、|^六、/)) {
            if (currentSection) contentHtml += '</div>';
            currentSection = true;
            contentHtml += `<div class="section"><div class="section-title2">${line}</div>`;
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
    seaState.beautifiedHtml = '';
    seaGoToStep(1);
}

function seaToggleFeedback() {
    const popup = document.getElementById('seaFeedbackPopup');
    popup.classList.toggle('show');
}
