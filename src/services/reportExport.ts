import jsPDF from 'jspdf';
import { WalletRiskResponse } from './api';
import { RiskFactor, SanctionsMatch } from './riskFactors';

export interface ExportData {
  wallet: WalletRiskResponse;
  recordId: string;
  riskFactors: RiskFactor[];
  sanctionsMatches: SanctionsMatch[];
  analystNotes?: string;
  investigationStatus?: string;
  tags?: string[];
  timestamp: string;
}

class ReportExportService {
  async exportToPDF(data: ExportData): Promise<void> {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPosition = 30;

      // Helper function to add new page if needed
      const checkPageSpace = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 40) {
          doc.addPage();
          yPosition = 30;
        }
      };

      // Helper function to draw progress bar
      const drawProgressBar = (x: number, y: number, width: number, height: number, percentage: number, color: [number, number, number]) => {
        // Background bar
        doc.setFillColor(240, 240, 240);
        doc.rect(x, y, width, height, 'F');
        
        // Progress fill
        const fillWidth = Math.max(0, Math.min(width, (percentage / 100) * width));
        doc.setFillColor(...color);
        doc.rect(x, y, fillWidth, height, 'F');
        
        // Border
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.rect(x, y, width, height);
      };

      // Header Section
      doc.setFillColor(51, 65, 85); // slate-700
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Company Logo (circle with R)
      doc.setFillColor(59, 130, 246); // blue-500
      doc.circle(margin + 8, 20, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('R', margin + 5, 24);
      
      // Main Title
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('Rìan Intelligence Report', margin + 25, 20);
      
      // Report Metadata
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const reportDate = new Date(data.timestamp).toLocaleString();
      doc.text(`Generated: ${reportDate}`, pageWidth - margin - 70, 12);
      doc.text(`Report ID: ${data.recordId}`, pageWidth - margin - 70, 20);
      doc.text(`Network: ${data.wallet.network?.toUpperCase() || 'Unknown'}`, pageWidth - margin - 70, 28);
      
      yPosition = 55;

      // Executive Summary Section
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 100, 'FD');
      
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Executive Summary', margin + 10, yPosition + 15);
      
      // Wallet Address
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('Wallet Address:', margin + 10, yPosition + 30);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.text(data.wallet.address, margin + 10, yPosition + 38);
      
      // Risk Score Section
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Risk Score:', margin + 10, yPosition + 52);
      
      const riskScore = data.wallet.risk_score || 0;
      const riskPercentage = (riskScore / 10) * 100;
      let riskColor: [number, number, number] = [34, 197, 94]; // green-500
      if (riskScore >= 7) riskColor = [239, 68, 68]; // red-500
      else if (riskScore >= 4) riskColor = [245, 158, 11]; // amber-500
      
      drawProgressBar(margin + 10, yPosition + 56, 60, 8, riskPercentage, riskColor);
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text(`${riskScore.toFixed(1)}/10.0`, margin + 75, yPosition + 62);
      
      // Risk Level Badge
      const riskLevel = data.wallet.risk_level || 'Unknown';
      let badgeColor: [number, number, number] = [34, 197, 94]; // green-500
      if (riskLevel === 'High' || riskLevel === 'Critical') badgeColor = [239, 68, 68]; // red-500
      else if (riskLevel === 'Medium') badgeColor = [245, 158, 11]; // amber-500
      
      doc.setFillColor(...badgeColor);
      doc.roundedRect(margin + 10, yPosition + 68, 30, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(riskLevel.toUpperCase(), margin + 12, yPosition + 75);
      
      // Investigation Status
      doc.setTextColor(71, 85, 105);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      doc.text('Status:', margin + 45, yPosition + 75);
      doc.setTextColor(15, 23, 42);
      doc.setFont(undefined, 'bold');
      doc.text((data.investigationStatus || 'Pending').toUpperCase(), margin + 65, yPosition + 75);

      // Right side - Volume Intelligence
      const rightColumnX = margin + 100;
      doc.setTextColor(71, 85, 105);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      doc.text('Volume Intelligence:', rightColumnX, yPosition + 30);
      
      if (data.wallet.volume_metrics?.lifetime_value) {
        const inbound = data.wallet.volume_metrics.lifetime_value.inbound || 0;
        const outbound = data.wallet.volume_metrics.lifetime_value.outbound || 0;
        const usdValue = data.wallet.volume_metrics.lifetime_value.usd_equivalent || 0;
        const currency = data.wallet.network === 'bitcoin' ? 'BTC' : 'ETH';
        
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.text(`Inbound: ${inbound.toFixed(4)} ${currency}`, rightColumnX, yPosition + 40);
        doc.text(`Outbound: ${outbound.toFixed(4)} ${currency}`, rightColumnX, yPosition + 48);
        doc.setFontSize(11);
        doc.text(`USD Value: $${usdValue.toLocaleString()}`, rightColumnX, yPosition + 58);
      } else {
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(9);
        doc.text('No volume data available', rightColumnX, yPosition + 40);
      }

      // Entity Attribution
      if (data.wallet.entity_attribution) {
        doc.setTextColor(71, 85, 105);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(11);
        doc.text('Entity Type:', rightColumnX, yPosition + 70);
        doc.setTextColor(15, 23, 42);
        doc.setFont(undefined, 'bold');
        doc.text(data.wallet.entity_attribution.type || 'Unknown', rightColumnX + 35, yPosition + 70);
        
        // Attribution Confidence
        const confidence = (data.wallet.entity_attribution.confidence || 0) * 100;
        doc.setTextColor(71, 85, 105);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text('Confidence:', rightColumnX, yPosition + 80);
        drawProgressBar(rightColumnX + 30, yPosition + 78, 40, 4, confidence, [59, 130, 246]);
        doc.setFontSize(8);
        doc.text(`${confidence.toFixed(0)}%`, rightColumnX + 75, yPosition + 81);
      }
      
      yPosition += 115;

      // Transaction Count and Activity
      checkPageSpace(40);
      doc.setFillColor(239, 246, 255); // blue-50
      doc.setDrawColor(191, 219, 254); // blue-200
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'FD');
      
      doc.setTextColor(30, 64, 175); // blue-800
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Transaction Activity', margin + 10, yPosition + 12);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Transactions: ${data.wallet.transaction_count?.toLocaleString() || '0'}`, margin + 10, yPosition + 22);
      
      if (data.wallet.last_activity) {
        const lastActivity = new Date(data.wallet.last_activity).toLocaleDateString();
        doc.text(`Last Activity: ${lastActivity}`, margin + 80, yPosition + 22);
      }
      
      if (data.wallet.temporal_patterns?.first_seen) {
        const firstSeen = new Date(data.wallet.temporal_patterns.first_seen).toLocaleDateString();
        doc.text(`First Seen: ${firstSeen}`, margin + 10, yPosition + 30);
      }
      
      yPosition += 40;

      // Risk Factors Section
      if (data.riskFactors.length > 0) {
        checkPageSpace(60);
        
        doc.setFillColor(254, 242, 242); // red-50
        doc.setDrawColor(252, 165, 165); // red-300
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'FD');
        
        doc.setTextColor(185, 28, 28); // red-800
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Risk Factors Analysis', margin + 10, yPosition + 13);
        
        yPosition += 30;
        
        data.riskFactors.forEach((factor) => {
          checkPageSpace(25);
          
          // Risk Factor Card
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(229, 231, 235); // gray-200
          doc.rect(margin, yPosition, pageWidth - 2 * margin, 22, 'FD');
          
          // Severity Indicator (left border)
          let severityColor: [number, number, number] = [34, 197, 94]; // green-500
          if (factor.severity === 'high') severityColor = [239, 68, 68]; // red-500
          else if (factor.severity === 'medium') severityColor = [245, 158, 11]; // amber-500
          
          doc.setFillColor(...severityColor);
          doc.rect(margin, yPosition, 3, 22, 'F');
          
          // Risk Factor Name
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text(factor.factor_type.replace(/_/g, ' ').toUpperCase(), margin + 8, yPosition + 10);
          
          // Score
          doc.setTextColor(71, 85, 105);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(10);
          doc.text(`Score: ${factor.score.toFixed(1)}/10`, margin + 8, yPosition + 18);
          
          // Progress Bar for Score
          const scorePercentage = (factor.score / 10) * 100;
          drawProgressBar(margin + 60, yPosition + 15, 50, 5, scorePercentage, severityColor);
          
          // Description
          if (factor.description) {
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128);
            const descText = factor.description.length > 80 ? 
              factor.description.substring(0, 80) + '...' : factor.description;
            doc.text(descText, margin + 120, yPosition + 12);
          }
          
          yPosition += 27;
        });
      }

      // Sanctions Alerts
      if (data.sanctionsMatches.length > 0) {
        checkPageSpace(40);
        
        doc.setFillColor(254, 226, 226); // red-50
        doc.setDrawColor(248, 113, 113); // red-400
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 25, 'FD');
        
        doc.setTextColor(185, 28, 28); // red-800
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('⚠️ SANCTIONS EXPOSURE DETECTED', margin + 10, yPosition + 16);
        
        yPosition += 35;
        
        data.sanctionsMatches.forEach(match => {
          checkPageSpace(15);
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(10);
          doc.text(`• ${match.entity_name} (${match.entity_type})`, margin + 10, yPosition);
          doc.text(`Match: ${match.match_type} | Confidence: ${(match.confidence_score * 100).toFixed(0)}%`, 
                   margin + 15, yPosition + 8);
          yPosition += 18;
        });
      }

      // Counterparties Section
      if (data.wallet.top_counterparties && data.wallet.top_counterparties.length > 0) {
        checkPageSpace(60);
        
        doc.setFillColor(240, 253, 244); // green-50
        doc.setDrawColor(134, 239, 172); // green-300
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'FD');
        
        doc.setTextColor(20, 83, 45); // green-800
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Top Counterparties', margin + 10, yPosition + 13);
        
        yPosition += 30;
        
        data.wallet.top_counterparties.slice(0, 5).forEach((counterparty, index) => {
          checkPageSpace(15);
          
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.text(`${index + 1}. ${counterparty.entity_name || 'Unknown Entity'}`, margin + 10, yPosition);
          
          doc.setFont(undefined, 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(`Risk: ${counterparty.risk_level} | Transactions: ${counterparty.transaction_count}`, 
                   margin + 15, yPosition + 8);
          
          yPosition += 18;
        });
      }

      // AI Summary Section
      if (data.wallet.ai_summary || data.analystNotes) {
        checkPageSpace(50);
        
        doc.setFillColor(236, 254, 255); // cyan-50
        doc.setDrawColor(103, 232, 249); // cyan-300
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 40, 'FD');
        
        doc.setTextColor(8, 145, 178); // cyan-700
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('💡 AI Intelligence Summary', margin + 10, yPosition + 12);
        
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        const summaryText = data.wallet.ai_summary || data.analystNotes || '';
        const lines = doc.splitTextToSize(summaryText, pageWidth - margin * 2 - 20);
        doc.text(lines.slice(0, 4), margin + 10, yPosition + 22);
        
        yPosition += 50;
      }

      // Footer Section
      const footerY = pageHeight - 25;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      doc.setFillColor(51, 65, 85);
      doc.rect(0, footerY, pageWidth, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Generated by Rìan Compliance Platform', margin, footerY + 8);
      doc.text(`© ${new Date().getFullYear()} Rìan. Confidential & Proprietary.`, margin, footerY + 16);
      
      // Page numbering
      doc.text('Page 1 of 1', pageWidth - margin - 25, footerY + 8);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, footerY + 16);

      // Generate filename and save
      const filename = `rian-intelligence-report-${data.recordId}-${Date.now()}.pdf`;
      doc.save(filename);

      console.log('Enhanced PDF report generated successfully:', filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  async exportToCSV(data: ExportData): Promise<void> {
    try {
      const csvRows = [
        ['Field', 'Value'],
        ['Record ID', data.recordId || 'Unknown'],
        ['Timestamp', data.timestamp],
        ['Wallet Address', data.wallet.address],
        ['Network', data.wallet.network || 'Unknown'],
        ['Risk Score', data.wallet.risk_score?.toString() || 'N/A'],
        ['Risk Level', data.wallet.risk_level || 'Unknown'],
        ['Entity Type', data.wallet.entity_attribution?.type || 'Unknown'],
        ['Entity Name', data.wallet.entity_attribution?.name || 'Unknown'],
        ['Transaction Count', data.wallet.transaction_count?.toString() || '0'],
        ['Investigation Status', data.investigationStatus || 'Pending'],
        ['Analyst Notes', data.analystNotes || ''],
        ['Tags', data.tags?.join('; ') || ''],
        [''],
        ['Risk Factors'],
        ['Factor Type', 'Severity', 'Score', 'Description']
      ];

      data.riskFactors.forEach(factor => {
        csvRows.push([
          factor.factor_type,
          factor.severity,
          factor.score.toString(),
          factor.description || ''
        ]);
      });

      if (data.sanctionsMatches.length > 0) {
        csvRows.push([''], ['Sanctions Matches']);
        csvRows.push(['Entity Name', 'Entity Type', 'Match Type', 'Confidence Score']);
        
        data.sanctionsMatches.forEach(match => {
          csvRows.push([
            match.entity_name,
            match.entity_type,
            match.match_type,
            (match.confidence_score * 100).toFixed(0) + '%'
          ]);
        });
      }

      const csvContent = csvRows.map(row => 
        row.map(field => `"${field.replace(/"/g, '""')}"`)
          .join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rian-report-${data.recordId || 'unknown'}-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      console.log('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw new Error('Failed to export CSV data');
    }
  }
}

export const reportExportService = new ReportExportService();
