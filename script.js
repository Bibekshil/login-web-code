// ==================== AUTH SYSTEM WITH ROLE-BASED ACCESS ====================

// THE ONLY SUPER ADMIN USER (Hardcoded)
const ADMIN_EMAIL = "bibekshilsharma@gmail.com";
const ADMIN_PASSWORD = "bibekshil@120";

let users = [];
let loginHistory = [];
let studentsData = [];
let nextId = 40;
let masterDataTable = null;
let historyDataTable = null;

// ==================== INITIALIZATION & DATA LOADING ====================

function loadUsers() {
    const stored = localStorage.getItem('school_auth_users_v3');
    if (stored) {
        users = JSON.parse(stored);
    } else {
        users = [{ 
            id: 1, 
            name: "Bibekshil Sharma", 
            email: ADMIN_EMAIL, 
            password: ADMIN_PASSWORD, 
            securityAnswer: "blue", 
            role: "admin",
            isSuperAdmin: true,
            createdAt: new Date().toISOString()
        }];
        localStorage.setItem('school_auth_users_v3', JSON.stringify(users));
    }
}

function loadLoginHistory() {
    const stored = localStorage.getItem('school_login_history_v3');
    if (stored) {
        loginHistory = JSON.parse(stored);
    } else {
        loginHistory = [];
    }
}

function saveUsers() {
    localStorage.setItem('school_auth_users_v3', JSON.stringify(users));
}

function saveLoginHistory() {
    localStorage.setItem('school_login_history_v3', JSON.stringify(loginHistory));
}

function saveStudents() {
    localStorage.setItem('school_students_data_final', JSON.stringify(studentsData));
}

function recordLogin(userEmail, userName) {
    const loginRecord = {
        id: loginHistory.length + 1,
        email: userEmail,
        name: userName,
        loginTime: new Date().toLocaleString('en-NP', { timeZone: 'Asia/Kathmandu' }),
        timestamp: Date.now(),
        device: navigator.userAgent.substring(0, 80),
        sessionId: Math.random().toString(36).substring(2, 15)
    };
    loginHistory.unshift(loginRecord);
    saveLoginHistory();
}

function isLoggedIn() {
    return sessionStorage.getItem('school_logged_in') === 'true';
}

function getCurrentUser() {
    const email = sessionStorage.getItem('school_user_email');
    return users.find(u => u.email === email);
}

function isSuperAdmin() {
    const currentUser = getCurrentUser();
    return currentUser && currentUser.email === ADMIN_EMAIL && currentUser.password === ADMIN_PASSWORD;
}

// ==================== UI HELPERS ====================

function showToast(message, isError = false) {
    let toast = document.getElementById('toastMessage');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastMessage';
        toast.className = 'toast-message';
        document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.style.backgroundColor = isError ? '#e74c3c' : '#27ae60';
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

function updateUserUI() {
    const user = getCurrentUser();
    if (user) {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const sideAvatar = document.getElementById('sideAvatar');
        const topAvatar = document.getElementById('topAvatar');
        const sideName = document.getElementById('sideName');
        const sideRole = document.getElementById('sideRole');
        
        if (sideAvatar) sideAvatar.innerText = initials;
        if (topAvatar) topAvatar.innerText = initials;
        if (sideName) sideName.innerText = user.name.split(' ')[0];
        if (sideRole) sideRole.innerText = isSuperAdmin() ? 'Super Admin' : (user.role === 'admin' ? 'Administrator' : 'Staff Member');
    }
    
    // Show/hide Login Tracker menu based on user role
    const historyNav = document.getElementById('navLoginHistory');
    if (historyNav) {
        if (isSuperAdmin()) {
            historyNav.style.display = 'block';
        } else {
            historyNav.style.display = 'none';
            const historyPanel = document.getElementById('historyPanel');
            if (historyPanel && historyPanel.style.display === 'block') {
                document.getElementById('dashboardBtn').click();
            }
        }
    }
}

function renderLoginHistoryTable() {
    if (!isSuperAdmin()) return;
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = loginHistory.map((log, idx) => `
        <tr>
            <td style="padding: 10px;">${idx + 1}</td>
            <td style="padding: 10px;"><strong>${escapeHtml(log.email)}</strong>${log.email === ADMIN_EMAIL ? ' <span class="admin-badge">Super Admin</span>' : ''}</td>
            <td style="padding: 10px;">${escapeHtml(log.name)}</td>
            <td style="padding: 10px;"><i class='bx bx-calendar'></i> ${log.loginTime}</td>
            <td style="padding: 10px;"><small>${escapeHtml(log.device || 'Desktop')}</small></td>
            <td style="padding: 10px;"><code>${log.sessionId}</code></td>
        </tr>
    `).join('');
    
    document.getElementById('totalLoginsCount').innerText = loginHistory.length;
    
    if (historyDataTable) historyDataTable.destroy();
    if ($('#loginHistoryTable').length && loginHistory.length > 0) {
        historyDataTable = $('#loginHistoryTable').DataTable({ 
            paging: true, 
            ordering: true, 
            pageLength: 10, 
            order: [[3, 'desc']] 
        });
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function logout() {
    sessionStorage.removeItem('school_logged_in');
    sessionStorage.removeItem('school_user_email');
    showToast('<i class="bx bx-log-out-circle"></i> Logged out successfully');
    location.reload();
}

// ==================== REGISTRATION / CREATE ACCOUNT MODAL ====================

function showRegisterModal() {
    // Remove any existing modals
    const existingAuth = document.getElementById('authGlobal');
    if (existingAuth) existingAuth.remove();
    
    const existingRegister = document.getElementById('registerModal');
    if (existingRegister) existingRegister.remove();
    
    const modal = document.createElement('div');
    modal.id = 'registerModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    modal.innerHTML = `
        <div style="
            max-width: 500px;
            width: 100%;
            background: white;
            border-radius: 32px;
            padding: 35px 32px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            border-top: 4px solid #d4af37;
            max-height: 90vh;
            overflow-y: auto;
            box-sizing: border-box;
        ">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="
                    width: 70px;
                    height: 70px;
                    background: linear-gradient(135deg, #d4af37, #b8960c);
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                ">
                    <i class='bx bx-user-plus' style="font-size: 40px; color: #1a2a5e;"></i>
                </div>
                <h2 style="font-size: 28px; font-weight: 800; color: #2c3e8f; margin-bottom: 8px;">Create Account</h2>
                <p style="color: #7f8c8d; margin-top: 8px; font-size: 14px;">Register to access the dashboard</p>
            </div>
            
            <form id="registerForm">
                <div style="margin-bottom: 18px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Full Name *</label>
                    <input type="text" id="regFullName" placeholder="e.g., John Doe" style="width: 100%; padding: 14px 16px; border: 2px solid #e0e0e0; border-radius: 16px; font-size: 15px; transition: all 0.2s; box-sizing: border-box;" autocomplete="off">
                </div>
                
                <div style="margin-bottom: 18px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Email Address *</label>
                    <input type="email" id="regEmailAddr" placeholder="your@email.com" style="width: 100%; padding: 14px 16px; border: 2px solid #e0e0e0; border-radius: 16px; font-size: 15px; transition: all 0.2s; box-sizing: border-box;" autocomplete="off">
                </div>
                
                <div style="margin-bottom: 18px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Password *</label>
                    <input type="password" id="regPassword" placeholder="Minimum 6 characters" style="width: 100%; padding: 14px 16px; border: 2px solid #e0e0e0; border-radius: 16px; font-size: 15px; transition: all 0.2s; box-sizing: border-box;">
                </div>
                
                <div style="margin-bottom: 18px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Confirm Password *</label>
                    <input type="password" id="regConfirmPassword" placeholder="Re-enter password" style="width: 100%; padding: 14px 16px; border: 2px solid #e0e0e0; border-radius: 16px; font-size: 15px; transition: all 0.2s; box-sizing: border-box;">
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Security Answer *</label>
                    <input type="text" id="regSecurityAnswer" placeholder="What is your favorite color?" style="width: 100%; padding: 14px 16px; border: 2px solid #e0e0e0; border-radius: 16px; font-size: 15px; transition: all 0.2s; box-sizing: border-box;">
                    <small style="color: #7f8c8d; font-size: 11px; margin-top: 5px; display: block;">Used for password recovery</small>
                </div>
                
                <button type="submit" style="
                    width: 100%;
                    background: linear-gradient(135deg, #d4af37, #b8960c);
                    color: #1a2a5e;
                    font-weight: 700;
                    padding: 14px;
                    border: none;
                    border-radius: 40px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s;
                ">
                    <i class='bx bx-check-circle'></i> Create Account
                </button>
                
                <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <span id="backToLoginFromReg" style="cursor: pointer; color: #d4af37; font-weight: 600; transition: all 0.2s;"><i class='bx bx-arrow-back'></i> Already have an account? Login here</span>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add focus effects
    modal.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = '#d4af37';
            this.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)';
        });
        input.addEventListener('blur', function() {
            this.style.borderColor = '#e0e0e0';
            this.style.boxShadow = 'none';
        });
    });
    
    // Registration form submission
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('regFullName').value.trim();
        const email = document.getElementById('regEmailAddr').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const securityAnswer = document.getElementById('regSecurityAnswer').value.trim().toLowerCase();
        
        if (!name || !email || !password || !confirmPassword || !securityAnswer) {
            showToast('<i class="bx bx-error-circle"></i> Please fill all fields', true);
            return;
        }
        
        if (password.length < 6) {
            showToast('<i class="bx bx-error-circle"></i> Password must be at least 6 characters', true);
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('<i class="bx bx-error-circle"></i> Passwords do not match', true);
            return;
        }
        
        if (users.find(u => u.email === email)) {
            showToast('<i class="bx bx-x-circle"></i> Email already registered! Please use another email.', true);
            return;
        }
        
        if (email === ADMIN_EMAIL) {
            showToast('<i class="bx bx-x-circle"></i> This email is reserved for super admin.', true);
            return;
        }
        
        const newUser = {
            id: users.length + 1,
            name: name,
            email: email,
            password: password,
            securityAnswer: securityAnswer,
            role: "staff",
            isSuperAdmin: false,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        saveUsers();
        
        showToast('<i class="bx bx-check-circle"></i> Account created successfully! Please login.');
        modal.remove();
        showAuthModal();
    });
    
    document.getElementById('backToLoginFromReg').addEventListener('click', () => {
        modal.remove();
        showAuthModal();
    });
}

// ==================== FORGOT PASSWORD MODAL ====================

function showForgotPasswordModal() {
    // Remove existing modals
    const existing = document.getElementById('forgotPasswordModal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'forgotPasswordModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="max-width: 460px; width: 100%; background: white; border-radius: 32px; padding: 35px 32px; border-top: 4px solid #d4af37; max-height: 90vh; overflow-y: auto;">
            <div style="text-align: center; margin-bottom: 24px;">
                <i class='bx bx-lock-alt' style="font-size: 48px; color: #d4af37;"></i>
                <h3 style="font-size: 24px; font-weight: 800; color: #2c3e8f; margin-top: 8px;">Forgot Password</h3>
                <p style="color: #7f8c8d; font-size: 14px;">Reset your password using security answer</p>
            </div>
            
            <div id="forgotStep1">
                <input type="email" id="forgotEmail" placeholder="Enter your registered email" style="width: 100%; padding: 14px 16px; margin-bottom: 16px; border: 2px solid #e0e0e0; border-radius: 16px; font-size: 15px; box-sizing: border-box;">
                <input type="text" id="forgotAnswer" placeholder="Security Answer (favorite color)" style="width: 100%; padding: 14px 16px; margin-bottom: 24px; border: 2px solid #e0e0e0; border-radius: 16px; font-size: 15px; box-sizing: border-box;">
                <button id="verifySecurityBtn" style="width: 100%; background: linear-gradient(135deg, #d4af37, #b8960c); color: #1a2a5e; font-weight: 700; padding: 14px; border: none; border-radius: 40px; font-size: 16px; cursor: pointer;"><i class='bx bx-check-shield'></i> Verify & Continue</button>
                <div style="margin-top: 20px; text-align: center;">
                    <span id="backToLoginFromForgot" style="cursor: pointer; color: #d4af37; font-weight: 600;"><i class='bx bx-arrow-back'></i> Back to Login</span>
                </div>
            </div>
            
            <div id="forgotStep2" style="display: none;">
                <input type="password" id="newPassword" placeholder="New Password (min 6 chars)" style="width: 100%; padding: 14px 16px; margin-bottom: 16px; border: 2px solid #e0e0e0; border-radius: 16px; font-size: 15px; box-sizing: border-box;">
                <input type="password" id="confirmNewPassword" placeholder="Confirm New Password" style="width: 100%; padding: 14px 16px; margin-bottom: 24px; border: 2px solid #e0e0e0; border-radius: 16px; font-size: 15px; box-sizing: border-box;">
                <button id="resetPasswordBtn" style="width: 100%; background: linear-gradient(135deg, #d4af37, #b8960c); color: #1a2a5e; font-weight: 700; padding: 14px; border: none; border-radius: 40px; font-size: 16px; cursor: pointer;"><i class='bx bx-reset'></i> Reset Password</button>
                <div style="margin-top: 20px; text-align: center;">
                    <span id="backToLoginFromReset" style="cursor: pointer; color: #d4af37; font-weight: 600;"><i class='bx bx-arrow-back'></i> Back to Login</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    let resetEmail = '';
    
    document.getElementById('verifySecurityBtn').addEventListener('click', () => {
        const email = document.getElementById('forgotEmail').value.trim();
        const answer = document.getElementById('forgotAnswer').value.trim().toLowerCase();
        const user = users.find(u => u.email === email);
        
        if (!user) { 
            showToast('<i class="bx bx-x-circle"></i> Email not found', true); 
            return; 
        }
        if (user.securityAnswer !== answer) { 
            showToast('<i class="bx bx-x-circle"></i> Incorrect security answer', true); 
            return; 
        }
        
        resetEmail = email;
        document.getElementById('forgotStep1').style.display = 'none';
        document.getElementById('forgotStep2').style.display = 'block';
    });
    
    document.getElementById('resetPasswordBtn').addEventListener('click', () => {
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmNewPassword').value;
        
        if (newPass.length < 6) { 
            showToast('<i class="bx bx-error-circle"></i> Password must be at least 6 characters', true); 
            return; 
        }
        if (newPass !== confirmPass) { 
            showToast('<i class="bx bx-error-circle"></i> Passwords do not match', true); 
            return; 
        }
        
        const userIndex = users.findIndex(u => u.email === resetEmail);
        if (userIndex !== -1) {
            users[userIndex].password = newPass;
            saveUsers();
            showToast('<i class="bx bx-check-circle"></i> Password reset successfully! Please login.');
            modal.remove();
            showAuthModal();
        }
    });
    
    const closeModal = () => modal.remove();
    document.getElementById('backToLoginFromForgot')?.addEventListener('click', closeModal);
    document.getElementById('backToLoginFromReset')?.addEventListener('click', closeModal);
}

// ==================== AUTH MODAL WITH REGISTER OPTION ====================

function showAuthModal() {
    // Remove any existing modals
    const existingModals = document.querySelectorAll('#authGlobal, #registerModal, #forgotPasswordModal');
    existingModals.forEach(modal => modal.remove());
    
    const div = document.createElement("div");
    div.id = "authGlobal";
    div.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    div.innerHTML = `
        <div style="max-width: 460px; width: 100%; background: white; border-radius: 32px; padding: 40px 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border-top: 4px solid #d4af37; box-sizing: border-box;">
            <div id="loginBox">
                <div style="text-align: center; margin-bottom: 28px;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #d4af37, #b8960c); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                        <i class='bx bxs-school' style="font-size: 40px; color: #1a2a5e;"></i>
                    </div>
                    <h2 style="font-size: 28px; font-weight: 800; color: #2c3e8f;">Welcome Back</h2>
                    <p style="color: #7f8c8d; margin-top: 5px;">Login to your dashboard</p>
                </div>
                
                <form id="loginForm">
                    <input type="email" id="loginEmail" placeholder="Email address" required style="width: 100%; padding: 14px 16px; margin-bottom: 16px; border: 2px solid #e0e0e0; border-radius: 16px; font-size: 15px; transition: all 0.2s; box-sizing: border-box;">
                    <input type="password" id="loginPass" placeholder="Password" required style="width: 100%; padding: 14px 16px; margin-bottom: 20px; border: 2px solid #e0e0e0; border-radius: 16px; font-size: 15px; transition: all 0.2s; box-sizing: border-box;">
                    <button type="submit" style="width: 100%; background: linear-gradient(135deg, #d4af37, #b8960c); color: #1a2a5e; font-weight: 700; padding: 14px; border: none; border-radius: 40px; font-size: 16px; cursor: pointer; transition: all 0.3s;"><i class='bx bx-log-in-circle'></i> Login to Dashboard</button>
                </form>
                
                <div style="margin-top: 16px; text-align: center;">
                    <span id="showForgotBtn" style="cursor: pointer; color: #7f8c8d; font-size: 14px; display: inline-block;"><i class='bx bx-key'></i> Forgot Password?</span>
                </div>
                
                <div style="margin-top: 24px; text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <span style="color: #7f8c8d;">Don't have an account?</span>
                    <strong id="showRegisterBtn" style="cursor: pointer; color: #d4af37; margin-left: 8px; font-size: 15px;"><i class='bx bx-user-plus'></i> Create Account</strong>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(div);
    
    // Add focus effects
    div.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = '#d4af37';
            this.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)';
        });
        input.addEventListener('blur', function() {
            this.style.borderColor = '#e0e0e0';
            this.style.boxShadow = 'none';
        });
    });
    
    // Login handler
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPass').value;
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            recordLogin(user.email, user.name);
            sessionStorage.setItem('school_logged_in', 'true');
            sessionStorage.setItem('school_user_email', user.email);
            document.getElementById('authGlobal').remove();
            updateUserUI();
            showToast(`<i class='bx bx-star'></i> Welcome back, ${user.name}!`);
            initializeDashboard();
        } else {
            showToast('<i class="bx bx-x-circle"></i> Invalid email or password', true);
        }
    });
    
    // Forgot password handler
    document.getElementById('showForgotBtn').addEventListener('click', () => {
        div.remove();
        showForgotPasswordModal();
    });
    
    // Register handler
    document.getElementById('showRegisterBtn').addEventListener('click', () => {
        div.remove();
        showRegisterModal();
    });
}

// ==================== STUDENT DATA MANAGEMENT ====================

function loadStudents() {
    const stored = localStorage.getItem('school_students_data_final');
    if (stored) {
        studentsData = JSON.parse(stored);
        nextId = Math.max(...studentsData.map(s => s.id), 39) + 1;
    } else {
        studentsData = [
            { id: 1, name: "DEV RAJ PANT", symbol: "07702869E", dob: "2067-08-22", gpa: 3.79 },
            { id: 2, name: "PREMA JAGARI", symbol: "07702901K", dob: "2067-10-08", gpa: 3.58 },
            { id: 3, name: "MAMITA RANA", symbol: "07702887W", dob: "2066-05-10", gpa: 3.56 },
            { id: 4, name: "REJINA DANGAURA", symbol: "07702908R", dob: "2066-01-19", gpa: 3.56 },
            { id: 5, name: "PREM RAJ PANT", symbol: "07702900J", dob: "2066-11-03", gpa: 3.31 },
            { id: 6, name: "PRATIKSHYA KUMARI BOHARA", symbol: "07702899I", dob: "2066-01-23", gpa: 3.25 },
            { id: 7, name: "BISHAL ROKAYA", symbol: "07702865A", dob: "2065-01-14", gpa: 3.21 },
            { id: 8, name: "DEBAKI PANT", symbol: "07702868D", dob: "2066-10-07", gpa: 3.20 },
            { id: 9, name: "RAJESH BHATT", symbol: "07702907Q", dob: "2066-10-15", gpa: 3.17 },
            { id: 10, name: "LAXMI BIST", symbol: "07702884T", dob: "2067-10-01", gpa: 3.13 },
            { id: 11, name: "MANJARI BHATT", symbol: "07702890Z", dob: "2068-03-03", gpa: 3.12 },
            { id: 12, name: "AADITYA DANGAURA", symbol: "07702846H", dob: "2067-06-01", gpa: 3.09 },
            { id: 13, name: "HIMAL THAPA", symbol: "07702877M", dob: "2066-06-29", gpa: 3.09 },
            { id: 14, name: "DHURB RAJ PANT", symbol: "07702870F", dob: "2067-12-14", gpa: 3.03 },
            { id: 15, name: "GAURAB PANT", symbol: "07702873I", dob: "2066-09-06", gpa: 3.02 },
            { id: 16, name: "NEHA DANGAURA", symbol: "07702892B", dob: "2066-04-05", gpa: 3.00 },
            { id: 17, name: "ASMA OAD", symbol: "07702855Q", dob: "2068-03-29", gpa: 2.94 },
            { id: 18, name: "BIBEKSHIL SHARMA", symbol: "07702861W", dob: "2067-06-13", gpa: 2.92 },
            { id: 19, name: "SARIKA BIST", symbol: "07702919C", dob: "2066-07-11", gpa: 2.90 },
            { id: 20, name: "AASHMA ROKAYA", symbol: "07702847I", dob: "2067-07-03", gpa: 2.88 },
            { id: 21, name: "ASHOK SARKI", symbol: "07702854P", dob: "2065-10-27", gpa: 2.85 },
            { id: 22, name: "GAYATRI PANT", symbol: "07702874J", dob: "2068-11-19", gpa: 2.84 },
            { id: 23, name: "MANJU PANT", symbol: "07702891A", dob: "2068-07-06", gpa: 2.84 },
            { id: 24, name: "PRAGYA PANT", symbol: "07702897G", dob: "2067-05-05", gpa: 2.84 },
            { id: 25, name: "LAXMI NATH", symbol: "07702885U", dob: "2065-08-07", gpa: 2.83 },
            { id: 26, name: "ANUSKA DANGAURA", symbol: "07702852N", dob: "2067-05-06", gpa: 2.82 },
            { id: 27, name: "CHANDRA PRAKASH PANT", symbol: "07702866B", dob: "2068-10-25", gpa: 2.80 },
            { id: 28, name: "MANISH OAD", symbol: "07702889Y", dob: "2065-11-08", gpa: 2.76 },
            { id: 29, name: "BHAWANA PANT", symbol: "07702859U", dob: "2066-09-14", gpa: 2.75 },
            { id: 30, name: "ANJALI BIST", symbol: "07702850L", dob: "2067-11-07", gpa: 2.72 },
            { id: 31, name: "BHUWAN DANI", symbol: "07702860V", dob: "2065-10-10", gpa: 2.70 },
            { id: 32, name: "BASANT KHATRI", symbol: "07702858T", dob: "2068-11-21", gpa: 2.69 },
            { id: 33, name: "DIPESH BOHARA", symbol: "07702871G", dob: "2066-02-07", gpa: 2.67 },
            { id: 34, name: "DIPIKA SHAHU", symbol: "07702872H", dob: "2065-09-07", gpa: 2.67 },
            { id: 35, name: "ASMITA MAHARA", symbol: "07702856R", dob: "2066-03-16", gpa: 2.66 },
            { id: 36, name: "SAKUNTALA DANGAURA", symbol: "07702914X", dob: "2066-05-08", gpa: 2.65 },
            { id: 37, name: "PUSPALATA BHATT", symbol: "07702904N", dob: "2068-06-10", gpa: 2.56 },
            { id: 38, name: "PUJA KUMARI BHATT", symbol: "07702902L", dob: "2066-11-19", gpa: 2.55 },
            { id: 39, name: "AKASH RANA", symbol: "07702849K", dob: "2064-07-25", gpa: 2.44 }
        ];
        saveStudents();
    }
    nextId = Math.max(...studentsData.map(s => s.id), 39) + 1;
}

function updateStats() {
    const total = studentsData.length;
    const avg = total ? (studentsData.reduce((s, a) => s + a.gpa, 0) / total).toFixed(2) : "0.00";
    const totalStat = document.getElementById('totalStat');
    const avgGpaStat = document.getElementById('avgGpaStat');
    const highStat = document.getElementById('highStat');
    const passPercentStat = document.getElementById('passPercentStat');
    const studentCountSpan = document.getElementById('studentCountSpan');
    
    if (totalStat) totalStat.innerText = total;
    if (avgGpaStat) avgGpaStat.innerText = avg;
    if (highStat) highStat.innerText = studentsData.filter(s => s.gpa >= 3.5).length;
    if (passPercentStat) passPercentStat.innerText = total ? Math.round((studentsData.filter(s => s.gpa >= 3.0).length / total) * 100) + '%' : '0%';
    if (studentCountSpan) studentCountSpan.innerText = total;
}

function renderNameTiles() {
    const container = document.getElementById('allNamesContainer');
    if (!container) return;
    
    container.innerHTML = studentsData.map(s => `
        <div class="student-name-tile" data-id="${s.id}" style="background: white; padding: 14px 18px; border-radius: 14px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
            <i class='bx bx-user-circle' style="font-size: 28px; color: #d4af37;"></i>
            <span style="flex: 1; font-weight: 600; color: #1f2937;">${escapeHtml(s.name)}</span>
            <span style="background: linear-gradient(135deg, #d4af37, #b8960c); color: #1a2a5e; padding: 5px 12px; border-radius: 30px; font-size: 12px; font-weight: 700;">${s.gpa.toFixed(2)}</span>
        </div>
    `).join('');
    
    document.querySelectorAll('.student-name-tile').forEach(t => {
        t.addEventListener('click', () => {
            const id = parseInt(t.dataset.id);
            const s = studentsData.find(s => s.id === id);
            if (s) openEditModal(s);
        });
    });
}

function renderTopTen() {
    const topTen = [...studentsData].sort((a, b) => b.gpa - a.gpa).slice(0, 10);
    const tbody = document.getElementById('topTenBody');
    if (!tbody) return;
    
    tbody.innerHTML = topTen.map(s => `
        <tr>
            <td style="padding: 12px; font-weight: 600;">${escapeHtml(s.name)}</td>
            <td style="padding: 12px;">${escapeHtml(s.symbol)}</td>
            <td style="padding: 12px; font-weight: 700; color: #d4af37;">${s.gpa.toFixed(2)}</td>
        </tr>
    `).join('');
}

function openEditModal(s) {
    const editId = document.getElementById('editId');
    const stdName = document.getElementById('stdName');
    const stdSymbol = document.getElementById('stdSymbol');
    const stdDob = document.getElementById('stdDob');
    const stdGpa = document.getElementById('stdGpa');
    const modalTitle = document.getElementById('modalTitle');
    const studentModal = document.getElementById('studentModal');
    
    if (editId) editId.value = s.id;
    if (stdName) stdName.value = s.name;
    if (stdSymbol) stdSymbol.value = s.symbol;
    if (stdDob) stdDob.value = s.dob;
    if (stdGpa) stdGpa.value = s.gpa;
    if (modalTitle) modalTitle.innerHTML = '<i class="bx bxs-edit-alt"></i> Edit Student';
    if (studentModal) studentModal.style.display = 'flex';
}

function renderMasterTable() {
    const tbody = document.getElementById('masterTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = studentsData.map((s, idx) => `
        <tr data-id="${s.id}">
            <td style="padding: 14px;">${idx + 1}</td>
            <td style="padding: 14px; font-weight: 500;">${escapeHtml(s.name)}</td>
            <td style="padding: 14px;">${escapeHtml(s.symbol)}</td>
            <td style="padding: 14px;">${s.dob}</td>
            <td style="padding: 14px; font-weight: 700;">${s.gpa.toFixed(2)}</td>
            <td style="padding: 14px;">
                <i class='bx bx-edit-alt edit-icon' data-id="${s.id}" style="cursor: pointer; color: #d4af37; font-size: 20px; margin-right: 12px;"></i>
                <i class='bx bx-trash delete-icon' data-id="${s.id}" style="cursor: pointer; color: #e74c3c; font-size: 20px;"></i>
            </td>
        </table>
    `).join('');
    
    if (masterDataTable) masterDataTable.destroy();
    masterDataTable = $('#masterStudentTable').DataTable({ 
        paging: true, 
        searching: true, 
        ordering: true, 
        pageLength: 10 
    });
    attachTableEvents();
}

function attachTableEvents() {
    $('#masterStudentTable').off('click', '.edit-icon').on('click', '.edit-icon', function() {
        const id = parseInt($(this).data('id'));
        const student = studentsData.find(s => s.id === id);
        if (student) openEditModal(student);
    });
    
    $('#masterStudentTable').off('click', '.delete-icon').on('click', '.delete-icon', function() {
        const id = parseInt($(this).data('id'));
        if (confirm('Delete this student permanently?')) {
            studentsData = studentsData.filter(s => s.id !== id);
            saveStudents();
            updateAllUI();
            showToast('<i class="bx bx-check-circle"></i> Deleted successfully');
        }
    });
}

function updateAllUI() {
    updateStats();
    renderNameTiles();
    renderTopTen();
    renderMasterTable();
    if (isSuperAdmin()) renderLoginHistoryTable();
}

// ==================== EVENT LISTENERS ====================

function setupEvents() {
    // Student form submission
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = parseInt(document.getElementById('editId').value);
            const name = document.getElementById('stdName').value.trim();
            const symbol = document.getElementById('stdSymbol').value.trim();
            const dob = document.getElementById('stdDob').value;
            const gpa = parseFloat(document.getElementById('stdGpa').value);
            
            if (!name || !symbol || !dob || isNaN(gpa) || gpa < 0 || gpa > 4) {
                showToast('<i class="bx bx-x-circle"></i> Invalid data', true);
                return;
            }
            
            if (id) {
                const idx = studentsData.findIndex(s => s.id === id);
                if (idx !== -1) {
                    studentsData[idx] = { ...studentsData[idx], name, symbol, dob, gpa };
                    showToast('<i class="bx bx-check-circle"></i> Student updated successfully');
                }
            } else {
                studentsData.push({ id: nextId++, name, symbol, dob, gpa });
                showToast('<i class="bx bx-check-circle"></i> Student added successfully');
            }
            saveStudents();
            updateAllUI();
            document.getElementById('studentModal').style.display = 'none';
            studentForm.reset();
        });
    }
    
    // Add student button
    const addStdBtn = document.getElementById('addStdBtn');
    if (addStdBtn) {
        addStdBtn.addEventListener('click', () => {
            const form = document.getElementById('studentForm');
            if (form) form.reset();
            document.getElementById('editId').value = '';
            document.getElementById('modalTitle').innerHTML = '<i class="bx bx-plus-circle"></i> Add New Student';
            document.getElementById('studentModal').style.display = 'flex';
        });
    }
    
    // Close modal
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('studentModal').style.display = 'none';
        });
    }
    
    // Navigation buttons
    const dashboardBtn = document.getElementById('dashboardBtn');
    const studentsBtn = document.getElementById('studentsBtn');
    const historyBtn = document.getElementById('historyBtn');
    const dashboardPanel = document.getElementById('dashboardPanel');
    const studentsPanel = document.getElementById('studentsPanel');
    const historyPanel = document.getElementById('historyPanel');
    const navDashboard = document.getElementById('navDashboard');
    const navStudents = document.getElementById('navStudents');
    const navLoginHistory = document.getElementById('navLoginHistory');
    
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (dashboardPanel) dashboardPanel.style.display = 'block';
            if (studentsPanel) studentsPanel.style.display = 'none';
            if (historyPanel) historyPanel.style.display = 'none';
            if (navDashboard) navDashboard.classList.add('active');
            if (navStudents) navStudents.classList.remove('active');
            if (navLoginHistory) navLoginHistory.classList.remove('active');
        });
    }
    
    if (studentsBtn) {
        studentsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (dashboardPanel) dashboardPanel.style.display = 'none';
            if (studentsPanel) studentsPanel.style.display = 'block';
            if (historyPanel) historyPanel.style.display = 'none';
            if (navStudents) navStudents.classList.add('active');
            if (navDashboard) navDashboard.classList.remove('active');
            if (navLoginHistory) navLoginHistory.classList.remove('active');
            setTimeout(() => { if (masterDataTable) masterDataTable.columns.adjust(); }, 100);
        });
    }
    
    if (historyBtn) {
        historyBtn.addEventListener('click', (e) => {
            if (!isSuperAdmin()) {
                showToast('<i class="bx bx-lock-alt"></i> Access denied. Super Admin only!', true);
                return;
            }
            e.preventDefault();
            if (dashboardPanel) dashboardPanel.style.display = 'none';
            if (studentsPanel) studentsPanel.style.display = 'none';
            if (historyPanel) historyPanel.style.display = 'block';
            if (navLoginHistory) navLoginHistory.classList.add('active');
            if (navDashboard) navDashboard.classList.remove('active');
            if (navStudents) navStudents.classList.remove('active');
            renderLoginHistoryTable();
        });
    }
    
    // Logout
    const logoutGlobal = document.getElementById('logoutGlobal');
    if (logoutGlobal) logoutGlobal.addEventListener('click', () => logout());
    
    // Sidebar toggle
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (toggleBtn && sidebar && overlay) {
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('mobile-open');
                overlay.classList.toggle('active');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
        });
    }
    
    // Close modal on overlay click
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('studentModal');
        if (modal && e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Global search
    const globalSearch = document.getElementById('globalSearchInput');
    if (globalSearch) {
        globalSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            if (masterDataTable) {
                masterDataTable.search(term).draw();
            }
            const dashboardPanelEl = document.getElementById('dashboardPanel');
            if (dashboardPanelEl && dashboardPanelEl.style.display !== 'none') {
                document.querySelectorAll('.student-name-tile').forEach(tile => {
                    const text = tile.innerText.toLowerCase();
                    tile.style.display = text.includes(term) ? 'flex' : 'none';
                });
            }
        });
    }
}

// ==================== INITIALIZATION ====================

function initializeDashboard() {
    loadStudents();
    loadLoginHistory();
    updateAllUI();
    setupEvents();
    updateUserUI();
    if (typeof AOS !== 'undefined') AOS.init();
    
    if (isSuperAdmin()) {
        showToast(`<i class='bx bx-crown'></i> Welcome Super Admin! Total logins recorded: ${loginHistory.length}`);
    } else {
        showToast(`<i class='bx bxs-graduation'></i> Welcome to Student Management System!`);
    }
}

// ==================== START APPLICATION ====================
loadUsers();
if (isLoggedIn()) {
    initializeDashboard();
} else {
    showAuthModal();
}
