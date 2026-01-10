// Reports Modal Functions

function setupReportsModal() {
    const modal = document.getElementById('reportsViewModal');
    const closeBtn = document.querySelector('.close-reports');
    
    closeBtn.onclick = () => modal.style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
    
    // Search functionality
    document.getElementById('reportSearch').addEventListener('input', (e) => {
        currentFilters.search = e.target.value.toLowerCase();
        filterAndDisplayReports();
    });
    
    // Status filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilters.status = chip.getAttribute('data-status');
            filterAndDisplayReports();
        });
    });
    
    // Priority filter
    document.getElementById('priorityFilter').addEventListener('change', (e) => {
        currentFilters.priority = e.target.value;
        filterAndDisplayReports();
    });
    
    // Location filter
    document.getElementById('locationFilter').addEventListener('change', (e) => {
        currentFilters.location = e.target.value;
        filterAndDisplayReports();
    });
}

function openReportsView() {
    const modal = document.getElementById('reportsViewModal');
    modal.style.display = 'block';
    
    populateLocationFilter();
    filterAndDisplayReports();
}

function populateLocationFilter() {
    const locationFilter = document.getElementById('locationFilter');
    const locations = [...new Set(allReports.map(r => r.location))].sort();
    
    locationFilter.innerHTML = '<option value="all">All Locations</option>';
    locations.forEach(location => {
        if (location) {
            locationFilter.innerHTML += `<option value="${location}">${location}</option>`;
        }
    });
}

function filterAndDisplayReports() {
    let filtered = allReports.filter(report => {
        // Status filter
        if (currentFilters.status !== 'all') {
            const reportStatus = (report.status || '').toLowerCase().replace(/\s+/g, '');
            const filterStatus = currentFilters.status.toLowerCase().replace(/\s+/g, '');
            if (reportStatus !== filterStatus) return false;
        }
        
        // Priority filter
        if (currentFilters.priority !== 'all') {
            if ((report.priority || '').toLowerCase() !== currentFilters.priority) return false;
        }
        
        // Location filter
        if (currentFilters.location !== 'all') {
            if (report.location !== currentFilters.location) return false;
        }
        
        // Search filter
        if (currentFilters.search) {
            const searchText = currentFilters.search;
            const searchIn = `${report.title} ${report.description} ${report.location} ${report.reportedBy} ${report.reportedByName}`.toLowerCase();
            if (!searchIn.includes(searchText)) return false;
        }
        
        return true;
    });
    
    // Update counts
    document.getElementById('filteredCount').textContent = filtered.length;
    document.getElementById('totalReportsCount').textContent = allReports.length;
    
    // Display reports
    displayReportCards(filtered);
}

function displayReportCards(reports) {
    const container = document.getElementById('reportsList');
    
    if (reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox" style="font-size: 64px; color: #ddd;"></i>
                <h3>No reports found</h3>
                <p>Try adjusting your filters or search query</p>
            </div>
        `;
        return;
    }
    
    reports.sort((a, b) => b.createdAt - a.createdAt);
    
    const dateFormat = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    container.innerHTML = reports.map(report => {
        const statusColor = getStatusColor(report.status);
        const priorityColor = getPriorityColor(report.priority);
        const hasPhoto = report.photoBase64 && report.photoBase64.length > 0;
        const hasCompletionPhoto = report.completionPhotoBase64 && report.completionPhotoBase64.length > 0;
        const reporterName = report.reportedByName || report.reportedBy || 'Unknown';
        
        let photoPreview = '';
        if (hasPhoto) {
            photoPreview = `
                <div style="margin-top: 10px;">
                    <img src="data:image/jpeg;base64,${report.photoBase64}" 
                         style="max-width: 100%; max-height: 200px; border-radius: 8px; cursor: pointer;" 
                         onclick="viewReportPhoto('${report.reportId}', 'report')"
                         title="Click to view full size">
                </div>
            `;
        }
        
        return `
            <div class="report-card" style="border-left-color: ${statusColor}">
                <div class="report-card-header">
                    <div style="flex: 1;">
                        <div class="report-title">${report.title || 'Untitled Report'}</div>
                        <div style="font-size: 13px; color: #999;">
                            <i class="bi bi-calendar"></i> ${dateFormat.format(new Date(report.createdAt))}
                            ${report.scheduledDate ? `<br><i class="bi bi-calendar-check"></i> Scheduled: ${report.scheduledDate} ${report.scheduledTime || ''}` : ''}
                        </div>
                    </div>
                    <div class="report-badges">
                        <span class="badge-status" style="background: ${statusColor}; color: white;">
                            ${(report.status || 'Pending').toUpperCase()}
                        </span>
                        <span class="badge-priority" style="background: ${priorityColor}; color: white;">
                            ${(report.priority || 'Medium').toUpperCase()}
                        </span>
                    </div>
                </div>
                
                <div class="report-details">
                    <div><strong>Description:</strong> ${report.description || 'No description'}</div>
                    <div><strong>Location:</strong> ${report.location || 'Unknown'} • ${report.campus || 'Unknown Campus'}</div>
                    ${report.department ? `<div><strong>Department:</strong> ${report.department}</div>` : ''}
                    <div><strong>Reported by:</strong> ${reporterName}</div>
                    ${report.assignedTo ? `<div><strong>Assigned to:</strong> ${report.assignedToName || report.assignedTo}</div>` : ''}
                    ${report.rejectionReason ? `<div style="color: #e74c3c;"><strong>Rejection Reason:</strong> ${report.rejectionReason}</div>` : ''}
                    ${report.partialCompletionNotes ? `<div style="color: #f39c12;"><strong>Partial Notes:</strong> ${report.partialCompletionNotes}</div>` : ''}
                    ${photoPreview}
                </div>
                
                <div class="report-actions">
                    <button class="action-btn btn-chat" onclick="openReportChat('${report.reportId}', '${report.title.replace(/'/g, "\\'")}')">
                        <i class="bi bi-chat-dots"></i> Open Chat
                    </button>
                <button class="action-btn btn-view" onclick="viewReportDetails('${report.reportId}')">
                        <i class="bi bi-eye"></i> View Full Details
                    </button>
                    <button class="action-btn btn-primary" onclick="showUpdateStatusDialog('${report.reportId}')">
                        <i class="bi bi-arrow-repeat"></i> Update Status
                    </button>
                    <button class="action-btn btn-warning" onclick="showUpdatePriorityDialog('${report.reportId}')">
                        <i class="bi bi-exclamation-triangle"></i> Update Priority
                    </button>
                    <button class="action-btn btn-info" onclick="showSetScheduleDialog('${report.reportId}')">
                        <i class="bi bi-calendar-plus"></i> Set Schedule
                    </button>
                    <button class="action-btn btn-secondary" onclick="showActionHistory('${report.reportId}')">
                        <i class="bi bi-clock-history"></i> View History
                    </button>
                    ${hasPhoto ? `<button class="action-btn btn-view" onclick="viewReportPhoto('${report.reportId}', 'report')">
                        <i class="bi bi-camera"></i> View Report Photo
                    </button>` : ''}
                    ${hasCompletionPhoto ? `<button class="action-btn btn-view" onclick="viewReportPhoto('${report.reportId}', 'completion')">
                        <i class="bi bi-check-circle"></i> View Completion Photo
                    </button>` : ''}
                    <button class="action-btn btn-export" onclick="exportSingleReport('${report.reportId}')">
                        <i class="bi bi-file-pdf"></i> Export PDF
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getStatusColor(status) {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return '#10b981';
    if (s === 'partially completed') return '#8b5cf6';
    if (s === 'in progress') return '#2563eb';
    if (s === 'scheduled') return '#06b6d4';
    if (s === 'rejected') return '#ef4444';
    return '#f59e0b';
}

function getPriorityColor(priority) {
    const p = (priority || '').toLowerCase();
    if (p === 'critical') return '#991b1b';
    if (p === 'high') return '#f59e0b';
    if (p === 'medium') return '#eab308';
    return '#06b6d4';
}

function viewReportDetails(reportId) {
    const report = allReports.find(r => r.reportId === reportId);
    if (!report) return;
    
    const dateFormat = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let detailsHTML = `
        <div style="max-height: 70vh; overflow-y: auto; padding: 20px;">
            <h3>${report.title || 'Untitled Report'}</h3>
            <hr>
            
            <h5>📝 Report Information</h5>
            <p><strong>Description:</strong> ${report.description || 'No description'}</p>
            <p><strong>Location:</strong> ${report.location || 'Unknown'}</p>
            <p><strong>Campus:</strong> ${report.campus || 'Unknown'}</p>
            ${report.department ? `<p><strong>Department:</strong> ${report.department}</p>` : ''}
            <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(report.priority)}; font-weight: bold;">${(report.priority || 'Medium').toUpperCase()}</span></p>
            <p><strong>Status:</strong> <span style="color: ${getStatusColor(report.status)}; font-weight: bold;">${(report.status || 'Pending').toUpperCase()}</span></p>
            
            <hr>
            <h5>📅 Timeline</h5>
            <p><strong>Created:</strong> ${dateFormat.format(new Date(report.createdAt))}</p>
            <p><strong>Reported by:</strong> ${report.reportedByName || report.reportedBy || 'Unknown'}</p>
            
            ${report.scheduledDate ? `
                <p><strong>Scheduled:</strong> ${report.scheduledDate} ${report.scheduledTime || ''}</p>
                ${report.scheduledByName ? `<p><strong>Scheduled by:</strong> ${report.scheduledByName}</p>` : ''}
            ` : ''}
            
            ${report.assignedTo ? `
                <p><strong>Assigned to:</strong> ${report.assignedToName || report.assignedTo}</p>
            ` : ''}
            
            ${report.completedAt > 0 ? `
                <p><strong>Completed:</strong> ${dateFormat.format(new Date(report.completedAt))}</p>
                ${report.completedByName ? `<p><strong>Completed by:</strong> ${report.completedByName}</p>` : ''}
                <p><strong>Duration:</strong> ${formatDuration(report.completedAt - report.createdAt)}</p>
            ` : ''}
            
            ${report.rejectedAt > 0 ? `
                <hr>
                <h5 style="color: #e74c3c;">❌ Rejection Details</h5>
                <p><strong>Rejected:</strong> ${dateFormat.format(new Date(report.rejectedAt))}</p>
                ${report.rejectedByName ? `<p><strong>Rejected by:</strong> ${report.rejectedByName}</p>` : ''}
                <p><strong>Reason:</strong> ${report.rejectionReason || 'No reason provided'}</p>
            ` : ''}
            
            ${report.partialCompletionNotes ? `
                <hr>
                <h5 style="color: #f39c12;">⚠️ Partial Completion</h5>
                <p>${report.partialCompletionNotes}</p>
            ` : ''}
            
            ${(report.photoBase64 || report.completionPhotoBase64) ? `
                <hr>
                <h5>📷 Attachments</h5>
                ${report.photoBase64 ? '<p>✅ Report Photo Available <button onclick="viewReportPhoto(\'' + report.reportId + '\', \'report\')" style="margin-left: 10px; padding: 5px 15px; border: none; background: #3498db; color: white; border-radius: 5px; cursor: pointer;">View</button></p>' : ''}
                ${report.completionPhotoBase64 ? '<p>✅ Completion Photo Available <button onclick="viewReportPhoto(\'' + report.reportId + '\', \'completion\')" style="margin-left: 10px; padding: 5px 15px; border: none; background: #10b981; color: white; border-radius: 5px; cursor: pointer;">View</button></p>' : ''}
            ` : ''}
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div style="background: white; border-radius: 15px; max-width: 800px; width: 90%;">
            ${detailsHTML}
            <div style="padding: 20px; text-align: right; border-top: 1px solid #eee;">
               
            <button onclick="openReportChat('${report.reportId}', '${report.title.replace(/'/g, "\\'")}'); this.closest('[style*=fixed]').remove();" 
                        style="padding: 10px 30px; background: #9b59b6; color: white; border: none; border-radius: 20px; cursor: pointer;">
                    <i class="bi bi-chat-dots"></i> Open Chat
                </button>
            
            <button onclick="this.closest('[style*=fixed]').remove()" style="padding: 10px 30px; background: #667eea; color: white; border: none; border-radius: 20px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);







}

function viewReportPhoto(reportId, type) {
    const report = allReports.find(r => r.reportId === reportId);
    if (!report) return;
    
    const photoData = type === 'completion' ? report.completionPhotoBase64 : report.photoBase64;
    if (!photoData) {
        showToast(`No ${type} photo available`);
        return;
    }
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;';
    
    const title = document.createElement('div');
    title.style.cssText = 'color: white; font-size: 20px; margin-bottom: 20px; text-align: center; padding: 10px;';
    title.textContent = type === 'completion' ? '✅ Completion Photo' : '📷 Report Photo';
    modal.appendChild(title);
    
    const img = document.createElement('img');
    img.src = `data:image/jpeg;base64,${photoData}`;
    img.style.cssText = 'max-width: 90%; max-height: 80%; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);';
    modal.appendChild(img);
    
    const closeText = document.createElement('div');
    closeText.style.cssText = 'color: white; font-size: 14px; margin-top: 20px; opacity: 0.8;';
    closeText.textContent = 'Click anywhere to close';
    modal.appendChild(closeText);
    
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

function resetFilters() {
    currentFilters = {
        status: 'all',
        priority: 'all',
        location: 'all',
        search: ''
    };
    
    document.getElementById('reportSearch').value = '';
    document.getElementById('priorityFilter').value = 'all';
    document.getElementById('locationFilter').value = 'all';
    
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-status="all"]').classList.add('active');
    
    filterAndDisplayReports();
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #333; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10001; animation: slideIn 0.3s ease-out;';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// NEW FUNCTIONS: Update Status, Priority, Schedule, History
// ============================================

function showUpdateStatusDialog(reportId) {
    const report = allReports.find(r => r.reportId === reportId);
    if (!report) return;
    
    const currentStatus = (report.status || 'pending').toLowerCase();
    const allStatuses = ['pending', 'scheduled', 'in progress', 'completed', 'partially completed', 'rejected'];
    
    // Filter available status options based on current status
    let availableStatuses = allStatuses.filter(status => {
        if (status === currentStatus) return false;
        if (status === 'rejected' && currentStatus !== 'pending') return false;
        if (status === 'pending' && currentStatus !== 'completed' && currentStatus !== 'partially completed' && currentStatus !== 'rejected') return false;
        if (currentStatus === 'rejected' && status !== 'pending') return false;
        if ((currentStatus === 'completed' || currentStatus === 'partially completed') && 
            status !== 'pending' && status !== 'scheduled' && status !== 'in progress') return false;
        if (status === 'scheduled' && currentStatus === 'in progress') return false;
        return true;
    });
    
    if (availableStatuses.length === 0) {
        showToast('No status changes available for this report');
        return;
    }
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%;';
    
    content.innerHTML = `
        <h3 style="margin-top: 0;">Update Status</h3>
        <p style="color: #666; margin-bottom: 20px;">Current Status: <strong>${currentStatus.toUpperCase()}</strong></p>
        <p style="margin-bottom: 15px;">Select new status:</p>
        <select id="newStatusSelect" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; margin-bottom: 20px;">
            <option value="">-- Select Status --</option>
            ${availableStatuses.map(s => `<option value="${s}">${s.toUpperCase()}</option>`).join('')}
        </select>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancelStatusBtn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">Cancel</button>
            <button id="updateStatusBtn" style="padding: 10px 20px; border: none; background: #667eea; color: white; border-radius: 5px; cursor: pointer;">Update</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('cancelStatusBtn').onclick = () => modal.remove();
    document.getElementById('updateStatusBtn').onclick = () => {
        const newStatus = document.getElementById('newStatusSelect').value;
        if (!newStatus) {
            showToast('Please select a status');
            return;
        }
        
        if (newStatus === 'rejected') {
            modal.remove();
            showRejectReasonDialog(reportId);
        } else if (newStatus === 'scheduled') {
            modal.remove();
            showSetScheduleDialog(reportId);
        } else if (newStatus === 'completed' || newStatus === 'partially completed') {
            showToast(`${newStatus.toUpperCase()} status requires completion through technician interface`);
            modal.remove();
        } else {
            updateReportStatus(reportId, newStatus);
            modal.remove();
        }
    };
}

function showRejectReasonDialog(reportId) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%;';
    
    content.innerHTML = `
        <h3 style="margin-top: 0; color: #e74c3c;">Reject Report</h3>
        <p style="margin-bottom: 15px;">Please provide a reason for rejecting this report:</p>
        <textarea id="rejectReasonText" style="width: 100%; min-height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; resize: vertical; margin-bottom: 20px;" placeholder="Enter rejection reason (required)"></textarea>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancelRejectBtn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">Cancel</button>
            <button id="confirmRejectBtn" style="padding: 10px 20px; border: none; background: #e74c3c; color: white; border-radius: 5px; cursor: pointer;">Reject Report</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('cancelRejectBtn').onclick = () => modal.remove();
    document.getElementById('confirmRejectBtn').onclick = () => {
        const reason = document.getElementById('rejectReasonText').value.trim();
        if (!reason) {
            showToast('Please provide a rejection reason');
            return;
        }
        updateReportStatusWithReason(reportId, 'rejected', reason);
        modal.remove();
    };
}

function updateReportStatus(reportId, newStatus) {
    showToast('Updating status...');
    
    // In a real app, this would make a Firebase call
    // For now, we'll simulate it
    const report = allReports.find(r => r.reportId === reportId);
    if (report) {
        report.status = newStatus;
        filterAndDisplayReports();
        showToast(`Status updated to ${newStatus.toUpperCase()}`);
    }
}

function updateReportStatusWithReason(reportId, newStatus, reason) {
    showToast('Rejecting report...');
    
    const report = allReports.find(r => r.reportId === reportId);
    if (report) {
        report.status = newStatus;
        report.rejectionReason = reason;
        report.rejectedAt = Date.now();
        filterAndDisplayReports();
        showToast('Report rejected successfully');
    }
}

function showUpdatePriorityDialog(reportId) {
    const report = allReports.find(r => r.reportId === reportId);
    if (!report) return;
    
    const currentPriority = (report.priority || 'medium').toLowerCase();
    const allPriorities = ['low', 'medium', 'high', 'critical'];
    const availablePriorities = allPriorities.filter(p => p !== currentPriority);
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%;';
    
    content.innerHTML = `
        <h3 style="margin-top: 0;">Update Priority Level</h3>
        <p style="color: #666; margin-bottom: 20px;">Current Priority: <strong style="color: ${getPriorityColor(report.priority)};">${currentPriority.toUpperCase()}</strong></p>
        <p style="margin-bottom: 15px;">Select new priority level:</p>
        <select id="newPrioritySelect" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; margin-bottom: 20px;">
            <option value="">-- Select Priority --</option>
            ${availablePriorities.map(p => `<option value="${p}">${p.toUpperCase()}</option>`).join('')}
        </select>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancelPriorityBtn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">Cancel</button>
            <button id="updatePriorityBtn" style="padding: 10px 20px; border: none; background: #667eea; color: white; border-radius: 5px; cursor: pointer;">Update</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('cancelPriorityBtn').onclick = () => modal.remove();
    document.getElementById('updatePriorityBtn').onclick = () => {
        const newPriority = document.getElementById('newPrioritySelect').value;
        if (!newPriority) {
            showToast('Please select a priority level');
            return;
        }
        
        if (newPriority === 'critical') {
            modal.remove();
            showCriticalPriorityConfirmation(reportId, newPriority);
        } else if (newPriority === 'high') {
            modal.remove();
            showHighPriorityConfirmation(reportId, newPriority);
        } else {
            updateReportPriority(reportId, newPriority);
            modal.remove();
        }
    };
}

function showCriticalPriorityConfirmation(reportId, newPriority) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; z-index: 10001; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%;';
    
    content.innerHTML = `
        <h3 style="margin-top: 0; color: #991b1b;">⚠️ Confirm CRITICAL Priority</h3>
        <p style="margin-bottom: 15px;">You are updating this report to <strong>CRITICAL</strong> priority.</p>
        <p style="margin-bottom: 10px;"><strong>CRITICAL priority should ONLY be used for:</strong></p>
        <ul style="margin-bottom: 20px; padding-left: 20px;">
            <li>Immediate safety hazards</li>
            <li>Fire/electrical emergencies</li>
            <li>Severe water leaks/flooding</li>
            <li>Complete system failures</li>
        </ul>
        <p style="margin-bottom: 20px;"><strong>Is this issue truly CRITICAL?</strong></p>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancelCriticalBtn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">Cancel</button>
            <button id="confirmCriticalBtn" style="padding: 10px 20px; border: none; background: #991b1b; color: white; border-radius: 5px; cursor: pointer;">Yes, Set to CRITICAL</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('cancelCriticalBtn').onclick = () => modal.remove();
    document.getElementById('confirmCriticalBtn').onclick = () => {
        updateReportPriority(reportId, newPriority);
        modal.remove();
    };
}

function showHighPriorityConfirmation(reportId, newPriority) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; z-index: 10001; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%;';
    
    content.innerHTML = `
        <h3 style="margin-top: 0; color: #f59e0b;">Confirm HIGH Priority</h3>
        <p style="margin-bottom: 15px;">You are updating this report to <strong>HIGH</strong> priority.</p>
        <p style="margin-bottom: 10px;"><strong>HIGH priority should be used for:</strong></p>
        <ul style="margin-bottom: 20px; padding-left: 20px;">
            <li>Issues affecting operations</li>
            <li>Problems impacting multiple users</li>
            <li>Urgent but not emergency situations</li>
        </ul>
        <p style="margin-bottom: 20px;"><strong>Is this the correct priority level?</strong></p>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancelHighBtn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">Cancel</button>
            <button id="confirmHighBtn" style="padding: 10px 20px; border: none; background: #f59e0b; color: white; border-radius: 5px; cursor: pointer;">Yes, Set to HIGH</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('cancelHighBtn').onclick = () => modal.remove();
    document.getElementById('confirmHighBtn').onclick = () => {
        updateReportPriority(reportId, newPriority);
        modal.remove();
    };
}

function updateReportPriority(reportId, newPriority) {
    showToast('Updating priority...');
    
    const report = allReports.find(r => r.reportId === reportId);
    if (report) {
        const oldPriority = report.priority;
        report.priority = newPriority;
        filterAndDisplayReports();
        showToast(`Priority updated: ${oldPriority.toUpperCase()} → ${newPriority.toUpperCase()}`);
    }
}

function showSetScheduleDialog(reportId) {
    const report = allReports.find(r => r.reportId === reportId);
    if (!report) return;
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%;';
    
    const currentDate = report.scheduledDate || '';
    const currentTime = report.scheduledTime || '';
    const currentAssigned = report.assignedTo || '';
    
    content.innerHTML = `
        <h3 style="margin-top: 0;">Set Schedule</h3>
        <p style="margin-bottom: 20px;">Schedule maintenance for: <strong>${report.title}</strong></p>
        
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Date:</label>
        <input type="date" id="scheduleDate" value="${currentDate}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 15px;">
        
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Time:</label>
        <input type="time" id="scheduleTime" value="${currentTime}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 15px;">
        
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Assign To (Optional):</label>
        <input type="text" id="assignedTo" value="${currentAssigned}" placeholder="Technician name" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 20px;">
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancelScheduleBtn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">Cancel</button>
            <button id="saveScheduleBtn" style="padding: 10px 20px; border: none; background: #667eea; color: white; border-radius: 5px; cursor: pointer;">Save Schedule</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('cancelScheduleBtn').onclick = () => modal.remove();
    document.getElementById('saveScheduleBtn').onclick = () => {
        const date = document.getElementById('scheduleDate').value;
        const time = document.getElementById('scheduleTime').value;
        const assignedTo = document.getElementById('assignedTo').value.trim();
        
        if (!date || !time) {
            showToast('Please select both date and time');
            return;
        }
        
        updateReportSchedule(reportId, date, time, assignedTo);
        modal.remove();
    };
}

function updateReportSchedule(reportId, date, time, assignedTo) {
    showToast('Saving schedule...');
    
    const report = allReports.find(r => r.reportId === reportId);
    if (report) {
        report.scheduledDate = date;
        report.scheduledTime = time;
        report.status = 'scheduled';
        if (assignedTo) {
            report.assignedTo = assignedTo;
        }
        filterAndDisplayReports();
        showToast('Schedule saved successfully');
    }
}

function showActionHistory(reportId) {
    const report = allReports.find(r => r.reportId === reportId);
    if (!report) return;
    
    const dateFormat = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let historyHTML = `
        <div style="max-height: 70vh; overflow-y: auto; padding: 20px;">
            <h3>${report.title || 'Untitled Report'}</h3>
            <hr>
            
            <h5>📜 Action History</h5>
            
            <div style="margin: 20px 0;">
                <div style="padding: 10px; background: #f8f9fa; border-left: 3px solid #667eea; margin-bottom: 10px;">
                    <strong>📝 Report Created</strong><br>
                    <small>${dateFormat.format(new Date(report.createdAt))}</small><br>
                    <small>By: ${report.reportedByName || report.reportedBy || 'Unknown'}</small>
                </div>
                
                ${report.scheduledDate ? `
                <div style="padding: 10px; background: #f8f9fa; border-left: 3px solid #06b6d4; margin-bottom: 10px;">
                    <strong>📅 Scheduled</strong><br>
                    <small>${report.scheduledDate} ${report.scheduledTime || ''}</small><br>
                    ${report.scheduledByName ? `<small>By: ${report.scheduledByName}</small>` : ''}
                </div>
                ` : ''}
                
                ${report.assignedTo ? `
                <div style="padding: 10px; background: #f8f9fa; border-left: 3px solid #8b5cf6; margin-bottom: 10px;">
                    <strong>👷 Assigned</strong><br>
                    <small>To: ${report.assignedToName || report.assignedTo}</small>
                </div>
                ` : ''}
                
                ${report.status === 'in progress' ? `
                <div style="padding: 10px; background: #f8f9fa; border-left: 3px solid #2563eb; margin-bottom: 10px;">
                    <strong>🔧 Work Started</strong><br>
                    <small>Status changed to In Progress</small>
                </div>
                ` : ''}
                
                ${report.completedAt > 0 ? `
                <div style="padding: 10px; background: #f8f9fa; border-left: 3px solid #10b981; margin-bottom: 10px;">
                    <strong>${report.status === 'partially completed' ? '⚠️ Partially Completed' : '✅ Completed'}</strong><br>
                    <small>${dateFormat.format(new Date(report.completedAt))}</small><br>
                    ${report.completedByName ? `<small>By: ${report.completedByName}</small>` : ''}
                    ${report.partialCompletionNotes ? `<br><small>Notes: ${report.partialCompletionNotes}</small>` : ''}
                </div>
                ` : ''}
                
                ${report.rejectedAt > 0 ? `
                <div style="padding: 10px; background: #fee; border-left: 3px solid #e74c3c; margin-bottom: 10px;">
                    <strong>❌ Rejected</strong><br>
                    <small>${dateFormat.format(new Date(report.rejectedAt))}</small><br>
                    ${report.rejectedByName ? `<small>By: ${report.rejectedByName}</small><br>` : ''}
                    ${report.rejectionReason ? `<small>Reason: ${report.rejectionReason}</small>` : ''}
                </div>
                ` : ''}
            </div>
            
            <hr>
            <h5>📊 Current Status</h5>
            <p><strong>Status:</strong> <span style="color: ${getStatusColor(report.status)};">${(report.status || 'Pending').toUpperCase()}</span></p>
            <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(report.priority)};">${(report.priority || 'Medium').toUpperCase()}</span></p>
            <p><strong>Location:</strong> ${report.location || 'Unknown'}</p>
            <p><strong>Campus:</strong> ${report.campus || 'Unknown'}</p>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div style="background: white; border-radius: 15px; max-width: 800px; width: 90%;">
            ${historyHTML}
            <div style="padding: 20px; text-align: right; border-top: 1px solid #eee;">
                <button onclick="this.closest('[style*=fixed]').remove()" style="padding: 10px 30px; background: #667eea; color: white; border: none; border-radius: 20px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}