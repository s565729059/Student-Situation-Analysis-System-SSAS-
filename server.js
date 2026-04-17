const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

// 导入模型
const Student = require('./models/Student');
const Admin = require('./models/Admin');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 会话设置
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// MongoDB连接
mongoose.connect('mongodb://localhost:27017/student-analysis', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
    // 初始化管理员账号
    initializeAdmins();
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// 初始化管理员账号
async function initializeAdmins() {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const admins = [];
            for (let i = 1; i <= 100; i++) {
                const adminId = `admin001-${i}`;
                const hashedPassword = await bcrypt.hash('123456', 10);
                admins.push({
                    adminId,
                    password: hashedPassword,
                    firstLogin: true
                });
            }
            await Admin.insertMany(admins);
            console.log('Admin accounts initialized');
        }
    } catch (err) {
        console.error('Error initializing admins:', err);
    }
}

// 路由

// 首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 保存学生分析结果
app.post('/api/save-analysis', async (req, res) => {
    try {
        const studentData = req.body;
        const newStudent = new Student(studentData);
        await newStudent.save();
        res.json({ success: true, message: '分析结果保存成功' });
    } catch (err) {
        res.json({ success: false, message: '保存失败', error: err.message });
    }
});

// 后台登录页面
app.get('/admin/login', (req, res) => {
    res.render('login');
});

// 后台登录处理
app.post('/admin/login', async (req, res) => {
    try {
        const { adminId, password } = req.body;
        const admin = await Admin.findOne({ adminId });
        
        if (!admin) {
            return res.render('login', { error: '账号不存在' });
        }
        
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.render('login', { error: '密码错误' });
        }
        
        req.session.admin = admin;
        
        if (admin.firstLogin) {
            return res.redirect('/admin/change-password');
        }
        
        res.redirect('/admin/dashboard');
    } catch (err) {
        res.render('login', { error: '登录失败' });
    }
});

// 修改密码页面
app.get('/admin/change-password', (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }
    res.render('change-password');
});

// 修改密码处理
app.post('/admin/change-password', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }
    
    try {
        const { newPassword, confirmPassword } = req.body;
        
        if (newPassword !== confirmPassword) {
            return res.render('change-password', { error: '两次密码不一致' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await Admin.findByIdAndUpdate(req.session.admin._id, {
            password: hashedPassword,
            firstLogin: false
        });
        
        req.session.admin.password = hashedPassword;
        req.session.admin.firstLogin = false;
        
        res.redirect('/admin/dashboard');
    } catch (err) {
        res.render('change-password', { error: '修改密码失败' });
    }
});

// 后台仪表盘
app.get('/admin/dashboard', (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }
    res.render('dashboard');
});

// 搜索学生
app.post('/admin/search', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }
    
    try {
        const { searchTerm } = req.body;
        const students = await Student.find({
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { gender: { $regex: searchTerm, $options: 'i' } },
                { grade: { $regex: searchTerm, $options: 'i' } }
            ]
        });
        res.render('dashboard', { students });
    } catch (err) {
        res.render('dashboard', { error: '搜索失败' });
    }
});

// 后门 - 管理员账号管理
app.get('/admin/backdoor', (req, res) => {
    res.render('backdoor');
});

// 后门 - 获取所有管理员账号
app.post('/admin/backdoor/get-admins', async (req, res) => {
    try {
        const admins = await Admin.find();
        res.json({ success: true, admins });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// 后门 - 修改管理员账号
app.post('/admin/backdoor/update-admin', async (req, res) => {
    try {
        const { id, adminId, password, firstLogin } = req.body;
        const updateData = {};
        
        if (adminId) updateData.adminId = adminId;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (firstLogin !== undefined) updateData.firstLogin = firstLogin === 'true';
        
        await Admin.findByIdAndUpdate(id, updateData);
        res.json({ success: true, message: '管理员账号更新成功' });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// 登出
app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin login page: http://localhost:${PORT}/admin/login`);
});
