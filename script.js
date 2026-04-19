document.addEventListener('DOMContentLoaded', function() {
    const gradeSelect = document.getElementById('grade');
    const gradesContainer = document.getElementById('gradesContainer');
    const studentForm = document.getElementById('studentForm');
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const radarChartCanvas = document.getElementById('radarChart');
    let radarChart = null;
    
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
                    } else if (['地理', '生物'].includes(subject)) {
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
            
            // 生成雷达图
            try {
                console.log('开始生成雷达图');
                generateRadarChart(studentData);
                console.log('雷达图生成完成');
            } catch (chartError) {
                console.error('雷达图生成失败:', chartError);
                // 雷达图失败不影响结果显示
            }
            
            // 分步骤分析
            const analysisSections = document.getElementById('analysisSections');
            analysisSections.innerHTML = '';
            
            // 存储分析结果
            const analysisResults = {};
            
            // 1. 整体学习情况评估
            console.log('开始分析整体学习情况');
            const overallSectionId = generateSectionId('整体学习情况评估');
            const overallSection = document.createElement('div');
            overallSection.id = overallSectionId;
            overallSection.className = 'analysis-section';
            analysisSections.appendChild(overallSection);
            showLoading(overallSectionId, '正在分析整体学习情况，请稍候...');
            const overallAnalysis = await analyzeOverallLearning(studentData);
            analysisResults['整体学习情况评估'] = overallAnalysis;
            displayAnalysisSection('整体学习情况评估', overallAnalysis, 'blue');
            
            // 2. 各学科知识掌握情况
            console.log('开始分析各学科知识掌握情况');
            const subjectSectionId = generateSectionId('各学科的知识掌握情况');
            const subjectSection = document.createElement('div');
            subjectSection.id = subjectSectionId;
            subjectSection.className = 'analysis-section';
            analysisSections.appendChild(subjectSection);
            showLoading(subjectSectionId, '正在分析各学科知识掌握情况，请稍候...');
            const subjectAnalysis = await analyzeSubjects(studentData);
            analysisResults['各学科的知识掌握情况'] = subjectAnalysis;
            await displaySubjectAnalysis(subjectAnalysis, studentData);
            
            // 3. 个性化学习建议
            console.log('开始分析个性化学习建议');
            const adviceSectionId = generateSectionId('个性化学习建议');
            const adviceSection = document.createElement('div');
            adviceSection.id = adviceSectionId;
            adviceSection.className = 'analysis-section';
            analysisSections.appendChild(adviceSection);
            showLoading(adviceSectionId, '正在生成个性化学习建议，请稍候...');
            const learningAdvice = await analyzeLearningAdvice(studentData);
            analysisResults['个性化学习建议'] = learningAdvice;
            displayAnalysisSection('个性化学习建议', learningAdvice, 'green');
            
            // 4. 补课方案
            console.log('开始分析补课方案');
            const tutoringSectionId = generateSectionId('具体的补课方案');
            const tutoringSection = document.createElement('div');
            tutoringSection.id = tutoringSectionId;
            tutoringSection.className = 'analysis-section';
            analysisSections.appendChild(tutoringSection);
            showLoading(tutoringSectionId, '正在生成补课方案，请稍候...');
            const tutoringPlan = await analyzeTutoringPlan(studentData);
            analysisResults['具体的补课方案'] = tutoringPlan;
            displayAnalysisSection('具体的补课方案', tutoringPlan, 'orange');
            
            // 5. 其他补充信息
            console.log('开始分析其他补充信息');
            const additionalSectionId = generateSectionId('其它补充信息');
            const additionalSection = document.createElement('div');
            additionalSection.id = additionalSectionId;
            additionalSection.className = 'analysis-section';
            analysisSections.appendChild(additionalSection);
            showLoading(additionalSectionId, '正在生成其他补充信息，请稍候...');
            const additionalInfo = await analyzeAdditionalInfo(studentData);
            analysisResults['其它补充信息'] = additionalInfo;
            displayAnalysisSection('其它补充信息', additionalInfo, 'purple');
            
            // 显示导出按钮
            document.getElementById('exportButtons').style.display = 'flex';
            
            // 保存分析结果到全局变量，供导出使用
            window.studentAnalysisData = {
                studentData: studentData,
                analysisResults: analysisResults
            };
            
        } catch (error) {
            console.error('分析失败:', error);
            console.error('错误类型:', error.name);
            console.error('错误堆栈:', error.stack);
            try {
                resultContent.innerHTML = `<p style="color: red;">分析失败，请稍后重试。错误信息：${error.message}</p>`;
                resultSection.style.display = 'block';
            } catch (displayError) {
                console.error('错误信息显示失败:', displayError);
            }
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
    
    // 通用API调用函数
    async function callDeepSeekAPI(prompt) {
        // 添加字数限制
        const limitedPrompt = prompt + '\n\n注意：请控制回答字数在500字以内，保持内容凝练、重点突出。';
        
        const apiKey = 'sk-b91a4c7eee1642e19f0e6378464e9d2e';
        const url = 'https://api.deepseek.com/v1/chat/completions';
        
        // 尝试不同的模型
        const models = ['deepseek-reasoner', 'deepseek-chat'];
        let lastError;
        
        for (const model of models) {
            console.log(`尝试使用模型: ${model}`);
            
            for (let attempt = 1; attempt <= 3; attempt++) { // 增加到3次尝试
                console.log(`第${attempt}次尝试`);
                
                try {
                    // 创建AbortController用于超时控制
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25秒超时
                    
                    console.log('发起API请求:', url);
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
                                    content: limitedPrompt
                                }
                            ],
                            max_tokens: 1000, // 限制输出令牌数
                            temperature: 0.7
                        }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    console.log('API请求成功，状态码:', response.status);
                    
                    if (!response.ok) {
                        console.error('API响应错误:', response.status, response.statusText);
                        throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    console.log('API响应数据:', data);
                    
                    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
                        throw new Error('API响应格式错误');
                    }
                    
                    console.log(`使用模型${model}成功获取分析结果`);
                    return data.choices[0].message.content;
                } catch (error) {
                    console.error(`API调用失败 (${model}, 尝试${attempt}):`, error);
                    lastError = error;
                    
                    // 如果是网络错误或超时错误，等待后重试
                    if (error.name === 'AbortError' || error.message === 'Failed to fetch') {
                        console.log('网络错误或超时，等待后重试...');
                        await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒
                    } else {
                        // 其他错误，切换模型
                        break;
                    }
                }
            }
        }
        
        // 所有尝试都失败
        throw lastError || new Error('所有模型调用都失败');
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
        1. 请控制回答字数在500字以内，保持内容凝练、重点突出
        2. 不要使用星号(*)或其他特殊符号作为列表标记
        3. 使用自然的段落结构，不要使用Markdown格式
        4. 确保分析全面、详细，能够给家长一个明确的指导
        `;
        
        return await callDeepSeekAPI(prompt);
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
        2. 请控制每个学科的分析字数在200字以内，保持内容凝练、重点突出
        3. 不要使用星号(*)或其他特殊符号作为列表标记
        4. 使用自然的段落结构，不要使用Markdown格式
        5. 确保分析全面、详细，能够给家长一个明确的指导
        `;
        
        return await callDeepSeekAPI(prompt);
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
        1. 请控制回答字数在500字以内，保持内容凝练、重点突出
        2. 不要使用星号(*)或其他特殊符号作为列表标记
        3. 使用自然的段落结构，不要使用Markdown格式
        4. 确保建议具体、实用，能够给家长和学生一个明确的指导
        `;
        
        return await callDeepSeekAPI(prompt);
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
        1. 请控制回答字数在500字以内，保持内容凝练、重点突出
        2. 不要使用星号(*)或其他特殊符号作为列表标记
        3. 使用自然的段落结构，不要使用Markdown格式
        4. 确保方案具体、实用，能够给家长一个明确的指导
        `;
        
        return await callDeepSeekAPI(prompt);
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
        1. 请控制回答字数在500字以内，保持内容凝练、重点突出
        2. 不要使用星号(*)或其他特殊符号作为列表标记
        3. 使用自然的段落结构，不要使用Markdown格式
        4. 确保信息全面、实用，能够给家长一个明确的指导
        `;
        
        return await callDeepSeekAPI(prompt);
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
    
    // 显示分析板块
    function displayAnalysisSection(title, content, color) {
        // 查找对应的section元素
        const sectionId = generateSectionId(title);
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
            
            sectionElement.innerHTML = `
                <h4>${title}</h4>
                <div class="analysis-content">
                    <p>${cleanedContent}</p>
                </div>
            `;
        }
    }
    
    // 显示学科分析
    async function displaySubjectAnalysis(content, studentData) {
        // 查找对应的section元素
        const sectionId = generateSectionId('各学科的知识掌握情况');
        const sectionElement = document.getElementById(sectionId);
        
        if (sectionElement) {
            // 替换符号为小表情，保留所有文字内容
            let cleanedContent = content;
            // 移除星号和其他特殊符号
            cleanedContent = cleanedContent.replace(/^\*+ /gm, '');
            cleanedContent = cleanedContent.replace(/^-+ /gm, '');
            
            // 尝试提取各个学科的分析
            const expectedSubjects = subjectsByGrade[studentData.grade];
            let subjectsContent = '';
            const foundSubjects = [];
            
            // 按学科分割内容
            const subjectRegex = /学科：([^\n]+)\n([\s\S]*?)(?=学科：|$)/g;
            let subjectMatch;
            
            while ((subjectMatch = subjectRegex.exec(cleanedContent)) !== null) {
                const subject = subjectMatch[1].trim();
                const subjectAnalysis = subjectMatch[2].trim();
                foundSubjects.push(subject);
                
                subjectsContent += `
                    <div class="subject-card" style="border-left-color: ${getSubjectColor(subject)}">
                        <h5 class="subject-title">${subject}</h5>
                        <div class="subject-analysis">${subjectAnalysis.replace(/\n/g, '<br>')}</div>
                    </div>
                `;
            }
            
            // 检查是否所有学科都有分析
            const missingSubjects = expectedSubjects.filter(subject => !foundSubjects.includes(subject));
            
            if (missingSubjects.length > 0) {
                // 如果有缺失的学科，重新调用AI生成
                console.log('发现缺失的学科分析:', missingSubjects);
                sectionElement.innerHTML = `
                    <h4>各学科的知识掌握情况</h4>
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <p>发现学科分析不完整，正在重新生成...</p>
                    </div>
                `;
                
                try {
                    // 重新生成学科分析
                    const newSubjectAnalysis = await analyzeSubjects(studentData);
                    // 递归调用显示函数
                    await displaySubjectAnalysis(newSubjectAnalysis, studentData);
                } catch (error) {
                    console.error('重新生成学科分析失败:', error);
                    sectionElement.innerHTML = `
                        <h4>各学科的知识掌握情况</h4>
                        <p style="color: red;">学科分析生成失败，请稍后重试。</p>
                    `;
                }
                return;
            }
            
            if (!subjectsContent) {
                subjectsContent = `<p>${cleanedContent}</p>`;
            }
            
            sectionElement.className = 'analysis-section';
            sectionElement.style.borderLeftColor = getColorByType('blue');
            
            sectionElement.innerHTML = `
                <h4>各学科的知识掌握情况</h4>
                <div class="subjects-container">
                    ${subjectsContent}
                </div>
            `;
        }
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
    
    // 生成雷达图
    function generateRadarChart(studentData) {
        // 检查Chart.js是否加载成功
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js未加载成功，无法生成雷达图');
            return;
        }
        
        // 计算每个科目的平均成绩
        const subjectScores = {};
        studentData.grades.forEach(examGrades => {
            for (const [subject, score] of Object.entries(examGrades)) {
                if (!subjectScores[subject]) {
                    subjectScores[subject] = [];
                }
                subjectScores[subject].push(Number(score));
            }
        });
        
        // 计算平均分
        const subjects = Object.keys(subjectScores);
        const avgScores = subjects.map(subject => {
            const scores = subjectScores[subject];
            const sum = scores.reduce((a, b) => a + b, 0);
            return Math.round(sum / scores.length);
        });
        
        try {
            // 销毁旧图表
            if (radarChart) {
                radarChart.destroy();
            }
            
            // 创建新图表
            radarChart = new Chart(radarChartCanvas, {
                type: 'radar',
                data: {
                    labels: subjects,
                    datasets: [{
                        label: '平均成绩分布',
                        data: avgScores,
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
                            max: 120,
                            ticks: {
                                stepSize: 20
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: '学科平均成绩雷达图',
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('雷达图生成失败:', error);
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
});