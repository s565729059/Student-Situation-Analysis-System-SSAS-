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
    
    // 年级切换事件
    gradeSelect.addEventListener('change', function() {
        const selectedGrade = this.value;
        gradesContainer.innerHTML = '<h3>成绩输入</h3>';
        
        if (selectedGrade) {
            const subjects = subjectsByGrade[selectedGrade];
            subjects.forEach(subject => {
                const maxScore = ['语文', '数学', '英语'].includes(subject) ? 120 : 100;
                const inputGroup = document.createElement('div');
                inputGroup.className = 'grade-input-group';
                inputGroup.innerHTML = `
                    <label for="${subject}">${subject}</label>
                    <input type="number" id="${subject}" name="${subject}" min="0" max="${maxScore}" required>
                `;
                gradesContainer.appendChild(inputGroup);
            });
        }
    });
    
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
            hobbies: formData.get('hobbies'),
            studyHabits: formData.get('studyHabits'),
            otherInfo: formData.get('otherInfo'),
            grades: {}
        };
        
        // 收集成绩数据
        console.log('studentData.grade:', studentData.grade);
        console.log('subjectsByGrade:', subjectsByGrade);
        console.log('subjectsByGrade[studentData.grade]:', subjectsByGrade[studentData.grade]);
        
        const subjects = subjectsByGrade[studentData.grade];
        if (subjects) {
            console.log('找到科目:', subjects);
            subjects.forEach(subject => {
                studentData.grades[subject] = formData.get(subject);
            });
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
        
        const prompt = `
        请根据以下学生信息进行详细分析：
        学生姓名：${studentData.name}
        性别：${studentData.gender}
        年龄：${studentData.age}
        年级：${studentData.grade}
        兴趣爱好：${studentData.hobbies || '无'}
        学习习惯：${studentData.studyHabits || '无'}
        其他补充信息：${studentData.otherInfo || '无'}
        成绩：${JSON.stringify(studentData.grades, null, 2)}
        
        分析方向：
        1. 学生的整体学习情况
        2. 各科的成绩，有没有短板
        3. 根据学生情况，推荐补课计划
        4. 整体内容要详细，给家长明确的指导
        5. 推荐全科班课为主，如果有明显短板，可以额外推荐一对一或者小组课（4人课）
        6. 结合学生的兴趣爱好和学习习惯，提供个性化的学习建议
        
        请提供详细的分析报告，包括：
        - 整体学习情况评估
        - 各科成绩分析
        - 存在的问题和不足
        - 具体的补课推荐方案
        - 结合兴趣爱好的个性化学习建议
        - 学习习惯的改进建议
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
            <p><strong>兴趣爱好：</strong>${studentData.hobbies || '无'}</p>
            <p><strong>学习习惯：</strong>${studentData.studyHabits || '无'}</p>
            <p><strong>其他补充信息：</strong>${studentData.otherInfo || '无'}</p>
            
            <h4>成绩情况</h4>
            <ul>
                ${Object.entries(studentData.grades).map(([subject, score]) => 
                    `<li><strong>${subject}：</strong>${score}分</li>`
                ).join('')}
            </ul>
            
            <h4>分析报告</h4>
            <div class="analysis-report">${analysisResult.replace(/\n/g, '<br>')}</div>
        `;
    }
    
    // 生成雷达图
    function generateRadarChart(studentData) {
        // 检查Chart.js是否加载成功
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js未加载成功，无法生成雷达图');
            return;
        }
        
        const subjects = Object.keys(studentData.grades);
        const scores = Object.values(studentData.grades).map(Number);
        
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
                        label: '成绩分布',
                        data: scores,
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
                            text: '学科成绩雷达图',
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
        
        // 分割分析结果为不同部分
        const sections = [
            { title: '整体学习情况评估', keywords: ['整体学习情况', '学习情况评估'] },
            { title: '存在的问题和不足', keywords: ['问题', '不足'] },
            { title: '具体的补课推荐方案', keywords: ['补课推荐', '推荐方案'] },
            { title: '个性化学习建议', keywords: ['学习建议', '个性化建议'] },
            { title: '学习习惯的改进建议', keywords: ['学习习惯', '改进建议'] }
        ];
        
        // 为每个部分创建板块
        sections.forEach(section => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'analysis-section';
            sectionElement.innerHTML = `
                <h4>${section.title}</h4>
                <p>${extractSectionContent(analysisResult, section.keywords)}</p>
            `;
            analysisSections.appendChild(sectionElement);
        });
        
        // 添加各科成绩分析板块
        const subjects = Object.keys(studentData.grades);
        if (subjects.length > 0) {
            const subjectAnalysisSection = document.createElement('div');
            subjectAnalysisSection.className = 'analysis-section';
            subjectAnalysisSection.innerHTML = '<h4>各科成绩分析</h4>';
            
            const subjectList = document.createElement('div');
            subjects.forEach(subject => {
                const subjectItem = document.createElement('div');
                subjectItem.style.marginBottom = '10px';
                subjectItem.innerHTML = `
                    <strong>${subject}：</strong>${studentData.grades[subject]}分
                `;
                subjectList.appendChild(subjectItem);
            });
            
            subjectAnalysisSection.appendChild(subjectList);
            analysisSections.appendChild(subjectAnalysisSection);
        }
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