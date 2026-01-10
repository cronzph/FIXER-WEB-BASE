// Authentication Functions

function initAuth() {
    console.log('Initializing authentication...');
    
    // Check if user is logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in, verify they're an admin
            verifyAdminAccess(user);
        } else {
            // No user signed in, redirect to login
            console.log('No user logged in, redirecting to login page');
            redirectToLogin();
        }
    });
}

async function verifyAdminAccess(user) {
    try {
        console.log('Verifying admin access for user:', user.email);
        
        // Check if email is verified
        if (!user.emailVerified) {
            console.log('Email not verified');
            showAuthError('Your email address is not verified. Please verify your email and login again.');
            setTimeout(() => {
                auth.signOut();
                redirectToLogin();
            }, 3000);
            return;
        }
        
        // Get user data from database
        const snapshot = await database.ref(`users/${user.uid}`).once('value');
        
        if (!snapshot.exists()) {
            console.log('User data not found');
            showAuthError('User data not found. Please contact administrator.');
            setTimeout(() => {
                auth.signOut();
                redirectToLogin();
            }, 3000);
            return;
        }
        
        const userData = snapshot.val();
        
        // Check if user is admin
        if (userData.role !== 'ADMIN') {
            console.log('User is not admin:', userData.role);
            showAuthError('Access denied. Admin privileges required.');
            logSecurityEvent('unauthorized_access', `Non-admin user attempted to access dashboard: ${user.email}`);
            setTimeout(() => {
                auth.signOut();
                redirectToLogin();
            }, 3000);
            return;
        }
        
        // Check if user is approved
        if (!userData.approved) {
            console.log('User not approved');
            showAuthError('Your account is pending approval. Please wait for administrator approval.');
            setTimeout(() => {
                auth.signOut();
                redirectToLogin();
            }, 3000);
            return;
        }
        
        // Check if user role is active
        if (!userData.roleActive) {
            console.log('User role is not active');
            showAuthError('Your account has been deactivated. Please contact administrator.');
            setTimeout(() => {
                auth.signOut();
                redirectToLogin();
            }, 3000);
            return;
        }
        
        // All checks passed, user is authenticated admin
        console.log('Admin access verified successfully');
        
        // Update last access time
        await database.ref(`users/${user.uid}`).update({
            lastAccess: Date.now()
        });
        
        // Store user info globally
        window.currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: userData.displayName || user.email,
            role: userData.role
        };
        
        // Display user info in header
        displayUserInfo();
        
        // Load dashboard data
        loadReportsData();
        
    } catch (error) {
        console.error('Error verifying admin access:', error);
        showAuthError('Failed to verify access. Please try again.');
        setTimeout(() => {
            auth.signOut();
            redirectToLogin();
        }, 3000);
    }
}

function redirectToLogin() {
    // Redirect to login page
    window.location.href = 'admin-login.html';
}

function logSecurityEvent(eventType, details) {
    const securityEvent = {
        email: window.currentUser ? window.currentUser.email : 'unknown',
        eventType: eventType,
        details: details,
        timestamp: Date.now(),
        deviceInfo: navigator.userAgent,
        platform: 'web'
    };

    database.ref('security_events').push(securityEvent);
}

function showAuthError(message) {
    document.getElementById('loadingSpinner').innerHTML = `
        <div class="text-center">
            <i class="bi bi-exclamation-triangle text-warning" style="font-size: 4rem;"></i>
            <p class="mt-3 text-white fw-bold">Authentication Failed</p>
            <p class="text-white">${message}</p>
            <div class="mt-3">
                <div class="spinner-border text-light" role="status">
                    <span class="visually-hidden">Redirecting...</span>
                </div>
                <p class="text-white mt-2">Redirecting to login...</p>
            </div>
        </div>
    `;
}

function displayUserInfo() {
    // This function displays user info in the header
    if (window.currentUser) {
        console.log('Logged in as:', window.currentUser.email);
        
        const userInfoBadge = document.getElementById('userInfoBadge');
        const userEmailDisplay = document.getElementById('userEmailDisplay');
        
        if (userInfoBadge && userEmailDisplay) {
            userEmailDisplay.textContent = window.currentUser.email;
            userInfoBadge.style.display = 'inline-flex';
        }
    }
}