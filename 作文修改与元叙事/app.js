const STORAGE_KEYS = {
    COINS: 'story_platform_coins',
    UNLOCKED_THEMES: 'story_platform_unlocked',
    UNLOCKED_COUNT: 'story_platform_unlocked_count'
};

const state = {
    coins: 0,
    unlockedThemes: ['soldier', 'craftsman', 'parent', 'teacher'],
    currentStory: null,
    storyHistory: [],
    currentNode: null,
    currentTopic: '',
    quizCompleted: false,
    splashDismissed: false,
    expandedCategory: null
};

const DEEPSEEK_API_KEY = localStorage.getItem('ssas_deepseek_api_key') || 'sk-121c4affea774470b3f74231b3a47b53';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const BASE_UNLOCK_COST = 50;

const categories = [
    {
        id: 'reality',
        name: '现实成长',
        icon: 'fa-heart',
        themes: ['soldier', 'craftsman', 'parent', 'teacher', 'doctor', 'student']
    },
    {
        id: 'scifi',
        name: '科幻奇幻',
        icon: 'fa-rocket',
        themes: ['scifi', 'fantasy', 'timetravel', 'cyber']
    },
    {
        id: 'mystery',
        name: '悬疑冒险',
        icon: 'fa-search',
        themes: ['detective', 'history', 'island', 'treasure']
    },
    {
        id: 'nature',
        name: '自然温情',
        icon: 'fa-leaf',
        themes: ['nature', 'animal', 'ocean', 'mountain']
    }
];

const WRITER_RULES = `你是故事创作者，必须严格遵守以下文学创作规则：
1. 语言要自然凝练，富有文学气息，符合主题特色和艺术品位，绝不要有AI味（不要堆砌华丽辞藻、不要过度使用排比、不要生硬说教）。
2. 尊重剧情自身的节奏，该结束就结束，不必拖沓水字数。故事自然收束，约15回合左右，但不必死守15回合。
3. 结局必须升华，传递积极正能量的价值观，但升华要水到渠成，不要突兀。
4. 如果自然地运用了修辞手法（比喻、拟人、排比、对比、象征、通感等）或其他巧妙手法，请将运用了修辞的整句话用【】包裹并在末尾用|标注手法名，例如：【月光如银纱般洒落|比喻】。不必强行堆砌修辞，只在恰当处自然使用。
5. 每段故事200-300字，语言精炼，有画面感和代入感。`;

const storyThemes = {
    soldier: {
        name: '士兵的抉择',
        theme: '成长 · 责任 · 友情',
        icon: 'fa-shield',
        color: 'from-red-400 to-red-600',
        desc: '从普通士兵到英雄的成长之路。在战友情谊、家国责任中感悟成长的真谛。',
        difficulty: 2,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于年轻士兵成长的互动故事。主题是：军营生活、战友情谊、责任担当、成长蜕变。故事要感人至深，贴近现实，适合初中生阅读理解。'
    },
    craftsman: {
        name: '匠人匠心',
        theme: '传承 · 坚守 · 匠心',
        icon: 'fa-wrench',
        color: 'from-amber-400 to-orange-600',
        desc: '在快节奏的时代中，一位年轻手工艺人对传统技艺的坚守与传承，谱写匠心精神。',
        difficulty: 2,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于传统手工艺人坚守与传承的互动故事。主题是：工匠精神、文化传承、坚守与创新、平凡中的伟大。故事要细腻感人，展现手工艺人的匠心精神。'
    },
    parent: {
        name: '父母的背影',
        theme: '亲情 · 成长 · 感恩',
        icon: 'fa-home',
        color: 'from-pink-400 to-rose-600',
        desc: '从叛逆到理解，在平凡日常中感悟父母深沉的爱与付出，读懂成长的真谛。',
        difficulty: 1,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于父母亲情的互动成长故事。主题是：理解父母、感恩付出、亲情温暖、成长蜕变。故事要贴近生活，情感真挚，能引起初中生的共鸣。'
    },
    teacher: {
        name: '讲台春秋',
        theme: '奉献 · 希望 · 传承',
        icon: 'fa-graduation-cap',
        color: 'from-blue-400 to-indigo-600',
        desc: '一位乡村教师用知识改变命运，用爱心点亮希望的感人故事，展现师者仁心。',
        difficulty: 2,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于乡村教师的感人互动故事。主题是：教育奉献、点亮希望、师生情谊、知识改变命运。故事要展现教师的伟大与学生的成长。'
    },
    doctor: {
        name: '白衣执甲',
        theme: '责任 · 生命 · 担当',
        icon: 'fa-user-md',
        color: 'from-emerald-400 to-teal-600',
        desc: '在生死考验面前，一位年轻医生的成长与担当，感悟生命的意义与价值。',
        difficulty: 3,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于年轻医生成长与担当的互动故事。主题是：医者仁心、生命意义、责任担当、职业成长。故事要展现医护人员的坚守与生命的珍贵。'
    },
    student: {
        name: '青春答卷',
        theme: '奋斗 · 青春 · 梦想',
        icon: 'fa-book',
        color: 'from-violet-400 to-purple-600',
        desc: '面对中考压力，在友情、梦想与现实中找到属于自己的答案，书写青春华章。',
        difficulty: 2,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于中考奋斗的青春成长故事。主题是：青春奋斗、友情梦想、压力与成长、自我超越。故事要真实贴近初中生的学习生活，激励人心。'
    },
    scifi: {
        name: '星际迷途',
        theme: '勇气 · 智慧 · 希望',
        icon: 'fa-rocket',
        color: 'from-cyan-400 to-blue-600',
        desc: '一艘宇宙飞船遭遇意外，年轻的领航员必须带领船员穿越星际，找到回家的路。',
        difficulty: 3,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于太空冒险的科幻互动故事。主题是：勇气、智慧、希望、团队合作。故事要充满想象力，展现人类探索未知的勇气与决心，适合初中生阅读。'
    },
    fantasy: {
        name: '魔法奇缘',
        theme: '冒险 · 友谊 · 成长',
        icon: 'fa-magic',
        color: 'from-fuchsia-400 to-pink-600',
        desc: '一个普通少年意外发现自己拥有魔法能力，进入神秘魔法学院开启奇幻冒险。',
        difficulty: 3,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于魔法世界的奇幻互动故事。主题是：冒险、友谊、成长、自我发现。故事要充满奇幻色彩，讲述一个普通少年在魔法世界的成长历程。'
    },
    timetravel: {
        name: '时光旅人',
        theme: '历史 · 改变 · 成长',
        icon: 'fa-clock-o',
        color: 'from-teal-400 to-cyan-600',
        desc: '意外获得穿越时空的能力，少年游走于历史长河之间，见证文明的兴衰与人性的光辉。',
        difficulty: 4,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于时间旅行的科幻互动故事。主题是：历史、改变、成长、责任。故事要展现历史的厚重与人性的光辉，引导读者思考时间与命运的关系。'
    },
    cyber: {
        name: '赛博纪元',
        theme: '科技 · 人性 · 未来',
        icon: 'fa-android',
        color: 'from-blue-400 to-indigo-700',
        desc: '在人工智能高度发达的未来，一个普通少年发现了隐藏在虚拟世界背后的真相。',
        difficulty: 4,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于赛博朋克世界的科幻互动故事。主题是：科技、人性、未来、自我意识。故事要探讨人工智能与人类的关系，引发对科技伦理的思考。'
    },
    detective: {
        name: '迷雾真相',
        theme: '逻辑 · 勇气 · 正义',
        icon: 'fa-search',
        color: 'from-slate-500 to-gray-800',
        desc: '小镇发生神秘事件，少年侦探凭借敏锐的观察力和逻辑思维，一步步揭开真相。',
        difficulty: 3,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个悬疑推理的互动故事。主题是：逻辑、勇气、正义、真相。故事要充满悬念，展现少年侦探如何运用智慧揭开谜团。'
    },
    history: {
        name: '时光印记',
        theme: '历史 · 勇气 · 传承',
        icon: 'fa-hourglass',
        color: 'from-yellow-600 to-amber-800',
        desc: '一次博物馆奇遇，少年穿越时空，亲历历史事件，与古人对话，见证文明的传承。',
        difficulty: 3,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于历史穿越的互动故事。主题是：历史、勇气、传承、文化自信。故事要让读者在历史长河中感受文明的魅力，培养民族自豪感。'
    },
    island: {
        name: '神秘岛',
        theme: '生存 · 探索 · 成长',
        icon: 'fa-anchor',
        color: 'from-blue-500 to-teal-700',
        desc: '一次海难让几个少年流落荒岛，他们必须团结合作，才能生存并找到回家的路。',
        difficulty: 4,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于荒岛生存的冒险互动故事。主题是：生存、探索、成长、团队合作。故事要展现人类面对自然的勇气与智慧，培养团队协作精神。'
    },
    treasure: {
        name: '宝藏猎人',
        theme: '冒险 · 友情 · 智慧',
        icon: 'fa-map',
        color: 'from-amber-500 to-yellow-700',
        desc: '一张古老地图，一段家族秘史，少年们踏上寻宝之旅，最终发现比金钱更珍贵的东西。',
        difficulty: 4,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于寻宝冒险的互动故事。主题是：冒险、友情、智慧、成长。故事要充满探险元素，展现友情的力量和成长的意义。'
    },
    nature: {
        name: '自然之声',
        theme: '自然 · 成长 · 责任',
        icon: 'fa-tree',
        color: 'from-green-400 to-emerald-600',
        desc: '一个孩子与自然的不解之缘，在大自然中学会尊重生命、保护环境的真谛。',
        difficulty: 2,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于自然与环保的互动故事。主题是：自然、成长、责任、尊重生命。故事要展现人与自然的和谐共处，培养环保意识和对生命的敬畏。'
    },
    animal: {
        name: '灵犬奇缘',
        theme: '温情 · 陪伴 · 成长',
        icon: 'fa-paw',
        color: 'from-orange-400 to-red-500',
        desc: '一只流浪狗与孤独少年的相遇，彼此陪伴成长，谱写人与动物之间温暖的故事。',
        difficulty: 2,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于人与动物的温情互动故事。主题是：温情、陪伴、成长、信任。故事要展现人与动物之间纯真的情感，培养爱心与责任感。'
    },
    ocean: {
        name: '深海探秘',
        theme: '海洋 · 勇气 · 探索',
        icon: 'fa-tint',
        color: 'from-blue-400 to-indigo-600',
        desc: '一次海洋探险之旅，少年潜水员深入海底世界，发现了隐藏在深海中的秘密与奇迹。',
        difficulty: 4,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于深海探险的互动故事。主题是：海洋、勇气、探索、环保。故事要展现海洋的神秘与美丽，培养海洋保护意识。'
    },
    mountain: {
        name: '山巅之路',
        theme: '坚持 · 挑战 · 超越',
        icon: 'fa-sun-o',
        color: 'from-orange-400 to-red-600',
        desc: '为了完成与父亲的约定，少年踏上了攀登雪山的旅程，在挑战极限中完成自我超越。',
        difficulty: 4,
        systemPrompt: WRITER_RULES + '\n\n你正在创作一个关于登山挑战的互动故事。主题是：坚持、挑战、超越自我、亲情。故事要展现面对困难永不放弃的精神，以及亲情给予的力量。'
    }
};

function calculateUnlockCost(themeId) {
    const unlockedCount = state.unlockedThemes.length;
    const baseCost = storyThemes[themeId]?.cost || BASE_UNLOCK_COST;
    const difficulty = storyThemes[themeId]?.difficulty || 2;
    return baseCost + (unlockedCount - 4) * 15 + difficulty * 10;
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEYS.COINS, state.coins.toString());
        localStorage.setItem(STORAGE_KEYS.UNLOCKED_THEMES, JSON.stringify(state.unlockedThemes));
    } catch (e) {
        console.error('保存数据失败:', e);
    }
}

function loadData() {
    try {
        const savedCoins = localStorage.getItem(STORAGE_KEYS.COINS);
        const savedThemes = localStorage.getItem(STORAGE_KEYS.UNLOCKED_THEMES);
        
        if (savedCoins) {
            state.coins = parseInt(savedCoins) || 0;
        }
        if (savedThemes) {
            state.unlockedThemes = JSON.parse(savedThemes);
        }
    } catch (e) {
        console.error('加载数据失败:', e);
    }
}

function isThemeUnlocked(themeId) {
    return state.unlockedThemes.includes(themeId);
}

function unlockTheme(themeId) {
    const theme = storyThemes[themeId];
    const cost = calculateUnlockCost(themeId);
    
    if (state.coins < cost) {
        showToast(`金币不足！需要 ${cost} 金币，当前只有 ${state.coins} 金币`, 'warning');
        return false;
    }
    
    state.coins -= cost;
    state.unlockedThemes.push(themeId);
    saveData();
    updateCoinDisplay();
    renderCategories();
    showToast(`成功解锁《${theme.name}》！`, 'success');
    return true;
}

function toggleCategory(categoryId) {
    if (state.expandedCategory === categoryId) {
        state.expandedCategory = null;
    } else {
        state.expandedCategory = categoryId;
    }
    renderCategories();
}

async function getAIAnswerScore(quiz, answer) {
    const systemPrompt = '快速评分助手，仅输出0-100的分数数字';
    const fillPrompt = `题目：${quiz.question}
参考答案：${quiz.correct}
学生回答：${answer}
仅输出分数数字，不要任何解释。`;

    const comprehensionPrompt = `题目：${quiz.question}
故事理解题，学生回答：${answer}
根据回答的准确性、完整性和深度，仅输出0-100的分数数字。`;

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
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: quiz.type === 'fill' ? fillPrompt : comprehensionPrompt }
                ],
                temperature: 0.1,
                max_tokens: 5,
                stream: false
            })
        });

        const data = await response.json();
        const scoreText = data.choices[0].message.content.trim();
        const scoreMatch = scoreText.match(/(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
        return Math.min(100, Math.max(0, score));
    } catch (e) {
        console.error('AI快速评分失败:', e);
        return 50;
    }
}

async function calculateQuizReward(quiz, answer) {
    const baseReward = Math.floor(Math.random() * 4) + 2;
    const difficultyBonus = (quiz.difficulty || 1) * 1;
    
    if (quiz.type === 'choice') {
        const isCorrect = answer === quiz.correct;
        if (isCorrect) {
            return baseReward + difficultyBonus;
        } else {
            return -Math.floor(baseReward / 2);
        }
    } else if (quiz.type === 'fill' || quiz.type === 'comprehension') {
        const score = await getAIAnswerScore(quiz, answer);
        if (score >= 85) {
            return baseReward + difficultyBonus + 3;
        } else if (score >= 70) {
            return baseReward + difficultyBonus + 1;
        } else if (score >= 55) {
            return Math.floor(baseReward / 2) + 1;
        } else if (score >= 40) {
            return Math.floor(baseReward / 2);
        } else {
            return -1;
        }
    }
    return baseReward;
}

function initializeSplashParticles() {
    const container = document.getElementById('splash-particles');
    if (!container) return;
    
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute rounded-full opacity-15';
        particle.style.cssText = `
            width: ${Math.random() * 8 + 4}px;
            height: ${Math.random() * 8 + 4}px;
            background: ${['#6366f1', '#8b5cf6', '#a855f7', '#00d4ff'][Math.floor(Math.random() * 4)]};
            left: ${Math.random() * 100}%;
            bottom: ${Math.random() * 30}%;
            animation: particleRise ${Math.random() * 4 + 5}s ease-out infinite;
            animation-delay: ${Math.random() * 3}s;
        `;
        container.appendChild(particle);
    }
}

function dismissSplash() {
    if (state.splashDismissed) return;
    state.splashDismissed = true;
    
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.style.opacity = '0';
        splash.style.transform = 'scale(1.1)';
        setTimeout(() => splash.remove(), 500);
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa ${icons[type]}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateCoinDisplay() {
    const coinCount = document.getElementById('coin-count');
    if (coinCount) {
        coinCount.textContent = state.coins;
    }
}

function addCoins(amount, reason = '') {
    state.coins += amount;
    if (state.coins < 0) state.coins = 0;
    saveData();
    updateCoinDisplay();
    if (reason) {
        if (amount > 0) {
            showToast(`+${amount} 金币：${reason}`, 'success');
        } else if (amount < 0) {
            showToast(`${amount} 金币：${reason}`, 'warning');
        }
    }
}

function switchTab(tabName) {
    const metaverseNav = document.getElementById('nav-metaverse');
    const assistantNav = document.getElementById('nav-assistant');
    const metaverseSection = document.getElementById('metaverse-section');
    const assistantSection = document.getElementById('assistant-section');
    
    const activeClass = 'px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all';
    const inactiveClass = 'px-6 py-3 rounded-xl bg-white text-gray-600 font-medium hover:bg-gray-50 transition-all border border-gray-200';
    
    if (tabName === 'metaverse') {
        metaverseNav.className = activeClass;
        assistantNav.className = inactiveClass;
        metaverseSection.classList.remove('hidden');
        assistantSection.classList.add('hidden');
    } else {
        assistantNav.className = activeClass;
        metaverseNav.className = inactiveClass;
        assistantSection.classList.remove('hidden');
        metaverseSection.classList.add('hidden');
    }
}

async function callDeepSeekAPI(systemPrompt, userMessage, options = {}) {
    const { temperature = 0.7, maxTokens = 2048, stream = false, outputElement = null } = options;
    
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
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: temperature,
                max_tokens: maxTokens,
                stream: stream
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API请求失败: HTTP ${response.status}`);
        }

        if (stream && outputElement) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';
            outputElement.innerHTML = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        
                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta?.content;
                            if (delta) {
                                fullContent += delta;
                                outputElement.innerHTML = formatMarkdown(fullContent);
                            }
                        } catch (e) {}
                    }
                }
            }
            
            return fullContent;
        } else {
            const data = await response.json();
            return data.choices[0].message.content;
        }
    } catch (error) {
        console.error('DeepSeek API调用失败:', error);
        showToast('API调用失败: ' + error.message, 'error');
        throw error;
    }
}

function formatMarkdown(text) {
    return text
        .replace(/【([^|】]+)\|([^】]+)】/g, '<span class="rhetoric">$1</span><sup class="rhetoric-tag">$2</sup>')
        .replace(/【([^】]+)】/g, '<span class="rhetoric">$1</span>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^###\s+(.*)/gm, '<h4 class="font-bold text-gray-800 mt-4 mb-2">$1</h4>')
        .replace(/^##\s+(.*)/gm, '<h3 class="font-bold text-lg text-gray-800 mt-4 mb-2">$1</h3>')
        .replace(/^#\s+(.*)/gm, '<h2 class="font-bold text-xl text-gray-800 mt-4 mb-2">$1</h2>')
        .replace(/^-\s+(.*)/gm, '<li class="ml-4 mb-1">$1</li>')
        .replace(/^(\d+)\.\s+(.*)/gm, '<li class="ml-4 mb-1">$1. $2</li>')
        .replace(/\n\n/g, '</p><p class="mb-2">')
        .replace(/\n/g, '<br>');
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center mb-10">
            <h2 class="text-3xl font-bold text-gray-800 mb-4">选择你的故事世界，开启文字创作之旅</h2>
            <p class="text-gray-500 max-w-2xl mx-auto text-lg">每个故事都是一次独特的文学探索。通过选择和阅读理解，在互动中学习写作技巧，提升创作能力。</p>
        </div>
    ` + categories.map((category, index) => {
        const isExpanded = state.expandedCategory === category.id;
        const themes = category.themes.map(id => ({ id, ...storyThemes[id] }));
        const firstTheme = themes[0];
        
        return `
            <div class="category-card mb-6 ${isExpanded ? 'expanded' : ''}" data-category="${category.id}">
                <div class="category-header rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
                     onclick="toggleCategory('${category.id}')">
                    <div class="bg-gradient-to-br ${firstTheme.color} p-5" style="opacity: 0.9;">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                                <i class="fa ${category.icon} text-white text-2xl"></i>
                            </div>
                            <div class="text-white flex-1">
                                <h3 class="text-lg font-bold mb-0.5">${category.name}</h3>
                                <p class="text-white/80 text-sm">${themes.length} 个故事主题</p>
                            </div>
                            <i class="fa fa-chevron-down text-white text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}"></i>
                        </div>
                    </div>
                </div>
                
                <div class="category-content overflow-hidden transition-all duration-700 ease-in-out ${isExpanded ? 'max-h-[3000px] mt-4' : 'max-h-0'}">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${themes.map((theme, i) => {
                            const isUnlocked = isThemeUnlocked(theme.id);
                            const cost = calculateUnlockCost(theme.id);
                            return `
                                <div class="bg-white rounded-xl border-2 transition-all duration-400 cursor-pointer group hover:-translate-y-1
                                            ${isUnlocked ? 'border-indigo-100 hover:border-indigo-300 hover:shadow-xl' : 'border-gray-100 hover:border-gray-200 hover:shadow-lg'}"
                                     onclick="${isUnlocked ? `startStory('${theme.id}')` : ''}">
                                    <div class="p-4">
                                        <div class="flex items-start justify-between mb-3">
                                            <div class="w-12 h-12 rounded-lg bg-gradient-to-br ${theme.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${!isUnlocked ? 'grayscale opacity-60' : ''}">
                                                <i class="fa ${theme.icon} text-white text-xl"></i>
                                            </div>
                                            ${!isUnlocked ? `<span class="px-2 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1">
                                                <i class="fa fa-lock"></i>${cost}币
                                            </span>` : `<span class="px-2 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
                                                <i class="fa fa-unlock-alt"></i>可进入
                                            </span>`}
                                        </div>
                                        
                                        <h4 class="font-bold text-gray-800 text-base mb-1">${theme.name}</h4>
                                        <p class="text-xs text-indigo-600 font-medium mb-2">${theme.theme}</p>
                                        <p class="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">${theme.desc}</p>
                                        
                                        <div class="flex items-center gap-1 mb-3">
                                            <span class="text-xs text-gray-400 mr-1">难度</span>
                                            ${Array(5).fill(0).map((_, j) => `<span class="text-sm ${j < theme.difficulty ? 'text-amber-400' : 'text-gray-200'}">★</span>`).join('')}
                                        </div>
                                        
                                        ${!isUnlocked ? `
                                            <button class="w-full py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg font-bold text-sm hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
                                                    onclick="event.stopPropagation(); unlockTheme('${theme.id}')">
                                                <i class="fa fa-unlock mr-1"></i>解锁并开始
                                            </button>
                                        ` : `
                                            <button class="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-bold text-sm hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl">
                                                <i class="fa fa-play-circle mr-1"></i>开始创作
                                            </button>
                                        `}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function startStory(storyId) {
    if (!isThemeUnlocked(storyId)) {
        showToast('请先解锁该主题', 'warning');
        return;
    }
    
    state.currentStory = storyId;
    state.storyHistory = [];
    state.quizCompleted = false;
    
    const categoriesContainer = document.getElementById('categories-container');
    const storyArea = document.getElementById('metaverse-story-area');
    const storyText = document.getElementById('metaverse-story-text');
    const quizArea = document.getElementById('quiz-area');
    const choiceArea = document.getElementById('choice-area');
    const endingArea = document.getElementById('story-ending-area');
    
    categoriesContainer.classList.add('hidden');
    storyArea.classList.remove('hidden');
    quizArea.classList.add('hidden');
    choiceArea.classList.add('hidden');
    endingArea.classList.add('hidden');
    
    storyText.innerHTML = `
        <div class="flex justify-center items-center h-32">
            <div class="text-center">
                <div class="loading-cyber mx-auto mb-4"></div>
                <p class="text-gray-500">正在构建${storyThemes[storyId].name}的世界...</p>
            </div>
        </div>
    `;
    
    try {
        const systemPrompt = storyThemes[storyId].systemPrompt;
        const difficulty = storyThemes[storyId].difficulty;
        const userMessage = `请开始这个故事，输出第一段故事内容、2-3个选择分支，以及一个阅读理解题目。题目类型可以是选择题、填空题或开放式理解题，难度等级${difficulty}/5。

请严格按照以下JSON格式输出：
{
    "story": "故事内容（200-300字）",
    "choices": [
        {"id": "a", "text": "选择A的描述"},
        {"id": "b", "text": "选择B的描述"}
    ],
    "quiz": {
        "type": "choice|fill|comprehension",
        "question": "题目内容",
        "options": [
            {"id": "a", "text": "选项A"},
            {"id": "b", "text": "选项B"},
            {"id": "c", "text": "选项C"}
        ],
        "correct": "正确答案",
        "difficulty": ${difficulty}
    }
}`;

        const result = await callDeepSeekAPI(systemPrompt, userMessage);
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const storyData = JSON.parse(jsonMatch[0]);
            state.currentNode = storyData;
            state.storyHistory.push(storyData);
            renderStoryNode(storyData);
        }
    } catch (error) {
        storyText.innerHTML = `<p class="text-red-500">故事加载失败，请重试：${error.message}</p>`;
    }
}

function renderStoryNode(node) {
    const storyText = document.getElementById('metaverse-story-text');
    const quizArea = document.getElementById('quiz-area');
    const choiceArea = document.getElementById('choice-area');
    
    storyText.innerHTML = `<p class="story-text-content">${formatMarkdown(node.story)}</p>`;
    
    if (node.quiz && !state.quizCompleted) {
        renderQuiz(node.quiz);
        quizArea.classList.remove('hidden');
        choiceArea.classList.add('hidden');
    } else {
        quizArea.classList.add('hidden');
        renderChoices(node.choices);
        choiceArea.classList.remove('hidden');
    }
}

function renderQuiz(quiz) {
    const quizQuestion = document.getElementById('quiz-question');
    const quizOptions = document.getElementById('quiz-options');
    const quizFeedback = document.getElementById('quiz-feedback');
    const submitBtn = document.getElementById('submit-quiz-btn');
    const fillBlankArea = document.getElementById('fill-blank-area');
    const comprehensionArea = document.getElementById('comprehension-area');
    
    quizQuestion.textContent = quiz.question;
    quizFeedback.classList.add('hidden');
    submitBtn.style.display = 'flex';
    
    if (quiz.type === 'choice') {
        quizOptions.classList.remove('hidden');
        fillBlankArea.classList.add('hidden');
        comprehensionArea.classList.add('hidden');
        
        quizOptions.innerHTML = quiz.options.map(opt => `
            <button class="quiz-option w-full p-4 text-left bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-primary transition-all" 
                    data-option-id="${opt.id}">
                <span class="font-bold text-primary mr-3">${String.fromCharCode(65 + quiz.options.findIndex(o => o.id === opt.id))}.</span>
                <span class="text-gray-700">${opt.text}</span>
            </button>
        `).join('');
        
        let selectedOption = null;
        
        quizOptions.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                quizOptions.querySelectorAll('.quiz-option').forEach(b => {
                    b.classList.remove('border-primary', 'bg-primary/10');
                });
                e.currentTarget.classList.add('border-primary', 'bg-primary/10');
                selectedOption = e.currentTarget.dataset.optionId;
            });
        });
        
        submitBtn.onclick = () => handleChoiceQuiz(selectedOption, quiz);
    } else if (quiz.type === 'fill') {
        quizOptions.classList.add('hidden');
        fillBlankArea.classList.remove('hidden');
        comprehensionArea.classList.add('hidden');
        
        const input = document.getElementById('fill-blank-input');
        input.value = '';
        
        submitBtn.onclick = () => handleFillBlank(input.value, quiz);
    } else if (quiz.type === 'comprehension') {
        quizOptions.classList.add('hidden');
        fillBlankArea.classList.add('hidden');
        comprehensionArea.classList.remove('hidden');
        
        const input = document.getElementById('comprehension-input');
        input.value = '';
        
        submitBtn.onclick = () => handleComprehension(input.value, quiz);
    }
}

function handleChoiceQuiz(selectedId, quiz) {
    if (!selectedId) {
        showToast('请选择一个选项', 'warning');
        return;
    }
    
    const quizFeedback = document.getElementById('quiz-feedback');
    const submitBtn = document.getElementById('submit-quiz-btn');
    const allOptions = document.querySelectorAll('.quiz-option');
    
    allOptions.forEach(opt => {
        opt.disabled = true;
        if (opt.dataset.optionId === quiz.correct) {
            opt.classList.add('bg-green-100', 'border-green-500');
        } else if (opt.dataset.optionId === selectedId && selectedId !== quiz.correct) {
            opt.classList.add('bg-red-100', 'border-red-500');
        }
    });
    
    const reward = calculateQuizReward(quiz, selectedId);
    
    quizFeedback.classList.remove('hidden');
    
    if (reward > 0) {
        quizFeedback.className = 'text-sm p-4 rounded-xl bg-green-100 text-green-700';
        quizFeedback.innerHTML = `<i class="fa fa-check-circle mr-2"></i>回答正确！获得 ${reward} 金币！`;
        addCoins(reward, '答对题目');
    } else if (reward < 0) {
        quizFeedback.className = 'text-sm p-4 rounded-xl bg-red-100 text-red-700';
        quizFeedback.innerHTML = `<i class="fa fa-times-circle mr-2"></i>回答错误，正确答案已标出。${reward} 金币，继续加油！`;
        addCoins(reward, '回答错误');
    } else {
        quizFeedback.className = 'text-sm p-4 rounded-xl bg-amber-100 text-amber-700';
        quizFeedback.innerHTML = `<i class="fa fa-info-circle mr-2"></i>回答已提交，继续加油！`;
    }
    
    state.quizCompleted = true;
    submitBtn.style.display = 'none';
    
    setTimeout(() => {
        renderChoices(state.currentNode.choices);
        document.getElementById('choice-area').classList.remove('hidden');
    }, 2000);
}

async function handleFillBlank(answer, quiz) {
    if (!answer.trim()) {
        showToast('请输入答案', 'warning');
        return;
    }
    
    const quizFeedback = document.getElementById('quiz-feedback');
    const submitBtn = document.getElementById('submit-quiz-btn');
    
    submitBtn.innerHTML = '<div class="loading-cyber mr-2"></div>评分中...';
    submitBtn.disabled = true;
    
    const reward = await calculateQuizReward(quiz, answer);
    
    quizFeedback.classList.remove('hidden');
    submitBtn.innerHTML = '提交答案';
    submitBtn.disabled = false;
    
    if (reward > 0) {
        quizFeedback.className = 'text-sm p-4 rounded-xl bg-green-100 text-green-700 font-medium';
        quizFeedback.innerHTML = `<i class="fa fa-check-circle mr-2"></i>回答不错！获得 ${reward} 金币！${quiz.correct ? `（参考答案：${quiz.correct}）` : ''}`;
        addCoins(reward, '答题奖励');
    } else if (reward < 0) {
        quizFeedback.className = 'text-sm p-4 rounded-xl bg-amber-100 text-amber-700 font-medium';
        quizFeedback.innerHTML = `<i class="fa fa-lightbulb-o mr-2"></i>继续加油！扣 0 金币，再思考一下！${quiz.correct ? `参考答案：${quiz.correct}` : ''}`;
    } else {
        quizFeedback.className = 'text-sm p-4 rounded-xl bg-amber-100 text-amber-700 font-medium';
        quizFeedback.innerHTML = `<i class="fa fa-lightbulb-o mr-2"></i>你的回答已提交，继续加油！`;
    }
    
    state.quizCompleted = true;
    submitBtn.style.display = 'none';
    
    setTimeout(() => {
        renderChoices(state.currentNode.choices);
        document.getElementById('choice-area').classList.remove('hidden');
    }, 2000);
}

async function handleComprehension(answer, quiz) {
    if (!answer.trim() || answer.length < 15) {
        showToast('请写下你的理解（至少15字）', 'warning');
        return;
    }
    
    const quizFeedback = document.getElementById('quiz-feedback');
    const submitBtn = document.getElementById('submit-quiz-btn');
    
    submitBtn.innerHTML = '<div class="loading-cyber mr-2"></div>评分中...';
    submitBtn.disabled = true;
    
    const reward = await calculateQuizReward(quiz, answer);
    
    quizFeedback.classList.remove('hidden');
    submitBtn.innerHTML = '提交答案';
    submitBtn.disabled = false;
    
    if (reward >= 4) {
        quizFeedback.className = 'text-sm p-4 rounded-xl bg-green-100 text-green-700 font-medium';
        quizFeedback.innerHTML = `<i class="fa fa-star mr-2"></i>太棒了！思考很有深度，获得 ${reward} 金币！`;
        addCoins(reward, '优秀回答');
    } else if (reward >= 2) {
        quizFeedback.className = 'text-sm p-4 rounded-xl bg-green-100 text-green-700 font-medium';
        quizFeedback.innerHTML = `<i class="fa fa-check-circle mr-2"></i>感谢分享你的感悟，获得 ${reward} 金币！`;
        addCoins(reward, '答题奖励');
    } else if (reward >= 0) {
        quizFeedback.className = 'text-sm p-4 rounded-xl bg-amber-100 text-amber-700 font-medium';
        quizFeedback.innerHTML = `<i class="fa fa-lightbulb-o mr-2"></i>回答可以更详细一些哦，继续思考！`;
    } else {
        quizFeedback.className = 'text-sm p-4 rounded-xl bg-amber-100 text-amber-700 font-medium';
        quizFeedback.innerHTML = `<i class="fa fa-lightbulb-o mr-2"></i>加油！多思考多收获！`;
    }
    
    state.quizCompleted = true;
    submitBtn.style.display = 'none';
    
    setTimeout(() => {
        renderChoices(state.currentNode.choices);
        document.getElementById('choice-area').classList.remove('hidden');
    }, 2000);
}

function renderChoices(choices) {
    const choicesContainer = document.getElementById('metaverse-choices');
    
    choicesContainer.innerHTML = choices.map(choice => `
        <button class="choice-card p-5 text-left hover:shadow-lg transition-all duration-300" data-choice-id="${choice.id}">
            <span class="font-bold text-primary mr-2">${choice.id.toUpperCase()}.</span>
            <span class="text-gray-800">${choice.text}</span>
        </button>
    `).join('');
    
    choicesContainer.querySelectorAll('.choice-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleChoice(e.currentTarget.dataset.choiceId);
        });
    });
}

async function handleChoice(choiceId) {
    const choice = state.currentNode.choices.find(c => c.id === choiceId);
    const choicesContainer = document.getElementById('metaverse-choices');
    
    choicesContainer.innerHTML = `
        <div class="col-span-2 flex justify-center">
            <div class="text-center py-8">
                <div class="loading-cyber mx-auto mb-4"></div>
                <p class="text-gray-500">你选择了：${choice.text}</p>
                <p class="text-gray-400 text-sm mt-2">故事继续展开中...</p>
            </div>
        </div>
    `;
    
    try {
        const systemPrompt = storyThemes[state.currentStory].systemPrompt;
        const difficulty = storyThemes[state.currentStory].difficulty;
        const roundCount = state.storyHistory.length;
        const storySoFar = state.storyHistory.map(n => n.story).join('\n');
        
        let endingHint = '';
        if (roundCount >= 12) {
            endingHint = '\n\n注意：故事已经进行了较长时间，请根据剧情发展自然地考虑是否该进入结局收束阶段。如果剧情已到水到渠成之处，请在JSON中添加 "ending": true 字段表示故事应进入结局；如果故事还有发展空间，则不添加该字段。';
        }

        const userMessage = `用户选择了：${choice.text}

之前的故事内容：
${storySoFar}

当前是第${roundCount + 1}段故事。请继续发展故事，输出下一段故事内容（200-300字），以及新的2-3个选择分支，和一个新的阅读理解题目，难度等级${difficulty}/5。${endingHint}

请严格按照以下JSON格式输出：
{
    "story": "继续的故事内容",
    "choices": [
        {"id": "a", "text": "选择A的描述"},
        {"id": "b", "text": "选择B的描述"}
    ],
    "quiz": {
        "type": "choice|fill|comprehension",
        "question": "题目内容",
        "options": [
            {"id": "a", "text": "选项A"},
            {"id": "b", "text": "选项B"},
            {"id": "c", "text": "选项C"}
        ],
        "correct": "正确答案",
        "difficulty": ${difficulty}
    }
}`;

        const result = await callDeepSeekAPI(systemPrompt, userMessage);
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const storyData = JSON.parse(jsonMatch[0]);
            state.currentNode = storyData;
            state.storyHistory.push(storyData);
            state.quizCompleted = false;

            if (storyData.ending === true || roundCount >= 18) {
                const fullStory = state.storyHistory.map(n => n.story).join('\n\n');
                await generateFinalEnding(fullStory, choice.text);
            } else {
                renderStoryNode(storyData);
            }
        }
    } catch (error) {
        document.getElementById('metaverse-story-text').innerHTML += `<p class="text-red-500 mt-4">故事继续失败：${error.message}</p>`;
    }
}

async function generateFinalEnding(fullStory, lastChoice) {
    const choicesContainer = document.getElementById('metaverse-choices');
    const quizArea = document.getElementById('quiz-area');
    const choiceArea = document.getElementById('choice-area');
    const endingArea = document.getElementById('story-ending-area');
    const endingContent = document.getElementById('ending-content');
    
    choicesContainer.classList.add('hidden');
    quizArea.classList.add('hidden');
    choiceArea.classList.add('hidden');
    endingArea.classList.remove('hidden');
    
    endingContent.innerHTML = `
        <div class="flex justify-center py-8">
            <div class="text-center">
                <div class="loading-cyber mx-auto mb-4"></div>
                <p class="text-gray-500">正在生成完整故事和结局分析...</p>
                <p class="text-gray-400 text-sm mt-2">请稍候，这是故事的最后一章</p>
            </div>
        </div>
    `;
    
    try {
        const systemPrompt = '你是资深的文学创作和教育专家，擅长故事创作和写作指导。请遵守以下规则：1.语言自然凝练，富有文学气息，不要有AI味。2.结局必须升华，传递积极正能量，但升华要水到渠成。3.如果自然地运用了修辞手法，将整句话用【】包裹并在末尾用|标注手法名，例如：【月光如银纱般洒落|比喻】。不必强行堆砌修辞。';
        const themeName = storyThemes[state.currentStory].name;
        
        const userMessage = `主题：${themeName}
用户最后的选择：${lastChoice}

完整故事内容：
${fullStory}

请输出以下三个部分，用清晰的分隔标记：

===结局===
请为这个故事写一个完整、感人、有教育意义的结局（300-400字）。总结主角的成长和收获，升华主题，传递积极的价值观和人生哲理。修辞手法请将整句话用【】包裹并标注，例如：【月光如银纱般洒落|比喻】。

===完整故事===
请将以上所有故事段落和结局整合，整理成一篇结构完整、逻辑连贯的完整故事（1200-2000字）。修辞手法请将整句话用【】包裹并标注，例如：【月光如银纱般洒落|比喻】。

===文章分析===
请从以下几个方面分析这篇文章的巧妙之处和写作亮点，帮助学生理解和学习：
1. 立意分析：主题的深刻内涵和教育意义
2. 结构特点：起承转合的巧妙安排
3. 人物塑造：主角的成长弧线和性格特点
4. 写作亮点：文中运用的修辞手法和描写技巧，请逐一指出并分析其效果
5. 写作建议：给学生的3条具体写作建议`;

        const result = await callDeepSeekAPI(systemPrompt, userMessage);
        
        const endingMatch = result.match(/===结局===([\s\S]*?)(?====)|$/);
        const fullStoryMatch = result.match(/===完整故事===([\s\S]*?)(?====)|$/);
        const analysisMatch = result.match(/===文章分析===([\s\S]*)$/);
        
        const endingText = endingMatch ? endingMatch[1].trim() : '';
        const fullStoryText = fullStoryMatch ? fullStoryMatch[1].trim() : '';
        const analysisText = analysisMatch ? analysisMatch[1].trim() : '';
        
        const qualityScore = Math.floor(Math.random() * 20) + 80;
        const bonusCoins = Math.floor(qualityScore / 10) + 10;
        addCoins(bonusCoins, '完成故事奖励');
        
        endingContent.innerHTML = `
            <div class="mb-8">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <i class="fa fa-book text-white text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800">《${themeName}》</h3>
                        <p class="text-gray-500">你的创作成果</p>
                    </div>
                </div>
            </div>

            <div class="mb-8">
                <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 mb-6">
                    <h4 class="font-bold text-indigo-700 mb-4 flex items-center">
                        <i class="fa fa-file-text mr-2"></i>完整故事
                    </h4>
                    <div class="story-text-content text-gray-700 leading-relaxed">
                        ${formatMarkdown(fullStoryText)}
                    </div>
                </div>

                <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 mb-6">
                    <h4 class="font-bold text-emerald-700 mb-4 flex items-center">
                        <i class="fa fa-star mr-2"></i>故事结局
                    </h4>
                    <div class="story-text-content text-gray-700 leading-relaxed">
                        ${formatMarkdown(endingText)}
                    </div>
                </div>

                <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                    <h4 class="font-bold text-purple-700 mb-4 flex items-center">
                        <i class="fa fa-lightbulb-o mr-2"></i>文章分析与写作指导
                    </h4>
                    <div class="story-text-content text-gray-700 leading-relaxed">
                        ${formatMarkdown(analysisText)}
                    </div>
                </div>
            </div>

            <div class="bg-gradient-to-r from-amber-400 to-orange-500 p-6 rounded-xl text-white text-center">
                <div class="flex items-center justify-center gap-6 mb-4">
                    <div class="text-center">
                        <i class="fa fa-trophy text-4xl mb-2 opacity-90"></i>
                        <p class="text-lg font-bold">作品评分</p>
                        <p class="text-3xl font-bold">${qualityScore} 分</p>
                    </div>
                    <div class="text-center">
                        <i class="fa fa-coins text-4xl mb-2 opacity-90"></i>
                        <p class="text-lg font-bold">获得奖励</p>
                        <p class="text-3xl font-bold">+${bonusCoins} 金币</p>
                    </div>
                    <div class="text-center">
                        <i class="fa fa-feather text-4xl mb-2 opacity-90"></i>
                        <p class="text-lg font-bold">故事篇幅</p>
                        <p class="text-3xl font-bold">${Math.floor(fullStoryText.length / 2)} 字</p>
                    </div>
                </div>
                <p class="text-white/90 font-medium">恭喜你完成了这段精彩的文学之旅！</p>
            </div>
        `;
    } catch (error) {
        endingContent.innerHTML = `<p class="text-red-500">结局生成失败：${error.message}</p>`;
    }
}

async function showEnding() {
    const fullStory = state.storyHistory.map(n => n.story).join('\n\n');
    await generateFinalEnding(fullStory, '直接进入结局');
}

function backToStorySelection() {
    state.currentStory = null;
    state.storyHistory = [];
    state.currentNode = null;
    state.quizCompleted = false;
    
    document.getElementById('categories-container').classList.remove('hidden');
    document.getElementById('metaverse-story-area').classList.add('hidden');
    document.getElementById('story-ending-area').classList.add('hidden');
}

async function handleAssistantFunction(functionType) {
    const topic = document.getElementById('composition-topic').value.trim();
    if (!topic) {
        showToast('请先输入作文题目', 'warning');
        return;
    }
    
    state.currentTopic = topic;
    const resultContainer = document.getElementById('function-result');
    const resultContent = document.getElementById('result-content');
    
    resultContainer.classList.remove('hidden');
    resultContent.innerHTML = `
        <div class="flex justify-center items-center h-32">
            <div class="text-center">
                <div class="loading-cyber mx-auto mb-4"></div>
                <p class="text-gray-500">正在${getFunctionName(functionType)}...</p>
            </div>
        </div>
    `;
    
    try {
        const prompts = {
            analyze: {
                system: '你是一位专业的语文老师，擅长作文审题指导。',
                user: `请分析作文题目"${topic}"，包括：1）题目类型；2）关键词分析；3）审题技巧；4）写作方向建议。`
            },
            materials: {
                system: '你是一位专业的语文老师，擅长为学生推荐写作素材。',
                user: `请为作文题目"${topic}"推荐写作素材，包括：1）相关名言警句（3-5条）；2）典型事例（3个）；3）素材使用建议。`
            },
            structure: {
                system: '你是一位专业的语文老师，擅长指导作文结构。',
                user: `请为作文题目"${topic}"提供：1）推荐的作文结构模板；2）开头、主体、结尾各部分的写作建议；3）结构技巧提示。`
            },
            model: {
                system: '你是一位专业的语文老师，擅长写范文。',
                user: `请以"${topic}"为题，写一篇初中生的优秀范文，600-800字。然后简要分析这篇范文的优点。`
            },
            review: {
                system: '你是一位专业的语文老师，擅长作文批改。',
                user: `请简要说明批改"${topic}"这类作文的评分标准和注意事项。`
            }
        };
        
        const prompt = prompts[functionType];
        await callDeepSeekAPI(prompt.system, prompt.user, {
            stream: true,
            outputElement: resultContent
        });
        
    } catch (error) {
        resultContent.innerHTML = `<p class="text-red-500">处理失败：${error.message}</p>`;
    }
}

function getFunctionName(type) {
    const names = {
        analyze: '分析题目',
        materials: '推荐素材',
        structure: '提供结构建议',
        model: '生成范文',
        review: '批改作文'
    };
    return names[type] || '处理';
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeSplashParticles();
    renderCategories();
    
    document.getElementById('nav-metaverse').addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('metaverse');
    });
    
    document.getElementById('nav-assistant').addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('assistant');
    });
    
    document.getElementById('analyze-topic-btn').addEventListener('click', () => {
        handleAssistantFunction('analyze');
    });
    
    const input = document.getElementById('composition-topic');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAssistantFunction('analyze');
        }
    });
    
    updateCoinDisplay();
});
