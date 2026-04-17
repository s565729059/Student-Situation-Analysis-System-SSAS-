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
                examSection.innerHTML = `<h4>第${i}次考试</h4>`;
                
                subjects.forEach(subject => {
                    let maxScore;
                    if (['语文', '数学', '英语'].includes(subject)) {
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
        
        // 显示等待动画
        loadingOverlay.style.display = 'flex';
        const loadingText = loadingOverlay.querySelector('p');
        loadingText.textContent = '正在分析，请稍候...';
        
        // 设置20秒超时提示
        const timeoutId = setTimeout(() => {
            loadingText.textContent = 'AI正在深入分析，请耐心等待...';
        }, 20000);
        
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
                const examGrades = {};
                subjects.forEach(subject => {
                    examGrades[subject] = formData.get(`${subject}_${i}`);
                });
                studentData.grades.push(examGrades);
            }
        } else {
            console.error('未找到对应年级的科目:', studentData.grade);
            throw new Error('请选择有效的年级');
        }
        
        try {
            console.log('开始分析学生数据:', studentData);
            
            // 调用DeepSeek API
            console.log('开始调用DeepSeek API...');
            const analysisResult = await analyzeStudent(studentData);
            console.log('API分析结果获取成功');
            console.log('分析结果长度:', analysisResult.length);
            
            // 显示结果
            console.log('开始显示结果');
            try {
                displayResult(studentData, analysisResult);
                console.log('结果显示完成');
            } catch (displayError) {
                console.error('结果显示失败:', displayError);
                resultContent.innerHTML = `<p style="color: red;">结果显示失败，请稍后重试。</p>`;
            }
            
            // 生成雷达图
            try {
                console.log('开始生成雷达图');
                generateRadarChart(studentData);
                console.log('雷达图生成完成');
            } catch (chartError) {
                console.error('雷达图生成失败:', chartError);
                // 雷达图失败不影响结果显示
            }
            
            // 显示结果区域
            console.log('显示结果区域');
            resultSection.style.display = 'block';
            console.log('结果区域显示完成');
            
            // 显示详细分析报告
            console.log('显示详细分析报告');
            displayDetailedAnalysis(analysisResult, studentData);
            const detailedAnalysisSection = document.getElementById('detailedAnalysisSection');
            detailedAnalysisSection.style.display = 'block';
            console.log('详细分析报告显示完成');
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
        } finally {
            // 清除超时计时器
            clearTimeout(timeoutId);
            // 隐藏等待动画
            loadingOverlay.style.display = 'none';
            console.log('等待动画隐藏完成');
        }
    });
    
    // 调用DeepSeek API
    async function analyzeStudent(studentData) {
        const apiKey = 'sk-b91a4c7eee1642e19f0e6378464e9d2e';
        const url = 'https://api.deepseek.com/v1/chat/completions';
        
        // 构建成绩信息
        let gradesInfo = '';
        studentData.grades.forEach((examGrades, index) => {
            gradesInfo += `第${index + 1}次考试：\n`;
            for (const [subject, score] of Object.entries(examGrades)) {
                gradesInfo += `  ${subject}：${score}分\n`;
            }
        });
        
        const prompt = `
        请根据以下学生信息进行详细分析，并严格按照以下五个板块结构生成分析报告：
        
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
        
        请按照以下结构生成详细的分析报告：
        
        一、整体学习情况评估
        - 分析学生的整体学习状况
        - 重点分析多次考试的成绩趋势
        - 评估学生的学习能力和潜力
        
        二、各学科的知识掌握情况
        - 针对每个学科进行详细分析
        - 分析每次考试的表现和变化趋势
        - 找出各学科的不足之处和发展趋势
        - 评估各学科的学习水平
        
        三、个性化学习建议
        - 结合学生的兴趣爱好和学习习惯
        - 提供个性化的学习方法和策略
        - 给出具体的学习计划和时间安排建议
        
        四、具体的补课方案
        - 推荐全科班课为主
        - 如果有明显短板，额外推荐一对一或者小组课（4人课）
        - 提供具体的补课内容和时间安排建议
        
        五、其它补充信息
        - 针对学生的特殊情况提供额外建议
        - 家长需要注意的事项
        - 长期学习规划建议
        
        请确保分析报告详细、全面，能够给家长一个明确的指导。
        `;
        
        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-reasoner',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.7
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.error('API响应错误:', response.status, response.statusText);
                throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('API响应数据:', data);
            return data.choices[0].message.content;
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('API调用错误:', error);
            throw error;
        }
    }
    
    // 显示分析结果
    function displayResult(studentData, analysisResult) {
        resultContent.innerHTML = `
            <h4>学生信息</h4>
            <p><strong>姓名：</strong>${studentData.name}</p>
            <p><strong>性别：</strong>${studentData.gender}</p>
            <p><strong>年龄：</strong>${studentData.age}</p>
            <p><strong>年级：</strong>${studentData.grade}</p>
            <p><strong>考试次数：</strong>${studentData.examCount}次</p>
            <p><strong>兴趣爱好：</strong>${studentData.hobbies || '无'}</p>
            <p><strong>学习习惯：</strong>${studentData.studyHabits || '无'}</p>
            <p><strong>其他补充信息：</strong>${studentData.otherInfo || '无'}</p>
            
            <h4>分析报告</h4>
            <p>详细分析报告已生成，请查看下方的详细分析部分。</p>
        `;
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
});