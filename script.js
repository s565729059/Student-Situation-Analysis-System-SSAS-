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
            grades: {}
        };
        
        // 收集成绩数据
        const subjects = subjectsByGrade[studentData.grade];
        subjects.forEach(subject => {
            studentData.grades[subject] = formData.get(subject);
        });
        
        try {
            // 调用DeepSeek API
            const analysisResult = await analyzeStudent(studentData);
            
            // 显示结果
            displayResult(studentData, analysisResult);
            
            // 生成雷达图
            generateRadarChart(studentData);
            
            // 显示结果区域
            resultSection.style.display = 'block';
        } catch (error) {
            console.error('分析失败:', error);
            resultContent.innerHTML = '<p style="color: red;">分析失败，请稍后重试。</p>';
            resultSection.style.display = 'block';
        } finally {
            // 清除超时计时器
            clearTimeout(timeoutId);
            // 隐藏等待动画
            loadingOverlay.style.display = 'none';
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
        成绩：${JSON.stringify(studentData.grades, null, 2)}
        
        分析方向：
        1. 学生的整体学习情况
        2. 各科的成绩，有没有短板
        3. 根据学生情况，推荐补课计划
        4. 整体内容要详细，给家长明确的指导
        5. 推荐全科班课为主，如果有明显短板，可以额外推荐一对一或者小组课（4人课）
        
        请提供详细的分析报告，包括：
        - 整体学习情况评估
        - 各科成绩分析
        - 存在的问题和不足
        - 具体的补课推荐方案
        - 学习建议
        `;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error('API调用失败');
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
    
    // 显示分析结果
    function displayResult(studentData, analysisResult) {
        resultContent.innerHTML = `
            <h4>学生信息</h4>
            <p><strong>姓名：</strong>${studentData.name}</p>
            <p><strong>性别：</strong>${studentData.gender}</p>
            <p><strong>年龄：</strong>${studentData.age}</p>
            <p><strong>年级：</strong>${studentData.grade}</p>
            
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
        const subjects = Object.keys(studentData.grades);
        const scores = Object.values(studentData.grades).map(Number);
        
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
    }
});