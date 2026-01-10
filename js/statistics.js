// Statistics Calculation Functions

function updateStatistics() {
    const stats = {
        pending: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
        partiallyCompleted: 0
    };

    allReports.forEach(report => {
        if (!report.status) return;
        
        const status = report.status.toLowerCase().replace(/\s+/g, '');
        
        switch(status) {
            case 'pending':
                stats.pending++;
                break;
            case 'scheduled':
                stats.scheduled++;
                break;
            case 'inprogress':
            case 'in progress':
                stats.inProgress++;
                break;
            case 'completed':
                stats.completed++;
                break;
            case 'partiallycompleted':
            case 'partially completed':
                stats.partiallyCompleted++;
                break;
            case 'rejected':
                stats.rejected++;
                break;
        }
    });

    // Update DOM
    document.getElementById('pendingCount').textContent = stats.pending;
    document.getElementById('scheduledCount').textContent = stats.scheduled;
    document.getElementById('inProgressCount').textContent = stats.inProgress;
    document.getElementById('partialCount').textContent = stats.partiallyCompleted;
    document.getElementById('completedCount').textContent = stats.completed;
    document.getElementById('rejectedCount').textContent = stats.rejected;
    document.getElementById('totalCount').textContent = allReports.length;
    
    // Active issues
    const activeCount = stats.pending + stats.scheduled + stats.inProgress + stats.partiallyCompleted;
    document.getElementById('activeCount').textContent = activeCount;
}

function updateUsersList() {
    const userCounts = {};
    allReports.forEach(report => {
        const user = report.reportedByName || report.reportedBy || 'Unknown';
        userCounts[user] = (userCounts[user] || 0) + 1;
    });

    const sortedUsers = Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const listHtml = sortedUsers.map(([user, count]) => `
        <div class="list-item">
            <span><i class="bi bi-person-fill"></i> ${user}</span>
            <span class="badge bg-info rounded-pill">${count}</span>
        </div>
    `).join('');

    document.getElementById('usersList').innerHTML = listHtml || 
        '<div class="text-center text-muted p-3">No user data</div>';
}

function updateScheduledList() {
    const scheduledReports = allReports.filter(r => 
        r.status && r.status.toLowerCase() === 'scheduled' && r.scheduledDate
    );

    if (scheduledReports.length === 0) {
        document.getElementById('scheduledList').innerHTML = 
            '<div class="text-center text-muted p-3">No scheduled maintenance</div>';
        return;
    }

    scheduledReports.sort((a, b) => {
        const dateA = new Date(a.scheduledDate);
        const dateB = new Date(b.scheduledDate);
        return dateA - dateB;
    });

    const listHtml = scheduledReports.map(report => {
        const priorityClass = `priority-${(report.priority || 'medium').toLowerCase()}`;
        const assignedTo = report.assignedToName || report.assignedTo || 'Not assigned';
        
        return `
            <div class="list-item">
                <div>
                    <strong>${report.title || 'Untitled'}</strong>
                    <br>
                    <small class="text-muted">
                        <i class="bi bi-calendar"></i> ${report.scheduledDate} 
                        ${report.scheduledTime ? 'at ' + report.scheduledTime : ''}
                    </small>
                    <br>
                    <small class="text-muted">
                        <i class="bi bi-geo-alt"></i> ${report.location || 'Unknown'} • ${report.campus || 'Unknown'}
                    </small>
                    <br>
                    <small class="text-muted">
                        <i class="bi bi-person"></i> Assigned: ${assignedTo}
                    </small>
                </div>
                <span class="priority-badge ${priorityClass}">
                    ${(report.priority || 'Medium').toUpperCase()}
                </span>
            </div>
        `;
    }).join('');

    document.getElementById('scheduledList').innerHTML = listHtml;
}

function updatePhotoStats() {
    let withPhoto = 0;
    let completionPhoto = 0;
    let noPhoto = 0;

    allReports.forEach(report => {
        const hasReportPhoto = report.photoUrl || report.photoBase64;
        const hasCompletionPhoto = report.completionPhotoBase64;

        if (hasReportPhoto) withPhoto++;
        if (hasCompletionPhoto) completionPhoto++;
        if (!hasReportPhoto && !hasCompletionPhoto) noPhoto++;
    });

    document.getElementById('withPhotoCount').textContent = withPhoto;
    document.getElementById('completionPhotoCount').textContent = completionPhoto;
    document.getElementById('noPhotoCount').textContent = noPhoto;
}

function formatDuration(ms) {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Less than 1 hour';
}