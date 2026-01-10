// Chart Creation Functions

function createStatusChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    if (charts.status) charts.status.destroy();
    
    const statusCounts = {};
    allReports.forEach(report => {
        const status = report.status || 'Pending';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#f59e0b', '#06b6d4', '#2563eb', '#10b981', '#8b5cf6', '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createPriorityChart() {
    const ctx = document.getElementById('priorityChart').getContext('2d');
    
    if (charts.priority) charts.priority.destroy();
    
    const priorityCounts = {
        'Critical': 0,
        'High': 0,
        'Medium': 0,
        'Low': 0
    };
    
    allReports.forEach(report => {
        if (!report.priority) return;
        const priority = report.priority.charAt(0).toUpperCase() + report.priority.slice(1).toLowerCase();
        if (priorityCounts.hasOwnProperty(priority)) {
            priorityCounts[priority]++;
        }
    });

    charts.priority = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(priorityCounts),
            datasets: [{
                label: 'Number of Reports',
                data: Object.values(priorityCounts),
                backgroundColor: ['#ef4444', '#f59e0b', '#eab308', '#06b6d4']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function createLocationsChart() {
    const ctx = document.getElementById('locationsChart').getContext('2d');
    
    if (charts.locations) charts.locations.destroy();
    
    const locationCounts = {};
    allReports.forEach(report => {
        const location = report.location || 'Unknown';
        locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    // Get top 10 locations
    const sortedLocations = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    charts.locations = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedLocations.map(l => l[0]),
            datasets: [{
                label: 'Reports per Location',
                data: sortedLocations.map(l => l[1]),
                backgroundColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function createTimelineChart() {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    
    if (charts.timeline) charts.timeline.destroy();
    
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        last7Days.push(date);
    }
    
    const dailyCounts = new Array(7).fill(0);
    
    allReports.forEach(report => {
        if (!report.createdAt) return;
        
        const reportDate = new Date(report.createdAt);
        reportDate.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < last7Days.length; i++) {
            if (reportDate.getTime() === last7Days[i].getTime()) {
                dailyCounts[i]++;
                break;
            }
        }
    });

    charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(date => {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Reports Created',
                data: dailyCounts,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

function createDepartmentChart() {
    const ctx = document.getElementById('departmentChart').getContext('2d');
    
    if (charts.department) charts.department.destroy();
    
    const deptCounts = {};
    allReports.forEach(report => {
        const dept = report.department || 'Not Specified';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    const sortedDepts = Object.entries(deptCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    charts.department = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: sortedDepts.map(d => d[0]),
            datasets: [{
                data: sortedDepts.map(d => d[1]),
                backgroundColor: [
                    '#ef4444', '#f59e0b', '#eab308', '#10b981', 
                    '#06b6d4', '#2563eb', '#8b5cf6', '#ec4899',
                    '#f97316', '#14b8a6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function createCompletionTimeChart() {
    const completedReports = allReports.filter(r => {
        const status = (r.status || '').toLowerCase();
        return (status === 'completed' || status === 'partially completed') 
            && r.completedAt && r.createdAt;
    });

    if (completedReports.length === 0) {
        document.getElementById('avgCompletionTime').textContent = 'No completed reports yet';
        return;
    }

    const completionTimes = completedReports.map(r => {
        const duration = r.completedAt - r.createdAt;
        return duration / (1000 * 60 * 60 * 24);
    });

    const avgDays = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    
    const hours = Math.floor(avgDays * 24);
    const days = Math.floor(avgDays);
    
    if (days > 0) {
        document.getElementById('avgCompletionTime').textContent = `${days} day${days !== 1 ? 's' : ''}`;
    } else {
        document.getElementById('avgCompletionTime').textContent = `${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    const ctx = document.getElementById('completionTimeChart').getContext('2d');
    
    if (charts.completionTime) charts.completionTime.destroy();
    
    const timeRanges = {
        '< 1 day': 0,
        '1-3 days': 0,
        '3-7 days': 0,
        '> 7 days': 0
    };

    completionTimes.forEach(days => {
        if (days < 1) timeRanges['< 1 day']++;
        else if (days <= 3) timeRanges['1-3 days']++;
        else if (days <= 7) timeRanges['3-7 days']++;
        else timeRanges['> 7 days']++;
    });

    charts.completionTime = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(timeRanges),
            datasets: [{
                label: 'Number of Reports',
                data: Object.values(timeRanges),
                backgroundColor: ['#10b981', '#06b6d4', '#f59e0b', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}