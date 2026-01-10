// Main Application Initialization

function initDashboard() {
    console.log('Initializing dashboard...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup Reports Modal
    setupReportsModal();
    
    // Initialize authentication (will check if user is logged in)
    initAuth();
}

function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        refreshData();
    });
    
    // View Reports button
    document.getElementById('viewReportsBtn').addEventListener('click', () => {
        openReportsView();
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        handleLogout();
    });
}

function handleLogout() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
        // Clear local storage
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_remember');
        
        // Sign out from Firebase
        auth.signOut().then(() => {
            console.log('User signed out successfully');
            // Redirect to login page
            window.location.href = 'admin-login.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
            alert('Error logging out. Please try again.');
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);