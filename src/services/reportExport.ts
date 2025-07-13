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
        if (yPosition + requiredSpace > pageHeight - 30) {
          doc.addPage();
          yPosition = 30;
        }
      };

      // Header with branding
      doc.setFillColor(0, 188, 212); // Teal brand color
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text('Rìan Intelligence Report', margin, 18);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      yPosition = 35;

      // Executive Summary Box
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 50, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 50);
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Executive Summary', margin + 10, yPosition + 15);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Address: ${data.wallet.address}`, margin + 10, yPosition + 25);
      doc.text(`Risk Level: ${data.wallet.risk_level || 'Unknown'}`, margin + 10, yPosition + 32);
      doc.text(`Risk Score: ${data.wallet.risk_score?.toFixed(1) || 'N/A'}/10`, margin + 10, yPosition + 39);
      doc.text(`Generated: ${new Date(data.timestamp).toLocaleString()}`, margin + 100, yPosition + 25);
      doc.text(`Record ID: ${data.recordId}`, margin + 100, yPosition + 32);
      doc.text(`Network: ${data.wallet.network || 'Unknown'}`, margin + 100, yPosition + 39);
      
      yPosition += 60;

      // Risk Level Indicator with color coding
      checkPageSpace(30);
      const riskLevel = data.wallet.risk_level || 'Unknown';
      let riskColor: [number, number, number] = [100, 100, 100];
      
      if (riskLevel === 'High') riskColor = [239, 68, 68];
      else if (riskLevel === 'Medium') riskColor = [245, 158, 11];
      else if (riskLevel === 'Low') riskColor = [34, 197, 94];
      
      doc.setFillColor(...riskColor);
      doc.rect(margin, yPosition, 60, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(riskLevel.toUpperCase(), margin + 30 - (riskLevel.length * 2), yPosition + 13);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      yPosition += 35;

      // Entity Attribution Section
      if (data.wallet.entity_attribution) {
        checkPageSpace(40);
        doc.setFillColor(219, 234, 254);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 35, 'F');
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Entity Attribution', margin + 10, yPosition + 15);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Name: ${data.wallet.entity_attribution.name || 'Unknown'}`, margin + 10, yPosition + 25);
        doc.text(`Type: ${data.wallet.entity_attribution.type || 'Unknown'}`, margin + 100, yPosition + 25);
        doc.text(`Confidence: ${(data.wallet.entity_attribution.confidence * 100).toFixed(1)}%`, margin + 10, yPosition + 32);
        
        yPosition += 45;
      }

      // Volume Intelligence Chart (Visual representation)
      if (data.wallet.volume_metrics) {
        checkPageSpace(60);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Volume Intelligence', margin, yPosition);
        yPosition += 10;
        
        const inbound = data.wallet.volume_metrics.lifetime_value?.inbound || 0;
        const outbound = data.wallet.volume_metrics.lifetime_value?.outbound || 0;
        const total = inbound + outbound;
        
        if (total > 0) {
          // Simple bar chart representation
          const chartWidth = 120;
          const inboundWidth = (inbound / total) * chartWidth;
          const outboundWidth = (outbound / total) * chartWidth;
          
          // Inbound bar
          doc.setFillColor(34, 197, 94);
          doc.rect(margin, yPosition, inboundWidth, 10, 'F');
          
          // Outbound bar
          doc.setFillColor(239, 68, 68);
          doc.rect(margin + inboundWidth, yPosition, outboundWidth, 10, 'F');
          
          yPosition += 20;
          
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          doc.text(`Inbound: ${inbound.toFixed(4)} ${data.wallet.network === 'bitcoin' ? 'BTC' : 'ETH'}`, margin, yPosition);
          doc.text(`Outbound: ${outbound.toFixed(4)} ${data.wallet.network === 'bitcoin' ? 'BTC' : 'ETH'}`, margin + 80, yPosition);
          yPosition += 8;
          doc.text(`USD Equivalent: $${data.wallet.volume_metrics.lifetime_value?.usd_equivalent?.toLocaleString() || 'N/A'}`, margin, yPosition);
        }
        
        yPosition += 20;
      }

      // Risk Factors Section with visual indicators
      if (data.riskFactors.length > 0) {
        checkPageSpace(20 + (data.riskFactors.length * 15));
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Risk Factors Analysis', margin, yPosition);
        yPosition += 15;

        data.riskFactors.forEach(factor => {
          checkPageSpace(15);
          
          // Severity indicator circle
          let severityColor: [number, number, number] = [100, 100, 100];
          if (factor.severity === 'high') severityColor = [239, 68, 68];
          else if (factor.severity === 'medium') severityColor = [245, 158, 11];
          else if (factor.severity === 'low') severityColor = [34, 197, 94];
          
          doc.setFillColor(...severityColor);
          doc.circle(margin + 3, yPosition - 2, 2, 'F');
          
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(factor.factor_type.replace(/_/g, ' ').toUpperCase(), margin + 10, yPosition);
          doc.text(`Score: ${factor.score.toFixed(1)}`, margin + 130, yPosition);
          
          yPosition += 6;
          
          if (factor.description) {
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            const lines = doc.splitTextToSize(factor.description, pageWidth - margin * 2 - 20);
            doc.text(lines, margin + 10, yPosition);
            yPosition += lines.length * 3 + 3;
          }
          yPosition += 2;
        });
      }

      // Sanctions Alert Section (if applicable)
      if (data.sanctionsMatches.length > 0) {
        checkPageSpace(40);
        
        // Red alert box
        doc.setFillColor(254, 226, 226);
        doc.setDrawColor(239, 68, 68);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 30 + (data.sanctionsMatches.length * 15), 'FD');
        
        doc.setTextColor(185, 28, 28);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('⚠️ SANCTIONS EXPOSURE DETECTED', margin + 10, yPosition + 15);
        
        yPosition += 25;
        
        data.sanctionsMatches.forEach(match => {
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`• ${match.entity_name} (${match.entity_type}) - ${match.match_type}`, margin + 10, yPosition);
          doc.text(`Confidence: ${(match.confidence_score * 100).toFixed(0)}%`, margin + 120, yPosition);
          yPosition += 7;
        });
        
        yPosition += 10;
      }

      // Investigation Notes Section
      if (data.analystNotes) {
        checkPageSpace(40);
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 5, 'F');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Investigation Notes', margin + 10, yPosition + 15);
        
        yPosition += 25;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const noteLines = doc.splitTextToSize(data.analystNotes, pageWidth - margin * 2 - 20);
        doc.text(noteLines, margin + 10, yPosition);
        yPosition += noteLines.length * 5 + 10;
      }

      // Status and Tags Footer
      if (data.investigationStatus || (data.tags && data.tags.length > 0)) {
        checkPageSpace(25);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
        
        if (data.investigationStatus) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(`Investigation Status: ${data.investigationStatus.toUpperCase()}`, margin, yPosition);
          yPosition += 10;
        }
        
        if (data.tags && data.tags.length > 0) {
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          doc.text(`Tags: ${data.tags.join(', ')}`, margin, yPosition);
        }
      }

      // Footer with branding
      doc.setFillColor(71, 85, 105);
      doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('Generated by Rìan Compliance Platform', margin, pageHeight - 15);
      doc.text(`© ${new Date().getFullYear()} Rìan. Confidential & Proprietary.`, margin, pageHeight - 8);
      doc.text(`Page 1`, pageWidth - margin - 20, pageHeight - 10);

      // Save with better filename
      const filename = `rian-intelligence-report-${data.recordId || 'unknown'}-${Date.now()}.pdf`;
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
