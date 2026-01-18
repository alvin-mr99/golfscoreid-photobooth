import type { ScoreData, CapturedPhoto } from '../types';

/**
 * PrintScoreService handles printing of score data and photos
 */
class PrintScoreService {
  private readonly MAX_PHOTOS = 3;
  /**
   * Generate preview HTML (without print styles)
   * @param scoreData The scoring data to preview
   * @param photos Array of selected photos to preview
   * @param selectedPlayerIds Array of selected player IDs to preview
   * @param scoreMode Display mode: 'stroke' or 'over'
   */
  async generatePreviewHTML(
    scoreData: ScoreData,
    photos: CapturedPhoto[],
    selectedPlayerIds?: string[],
    scoreMode: 'stroke' | 'over' = 'stroke'
  ): Promise<string> {
    // Simulate loading time for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Limit to maximum 3 photos
    const limitedPhotos = photos.slice(0, this.MAX_PHOTOS);
    
    return this.generatePrintHTML(scoreData, limitedPhotos, false, selectedPlayerIds, scoreMode);
  }

  /**
   * Print score data and selected photos
   * @param scoreData The scoring data to print
   * @param photos Array of selected photos to print
   * @param selectedPlayerIds Array of selected player IDs to print
   * @param scoreMode Display mode: 'stroke' or 'over'
   */
  async printScoreAndPhotos(
    scoreData: ScoreData,
    photos: CapturedPhoto[],
    selectedPlayerIds?: string[],
    scoreMode: 'stroke' | 'over' = 'stroke'
  ): Promise<void> {
    try {
      // Limit to maximum 3 photos
      const limitedPhotos = photos.slice(0, this.MAX_PHOTOS);

      // Create a hidden print container
      const printContainer = document.createElement('div');
      printContainer.id = 'print-container';
      printContainer.style.display = 'none';
      document.body.appendChild(printContainer);

      // Generate print HTML with selected players, limited photos, and score mode
      const printHTML = this.generatePrintHTML(scoreData, limitedPhotos, true, selectedPlayerIds, scoreMode);
      printContainer.innerHTML = printHTML;

      // Wait for images to load
      await this.waitForImagesToLoad(printContainer);

      // Trigger print dialog
      window.print();

      // Cleanup
      document.body.removeChild(printContainer);
    } catch (error) {
      console.error('Print error:', error);
      throw new Error('Failed to print. Please try again.');
    }
  }

  /**
   * Generate HTML for printing or preview - Postcard Layout
   * @param isPrint Whether this is for printing (true) or preview (false)
   * @param selectedPlayerIds Array of selected player IDs to include
   * @param scoreMode Display mode: 'stroke' or 'over'
   */
  private generatePrintHTML(
    scoreData: ScoreData, 
    _photos: CapturedPhoto[], 
    isPrint: boolean = true, 
    selectedPlayerIds?: string[],
    scoreMode: 'stroke' | 'over' = 'stroke'
  ): string {
    const holes = scoreData.holes || [];
    const outHoles = holes.slice(0, 9);
    const inHoles = holes.slice(9, 18);

    // Filter players based on selection
    const playersToDisplay = selectedPlayerIds && selectedPlayerIds.length > 0
      ? scoreData.players.filter(p => selectedPlayerIds.includes(p.playerId))
      : scoreData.players;

    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };

    const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' WIB';
    };

    const formatCurrentDateTime = () => {
      return new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' WIB';
    };

    // Calculate pars
    const outPar = outHoles.reduce((sum, hole) => sum + hole.par, 0);
    const inPar = inHoles.reduce((sum, hole) => sum + hole.par, 0);
    const totalPar = outPar + inPar;

    // Function to render score with SVG symbol
    const renderScoreSymbol = (strokes: number, par: number) => {
      const diff = strokes - par;
      
      // Determine display value based on mode
      const displayValue = scoreMode === 'stroke' 
        ? strokes 
        : (diff === 0 ? '0' : (diff > 0 ? `+${diff}` : diff));
      
      // Eagle or better - Double Circle
      if (diff <= -2) {
        return `
          <div style="position: relative; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
            <svg width="28" height="28" viewBox="0 0 28 28" style="position: absolute;">
              <circle cx="14" cy="14" r="12" fill="none" stroke="#1f2937" stroke-width="1.8"/>
              <circle cx="14" cy="14" r="8" fill="none" stroke="#1f2937" stroke-width="1.8"/>
            </svg>
            <span style="position: relative; z-index: 10; font-size: 10px; font-weight: bold; color: #1f2937;">${displayValue}</span>
          </div>
        `;
      }
      
      // Birdie - Triangle
      if (diff === -1) {
        return `
          <div style="position: relative; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
            <svg width="28" height="28" viewBox="0 0 28 28" style="position: absolute;">
              <path d="M14 3 L25 23 L3 23 Z" fill="none" stroke="#000000ff" stroke-width="1.8"/>
            </svg>
            <span style="position: relative; z-index: 10; font-size: 10px; font-weight: bold; color: #1f2937; margin-top: 3px;">${displayValue}</span>
          </div>
        `;
      }
      
      // Par - Circle
      if (diff === 0) {
        return `
          <div style="position: relative; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
            <svg width="28" height="28" viewBox="0 0 28 28" style="position: absolute;">
              <circle cx="14" cy="14" r="10" fill="none" stroke="#1f2937" stroke-width="1.8"/>
            </svg>
            <span style="position: relative; z-index: 10; font-size: 10px; font-weight: bold; color: #1f2937;">${displayValue}</span>
          </div>
        `;
      }
      
      // Bogey - Square
      if (diff === 1) {
        return `
          <div style="position: relative; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
            <svg width="28" height="28" viewBox="0 0 28 28" style="position: absolute;">
              <rect x="3" y="3" width="22" height="22" fill="none" stroke="#1f2937" stroke-width="1.8"/>
            </svg>
            <span style="position: relative; z-index: 10; font-size: 10px; font-weight: bold; color: #1f2937;">${displayValue}</span>
          </div>
        `;
      }
      
      // Double Bogey or worse - Double Square (nested)
      return `
        <div style="position: relative; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
          <svg width="28" height="28" viewBox="0 0 28 28" style="position: absolute;">
            <rect x="2" y="2" width="24" height="24" fill="none" stroke="#000000ff" stroke-width="1.8"/>
            <rect x="7" y="7" width="14" height="14" fill="none" stroke="#000000ff" stroke-width="1.8"/>
          </svg>
          <span style="position: relative; z-index: 10; font-size: 10px; font-weight: bold; color: #1f2937;">${displayValue}</span>
        </div>
      `;
    };

    return `
      <style>
        ${isPrint ? '@media print {' : ''}
          @page {
            size: 10in 7in landscape;
            margin: 0.3in;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Outfit', Arial, sans-serif;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          
          html, body {
            height: 100%;
            overflow: hidden;
          }
          
          .print-content {
            width: 100%;
            height: 100%;
            background: white;
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 2px solid rgba(255, 255, 255, 0.5);
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          .print-body {
            padding: 12px;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          
          /* Header Section */
          .header-section {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding-bottom: 8px;
            margin-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            flex-shrink: 0;
          }
          
          .header-left {
            flex: 1;
          }
          
          .header-title {
            font-size: 24px;
            font-weight: 900;
            background: linear-gradient(to right, #2563eb, #2563eb);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 0 0 4px 0;
            line-height: 1.2;
            text-align: left;
          }
          
          .header-datetime {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #374151;
            font-size: 12px;
          }
          
          .header-datetime svg {
            width: 14px;
            height: 14px;
            color: #2563eb;
            flex-shrink: 0;
          }
          
          .header-datetime span {
            font-weight: 600;
          }
          
          .header-right {
            text-align: right;
          }
          
          .total-score {
            font-size: 40px;
            font-weight: 900;
            background: linear-gradient(to right, #2563eb, #4f46e5);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1;
            margin-bottom: 4px;
          }
          
          .player-name-header {
            font-size: 14px;
            font-weight: bold;
            color: #1f2937;
          }
          
          .player-handicap {
            font-size: 10px;
            color: #6b7280;
            font-weight: 500;
          }
          
          /* Main Content Section */
          .main-content {
            display: flex;
            gap: 10px;
            margin-bottom: 8px;
            flex-shrink: 0;
          }
          
          .course-image {
            width: 40%;
            position: relative;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
          
          .course-image img {
            width: 100%;
            height: 360px;
            object-fit: cover;
          }
          
          .logo-overlay {
            position: absolute;
            top: 6px;
            right: 6px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(4px);
            border-radius: 10px;
            padding: 4px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .logo-overlay img {
            width: 40px;
            height: 40px;
            object-fit: contain;
          }
          
          .score-tables {
            width: 60%;
            display: flex;
            flex-direction: column;
            gap: 6px;
            height: 360px;
          }
          
          .score-table-container {
            flex: 1;
            overflow: hidden;
            border-radius: 10px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 2px solid #fff;
          }
          
          .score-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            height: 100%;
          }
          
          .score-table th {
            padding: 3px 2px;
            text-align: center;
            border: 1px solid rgba(37, 99, 235, 0.5);
            font-weight: bold;
          }
          
          .score-table td {
            padding: 3px 2px;
            border: 1px solid rgba(209, 213, 219, 0.5);
            text-align: center;
          }
          
          .header-out, .header-in {
            background: linear-gradient(to right, #2563eb, #1d4ed8) !important;
            color: white !important;
            font-size: 8px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .header-par {
            background: #9ca3af !important;
            color: white !important;
            font-size: 8px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .player-name-cell {
            text-align: left !important;
            font-weight: bold;
            padding: 3px 4px !important;
            font-size: 8px;
            color: #1f2937;
          }
          
          .score-table tbody tr {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-cell {
            font-weight: bold;
            font-size: 9px;
            background: white !important;
          }
          
          .subtotal-cell {
            background: #dbeafe !important;
            color: #1e3a8a !important;
            font-weight: bold;
            font-size: 9px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .total-cell {
            background: linear-gradient(to bottom right, rgba(156, 163, 175, 0.8), rgba(209, 213, 219, 0.8)) !important;
            color: #1f2937 !important;
            font-weight: bold;
            font-size: 10px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Photos Section */
          .photos-section {
            display: flex;
            gap: 10px;
            margin-bottom: 8px;
            flex-shrink: 0;
          }
          
          .photo-item {
            flex: 1;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border: 2px solid #e5e7eb;
          }
          
          .photo-item img {
            width: 100%;
            height: 110px;
            object-fit: cover;
          }
          
          /* Footer */
          .print-footer {
            padding-top: 6px;
            border-top: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 8px;
            color: #6b7280;
            flex-shrink: 0;
            margin-top: auto;
          }
          
          .footer-left, .footer-right {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .footer-left svg, .footer-right svg {
            width: 12px;
            height: 12px;
            color: #2563eb;
            flex-shrink: 0;
          }
          
          .footer-left span, .footer-right span {
            font-weight: 600;
          }
        ${isPrint ? '}' : ''}
      </style>

      
      <div class="print-content">
        <div class="print-body">
          <!-- Header Section -->
          <div class="header-section">
            <div class="header-left">
              <div style="display: flex; align-items: center; gap: 12px;">
                <!-- Logo Pangkalan Jati -->
                <div style="flex-shrink: 0;">
                  <img src="/logo-pangkalan-jati.png" alt="Logo Pangkalan Jati" style="width: 48px; height: 48px; object-fit: contain;" />
                </div>
                <!-- Title and Date -->
                <div style="flex: 1;">
                  <h1 class="header-title">Padang Golf Pangkalan Jati</h1>
                  <div class="header-datetime">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>${formatDate(scoreData.teeOffTime)}</span>
                    <span style="margin: 0 6px;">•</span>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>${formatTime(scoreData.teeOffTime)}</span>
                  </div>
                </div>
              </div>
            </div>
            ${playersToDisplay.length > 0 ? `
              <div class="header-right">
                <div class="total-score">${playersToDisplay[0].totalScore || '-'}</div>
                <div class="player-name-header">${playersToDisplay[0].playerName}</div>
                ${playersToDisplay[0].handicap !== undefined ? `
                  <div class="player-handicap">HCP: ${playersToDisplay[0].handicap}</div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          
          <!-- Main Content -->
          <div class="main-content">
            <!-- Course Image -->
            <div class="course-image">
              <img src="/lapangan.png" alt="Golf Course" />
              <div class="logo-overlay">
                <img src="/logo-app.png" alt="Logo" />
              </div>
            </div>
            
            <!-- Score Tables -->
            <div class="score-tables">
              <!-- OUT Table -->
              <div class="score-table-container">
                <table class="score-table">
                  <thead>
                    <tr class="header-out">
                      <th style="text-align: left; padding-left: 6px;">OUT</th>
                      ${outHoles.map(hole => `<th>${hole.holeNumber}</th>`).join('')}
                      <th style="background: rgba(37, 99, 235, 0.8) !important;">OUT</th>
                    </tr>
                    <tr class="header-par">
                      <th style="text-align: left; padding-left: 6px;">PAR</th>
                      ${outHoles.map(hole => `<th>${hole.par}</th>`).join('')}
                      <th style="background: rgba(107, 114, 128, 0.8) !important;">${outPar}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${playersToDisplay.map(player => {
                      const outScore = player.scores
                        .filter(s => s.holeNumber >= 1 && s.holeNumber <= 9)
                        .reduce((sum, s) => sum + s.strokes, 0);
                      
                      return `
                        <tr>
                          <td class="player-name-cell">${player.playerName}</td>
                          ${outHoles.map(hole => {
                            const holeScore = player.scores.find(s => s.holeNumber === hole.holeNumber);
                            if (holeScore) {
                              return `<td class="score-cell">${renderScoreSymbol(holeScore.strokes, hole.par)}</td>`;
                            }
                            return `<td class="score-cell">-</td>`;
                          }).join('')}
                          <td class="subtotal-cell">${
                            scoreMode === 'over' 
                              ? (outScore - outPar === 0 ? '0' : (outScore - outPar > 0 ? `+${outScore - outPar}` : outScore - outPar))
                              : (outScore || '-')
                          }</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
              
              <!-- IN Table -->
              <div class="score-table-container">
                <table class="score-table">
                  <thead>
                    <tr class="header-in">
                      <th style="text-align: left; padding-left: 6px;">IN</th>
                      ${inHoles.map(hole => `<th>${hole.holeNumber}</th>`).join('')}
                      <th style="background: rgba(37, 99, 235, 0.8) !important;">IN</th>
                      <th style="background: linear-gradient(to right, #4b5563, #4b5563) !important;">TOTAL</th>
                    </tr>
                    <tr class="header-par">
                      <th style="text-align: left; padding-left: 6px;">PAR</th>
                      ${inHoles.map(hole => `<th>${hole.par}</th>`).join('')}
                      <th style="background: rgba(107, 114, 128, 0.8) !important;">${inPar}</th>
                      <th style="background: rgba(75, 85, 99, 0.5) !important;">${totalPar}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${playersToDisplay.map(player => {
                      const inScore = player.scores
                        .filter(s => s.holeNumber >= 10 && s.holeNumber <= 18)
                        .reduce((sum, s) => sum + s.strokes, 0);
                      
                      return `
                        <tr>
                          <td class="player-name-cell">${player.playerName}</td>
                          ${inHoles.map(hole => {
                            const holeScore = player.scores.find(s => s.holeNumber === hole.holeNumber);
                            if (holeScore) {
                              return `<td class="score-cell">${renderScoreSymbol(holeScore.strokes, hole.par)}</td>`;
                            }
                            return `<td class="score-cell">-</td>`;
                          }).join('')}
                          <td class="subtotal-cell">${
                            scoreMode === 'over'
                              ? (inScore - inPar === 0 ? '0' : (inScore - inPar > 0 ? `+${inScore - inPar}` : inScore - inPar))
                              : (inScore || '-')
                          }</td>
                          <td class="total-cell">${player.totalScore || '-'}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <!-- Background Photos Section (Always Show) -->
          <div class="photos-section">
            <div class="photo-item">
              <img src="/background-1.jpg" alt="Golf Course Photo 1" />
            </div>
            <div class="photo-item">
              <img src="/background-2.jpg" alt="Golf Course Photo 2" />
            </div>
          </div>
          
          <!-- Footer -->
          <div class="print-footer">
            <div class="footer-left">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>GolfScoreID Created by PT DECOM FENO MAHAKA</span>
            </div>
            <div class="footer-right">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Printed: ${formatCurrentDateTime()}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Wait for all images in container to load
   */
  private waitForImagesToLoad(container: HTMLElement): Promise<void> {
    const images = container.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });
    });

    return Promise.all(promises).then(() => {});
  }
}

// Export singleton instance
export const printScoreService = new PrintScoreService();
