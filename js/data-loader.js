// Data Loading Functions

function loadReportsData() {
    console.log('Loading reports from Firebase...');
    
    database.ref('maintenance_reports').once('value')
        .then(snapshot => {
            allReports = [];
            
            snapshot.forEach(childSnapshot => {
                const report = childSnapshot.val();
                report.reportId = childSnapshot.key;
                allReports.push(report);
            });
            
            console.log('Loaded reports:', allReports.length);
            
            // Update last update time
            const now = new Date();
            document.getElementById('lastUpdate').textContent = 
                'Last updated: ' + now.toLocaleString();
            
            processData();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            showLoadError(error.message);
        });
}

function showLoadError(message) {
    document.getElementById('loadingSpinner').innerHTML = `
        <div class="text-center">
            <i class="bi bi-exclamation-triangle text-warning" style="font-size: 4rem;"></i>
            <p class="mt-3 text-white fw-bold">Failed to load data</p>
            <p class="text-white">${message}</p>
            <button class="btn btn-light" onclick="location.reload()">Try Again</button>
        </div>
    `;
}

function processData() {
    // Hide loading, show content
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';

    // Update statistics
    updateStatistics();
    
    // Create all charts
    createStatusChart();
    createPriorityChart();
    createLocationsChart();
    createTimelineChart();
    createDepartmentChart();
    createCompletionTimeChart();
    
    // Update lists
    updateUsersList();
    updateScheduledList();
    updatePhotoStats();
}

function refreshData() {
    document.getElementById('loadingSpinner').style.display = 'flex';
    document.getElementById('dashboardContent').style.display = 'none';
    loadReportsData();
}