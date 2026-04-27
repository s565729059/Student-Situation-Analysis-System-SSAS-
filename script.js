document.addEventListener('DOMContentLoaded', function() {
    const gradeSelect = document.getElementById('grade');
    const gradesContainer = document.getElementById('gradesContainer');
    const studentForm = document.getElementById('studentForm');
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const radarChartCanvas = document.getElementById('radarChart');
    const barChartCanvas = document.getElementById('barChart');
    const lineChartCanvas = document.getElementById('lineChart');
    let radarChart = null;
    let barChart = null;
    let lineChart = null;
    let currentStudentData = null; // 保存当前学生数据，用于重新生成
    
    // 年级对应的科目
    const subjectsByGrade = {
        '六年级': ['语文', '数学', '英语'],
        '七年级': ['语文', '数学', '英语', '地理', '生物'],
        '八年级': ['语文', '数学', '英语', '地理', '生物', '物理'],
        '九年级': ['语文', '数学', '英语', '物理', '化学']
    };
    
    // 考试次数选择
    const examCountSelect = document.getElementById('examCount');
    
    // 生成成绩输入框
    function generateGradeInputs() {
        const selectedGrade = gradeSelect.value;
        const selectedExamCount = examCountSelect.value;
        gradesContainer.innerHTML = '<h3>成绩输入</h3>';
        
        if (selectedGrade && selectedExamCount) {
            const subjects = subjectsByGrade[selectedGrade];
            for (let i = 1; i <= selectedExamCount; i++) {
                const examSection = document.createElement('div');
                examSection.className = 'exam-section';
                examSection.innerHTML = `
                    <div class="exam-name-input">
                        <label for="exam_name_${i}">考试名称</label>
                        <input type="text" id="exam_name_${i}" name="exam_name_${i}" placeholder="例如：七年级期中考试" required>
                    </div>
                `;
                
                subjects.forEach(subject => {
                    let maxScore;
                    if (selectedGrade === '六年级') {
                        // 六年级语数英满分100分
                        maxScore = 100;
                    } else if (['语文', '数学', '英语'].includes(subject)) {
                        maxScore = 120;
                    } else if (['地理', '生物', '化学'].includes(subject)) {
                        maxScore = 80;
                    } else {
                        maxScore = 100;
                    }
                    const inputGroup = document.createElement('div');
                    inputGroup.className = 'grade-input-group';
                    inputGroup.innerHTML = `
                        <label for="${subject}_${i}">${subject} (满分${maxScore}分)</label>
                        <input type="number" id="${subject}_${i}" name="${subject}_${i}" min="0" max="${maxScore}" required>
                    `;
                    examSection.appendChild(inputGroup);
                });
                
                gradesContainer.appendChild(examSection);
            }
        }
    }
    
    // 年级选择事件
    gradeSelect.addEventListener('change', generateGradeInputs);
    
    // 考试次数选择事件
    examCountSelect.addEventListener('change', generateGradeInputs);
    
    // 表单提交事件
    studentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 收集表单数据
        const formData = new FormData(this);
        const studentData = {
            name: formData.get('name'),
            gender: formData.get('gender'),
            age: formData.get('age'),
            grade: formData.get('grade'),
            examCount: formData.get('examCount'),
            hobbies: formData.get('hobbies'),
            studyHabits: formData.get('studyHabits'),
            otherInfo: formData.get('otherInfo'),
            grades: []
        };
        
        // 保存当前学生数据，用于重新生成
        currentStudentData = studentData;
        
        // 收集成绩数据
        console.log('studentData.grade:', studentData.grade);
        console.log('studentData.examCount:', studentData.examCount);
        console.log('subjectsByGrade:', subjectsByGrade);
        console.log('subjectsByGrade[studentData.grade]:', subjectsByGrade[studentData.grade]);
        
        const subjects = subjectsByGrade[studentData.grade];
        if (subjects) {
            console.log('找到科目:', subjects);
            // 收集多次考试的成绩
            for (let i = 1; i <= studentData.examCount; i++) {
                const examName = formData.get(`exam_name_${i}`);
                const examGrades = {
                    examName: examName
                };
                subjects.forEach(subject => {
                    examGrades[subject] = formData.get(`${subject}_${i}`);
                });
                studentData.grades.push(examGrades);
            }
        } else {
            console.error('未找到对应年级的科目:', studentData.grade);
            throw new Error('请选择有效的年级');
        }
        
        // 隐藏导出按钮
        document.getElementById('exportButtons').style.display = 'none';
        
        try {
            console.log('开始分析学生数据:', studentData);
            
            // 显示结果区域
            resultSection.style.display = 'block';
            detailedAnalysisSection.style.display = 'block';
            
            // 显示学生基本信息
            displayResult(studentData, '');
            
            // 生成图表
            try {
                console.log('开始生成图表');
                generateCharts(studentData);
                console.log('图表生成完成');
            } catch (chartError) {
                console.error('图表生成失败:', chartError);
            }
            
            // 初始化分析结果存储
            const analysisResults = {};
            const analysisSections = document.getElementById('analysisSections');
            analysisSections.innerHTML = '';
            
            // 定义五个分析部分
            const sections = [
                { id: 1, title: '整体学习情况评估', color: 'blue', ai: 'kimi' },
                { id: 2, title: '各学科的知识掌握情况', color: 'blue', ai: 'deepseek' },
                { id: 3, title: '个性化学习建议', color: 'green', ai: 'kimi' },
                { id: 4, title: '具体的补课方案', color: 'orange', ai: 'kimi' },
                { id: 5, title: '其它补充信息', color: 'purple', ai: 'kimi' }
            ];
            
            // 预先创建所有分析部分的DOM元素
            const sectionElements = {};
            sections.forEach(section => {
                const sectionId = generateSectionId(section.title);
                const sectionElement = document.createElement('div');
                sectionElement.id = sectionId;
                sectionElement.className = 'analysis-section';
                analysisSections.appendChild(sectionElement);
                sectionElements[sectionId] = sectionElement;
                showLoading(sectionId, `正在${section.title}，请稍候...`);
            });
            
            // 并发处理所有五个分析部分
            const promises = sections.map(async (section) => {
                const sectionId = generateSectionId(section.title);
                try {
                    let analysisResult;
                    
                    // 根据section.ai选择处理方式
                    if (section.ai === 'kimi') {
                        console.log(`使用Kimi处理第${section.id}部分：${section.title}`);
                    } else {
                        console.log(`使用DeepSeek处理第${section.id}部分：${section.title}`);
                    }
                    
                    switch(section.id) {
                        case 1:
                            analysisResult = await analyzeOverallLearningWithAI(studentData, section.ai);
                            break;
                        case 2:
                            analysisResult = await analyzeSubjectsWithAI(studentData, section.ai);
                            break;
                        case 3:
                            analysisResult = await analyzeLearningAdviceWithAI(studentData, section.ai);
                            break;
                        case 4:
                            analysisResult = await analyzeTutoringPlanWithAI(studentData, section.ai);
                            break;
                        case 5:
                            analysisResult = await analyzeAdditionalInfoWithAI(studentData, section.ai);
                            break;
                    }
                    
                    // 存储结果
                    analysisResults[section.title] = analysisResult;
                    
                    // 立即显示这部分结果
                    if (section.id === 2) {
                        // 各学科分析不应用beautifyOutput，直接传原始内容
                        await displaySubjectAnalysis(analysisResult, studentData, sectionId, section.title);
                    } else {
                        // 其他部分应用美化
                        analysisResult = beautifyOutput(analysisResult);
                        displayAnalysisSection(section.title, analysisResult, section.color, sectionId);
                    }
                    
                    return { success: true, section: section.title };
                } catch (error) {
                    console.error(`${section.title}分析失败:`, error);
                    // 显示错误信息
                    displayErrorSection(section.title, error.message, sectionId);
                    return { success: false, section: section.title, error: error };
                }
            });
            
            // 等待所有分析完成（不过已经通过并发显示结果了）
            await Promise.all(promises);
            
            // 保存分析结果到全局变量，供导出使用
            window.studentAnalysisData = {
                studentData: studentData,
                analysisResults: analysisResults
            };
            
            // 显示导出按钮
            document.getElementById('exportButtons').style.display = 'flex';
            
        } catch (error) {
            console.error('分析失败:', error);
            resultContent.innerHTML = `<p style="color: red;">分析失败，请稍后重试。错误信息：${error.message}</p>`;
            resultSection.style.display = 'block';
        }
    });
    
    // 显示局部等待动画
    function showLoading(sectionId, text) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>${text}</p>
                </div>
            `;
        }
    }
    
    // 隐藏等待动画
    function hideLoading() {
        // 局部加载不需要全局隐藏
    }
    
    // 生成唯一的section ID
    function generateSectionId(title) {
        return title.toLowerCase().replace(/\s+/g, '-') + '-section';
    }
    
    // 通用DeepSeek API调用函数
    async function callDeepSeekAPI(prompt) {
        const apiKey = localStorage.getItem('ssas_deepseek_api_key') || 'sk-b91a4c7eee1642e19f0e6378464e9d2e';
        const url = 'https://api.deepseek.com/v1/chat/completions';
        
        const models = ['deepseek-v4-flash'];
        let lastError;
        let lastContent = null;
        
        for (const model of models) {
            console.log(`尝试使用DeepSeek模型: ${model}`);
            
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 120000); // 120秒超时
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.7
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`DeepSeek API调用失败: ${response.status}`);
                }
                
                const data = await response.json();
                if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                    console.log(`使用DeepSeek模型${model}成功获取结果`);
                    return data.choices[0].message.content;
                }
            } catch (error) {
                console.error(`DeepSeek API调用失败 (${model}):`, error);
                lastError = error;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        throw lastError || new Error('所有DeepSeek模型调用都失败');
    }
    
    async function callKimiAPI(prompt) {
        return await callDeepSeekAPI(prompt);
    }
    
    // 1. 分析整体学习情况
    async function analyzeOverallLearning(studentData) {
        // 构建成绩信息
        let gradesInfo = '';
        studentData.grades.forEach((examGrades, index) => {
            const examName = examGrades.examName || `第${index + 1}次考试`;
            gradesInfo += `${examName}：\n`;
            for (const [subject, score] of Object.entries(examGrades)) {
                if (subject !== 'examName') {
                    gradesInfo += `  ${subject}：${score}分\n`;
                }
            }
        });
        
        // 添加年级特殊说明
        let gradeSpecialNote = '';
        if (studentData.grade === '六年级') {
            gradeSpecialNote = '注意：这是小学阶段的学生，只有语文、数学、英语三科。请重点分析小学阶段的学习特点和过渡到初中的准备。';
        } else if (studentData.grade === '九年级') {
            gradeSpecialNote = '注意：九年级化学满分是80分，其他科目满分与其他年级相同。请根据实际满分情况进行分析。';
        }
        
        const prompt = `
        请根据以下学生信息，分析学生的整体学习情况：
        
        学生姓名：${studentData.name}
        性别：${studentData.gender}
        年龄：${studentData.age}
        年级：${studentData.grade}
        考试次数：${studentData.examCount}次
        兴趣爱好：${studentData.hobbies || '无'}
        学习习惯：${studentData.studyHabits || '无'}
        其他补充信息：${studentData.otherInfo || '无'}
        成绩：
        ${gradesInfo}
        
        ${gradeSpecialNote}
        
        请按照以下格式输出分析结果：
        
        # 整体学习状况分析
        [整体学习状况的详细分析]
        
        # 成绩趋势分析
        [成绩趋势的详细分析]
        
        # 学习能力与潜力评估
        [学习能力与潜力的详细分析]
        
        注意：
        1. 请提供详细、完整的分析内容
        2. 不要使用星号(*)或其他特殊符号作为列表标记
        3. 使用自然的段落结构，不要使用Markdown格式
        4. 确保分析全面、详细，能够给家长一个明确的指导
        `;
        
        return await callDeepSeekAPI(prompt, 'general');
    }
    
    // 2. 分析各学科知识掌握情况
    async function analyzeSubjects(studentData) {
        // 构建成绩信息
        let gradesInfo = '';
        studentData.grades.forEach((examGrades, index) => {
            const examName = examGrades.examName || `第${index + 1}次考试`;
            gradesInfo += `${examName}：\n`;
            for (const [subject, score] of Object.entries(examGrades)) {
                if (subject !== 'examName') {
                    gradesInfo += `  ${subject}：${score}分\n`;
                }
            }
        });
        
        // 获取学科列表
        const subjects = subjectsByGrade[studentData.grade];
        const subjectsList = subjects.join('、');
        
        // 添加年级特殊说明
        let gradeSpecialNote = '';
        if (studentData.grade === '六年级') {
            gradeSpecialNote = '注意：这是小学阶段的学生，只有语文、数学、英语三科。请重点分析小学阶段的学科特点和过渡到初中的准备。';
        } else if (studentData.grade === '九年级') {
            gradeSpecialNote = '注意：九年级化学满分是80分，其他科目满分与其他年级相同。请根据实际满分情况进行分析。';
        }
        
        const prompt = `
        请根据以下学生信息，分析学生的各学科知识掌握情况：
        
        学生姓名：${studentData.name}
        性别：${studentData.gender}
        年龄：${studentData.age}
        年级：${studentData.grade}
        考试次数：${studentData.examCount}次
        成绩：
        ${gradesInfo}
        
        ${gradeSpecialNote}
        
        请严格按照以下格式输出每个学科的分析结果：
        
        学科：[学科名称]
        [该学科的详细分析，包括每次考试的表现和变化趋势、不足之处和发展趋势、学习水平评估]
        
        请对以下学科进行分析：${subjectsList}
        
        注意：
        1. 每个学科必须单独分析，格式必须严格按照"学科：[学科名称]"开头
        2. 请对每个学科进行详细、完整的分析
        3. 不要使用星号(*)或其他特殊符号作为列表标记
        4. 使用自然的段落结构，不要使用Markdown格式
        5. 确保分析全面、详细，能够给家长一个明确的指导
        `;
        
        return await callDeepSeekAPI(prompt, 'subject');
    }
    
    // 3. 分析个性化学习建议
    async function analyzeLearningAdvice(studentData) {
        // 构建成绩信息
        let gradesInfo = '';
        studentData.grades.forEach((examGrades, index) => {
            const examName = examGrades.examName || `第${index + 1}次考试`;
            gradesInfo += `${examName}：\n`;
            for (const [subject, score] of Object.entries(examGrades)) {
                if (subject !== 'examName') {
                    gradesInfo += `  ${subject}：${score}分\n`;
                }
            }
        });
        
        // 添加年级特殊说明
        let gradeSpecialNote = '';
        if (studentData.grade === '六年级') {
            gradeSpecialNote = '注意：这是小学阶段的学生，只有语文、数学、英语三科。请重点关注小学阶段的学习特点和过渡到初中的准备。';
        } else if (studentData.grade === '九年级') {
            gradeSpecialNote = '注意：九年级化学满分是80分，其他科目满分与其他年级相同。请根据实际满分情况进行分析和建议。';
        }
        
        const prompt = `
        请根据以下学生信息，提出个性化的学习建议：
        
        学生姓名：${studentData.name}
        性别：${studentData.gender}
        年龄：${studentData.age}
        年级：${studentData.grade}
        考试次数：${studentData.examCount}次
        兴趣爱好：${studentData.hobbies || '无'}
        学习习惯：${studentData.studyHabits || '无'}
        其他补充信息：${studentData.otherInfo || '无'}
        成绩：
        ${gradesInfo}
        
        ${gradeSpecialNote}
        
        请按照以下格式输出建议：
        
        # 个性化学习方法和策略
        [结合学生的兴趣爱好和学习习惯的个性化学习方法和策略]
        
        # 学习计划和时间安排
        [具体的学习计划和时间安排建议]
        
        # 各学科学习技巧
        [针对各学科的学习技巧]
        
        注意：
        1. 请提供详细、完整的建议内容
        2. 不要使用星号(*)或其他特殊符号作为列表标记
        3. 使用自然的段落结构，不要使用Markdown格式
        4. 确保建议具体、实用，能够给家长和学生一个明确的指导
        `;
        
        return await callDeepSeekAPI(prompt, 'advice');
    }
    
    // 4. 分析补课方案
    async function analyzeTutoringPlan(studentData) {
        // 构建成绩信息
        let gradesInfo = '';
        studentData.grades.forEach((examGrades, index) => {
            const examName = examGrades.examName || `第${index + 1}次考试`;
            gradesInfo += `${examName}：\n`;
            for (const [subject, score] of Object.entries(examGrades)) {
                if (subject !== 'examName') {
                    gradesInfo += `  ${subject}：${score}分\n`;
                }
            }
        });
        
        // 添加年级特殊说明
        let gradeSpecialNote = '';
        if (studentData.grade === '六年级') {
            gradeSpecialNote = '注意：这是小学阶段的学生，只有语文、数学、英语三科的班课。请重点考虑小学阶段的补课特点和过渡到初中的准备。';
        } else if (studentData.grade === '九年级') {
            gradeSpecialNote = '注意：九年级化学满分是80分，其他科目满分与其他年级相同。请根据实际满分情况进行分析和补课方案推荐。';
        }
        
        const prompt = `
        请根据以下学生信息，提出具体的补课方案：
        
        学生姓名：${studentData.name}
        性别：${studentData.gender}
        年龄：${studentData.age}
        年级：${studentData.grade}
        考试次数：${studentData.examCount}次
        兴趣爱好：${studentData.hobbies || '无'}
        学习习惯：${studentData.studyHabits || '无'}
        其他补充信息：${studentData.otherInfo || '无'}
        成绩：
        ${gradesInfo}
        
        我们有以下班型：
        - 全科班课（12人小班课）
        - 小组课（4人）
        - 一对一
        - 晚辅导（辅导作业，周一到周五晚上）
        
        ${gradeSpecialNote}
        
        请按照以下格式输出补课方案：
        
        # 推荐班型
        [分析学生最适合的班型并推荐，优先推荐全科班课，如有明显短板可额外推荐一对一或小组课]
        
        # 补课内容
        [具体的补课内容建议]
        
        # 时间安排
        [具体的时间安排建议]
        
        注意：
        1. 请提供详细、完整的补课方案
        2. 不要使用星号(*)或其他特殊符号作为列表标记
        3. 使用自然的段落结构，不要使用Markdown格式
        4. 确保方案具体、实用，能够给家长一个明确的指导
        `;
        
        return await callDeepSeekAPI(prompt, 'tutoring');
    }
    
    // 5. 分析其他补充信息
    async function analyzeAdditionalInfo(studentData) {
        // 构建成绩信息
        let gradesInfo = '';
        studentData.grades.forEach((examGrades, index) => {
            const examName = examGrades.examName || `第${index + 1}次考试`;
            gradesInfo += `${examName}：\n`;
            for (const [subject, score] of Object.entries(examGrades)) {
                if (subject !== 'examName') {
                    gradesInfo += `  ${subject}：${score}分\n`;
                }
            }
        });
        
        // 添加年级特殊说明
        let gradeSpecialNote = '';
        if (studentData.grade === '六年级') {
            gradeSpecialNote = '注意：这是小学阶段的学生，只有语文、数学、英语三科。请重点关注小学到初中的过渡准备和长期学习规划。';
        } else if (studentData.grade === '九年级') {
            gradeSpecialNote = '注意：九年级化学满分是80分，其他科目满分与其他年级相同。请根据实际满分情况进行分析和建议。';
        }
        
        const prompt = `
        请根据以下学生信息，提供其他补充信息：
        
        学生姓名：${studentData.name}
        性别：${studentData.gender}
        年龄：${studentData.age}
        年级：${studentData.grade}
        考试次数：${studentData.examCount}次
        兴趣爱好：${studentData.hobbies || '无'}
        学习习惯：${studentData.studyHabits || '无'}
        其他补充信息：${studentData.otherInfo || '无'}
        成绩：
        ${gradesInfo}
        
        ${gradeSpecialNote}
        
        请按照以下格式输出补充信息：
        
        # 特殊情况建议
        [针对学生的特殊情况提供额外建议]
        
        # 家长注意事项
        [家长需要注意的事项]
        
        # 长期学习规划
        [长期学习规划建议]
        
        注意：
        1. 请提供详细、完整的补充信息
        2. 不要使用星号(*)或其他特殊符号作为列表标记
        3. 使用自然的段落结构，不要使用Markdown格式
        4. 确保信息全面、实用，能够给家长一个明确的指导
        `;
        
        return await callDeepSeekAPI(prompt, 'additional');
    }
    
    // 显示分析结果
    function displayResult(studentData, analysisResult) {
        resultContent.innerHTML = `
            <div class="student-info-card">
                <h4>学生信息</h4>
                <div class="info-grid">
                    <div class="info-item"><strong>姓名：</strong>${studentData.name}</div>
                    <div class="info-item"><strong>性别：</strong>${studentData.gender}</div>
                    <div class="info-item"><strong>年龄：</strong>${studentData.age}</div>
                    <div class="info-item"><strong>年级：</strong>${studentData.grade}</div>
                    <div class="info-item"><strong>考试次数：</strong>${studentData.examCount}次</div>
                    <div class="info-item"><strong>兴趣爱好：</strong>${studentData.hobbies || '无'}</div>
                    <div class="info-item"><strong>学习习惯：</strong>${studentData.studyHabits || '无'}</div>
                    <div class="info-item"><strong>其他补充信息：</strong>${studentData.otherInfo || '无'}</div>
                </div>
            </div>
            
            <div class="analysis-intro">
                <h4>分析报告</h4>
                <p>详细分析报告已生成，请查看下方的详细分析部分。</p>
            </div>
        `;
    }
    
    // 显示分析板块（带重新生成按钮）
    function displayAnalysisSection(title, content, color, sectionId) {
        if (!sectionId) {
            sectionId = generateSectionId(title);
        }
        const sectionElement = document.getElementById(sectionId);
        
        if (sectionElement) {
            // 替换符号为小表情，保留所有文字内容
            let cleanedContent = content;
            // 移除星号和其他特殊符号
            cleanedContent = cleanedContent.replace(/^\*+ /gm, '');
            cleanedContent = cleanedContent.replace(/^-+ /gm, '');
            
            // 处理标题
            cleanedContent = cleanedContent.replace(/^# (.*?)$/gm, '<h5 class="section-subtitle">$1</h5>');
            
            // 格式化内容
            cleanedContent = cleanedContent.replace(/\n/g, '<br>');
            
            // 分条显示（如果有列表）
            cleanedContent = cleanedContent.replace(/(\d+\. )/g, '</p><p class="advice-item">$1');
            
            sectionElement.className = 'analysis-section';
            sectionElement.style.borderLeftColor = getColorByType(color);
            
            // 确定应该使用哪个AI重新生成
            let aiType = 'kimi';
            if (title === '各学科的知识掌握情况' || title === '具体的补课方案') {
                aiType = 'kimi';
            }
            
            sectionElement.innerHTML = `
                <div class="section-header">
                    <h4>${title}</h4>
                    <button class="regenerate-btn" onclick="regenerateSection('${title}', '${aiType}', '${color}')">
                        🔄 重新生成
                    </button>
                </div>
                <div class="analysis-content">
                    <p>${cleanedContent}</p>
                </div>
            `;
        }
    }
    
    // 显示错误部分
    function displayErrorSection(title, error, sectionId) {
        if (!sectionId) {
            sectionId = generateSectionId(title);
        }
        const sectionElement = document.getElementById(sectionId);
        
        if (sectionElement) {
            let aiType = 'kimi';
            if (title === '各学科的知识掌握情况' || title === '具体的补课方案') {
                aiType = 'kimi';
            }
            
            sectionElement.className = 'analysis-section';
            sectionElement.style.borderLeftColor = '#e74c3c';
            sectionElement.innerHTML = `
                <div class="section-header">
                    <h4>${title}</h4>
                    <button class="regenerate-btn" onclick="regenerateSection('${title}', '${aiType}', '${title === '各学科的知识掌握情况' ? 'blue' : title === '个性化学习建议' ? 'green' : title === '具体的补课方案' ? 'orange' : 'purple'}')">
                        🔄 重新生成
                    </button>
                </div>
                <div class="analysis-content">
                    <p style="color: red;">生成失败: ${error}</p>
                </div>
            `;
        }
    }
    
    // 显示学科分析
    async function displaySubjectAnalysis(content, studentData, sectionId, title) {
        if (!sectionId) {
            sectionId = generateSectionId('各学科的知识掌握情况');
        }
        if (!title) {
            title = '各学科的知识掌握情况';
        }
        const sectionElement = document.getElementById(sectionId);
        
        if (sectionElement) {
            const expectedSubjects = subjectsByGrade[studentData.grade];
            let subjectsContent = '';
            
            console.log('开始解析各学科分析，原始内容长度:', content.length);
            console.log('前200字符:', content.substring(0, 200));
            
            // 方法1: 直接用 "学科：" 分割
            if (content.indexOf('学科：') !== -1) {
                let parts = content.split('学科：');
                for (let i = 1; i < parts.length; i++) {
                    let part = parts[i].trim();
                    let newlineIdx = part.indexOf('\n');
                    let subjectName = '';
                    let subjectContent = '';
                    
                    if (newlineIdx !== -1) {
                        subjectName = part.substring(0, newlineIdx).trim();
                        subjectContent = part.substring(newlineIdx).trim();
                    } else {
                        subjectName = part;
                        subjectContent = '';
                    }
                    
                    if (subjectName) {
                        subjectsContent += createSubjectCard(subjectName, subjectContent);
                    }
                }
            } 
            
            // 方法2: 如果没有找到，尝试按行找学科标题
            if (subjectsContent === '') {
                console.log('方法1失败，尝试方法2');
                let lines = content.split('\n');
                let currentSubject = null;
                let currentContent = '';
                
                for (let line of lines) {
                    line = line.trim();
                    if (!line) continue;
                    
                    let subjectMatch = null;
                    // 查找 "语文："
                    for (let subject of expectedSubjects) {
                        if (line.indexOf(subject + '：') === 0 || line.indexOf(subject + ':') === 0) {
                            subjectMatch = subject;
                            break;
                        }
                    }
                    
                    if (subjectMatch) {
                        if (currentSubject) {
                            subjectsContent += createSubjectCard(currentSubject, currentContent);
                        }
                        currentSubject = subjectMatch;
                        let cleanedLine = line.replace(currentSubject + '：', '').replace(currentSubject + ':', '');
                        currentContent = cleanedLine;
                    } else if (currentSubject) {
                        currentContent += '\n' + line;
                    }
                }
                
                if (currentSubject) {
                    subjectsContent += createSubjectCard(currentSubject, currentContent);
                }
            }
            
            // 方法3: 都失败了，直接用一个大卡片
            if (subjectsContent === '') {
                console.log('方法2也失败，使用方法3');
                subjectsContent = createSubjectCard('各学科分析', content);
            }
            
            console.log('最终生成的subjectsContent长度:', subjectsContent.length);
            
            sectionElement.className = 'analysis-section';
            sectionElement.style.borderLeftColor = getColorByType('blue');
            
            sectionElement.innerHTML = `
                <div class="section-header">
                    <h4>${title}</h4>
                    <button class="regenerate-btn" onclick="regenerateSection('${title}', 'deepseek', 'blue')">
                        🔄 重新生成
                    </button>
                </div>
                <div class="subjects-container">
                    ${subjectsContent}
                </div>
            `;
        }
    }
    
    // 创建学科卡片HTML - 简化版
    function createSubjectCard(subject, content) {
        let processedContent = content.trim();
        
        // 处理换行
        processedContent = processedContent.replace(/\n/g, '<br>');
        
        // 获取颜色
        let subjectColor = getSubjectColor(subject);
        
        return `
            <div class="subject-card" style="border-left: 5px solid ${subjectColor}; background-color: ${subjectColor}10;">
                <h5 class="subject-title">${subject}</h5>
                <div class="subject-analysis">${processedContent}</div>
            </div>
        `;
    }
    
    // 根据类型获取颜色
    function getColorByType(type) {
        const colorMap = {
            blue: '#4a6fa5',
            green: '#4a6f55',
            orange: '#e67e22',
            purple: '#8e44ad',
            red: '#e74c3c'
        };
        return colorMap[type] || '#4a6fa5';
    }
    
    // 根据学科获取颜色
    function getSubjectColor(subject) {
        const colorMap = {
            '语文': '#e74c3c',
            '数学': '#3498db',
            '英语': '#2ecc71',
            '物理': '#9b59b6',
            '化学': '#f39c12',
            '生物': '#1abc9c',
            '地理': '#34495e'
        };
        return colorMap[subject] || '#4a6fa5';
    }
    
    // 获取学科满分
    function getMaxScore(subject, grade) {
        if (grade === '六年级') {
            return 100;
        } else if (['语文', '数学', '英语'].includes(subject)) {
            return 120;
        } else if (['地理', '生物', '化学'].includes(subject)) {
            return 80;
        } else {
            return 100;
        }
    }
    
    // 生成所有图表
    function generateCharts(studentData) {
        // 检查Chart.js是否加载成功
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js未加载成功，无法生成图表');
            return;
        }
        
        // 计算每个科目的平均成绩
        const subjectScores = {};
        studentData.grades.forEach(examGrades => {
            for (const [subject, score] of Object.entries(examGrades)) {
                if (subject !== 'examName') {
                    if (!subjectScores[subject]) {
                        subjectScores[subject] = [];
                    }
                    subjectScores[subject].push(Number(score));
                }
            }
        });
        
        // 计算平均分和百分比
        const subjects = Object.keys(subjectScores);
        const avgScores = subjects.map(subject => {
            const scores = subjectScores[subject];
            const sum = scores.reduce((a, b) => a + b, 0);
            return Math.round(sum / scores.length);
        });
        
        // 计算百分比（相对于满分）
        const avgScoresPercent = subjects.map(subject => {
            const scores = subjectScores[subject];
            const sum = scores.reduce((a, b) => a + b, 0);
            const avg = sum / scores.length;
            const maxScore = getMaxScore(subject, studentData.grade);
            return Math.round((avg / maxScore) * 100);
        });
        
        // 确定雷达图的最大值（根据实际情况）
        let radarMax = 100;
        subjects.forEach(subject => {
            const max = getMaxScore(subject, studentData.grade);
            if (max > radarMax) radarMax = max;
        });
        // 向上取整到最近的10
        radarMax = Math.ceil(radarMax / 10) * 10;
        
        try {
            // 销毁旧图表
            if (radarChart) radarChart.destroy();
            if (barChart) barChart.destroy();
            if (lineChart) lineChart.destroy();
            
            // 生成雷达图（使用百分比）
            radarChart = new Chart(radarChartCanvas, {
                type: 'radar',
                data: {
                    labels: subjects,
                    datasets: [{
                        label: '平均成绩(%)',
                        data: avgScoresPercent,
                        backgroundColor: 'rgba(74, 111, 165, 0.2)',
                        borderColor: 'rgba(74, 111, 165, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(74, 111, 165, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(74, 111, 165, 1)'
                    }]
                },
                options: {
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            min: 0,
                            ticks: {
                                stepSize: 20,
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: '学科平均成绩雷达图(百分比)',
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });
            
            // 生成柱状图（原始分数）
            barChart = new Chart(barChartCanvas, {
                type: 'bar',
                data: {
                    labels: subjects,
                    datasets: [{
                        label: '平均成绩',
                        data: avgScores,
                        backgroundColor: subjects.map(subject => getSubjectColor(subject) + '80'),
                        borderColor: subjects.map(subject => getSubjectColor(subject)),
                        borderWidth: 2
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: radarMax
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: '学科平均成绩柱状图',
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });
            
            // 如果有多次考试，生成折线图
            if (studentData.grades.length > 1) {
                const trendCharts = document.getElementById('trendCharts');
                trendCharts.style.display = 'flex';
                
                const examNames = studentData.grades.map((g, i) => g.examName || `第${i+1}次考试`);
                const datasets = subjects.map(subject => ({
                    label: subject,
                    data: studentData.grades.map(g => Number(g[subject])),
                    borderColor: getSubjectColor(subject),
                    backgroundColor: getSubjectColor(subject) + '20',
                    tension: 0.3,
                    fill: false
                }));
                
                // 计算所有成绩的范围，自适应纵轴
                let allScores = [];
                studentData.grades.forEach(g => {
                    subjects.forEach(subject => {
                        allScores.push(Number(g[subject]));
                    });
                });
                
                const minScore = Math.min(...allScores);
                const maxScore = Math.max(...allScores);
                
                // 设置padding，让图表更美观
                const yMin = Math.max(0, minScore - 10);
                const yMax = Math.min(radarMax, maxScore + 10);
                
                lineChart = new Chart(lineChartCanvas, {
                    type: 'line',
                    data: {
                        labels: examNames,
                        datasets: datasets
                    },
                    options: {
                        plugins: {
                            title: {
                                display: true,
                                text: '各学科成绩变化趋势图',
                                font: {
                                    size: 16
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                min: yMin,
                                max: yMax,
                                ticks: {
                                    stepSize: Math.ceil((yMax - yMin) / 10)
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('图表生成失败:', error);
        }
    }
    
    // 显示详细分析报告
    function displayDetailedAnalysis(analysisResult, studentData) {
        const analysisSections = document.getElementById('analysisSections');
        analysisSections.innerHTML = '';
        
        // 替换符号为小表情，保留所有文字内容
        let cleanedResult = analysisResult;
        // 将星号列表替换为表情
        cleanedResult = cleanedResult.replace(/^\*+ /gm, '⭐ ');
        // 将减号列表替换为表情
        cleanedResult = cleanedResult.replace(/^-+ /gm, '✨ ');
        // 将井号标题替换为表情（如果有）
        cleanedResult = cleanedResult.replace(/^#+/gm, '📌 ');
        
        // 按照五个板块分割分析结果
        const sections = [
            { title: '整体学习情况评估', regex: /一、整体学习情况评估[\s\S]*?(?=二、|$)/ },
            { title: '各学科的知识掌握情况', regex: /二、各学科的知识掌握情况[\s\S]*?(?=三、|$)/ },
            { title: '个性化学习建议', regex: /三、个性化学习建议[\s\S]*?(?=四、|$)/ },
            { title: '具体的补课方案', regex: /四、具体的补课方案[\s\S]*?(?=五、|$)/ },
            { title: '其它补充信息', regex: /五、其它补充信息[\s\S]*/ }
        ];
        
        // 为每个部分创建板块
        sections.forEach(section => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'analysis-section';
            
            // 提取内容
            const match = cleanedResult.match(section.regex);
            let content = match ? match[0].trim() : '该部分内容未在分析报告中找到。';
            
            // 格式化内容
            content = content.replace(/\n/g, '<br>');
            
            // 特殊处理各学科的知识掌握情况
            if (section.title === '各学科的知识掌握情况') {
                // 尝试提取各个学科的分析
                const subjectRegex = /(语文|数学|英语|地理|生物|物理|化学)[\s\S]*?(?=(语文|数学|英语|地理|生物|物理|化学|$))/g;
                let subjectMatch;
                let subjectsContent = '';
                
                while ((subjectMatch = subjectRegex.exec(content)) !== null) {
                    const subjectAnalysis = subjectMatch[0].trim();
                    
                    subjectsContent += `
                        <div class="subject-card">
                            <div class="subject-analysis">${subjectAnalysis.replace(/\n/g, '<br>')}</div>
                        </div>
                    `;
                }
                
                if (subjectsContent) {
                    content = subjectsContent;
                }
            }
            
            sectionElement.innerHTML = `
                <h4>${section.title}</h4>
                <div class="analysis-content">${content}</div>
            `;
            analysisSections.appendChild(sectionElement);
        });
    }
    
    // 从分析结果中提取特定部分的内容
    function extractSectionContent(analysisResult, keywords) {
        // 简单的提取逻辑，实际应用中可能需要更复杂的处理
        const content = analysisResult.split('\n').filter(line => {
            return keywords.some(keyword => line.includes(keyword));
        }).join('\n');
        
        if (content) {
            return content;
        } else {
            return '该部分内容未在分析报告中找到。';
        }
    }
    
    // 导出Excel功能
    function exportToExcel() {
        // 获取存储的分析数据
        const analysisData = window.studentAnalysisData;
        if (!analysisData) {
            alert('请先完成分析，再进行导出');
            return;
        }
        
        const { studentData, analysisResults } = analysisData;
        
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 创建学生信息工作表
        const studentInfoData = [
            ['学生信息'],
            ['姓名', studentData.name],
            ['性别', studentData.gender],
            ['年龄', studentData.age],
            ['年级', studentData.grade],
            ['考试次数', studentData.examCount],
            ['兴趣爱好', studentData.hobbies || '无'],
            ['学习习惯', studentData.studyHabits || '无'],
            ['其他补充信息', studentData.otherInfo || '无']
        ];
        const studentInfoWs = XLSX.utils.aoa_to_sheet(studentInfoData);
        XLSX.utils.book_append_sheet(wb, studentInfoWs, '学生信息');
        
        // 创建成绩工作表
        if (studentData.grades.length > 0) {
            const subjects = Object.keys(studentData.grades[0]).filter(subject => subject !== 'examName');
            const gradesData = [['考试名称', ...subjects]];
            
            studentData.grades.forEach((examGrades, index) => {
                const examName = examGrades.examName || `第${index + 1}次考试`;
                const row = [examName];
                subjects.forEach(subject => {
                    row.push(examGrades[subject] || '');
                });
                gradesData.push(row);
            });
            
            const gradesWs = XLSX.utils.aoa_to_sheet(gradesData);
            XLSX.utils.book_append_sheet(wb, gradesWs, '成绩');
        }
        
        // 创建分析结果工作表
        const analysisDataArray = [['分析板块', '分析结果']];
        Object.entries(analysisResults).forEach(([section, content]) => {
            // 清理内容，移除HTML标签和特殊字符
            const cleanedContent = content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').substring(0, 32767); // Excel单元格最大字符数
            analysisDataArray.push([section, cleanedContent]);
        });
        const analysisWs = XLSX.utils.aoa_to_sheet(analysisDataArray);
        XLSX.utils.book_append_sheet(wb, analysisWs, '分析结果');
        
        // 生成Excel文件并下载
        const fileName = `${studentData.name || '学生'}_${studentData.grade || '未知年级'}_分析数据.xlsx`;
        XLSX.writeFile(wb, fileName);
    }
    
    // 为导出按钮添加点击事件监听器
    const exportExcelBtn = document.getElementById('exportExcel');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel);
    }
    
    // 为追加到已有Excel按钮添加点击事件监听器
    const appendToExcelBtn = document.getElementById('appendToExcel');
    const excelFileInput = document.getElementById('excelFile');
    
    if (appendToExcelBtn && excelFileInput) {
        appendToExcelBtn.addEventListener('click', function() {
            excelFileInput.click();
        });
        
        excelFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                appendDataToExcel(file);
            }
        });
    }
    
    // 追加数据到已有Excel文件
    function appendDataToExcel(file) {
        // 获取存储的分析数据
        const analysisData = window.studentAnalysisData;
        if (!analysisData) {
            alert('请先完成分析，再进行导出');
            return;
        }
        
        const { studentData, analysisResults } = analysisData;
        
        // 读取Excel文件
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                
                // 检查是否存在学生信息工作表
                let studentInfoWs = wb.Sheets['学生信息'];
                if (!studentInfoWs) {
                    // 如果不存在，创建新的学生信息工作表
                    const studentInfoData = [
                        ['学生信息'],
                        ['姓名', studentData.name],
                        ['性别', studentData.gender],
                        ['年龄', studentData.age],
                        ['年级', studentData.grade],
                        ['考试次数', studentData.examCount],
                        ['兴趣爱好', studentData.hobbies || '无'],
                        ['学习习惯', studentData.studyHabits || '无'],
                        ['其他补充信息', studentData.otherInfo || '无']
                    ];
                    studentInfoWs = XLSX.utils.aoa_to_sheet(studentInfoData);
                    XLSX.utils.book_append_sheet(wb, studentInfoWs, '学生信息');
                }
                
                // 检查是否存在成绩工作表
                let gradesWs = wb.Sheets['成绩'];
                if (!gradesWs) {
                    // 如果不存在，创建新的成绩工作表
                    if (studentData.grades.length > 0) {
                        const subjects = Object.keys(studentData.grades[0]).filter(subject => subject !== 'examName');
                        const gradesData = [['考试名称', ...subjects]];
                        
                        studentData.grades.forEach((examGrades, index) => {
                            const examName = examGrades.examName || `第${index + 1}次考试`;
                            const row = [examName];
                            subjects.forEach(subject => {
                                row.push(examGrades[subject] || '');
                            });
                            gradesData.push(row);
                        });
                        
                        gradesWs = XLSX.utils.aoa_to_sheet(gradesData);
                        XLSX.utils.book_append_sheet(wb, gradesWs, '成绩');
                    }
                } else {
                    // 如果存在，追加新数据
                    const existingData = XLSX.utils.sheet_to_json(gradesWs, { header: 1 });
                    if (existingData.length > 0) {
                        // 追加新的成绩数据
                        if (studentData.grades.length > 0) {
                            const subjects = Object.keys(studentData.grades[0]).filter(subject => subject !== 'examName');
                            
                            // 确保表头存在
                            if (existingData[0].length === 1 + subjects.length) {
                                studentData.grades.forEach((examGrades, index) => {
                                    const examName = examGrades.examName || `第${index + 1}次考试`;
                                    const row = [examName];
                                    subjects.forEach(subject => {
                                        row.push(examGrades[subject] || '');
                                    });
                                    existingData.push(row);
                                });
                                
                                // 更新工作表
                                gradesWs = XLSX.utils.aoa_to_sheet(existingData);
                                wb.Sheets['成绩'] = gradesWs;
                            }
                        }
                    }
                }
                
                // 检查是否存在分析结果工作表
                let analysisWs = wb.Sheets['分析结果'];
                if (!analysisWs) {
                    // 如果不存在，创建新的分析结果工作表
                    const analysisDataArray = [['分析板块', '分析结果']];
                    Object.entries(analysisResults).forEach(([section, content]) => {
                        const cleanedContent = content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').substring(0, 32767);
                        analysisDataArray.push([section, cleanedContent]);
                    });
                    analysisWs = XLSX.utils.aoa_to_sheet(analysisDataArray);
                    XLSX.utils.book_append_sheet(wb, analysisWs, '分析结果');
                } else {
                    // 如果存在，追加新的分析结果
                    const existingAnalysisData = XLSX.utils.sheet_to_json(analysisWs, { header: 1 });
                    if (existingAnalysisData.length > 0) {
                        // 添加分隔行
                        existingAnalysisData.push(['', '']);
                        existingAnalysisData.push(['--- 新的分析结果 ---', '']);
                        existingAnalysisData.push(['', '']);
                        
                        // 追加新的分析结果
                        Object.entries(analysisResults).forEach(([section, content]) => {
                            const cleanedContent = content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').substring(0, 32767);
                            existingAnalysisData.push([section, cleanedContent]);
                        });
                        
                        // 更新工作表
                        analysisWs = XLSX.utils.aoa_to_sheet(existingAnalysisData);
                        wb.Sheets['分析结果'] = analysisWs;
                    }
                }
                
                // 生成更新后的Excel文件并下载
                const fileName = `${studentData.name || '学生'}_${studentData.grade || '未知年级'}_分析数据.xlsx`;
                XLSX.writeFile(wb, fileName);
            } catch (error) {
                console.error('处理Excel文件时出错:', error);
                alert('处理Excel文件时出错，请确保选择的是有效的Excel文件。');
            }
        };
        
        reader.onerror = function() {
            alert('读取Excel文件时出错，请重试。');
        };
        
        reader.readAsArrayBuffer(file);
    }
    
    // === 新增：带AI选择的分析函数 ===
    
    // 1. 分析整体学习情况（可选择AI）
    async function analyzeOverallLearningWithAI(studentData, aiType) {
        let gradesInfo = '';
        studentData.grades.forEach((examGrades, index) => {
            const examName = examGrades.examName || `第${index + 1}次考试`;
            gradesInfo += `${examName}：\n`;
            for (const [subject, score] of Object.entries(examGrades)) {
                if (subject !== 'examName') {
                    gradesInfo += `  ${subject}：${score}分\n`;
                }
            }
        });
        
        let gradeSpecialNote = '';
        if (studentData.grade === '六年级') {
            gradeSpecialNote = '注意：这是小学阶段的学生，只有语文、数学、英语三科。请重点分析小学阶段的学习特点和过渡到初中的准备。';
        } else if (studentData.grade === '九年级') {
            gradeSpecialNote = '注意：九年级化学满分是80分，其他科目满分与其他年级相同。请根据实际满分情况进行分析。';
        }
        
        const prompt = `
            请根据以下学生信息，分析学生的整体学习情况：
            
            学生姓名：${studentData.name}
            性别：${studentData.gender}
            年龄：${studentData.age}
            年级：${studentData.grade}
            考试次数：${studentData.examCount}次
            兴趣爱好：${studentData.hobbies || '无'}
            学习习惯：${studentData.studyHabits || '无'}
            其他补充信息：${studentData.otherInfo || '无'}
            成绩：${gradesInfo}
            
            ${gradeSpecialNote}
            
            请按照以下格式输出分析结果：
            
            # 整体学习状况分析
            [整体学习状况的详细分析]
            
            # 成绩趋势分析
            [成绩趋势的详细分析]
            
            # 学习能力与潜力评估
            [学习能力与潜力的详细分析]
            
            重要要求：
            - 使用自然的段落结构，不要使用Markdown格式
            - 确保分析全面、详细，能够给家长一个明确的指导
            - 全部使用第三人称，称呼学生名字或"该生"
            - 严格使用中文输出，禁止出现任何英语单词或句子
        `;
        
        if (aiType === 'kimi') {
            return await callKimiAPI(prompt);
        } else {
            return await callDeepSeekAPI(prompt);
        }
    }
    
    // 2. 分析各学科知识掌握情况（可选择AI）
    async function analyzeSubjectsWithAI(studentData, aiType) {
        let gradesInfo = '';
        studentData.grades.forEach((examGrades, index) => {
            const examName = examGrades.examName || `第${index + 1}次考试`;
            gradesInfo += `${examName}：\n`;
            for (const [subject, score] of Object.entries(examGrades)) {
                if (subject !== 'examName') {
                    gradesInfo += `  ${subject}：${score}分\n`;
                }
            }
        });
        
        const subjects = subjectsByGrade[studentData.grade];
        const subjectsList = subjects.join('、');
        
        let gradeSpecialNote = '';
        if (studentData.grade === '六年级') {
            gradeSpecialNote = '注意：这是小学阶段的学生，只有语文、数学、英语三科。请重点分析小学阶段的学科特点和过渡到初中的准备。';
        } else if (studentData.grade === '九年级') {
            gradeSpecialNote = '注意：九年级化学满分是80分，其他科目满分与其他年级相同。请根据实际满分情况进行分析。';
        }
        
        const prompt = `
            请根据以下学生信息，分析学生的各学科知识掌握情况：
            
            学生姓名：${studentData.name}
            性别：${studentData.gender}
            年龄：${studentData.age}
            年级：${studentData.grade}
            考试次数：${studentData.examCount}次
            成绩：${gradesInfo}
            
            ${gradeSpecialNote}
            
            请严格按照以下格式输出每个学科的分析结果：
            
            学科：[学科名称]
            [该学科的详细分析，包括每次考试的表现和变化趋势、不足之处和发展趋势、学习水平评估]
            
            请对以下学科进行分析：${subjectsList}
            
            重要要求：
            - 每个学科必须单独分析，格式必须严格按照"学科：[学科名称]"开头
            - 请对每个学科进行详细、完整的分析
            - 使用自然的段落结构，不要使用Markdown格式
            - 确保分析全面、详细，能够给家长一个明确的指导
            - 全部使用第三人称，称呼学生名字或"该生"
            - 严格使用中文输出，禁止出现任何英语单词或句子
        `;
        
        if (aiType === 'kimi') {
            return await callKimiAPI(prompt);
        } else {
            return await callDeepSeekAPI(prompt);
        }
    }
    
    // 3. 分析个性化学习建议（可选择AI）
    async function analyzeLearningAdviceWithAI(studentData, aiType) {
        let gradesInfo = '';
        studentData.grades.forEach((examGrades, index) => {
            const examName = examGrades.examName || `第${index + 1}次考试`;
            gradesInfo += `${examName}：\n`;
            for (const [subject, score] of Object.entries(examGrades)) {
                if (subject !== 'examName') {
                    gradesInfo += `  ${subject}：${score}分\n`;
                }
            }
        });
        
        let gradeSpecialNote = '';
        if (studentData.grade === '六年级') {
            gradeSpecialNote = '注意：这是小学阶段的学生，只有语文、数学、英语三科。请重点关注小学阶段的学习特点和过渡到初中的准备。';
        } else if (studentData.grade === '九年级') {
            gradeSpecialNote = '注意：九年级化学满分是80分，其他科目满分与其他年级相同。请根据实际满分情况进行分析和建议。';
        }
        
        const prompt = `
            请根据以下学生信息，提出个性化的学习建议（给家长看的版本）：
            
            学生姓名：${studentData.name}
            性别：${studentData.gender}
            年龄：${studentData.age}
            年级：${studentData.grade}
            考试次数：${studentData.examCount}次
            兴趣爱好：${studentData.hobbies || '无'}
            学习习惯：${studentData.studyHabits || '无'}
            其他补充信息：${studentData.otherInfo || '无'}
            成绩：${gradesInfo}
            
            ${gradeSpecialNote}
            
            请按照以下格式输出建议：
            
            # 个性化学习方法和策略
            [结合学生的兴趣爱好和学习习惯的个性化学习方法和策略]
            
            # 学习计划和时间安排
            [具体的学习计划和时间安排建议]
            
            # 各学科学习技巧
            [针对各学科的学习技巧]
            
            重要要求：
            - 请提供详细、完整的建议内容
            - 使用自然的段落结构，不要使用Markdown格式
            - 确保建议具体、实用，能够给家长和学生一个明确的指导
            - 全部使用第三人称，称呼学生名字或"该生"
            - 严格使用中文输出，禁止出现任何英语单词或句子
        `;
        
        if (aiType === 'kimi') {
            return await callKimiAPI(prompt);
        } else {
            return await callDeepSeekAPI(prompt);
        }
    }
    
    // 4. 分析补课方案（可选择AI）
    async function analyzeTutoringPlanWithAI(studentData, aiType) {
        let gradesInfo = '';
        studentData.grades.forEach((examGrades, index) => {
            const examName = examGrades.examName || `第${index + 1}次考试`;
            gradesInfo += `${examName}：\n`;
            for (const [subject, score] of Object.entries(examGrades)) {
                if (subject !== 'examName') {
                    gradesInfo += `  ${subject}：${score}分\n`;
                }
            }
        });
        
        let gradeSpecialNote = '';
        if (studentData.grade === '六年级') {
            gradeSpecialNote = '注意：这是小学阶段的学生，只有语文、数学、英语三科的班课。请重点考虑小学阶段的补课特点和过渡到初中的准备。';
        } else if (studentData.grade === '九年级') {
            gradeSpecialNote = '注意：九年级化学满分是80分，其他科目满分与其他年级相同。请根据实际满分情况进行分析和补课方案推荐。';
        }
        
        const prompt = `
            请根据以下学生信息，提出具体的补课方案：
            
            学生姓名：${studentData.name}
            性别：${studentData.gender}
            年龄：${studentData.age}
            年级：${studentData.grade}
            考试次数：${studentData.examCount}次
            兴趣爱好：${studentData.hobbies || '无'}
            学习习惯：${studentData.studyHabits || '无'}
            其他补充信息：${studentData.otherInfo || '无'}
            成绩：${gradesInfo}
            
            我们有以下班型：
            - 全科班课（12人小班课）
            - 小组课（4人）
            - 一对一
            - 晚辅导（辅导作业，周一到周五晚上）
            
            ${gradeSpecialNote}
            
            请按照以下格式输出补课方案：
            
            # 推荐班型
            [分析学生最适合的班型并推荐，优先推荐全科班课，如有明显短板可额外推荐一对一或小组课]
            
            # 补课内容
            [具体的补课内容建议]
            
            # 时间安排
            [具体的时间安排建议]
            
            重要要求：
            - 请提供详细、完整的补课方案
            - 使用自然的段落结构，不要使用Markdown格式
            - 确保方案具体、实用，能够给家长一个明确的指导
            - 全部使用第三人称，称呼学生名字或"该生"
            - 严格使用中文输出，禁止出现任何英语单词或句子
        `;
        
        if (aiType === 'kimi') {
            return await callKimiAPI(prompt);
        } else {
            return await callDeepSeekAPI(prompt);
        }
    }
    
    // 5. 分析其他补充信息（可选择AI）
    async function analyzeAdditionalInfoWithAI(studentData, aiType) {
        let gradesInfo = '';
        studentData.grades.forEach((examGrades, index) => {
            const examName = examGrades.examName || `第${index + 1}次考试`;
            gradesInfo += `${examName}：\n`;
            for (const [subject, score] of Object.entries(examGrades)) {
                if (subject !== 'examName') {
                    gradesInfo += `  ${subject}：${score}分\n`;
                }
            }
        });
        
        let gradeSpecialNote = '';
        if (studentData.grade === '六年级') {
            gradeSpecialNote = '注意：这是小学阶段的学生，只有语文、数学、英语三科。请重点关注小学到初中的过渡准备和长期学习规划。';
        } else if (studentData.grade === '九年级') {
            gradeSpecialNote = '注意：九年级化学满分是80分，其他科目满分与其他年级相同。请根据实际满分情况进行分析和建议。';
        }
        
        const prompt = `
            请根据以下学生信息，提供其他补充信息：
            
            学生姓名：${studentData.name}
            性别：${studentData.gender}
            年龄：${studentData.age}
            年级：${studentData.grade}
            考试次数：${studentData.examCount}次
            兴趣爱好：${studentData.hobbies || '无'}
            学习习惯：${studentData.studyHabits || '无'}
            其他补充信息：${studentData.otherInfo || '无'}
            成绩：${gradesInfo}
            
            ${gradeSpecialNote}
            
            请按照以下格式输出补充信息：
            
            # 特殊情况建议
            [针对学生的特殊情况提供额外建议]
            
            # 家长注意事项
            [家长需要注意的事项]
            
            # 长期学习规划
            [长期学习规划建议]
            
            重要要求：
            - 请提供详细、完整的补充信息
            - 使用自然的段落结构，不要使用Markdown格式
            - 确保信息全面、实用，能够给家长一个明确的指导
            - 全部使用第三人称，称呼学生名字或"该生"
            - 严格使用中文输出，禁止出现任何英语单词或句子
        `;
        
        if (aiType === 'kimi') {
            return await callKimiAPI(prompt);
        } else {
            return await callDeepSeekAPI(prompt);
        }
    }
    
    // === 重新生成功能 ===
    async function regenerateSection(title, aiType, color) {
        if (!currentStudentData) {
            alert('请先生成分析报告！');
            return;
        }
        
        const sectionId = generateSectionId(title);
        const sectionElement = document.getElementById(sectionId);
        
        if (!sectionElement) {
            return;
        }
        
        showLoading(sectionId, `正在重新生成${title}，请稍候...`);
        
        try {
            let analysisResult;
            
            // 根据title选择AI类型
            if (title === '各学科的知识掌握情况') {
                aiType = 'deepseek';
            } else {
                aiType = 'kimi';
            }
            
            switch(title) {
                case '整体学习情况评估':
                    analysisResult = await analyzeOverallLearningWithAI(currentStudentData, aiType);
                    analysisResult = beautifyOutput(analysisResult);
                    displayAnalysisSection(title, analysisResult, color, sectionId);
                    break;
                case '各学科的知识掌握情况':
                    analysisResult = await analyzeSubjectsWithAI(currentStudentData, aiType);
                    // 各学科分析不应用beautifyOutput
                    await displaySubjectAnalysis(analysisResult, currentStudentData, sectionId, title);
                    break;
                case '个性化学习建议':
                    analysisResult = await analyzeLearningAdviceWithAI(currentStudentData, aiType);
                    analysisResult = beautifyOutput(analysisResult);
                    displayAnalysisSection(title, analysisResult, color, sectionId);
                    break;
                case '具体的补课方案':
                    analysisResult = await analyzeTutoringPlanWithAI(currentStudentData, aiType);
                    analysisResult = beautifyOutput(analysisResult);
                    displayAnalysisSection(title, analysisResult, color, sectionId);
                    break;
                case '其它补充信息':
                    analysisResult = await analyzeAdditionalInfoWithAI(currentStudentData, aiType);
                    analysisResult = beautifyOutput(analysisResult);
                    displayAnalysisSection(title, analysisResult, color, sectionId);
                    break;
            }
            
            // 更新全局分析结果
            if (window.studentAnalysisData && analysisResult) {
                window.studentAnalysisData.analysisResults[title] = analysisResult;
            }
            
        } catch (error) {
            console.error('重新生成失败:', error);
            displayErrorSection(title, error.message, sectionId);
        }
    }
    
    // 使regenerateSection全局可用
    window.regenerateSection = regenerateSection;
    
    // 美化输出的函数
    function beautifyOutput(text) {
        if (!text) return text;
        
        let result = text;
        
        // 第一步：彻底清理所有空行
        result = result.replace(/\r\n/g, '\n');
        result = result.replace(/\n\s*\n/g, '\n');
        result = result.replace(/\n{2,}/g, '\n');
        
        // 第二步：处理各级标题，添加表情
        // 处理#标题（一级标题）
        result = result.replace(/^# (.*?)$/gm, (match, title) => {
            return '<div class="beauty-title-1">📌 ' + title.trim() + '</div>';
        });
        
        // 处理##标题（二级标题）
        result = result.replace(/^## (.*?)$/gm, (match, title) => {
            return '<div class="beauty-title-2">✨ ' + title.trim() + '</div>';
        });
        
        // 处理星号标题（三级）
        result = result.replace(/\*\*\*(.*?)\*\*\*/g, (match, content) => {
            return '<span class="beauty-highlight-1">💡 ' + content.trim() + '</span>';
        });
        result = result.replace(/\*\*(.*?)\*\*/g, (match, content) => {
            return '<span class="beauty-highlight-2">🔹 ' + content.trim() + '</span>';
        });
        
        // 处理列表项
        result = result.replace(/^\- (.*?)$/gm, (match, item) => {
            return '<div class="beauty-list-item">• ' + item.trim() + '</div>';
        });
        result = result.replace(/^\d+\. (.*?)$/gm, (match, item) => {
            return '<div class="beauty-list-item-2">' + match + '</div>';
        });
        
        // 第三步：处理段落换行和格式化
        // 把单个换行变成段落
        result = result.replace(/([^\n])\n([^\n])/g, '$1</p><p>$2');
        result = result.replace(/^([^\n]+)$/gm, function(match, line) {
            if (line.includes('<div') || line.includes('<span') || line.includes('<h')) {
                return line;
            }
            if (line.trim().length > 0) {
                return '<p class="beauty-paragraph">' + line + '</p>';
            }
            return '';
        });
        
        return result;
    }
    
    // 问题反馈悬浮窗切换
    function toggleFeedback() {
        const popup = document.getElementById('feedbackPopup');
        if (popup) {
            popup.classList.toggle('show');
        }
    }
    
    // 使toggleFeedback全局可用
    window.toggleFeedback = toggleFeedback;
    
    // 点击页面其他地方关闭悬浮窗
    document.addEventListener('click', function(event) {
        const feedbackFloat = document.querySelector('.feedback-float');
        const feedbackPopup = document.getElementById('feedbackPopup');
        
        if (feedbackFloat && feedbackPopup && feedbackPopup.classList.contains('show')) {
            if (!feedbackFloat.contains(event.target)) {
                feedbackPopup.classList.remove('show');
            }
        }
    });
    
});