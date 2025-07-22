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
      const margin = 15;
      let yPosition = 25;

      // Helper function to draw rounded rectangle
      const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number = 3) => {
        doc.roundedRect(x, y, width, height, radius, radius, 'FD');
      };

      // Helper function to draw progress bar with rounded corners
      const drawProgressBar = (x: number, y: number, width: number, height: number, percentage: number, color: [number, number, number]) => {
        // Background
        doc.setFillColor(245, 245, 245);
        drawRoundedRect(x, y, width, height, 2);
        
        // Progress fill
        const fillWidth = Math.max(0, Math.min(width, (percentage / 100) * width));
        if (fillWidth > 0) {
          doc.setFillColor(...color);
          drawRoundedRect(x, y, fillWidth, height, 2);
        }
        
        // Border
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, width, height, 2, 2);
      };

      // Helper function to draw badge
      const drawBadge = (x: number, y: number, text: string, bgColor: [number, number, number], textColor: [number, number, number] = [255, 255, 255]) => {
        const textWidth = doc.getTextWidth(text);
        const badgeWidth = textWidth + 8;
        const badgeHeight = 6;
        
        doc.setFillColor(...bgColor);
        drawRoundedRect(x, y, badgeWidth, badgeHeight, 3);
        
        doc.setTextColor(...textColor);
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text(text, x + 4, y + 4);
        
        return badgeWidth;
      };

      // HEADER SECTION
      doc.setFillColor(51, 65, 85); // slate-700
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Logo circle
      doc.setFillColor(59, 130, 246); // blue-500
      doc.circle(margin + 6, 17, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('R', margin + 4, 20);
      
      // Main title
      doc.setFontSize(20);
      doc.text('Rìan Intelligence Report', margin + 18, 15);
      
      // Header metadata
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      const reportDate = new Date(data.timestamp).toLocaleString();
      doc.text(`Generated: ${reportDate}`, pageWidth - margin - 50, 10);
      doc.text(`Report ID: ${data.recordId}`, pageWidth - margin - 50, 16);
      doc.text(`Network: ${data.wallet.network?.toUpperCase() || 'Unknown'}`, pageWidth - margin - 50, 22);
      doc.text(`Status: ${data.investigationStatus?.toUpperCase() || 'PENDING'}`, pageWidth - margin - 50, 28);
      
      yPosition = 45;

      // EXECUTIVE SUMMARY CARD
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      drawRoundedRect(margin, yPosition, pageWidth - 2 * margin, 65, 4);
      
      // Card header
      doc.setFillColor(248, 250, 252);
      drawRoundedRect(margin, yPosition, pageWidth - 2 * margin, 12, 4);
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('EXECUTIVE SUMMARY', margin + 6, yPosition + 8);
      
      yPosition += 18;
      
      // Left column - Wallet Info
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Wallet Address:', margin + 6, yPosition);
      doc.setFont('courier', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.text(data.wallet.address.substring(0, 35) + '...', margin + 6, yPosition + 6);
      
      // Risk Score
      doc.setFont(undefined, 'normal');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.text('Risk Assessment:', margin + 6, yPosition + 16);
      
      const riskScore = data.wallet.risk_score || 0;
      const riskPercentage = (riskScore / 10) * 100;
      let riskColor: [number, number, number] = [34, 197, 94]; // green
      if (riskScore >= 7) riskColor = [239, 68, 68]; // red
      else if (riskScore >= 4) riskColor = [245, 158, 11]; // amber
      
      drawProgressBar(margin + 6, yPosition + 20, 50, 6, riskPercentage, riskColor);
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text(`${riskScore.toFixed(1)}/10`, margin + 60, yPosition + 24);
      
      // Risk Level Badge
      const riskLevel = data.wallet.risk_level || 'Unknown';
      let badgeColor: [number, number, number] = [34, 197, 94];
      if (riskLevel === 'High' || riskLevel === 'Critical') badgeColor = [239, 68, 68];
      else if (riskLevel === 'Medium') badgeColor = [245, 158, 11];
      
      drawBadge(margin + 75, yPosition + 20, riskLevel.toUpperCase(), badgeColor);
      
      // Entity Attribution
      if (data.wallet.entity_attribution) {
        doc.setTextColor(71, 85, 105);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text('Entity:', margin + 6, yPosition + 34);
        doc.setTextColor(15, 23, 42);
        doc.setFont(undefined, 'bold');
        doc.text(data.wallet.entity_attribution.type || 'Unknown', margin + 25, yPosition + 34);
        
        const confidence = (data.wallet.entity_attribution.confidence || 0) * 100;
        doc.setTextColor(71, 85, 105);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.text(`${confidence.toFixed(0)}% confidence`, margin + 6, yPosition + 41);
      }

      // Right column - Volume Intelligence
      const rightX = margin + 100;
      doc.setTextColor(71, 85, 105);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.text('Transaction Volume:', rightX, yPosition);
      
      if (data.wallet.volume_metrics?.lifetime_value) {
        const inbound = data.wallet.volume_metrics.lifetime_value.inbound || 0;
        const outbound = data.wallet.volume_metrics.lifetime_value.outbound || 0;
        const usdValue = data.wallet.volume_metrics.lifetime_value.usd_equivalent || 0;
        const currency = data.wallet.network === 'bitcoin' ? 'BTC' : 'ETH';
        
        // Volume display in a compact format
        doc.setFillColor(248, 250, 252);
        drawRoundedRect(rightX, yPosition + 4, 80, 30, 3);
        
        doc.setTextColor(15, 23, 42);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(8);
        doc.text(`IN: ${inbound.toFixed(4)} ${currency}`, rightX + 4, yPosition + 12);
        doc.text(`OUT: ${outbound.toFixed(4)} ${currency}`, rightX + 4, yPosition + 20);
        doc.setFontSize(9);
        doc.text(`≈ $${usdValue.toLocaleString()}`, rightX + 4, yPosition + 28);
      }

      // Transaction Activity - bottom section
      doc.setTextColor(71, 85, 105);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text(`Transactions: ${data.wallet.transaction_count?.toLocaleString() || '0'}`, margin + 6, yPosition + 52);
      
      if (data.wallet.temporal_patterns?.first_seen) {
        const firstSeen = new Date(data.wallet.temporal_patterns.first_seen).toLocaleDateString();
        doc.text(`First Seen: ${firstSeen}`, margin + 45, yPosition + 52);
      }
      
      if (data.wallet.last_activity) {
        const lastActivity = new Date(data.wallet.last_activity).toLocaleDateString();
        doc.text(`Last Activity: ${lastActivity}`, margin + 90, yPosition + 52);
      }

      yPosition += 75;

      // RISK FACTORS SECTION
      if (data.riskFactors.length > 0) {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(229, 231, 235);
        drawRoundedRect(margin, yPosition, pageWidth - 2 * margin, 40, 4);
        
        // Section header
        doc.setFillColor(254, 242, 242);
        drawRoundedRect(margin, yPosition, pageWidth - 2 * margin, 10, 4);
        doc.setTextColor(185, 28, 28);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('RISK FACTORS', margin + 6, yPosition + 7);
        
        yPosition += 15;
        
        // Display top 3 risk factors in columns
        const topFactors = data.riskFactors.slice(0, 3);
        const columnWidth = (pageWidth - 2 * margin - 20) / 3;
        
        topFactors.forEach((factor, index) => {
          const xPos = margin + 6 + (index * columnWidth);
          
          // Factor name
          doc.setTextColor(15, 23, 42);
          doc.setFont(undefined, 'bold');
          doc.setFontSize(8);
          doc.text(factor.factor_type.replace(/_/g, ' ').toUpperCase(), xPos, yPosition);
          
          // Score bar
          let severityColor: [number, number, number] = [34, 197, 94];
          if (factor.severity === 'high') severityColor = [239, 68, 68];
          else if (factor.severity === 'medium') severityColor = [245, 158, 11];
          
          const scorePercentage = (factor.score / 10) * 100;
          drawProgressBar(xPos, yPosition + 3, columnWidth - 10, 4, scorePercentage, severityColor);
          
          doc.setTextColor(71, 85, 105);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(7);
          doc.text(`${factor.score.toFixed(1)}/10`, xPos, yPosition + 12);
        });
        
        yPosition += 25;
      }

      // SANCTIONS ALERTS (if any)
      if (data.sanctionsMatches.length > 0) {
        yPosition += 5;
        doc.setFillColor(254, 226, 226);
        doc.setDrawColor(248, 113, 113);
        drawRoundedRect(margin, yPosition, pageWidth - 2 * margin, 15, 4);
        
        doc.setTextColor(185, 28, 28);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`⚠️ ${data.sanctionsMatches.length} SANCTIONS EXPOSURE(S) DETECTED`, margin + 6, yPosition + 9);
        
        yPosition += 20;
      }

      // TOP COUNTERPARTIES
      if (data.wallet.top_counterparties && data.wallet.top_counterparties.length > 0) {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(229, 231, 235);
        drawRoundedRect(margin, yPosition, pageWidth - 2 * margin, 35, 4);
        
        // Section header
        doc.setFillColor(240, 253, 244);
        drawRoundedRect(margin, yPosition, pageWidth - 2 * margin, 10, 4);
        doc.setTextColor(20, 83, 45);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('TOP COUNTERPARTIES', margin + 6, yPosition + 7);
        
        yPosition += 15;
        
        // Display top 3 counterparties
        data.wallet.top_counterparties.slice(0, 3).forEach((counterparty, index) => {
          const yPos = yPosition + (index * 6);
          
          doc.setTextColor(15, 23, 42);
          doc.setFont(undefined, 'bold');
          doc.setFontSize(8);
          doc.text(`${index + 1}. ${counterparty.entity_name || 'Unknown Entity'}`, margin + 6, yPos);
          
          // Risk badge
          let riskBadgeColor: [number, number, number] = [34, 197, 94];
          if (counterparty.risk_level === 'High') riskBadgeColor = [239, 68, 68];
          else if (counterparty.risk_level === 'Medium') riskBadgeColor = [245, 158, 11];
          
          drawBadge(margin + 70, yPos - 3, counterparty.risk_level.toUpperCase(), riskBadgeColor);
          
          doc.setTextColor(71, 85, 105);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(7);
          doc.text(`${counterparty.transaction_count} txns`, margin + 110, yPos);
        });
        
        yPosition += 25;
      }

      // AI SUMMARY (if available)
      if (data.wallet.ai_summary || data.analystNotes) {
        yPosition += 5;
        doc.setFillColor(236, 254, 255);
        doc.setDrawColor(103, 232, 249);
        drawRoundedRect(margin, yPosition, pageWidth - 2 * margin, 25, 4);
        
        doc.setTextColor(8, 145, 178);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('💡 AI INTELLIGENCE SUMMARY', margin + 6, yPosition + 9);
        
        const summaryText = data.wallet.ai_summary || data.analystNotes || '';
        doc.setTextColor(15, 23, 42);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        const lines = doc.splitTextToSize(summaryText, pageWidth - margin * 2 - 12);
        doc.text(lines.slice(0, 2), margin + 6, yPosition + 16);
      }

      // FOOTER
      const footerY = pageHeight - 20;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      doc.setFillColor(248, 250, 252);
      doc.rect(0, footerY, pageWidth, 20, 'F');
      
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.text('Generated by Rìan Compliance Platform', margin, footerY + 6);
      doc.text(`© ${new Date().getFullYear()} Rìan. Confidential & Proprietary.`, margin, footerY + 12);
      
      doc.text('Page 1 of 1', pageWidth - margin - 20, footerY + 6);
      doc.text(`Export: ${new Date().toLocaleDateString()}`, pageWidth - margin - 30, footerY + 12);

      // Generate and save
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
