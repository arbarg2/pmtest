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
        const fillWidth = (percentage / 100) * width;
        doc.setFillColor(...color);
        doc.rect(x, y, fillWidth, height, 'F');
        
        // Border
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, width, height);
      };

      // Header Section with Modern Branding
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Company Logo Placeholder (circle)
      doc.setFillColor(59, 130, 246); // blue-500
      doc.circle(margin + 8, 17, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('R', margin + 5, 21);
      
      // Main Title
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('Rìan Intelligence Report', margin + 25, 22);
      
      // Report Metadata (top right)
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const reportDate = new Date(data.timestamp).toLocaleString();
      doc.text(`Generated: ${reportDate}`, pageWidth - margin - 60, 15);
      doc.text(`Report ID: ${data.recordId}`, pageWidth - margin - 60, 22);
      doc.text(`Network: ${data.wallet.network?.toUpperCase() || 'Unknown'}`, pageWidth - margin - 60, 29);
      
      yPosition = 50;

      // Executive Summary Card
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 85, 'FD');
      
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Executive Summary', margin + 10, yPosition + 15);
      
      // Wallet Address
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('Wallet Address:', margin + 10, yPosition + 28);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(data.wallet.address, margin + 10, yPosition + 35);
      
      // Risk Score with Progress Bar
      doc.setFont(undefined, 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Risk Score:', margin + 10, yPosition + 48);
      
      const riskScore = data.wallet.risk_score || 0;
      const riskPercentage = (riskScore / 10) * 100;
      let riskColor: [number, number, number] = [34, 197, 94]; // green-500
      if (riskScore >= 7) riskColor = [239, 68, 68]; // red-500
      else if (riskScore >= 4) riskColor = [245, 158, 11]; // amber-500
      
      drawProgressBar(margin + 10, yPosition + 52, 80, 6, riskPercentage, riskColor);
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${riskScore.toFixed(1)}/10.0`, margin + 95, yPosition + 56);
      
      // Risk Level Badge
      const riskLevel = data.wallet.risk_level || 'Unknown';
      let badgeColor: [number, number, number] = [34, 197, 94]; // green-500
      if (riskLevel === 'High') badgeColor = [239, 68, 68]; // red-500
      else if (riskLevel === 'Medium') badgeColor = [245, 158, 11]; // amber-500
      
      doc.setFillColor(...badgeColor);
      doc.roundedRect(margin + 10, yPosition + 62, 35, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(riskLevel.toUpperCase(), margin + 12, yPosition + 70);
      
      // Investigation Status
      doc.setTextColor(71, 85, 105);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text('Status:', margin + 55, yPosition + 70);
      doc.setTextColor(15, 23, 42);
      doc.setFont(undefined, 'bold');
      doc.text((data.investigationStatus || 'Pending').toUpperCase(), margin + 75, yPosition + 70);

      // Volume Intelligence (Right Side)
      const volumeX = margin + 100;
      doc.setTextColor(71, 85, 105);
      doc.setFont(undefined, 'normal');
      doc.text('Volume Intelligence:', volumeX, yPosition + 28);
      
      if (data.wallet.volume_metrics?.lifetime_value) {
        const inbound = data.wallet.volume_metrics.lifetime_value.inbound || 0;
        const outbound = data.wallet.volume_metrics.lifetime_value.outbound || 0;
        const usdValue = data.wallet.volume_metrics.lifetime_value.usd_equivalent || 0;
        
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(12);
        doc.text(`Inbound: ${inbound.toFixed(4)} ${data.wallet.network === 'bitcoin' ? 'BTC' : 'ETH'}`, volumeX, yPosition + 38);
        doc.text(`Outbound: ${outbound.toFixed(4)} ${data.wallet.network === 'bitcoin' ? 'BTC' : 'ETH'}`, volumeX, yPosition + 46);
        doc.text(`USD Value: $${usdValue.toLocaleString()}`, volumeX, yPosition + 54);
      } else {
        doc.setTextColor(107, 114, 128);
        doc.text('No volume data available', volumeX, yPosition + 38);
      }

      // Entity Attribution
      if (data.wallet.entity_attribution) {
        doc.setTextColor(71, 85, 105);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('Entity Type:', volumeX, yPosition + 65);
        doc.setTextColor(15, 23, 42);
        doc.setFont(undefined, 'bold');
        doc.text(data.wallet.entity_attribution.type || 'Unknown', volumeX + 30, yPosition + 65);
        
        // Attribution Confidence Bar
        const confidence = (data.wallet.entity_attribution.confidence || 0) * 100;
        drawProgressBar(volumeX, yPosition + 70, 60, 4, confidence, [59, 130, 246]);
        doc.setFontSize(8);
        doc.text(`${confidence.toFixed(0)}% confidence`, volumeX + 65, yPosition + 74);
      }
      
      yPosition += 100;

      // Risk Factors Section
      if (data.riskFactors.length > 0) {
        checkPageSpace(60);
        
        // Section Header
        doc.setFillColor(239, 246, 255); // blue-50
        doc.setDrawColor(191, 219, 254); // blue-200
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'FD');
        
        doc.setTextColor(30, 64, 175); // blue-800
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Risk Factors Analysis', margin + 10, yPosition + 13);
        
        yPosition += 30;
        
        data.riskFactors.forEach((factor, index) => {
          checkPageSpace(25);
          
          // Risk Factor Card
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(229, 231, 235); // gray-200
          doc.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'FD');
          
          // Severity Indicator
          let severityColor: [number, number, number] = [34, 197, 94]; // green-500
          if (factor.severity === 'high') severityColor = [239, 68, 68]; // red-500
          else if (factor.severity === 'medium') severityColor = [245, 158, 11]; // amber-500
          
          doc.setFillColor(...severityColor);
          doc.rect(margin, yPosition, 4, 20, 'F');
          
          // Risk Factor Name
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text(factor.factor_type.replace(/_/g, ' ').toUpperCase(), margin + 10, yPosition + 8);
          
          // Score
          doc.setTextColor(71, 85, 105);
          doc.setFont(undefined, 'normal');
          doc.text(`Score: ${factor.score.toFixed(1)}/10`, margin + 10, yPosition + 15);
          
          // Progress Bar for Score
          const scorePercentage = (factor.score / 10) * 100;
          drawProgressBar(margin + 60, yPosition + 12, 40, 4, scorePercentage, severityColor);
          
          // Description (if available)
          if (factor.description) {
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128);
            const descText = factor.description.length > 60 ? 
              factor.description.substring(0, 60) + '...' : factor.description;
            doc.text(descText, margin + 110, yPosition + 12);
          }
          
          yPosition += 25;
        });
      }

      // Sanctions Alerts (if any)
      if (data.sanctionsMatches.length > 0) {
        checkPageSpace(40);
        
        // Alert Header
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
                   margin + 15, yPosition + 7);
          yPosition += 15;
        });
      }

      // AI Summary Section
      if (data.wallet.ai_summary || data.analystNotes) {
        checkPageSpace(40);
        
        // AI Summary Card
        doc.setFillColor(236, 254, 255); // cyan-50
        doc.setDrawColor(103, 232, 249); // cyan-300
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 35, 'FD');
        
        doc.setTextColor(8, 145, 178); // cyan-700
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('💡 AI Intelligence Summary', margin + 10, yPosition + 12);
        
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const summaryText = data.wallet.ai_summary || data.analystNotes || '';
        const lines = doc.splitTextToSize(summaryText, pageWidth - margin * 2 - 20);
        doc.text(lines.slice(0, 3), margin + 10, yPosition + 22); // Limit to 3 lines
        
        yPosition += 45;
      }

      // Footer Section
      const footerY = pageHeight - 30;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      doc.setFillColor(71, 85, 105);
      doc.rect(0, footerY + 5, pageWidth, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Generated by Rìan Compliance Platform', margin, footerY + 15);
      doc.text(`© ${new Date().getFullYear()} Rìan. Confidential & Proprietary.`, margin, footerY + 22);
      
      // Page numbering
      doc.text('Page 1 of 1', pageWidth - margin - 25, footerY + 15);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, footerY + 22);

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
