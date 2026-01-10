// PDF Export Functions

function exportSingleReport(reportId) {
    const report = allReports.find(r => r.reportId === reportId);
    if (!report) return;
    
    generatePDF([report], `Report_${report.title.replace(/[^a-z0-9]/gi, '_')}`);
}

function exportFilteredReportsToPDF() {
    let filtered = allReports.filter(report => {
        if (currentFilters.status !== 'all') {
            const reportStatus = (report.status || '').toLowerCase().replace(/\s+/g, '');
            const filterStatus = currentFilters.status.toLowerCase().replace(/\s+/g, '');
            if (reportStatus !== filterStatus) return false;
        }
        
        if (currentFilters.priority !== 'all') {
            if ((report.priority || '').toLowerCase() !== currentFilters.priority) return false;
        }
        
        if (currentFilters.location !== 'all') {
            if (report.location !== currentFilters.location) return false;
        }
        
        if (currentFilters.search) {
            const searchText = currentFilters.search;
            const searchIn = `${report.title} ${report.description} ${report.location} ${report.reportedBy} ${report.reportedByName}`.toLowerCase();
            if (!searchIn.includes(searchText)) return false;
        }
        
        return true;
    });
    
    if (filtered.length === 0) {
        showToast('No reports to export with current filters.');
        return;
    }
    
    const filterDesc = [];
    if (currentFilters.status !== 'all') filterDesc.push(`Status: ${currentFilters.status}`);
    if (currentFilters.priority !== 'all') filterDesc.push(`Priority: ${currentFilters.priority}`);
    if (currentFilters.location !== 'all') filterDesc.push(`Location: ${currentFilters.location}`);
    if (currentFilters.search) filterDesc.push(`Search: "${currentFilters.search}"`);
    
    const filename = filterDesc.length > 0 ? 
        `Filtered_Reports_${filterDesc.join('_').replace(/[^a-z0-9_]/gi, '_')}` :
        'All_Reports';
    
    generatePDF(filtered, filename);
}

function generatePDF(reports, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = margin;
    
    // Show loading message
    const loadingModal = document.createElement('div');
    loadingModal.style.cssText = 'position: fixed; z-index: 10001; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;';
    loadingModal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; max-width: 400px;">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
            <h3 style="margin-top: 20px;">Generating PDF...</h3>
            <p style="color: #666; margin-top: 10px;">Including photos, please wait...</p>
        </div>
    `;
    document.body.appendChild(loadingModal);
    
    const titlePaint = { size: 20, bold: true };
    const headerPaint = { size: 14, bold: true };
    const normalPaint = { size: 11, bold: false };
    const smallPaint = { size: 9, bold: false };
    
    // Title
    doc.setFontSize(titlePaint.size);
    doc.setFont(undefined, 'bold');
    doc.text('Maintenance Reports', margin, yPos);
    yPos += 10;
    
    // Generated date
    doc.setFontSize(smallPaint.size);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
    doc.text(`Total Reports: ${reports.length}`, pageWidth - margin - 50, yPos);
    yPos += 10;
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // Process each report
    for (let index = 0; index < reports.length; index++) {
        const report = reports[index];
        const dateFormat = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Check if we need a new page
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = margin;
        }
        
        // Report number and title
        doc.setFontSize(headerPaint.size);
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${report.title || 'Untitled Report'}`, margin, yPos);
        yPos += 8;
        
        // Status and Priority
        doc.setFontSize(normalPaint.size);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`Status: ${(report.status || 'Pending').toUpperCase()}`, margin + 5, yPos);
        doc.text(`Priority: ${(report.priority || 'Medium').toUpperCase()}`, margin + 80, yPos);
        yPos += 7;
        
        // Report details
        doc.setFont(undefined, 'normal');
        doc.setFontSize(smallPaint.size);
        
        doc.text(`Location: ${report.location || 'Unknown'}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`Campus: ${report.campus || 'Unknown'}`, margin + 5, yPos);
        yPos += 5;
        
        if (report.department) {
            doc.text(`Department: ${report.department}`, margin + 5, yPos);
            yPos += 5;
        }
        
        const description = report.description || 'No description';
        const descLines = doc.splitTextToSize(`Description: ${description}`, contentWidth - 10);
        doc.text(descLines, margin + 5, yPos);
        yPos += (descLines.length * 5) + 3;
        
        doc.text(`Created: ${dateFormat.format(new Date(report.createdAt))}`, margin + 5, yPos);
        yPos += 5;
        
        doc.text(`Reported by: ${report.reportedByName || report.reportedBy || 'Unknown'}`, margin + 5, yPos);
        yPos += 5;
        
        if (report.scheduledDate) {
            doc.text(`Scheduled: ${report.scheduledDate} ${report.scheduledTime || ''}`, margin + 5, yPos);
            yPos += 5;
            
            if (report.scheduledByName) {
                doc.text(`Scheduled by: ${report.scheduledByName}`, margin + 5, yPos);
                yPos += 5;
            }
        }
        
        if (report.assignedTo) {
            doc.text(`Assigned to: ${report.assignedToName || report.assignedTo}`, margin + 5, yPos);
            yPos += 5;
        }
        
        if (report.completedAt > 0) {
            doc.text(`Completed: ${dateFormat.format(new Date(report.completedAt))}`, margin + 5, yPos);
            yPos += 5;
            
            if (report.completedByName) {
                doc.text(`Completed by: ${report.completedByName}`, margin + 5, yPos);
                yPos += 5;
            }
            
            const duration = formatDuration(report.completedAt - report.createdAt);
            doc.text(`Duration: ${duration}`, margin + 5, yPos);
            yPos += 5;
        }
        
        if (report.rejectedAt > 0) {
            doc.text(`Rejected: ${dateFormat.format(new Date(report.rejectedAt))}`, margin + 5, yPos);
            yPos += 5;
            
            if (report.rejectedByName) {
                doc.text(`Rejected by: ${report.rejectedByName}`, margin + 5, yPos);
                yPos += 5;
            }
            
            if (report.rejectionReason) {
                const reasonLines = doc.splitTextToSize(`Reason: ${report.rejectionReason}`, contentWidth - 10);
                doc.text(reasonLines, margin + 5, yPos);
                yPos += (reasonLines.length * 5) + 3;
            }
        }
        
        if (report.partialCompletionNotes) {
            const notesLines = doc.splitTextToSize(`Partial Completion Notes: ${report.partialCompletionNotes}`, contentWidth - 10);
            doc.text(notesLines, margin + 5, yPos);
            yPos += (notesLines.length * 5) + 3;
        }
        
         
      // Add Report Photo
        if (report.photoBase64 && report.photoBase64.length > 0) {
            if (yPos > pageHeight - 100) {
                doc.addPage();
                yPos = margin;
            }
            
            try {
                doc.setFontSize(smallPaint.size);
                doc.setFont(undefined, 'bold');
                doc.text('Report Photo:', margin + 5, yPos);
                yPos += 7;
                
                // DEBUG: Log the photo data
                console.log('Report Photo Debug:', {
                    reportId: report.reportId,
                    hasPhoto: !!report.photoBase64,
                    photoLength: report.photoBase64?.length,
                    firstChars: report.photoBase64?.substring(0, 50),
                    hasNewlines: report.photoBase64?.includes('\n')
                });
                
                // CRITICAL: Remove ALL whitespace characters (newlines, spaces, tabs)
                let cleanBase64 = report.photoBase64.replace(/\s/g, '');
                
                console.log('Cleaned base64:', {
                    cleanLength: cleanBase64.length,
                    firstChars: cleanBase64.substring(0, 50)
                });
                
                // Detect image format from base64 prefix or use PNG as default
                let photoData = cleanBase64;
                let imageFormat = 'JPEG'; // Default to JPEG since your data starts with /9j/
                
                if (!photoData.startsWith('data:image/')) {
                    // If no data URI prefix, detect format
                    if (photoData.startsWith('/9j/')) {
                        imageFormat = 'JPEG';
                        photoData = `data:image/jpeg;base64,${photoData}`;
                    } else if (photoData.startsWith('iVBORw0KGgo')) {
                        imageFormat = 'PNG';
                        photoData = `data:image/png;base64,${photoData}`;
                    } else {
                        // Try JPEG as fallback
                        photoData = `data:image/jpeg;base64,${photoData}`;
                    }
                }
                
                console.log('Final photo data:', {
                    format: imageFormat,
                    dataLength: photoData.length,
                    startsWithData: photoData.startsWith('data:image/')
                });
                
                const imgWidth = contentWidth - 10;
                const imgHeight = 80;
                
                doc.addImage(photoData, imageFormat, margin + 5, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 7;
                
                console.log('✓ Photo added successfully!');
            } catch (error) {
                console.error('✗ Error adding report photo:', error);
                console.error('Error details:', error.message);
                doc.text('(Report photo could not be loaded)', margin + 5, yPos);
                yPos += 5;
            }
        } else {
            console.log('No report photo found for:', report.reportId);
        }
        
        // Add Completion Photo
        if (report.completionPhotoBase64 && report.completionPhotoBase64.length > 0) {
            if (yPos > pageHeight - 100) {
                doc.addPage();
                yPos = margin;
            }
            
            try {
                doc.setFontSize(smallPaint.size);
                doc.setFont(undefined, 'bold');
                doc.text('Completion Photo:', margin + 5, yPos);
                yPos += 7;
                
                const photoData = `data:image/jpeg;base64,${report.completionPhotoBase64}`;
                const imgWidth = contentWidth - 10;
                const imgHeight = 80;
                
                doc.addImage(photoData, 'JPEG', margin + 5, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 7;
            } catch (error) {
                console.error('Error adding completion photo:', error);
                doc.text('(Completion photo could not be loaded)', margin + 5, yPos);
                yPos += 5;
            }
        }
        
        // Separator line
        yPos += 5;
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
    }
    
    // Remove loading modal
    loadingModal.remove();
    
    // Save the PDF
    doc.save(`${filename}_${new Date().getTime()}.pdf`);
    
    // Show success message
    const successModal = document.createElement('div');
    successModal.style.cssText = 'position: fixed; z-index: 10001; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;';
    successModal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; max-width: 400px;">
            <i class="bi bi-check-circle-fill" style="font-size: 64px; color: #10b981;"></i>
            <h3 style="margin-top: 20px;">PDF Exported Successfully!</h3>
            <p style="color: #666; margin-top: 10px;">
                ${reports.length} report${reports.length > 1 ? 's' : ''} exported to PDF with photos
            </p>
            <button onclick="this.closest('[style*=fixed]').remove()" 
                    style="margin-top: 20px; padding: 10px 30px; background: #667eea; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 16px;">
                Close
            </button>
        </div>
    `;
    document.body.appendChild(successModal);
    setTimeout(() => successModal.remove(), 3000);
}