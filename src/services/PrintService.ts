import type { ScoreData, CapturedPhoto } from '../types';

/**
 * PrintService handles printing of score data and photos
 */
class PrintService {
  private readonly MAX_PHOTOS = 3;
  /**
   * Generate preview HTML (without print styles)
   * @param scoreData The scoring data to preview
   * @param photos Array of selected photos to preview
   * @param selectedPlayerIds Array of selected player IDs to preview
   */
  async generatePreviewHTML(
    scoreData: ScoreData,
    photos: CapturedPhoto[],
    selectedPlayerIds?: string[]
  ): Promise<string> {
    // Simulate loading time for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Limit to maximum 3 photos
    const limitedPhotos = photos.slice(0, this.MAX_PHOTOS);
    
    return this.generatePrintHTML(scoreData, limitedPhotos, false, selectedPlayerIds);
  }

  /**
   * Print score data and selected photos
   * @param scoreData The scoring data to print
   * @param photos Array of selected photos to print
   * @param selectedPlayerIds Array of selected player IDs to print
   */
  async printScoreAndPhotos(
    scoreData: ScoreData,
    photos: CapturedPhoto[],
    selectedPlayerIds?: string[]
  ): Promise<void> {
    try {
      // Limit to maximum 3 photos
      const limitedPhotos = photos.slice(0, this.MAX_PHOTOS);

      // Create a hidden print container
      const printContainer = document.createElement('div');
      printContainer.id = 'print-container';
      printContainer.style.display = 'none';
      document.body.appendChild(printContainer);

      // Generate print HTML with selected players and limited photos
      const printHTML = this.generatePrintHTML(scoreData, limitedPhotos, true, selectedPlayerIds);
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
   * Generate HTML for printing or preview
   * @param isPrint Whether this is for printing (true) or preview (false)
   * @param selectedPlayerIds Array of selected player IDs to include
   */
  private generatePrintHTML(scoreData: ScoreData, photos: CapturedPhoto[], isPrint: boolean = true, selectedPlayerIds?: string[]): string {
    const holes = scoreData.holes || [];
    const outHoles = holes.slice(0, 9);
    const inHoles = holes.slice(9, 18);

    // Filter players based on selection
    const playersToDisplay = selectedPlayerIds && selectedPlayerIds.length > 0
      ? scoreData.players.filter(p => selectedPlayerIds.includes(p.playerId))
      : scoreData.players;

    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };

    const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const formatGameMode = (mode: string | undefined) => {
      if (!mode) return 'Stroke Play';
      return mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatCourseType = (type: string | undefined) => {
      if (!type) return '18 Holes';
      if (type === 'FULL') return '18 Holes';
      if (type === 'HALF') return '9 Holes';
      return type;
    };

    const getScoreColor = (strokes: number, par: number) => {
      const diff = strokes - par;
      if (diff <= -2) return 'eagle'; // Eagle or better
      if (diff === -1) return 'birdie'; // Birdie
      if (diff === 0) return 'par'; // Par
      if (diff === 1) return 'bogey'; // Bogey
      return 'double'; // Double bogey or worse
    };

    return `
      <style>
        ${isPrint ? '@media print {' : ''}
          @page {
            size: A4 landscape;
            margin: 0.6cm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            font-family: 'Outfit', Arial, sans-serif;
            color: #000;
            background: #fff;
          }
          
          .print-content {
            width: 100%;
          }
          
          .print-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 3px solid #16a34a;
            position: relative;
          }
          
          .print-header .logo-left {
            width: 80px;
            height: 80px; 
            padding: 8px; 
            flex-shrink: 0;
          }
          
          .print-header .logo-left img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          
          .print-header .header-center {
            flex: 1;
            text-align: center;
            padding: 0 20px;
          }
          
          .print-header h1 {
            font-size: 22px;
            margin: 0 0 8px 0;
            color: #16a34a;
            font-weight: bold;
          }
          
          .print-header .flight-name {
            font-size: 18px;
            margin: 5px 0;
            font-weight: bold;
            color: #1f2937;
          }
          
          .print-header .date-time {
            font-size: 12px;
            color: #666;
            margin: 3px 0;
          }
          
          .print-header .logo-right {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
            
          }
          
          .print-header .logo-right img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          
          .flight-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 8px;
            flex-wrap: wrap;
          }
          
          .info-item {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            background: #f3f4f6;
            border-radius: 8px;
            border: 1px solid #d1d5db;
            font-size: 10px;
          }
          
          .info-label {
            font-weight: 600;
            color: #4b5563;
            text-transform: uppercase;
            font-size: 9px;
          }
          
          .info-value {
            font-weight: bold;
            color: #1f2937;
          }
          
          .legend {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-bottom: 8px;
            padding: 6px;
            background: #f9fafb;
            border-radius: 8px;
            flex-wrap: wrap;
          }
          
          .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 9px;
          }
          
          .legend-box {
            width: 18px;
            height: 18px;
            border: 1px solid #9ca3af;
            border-radius: 3px;
            display: inline-block;
          }
          
          .legend-box.eagle { 
            background-color: #fcd34d !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .legend-box.birdie { 
            background-color: #4ade80 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .legend-box.par { 
            background-color: #fff !important;
            border: 2px solid #6b7280 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .legend-box.bogey { 
            background-color: #fdba74 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .legend-box.double { 
            background-color: #f87171 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 9px;
          }
          
          .score-table th {
            padding: 6px 3px;
            text-align: center;
            border: 1px solid #1e40af;
            font-weight: bold;
          }
          
          .score-table td {
            padding: 6px 3px;
            border: 1px solid #d1d5db;
            text-align: center;
          }
          
          .header-out-in {
            background-color: #1e3a8a !important;
            color: white !important;
            font-size: 9px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .header-holes {
            background-color: #1e40af !important;
            color: white !important;
            font-size: 9px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .header-par {
            background-color: #3b82f6 !important;
            color: white !important;
            font-size: 9px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .header-index {
            background-color: #60a5fa !important;
            color: white !important;
            font-size: 9px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .player-name-cell {
            text-align: left !important;
            font-weight: bold;
            background: inherit;
            min-width: 100px;
            font-size: 9px;
            padding: 6px 8px !important;
          }
          
          .player-info {
            font-size: 8px;
            font-weight: normal;
            color: #4b5563;
            margin-top: 2px;
          }
          
          .score-table tbody tr:nth-child(even) {
            background-color: #eff6ff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-table tbody tr:nth-child(odd) {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-cell {
            font-weight: bold;
            font-size: 10px;
          }
          
          .score-cell.eagle {
            background-color: #fcd34d !important;
            color: #1f2937 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-cell.birdie {
            background-color: #4ade80 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-cell.par {
            background-color: #fff !important;
            color: #1f2937 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-cell.bogey {
            background-color: #fdba74 !important;
            color: #1f2937 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-cell.double {
            background-color: #f87171 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .subtotal-cell {
            background-color: #dbeafe !important;
            color: #1e3a8a !important;
            font-weight: bold;
            font-size: 10px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .total-cell {
            background-color: #93c5fd !important;
            color: #1e3a8a !important;
            font-weight: bold;
            font-size: 11px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .section-divider {
            background-color: #1e40af !important;
          }
          
          .photos-section {
            margin-top: 12px;
            page-break-before: auto;
          }
          
          .photos-section h2 {
            font-size: 14px;
            margin-bottom: 8px;
            color: #16a34a;
            border-bottom: 2px solid #16a34a;
            padding-bottom: 4px;
          }
          
          .photos-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 10px;
          }
          
          .photo-item {
            border: 2px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            page-break-inside: avoid;
          }
          
          .photo-item img {
            width: 100%;
            height: auto;
            display: block;
          }
          
          .print-footer {
            margin-top: 8px;
            padding-top: 6px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 9px;
            color: #666;
          }
        ${isPrint ? '}' : ''}
      </style>
      
      <div class="print-content">
        <!-- Header -->
        <div class="print-header">
          <div class="logo-left">
            <img src="/logo-pangkalan-jati.png" alt="GolfScoreID Logo" />
          </div>
          <div class="header-center">
            <h1>GolfScoreID</h1>
            <p class="flight-name">${scoreData.flightName}</p>
            <p class="date-time">${formatDate(scoreData.teeOffTime)} • ${formatTime(scoreData.teeOffTime)}</p>
          </div>
          <div class="logo-right">
            <img src="/logo-app.png" alt="Icon" />
          </div>
        </div>
        
        <!-- Flight Information -->
        <div class="flight-info">
          <div class="info-item">
            <span class="info-label">Tee Off:</span>
            <span class="info-value">${formatTime(scoreData.teeOffTime)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Start Hole:</span>
            <span class="info-value">Hole ${scoreData.startHole || 1}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Game Mode:</span>
            <span class="info-value">${formatGameMode(scoreData.gameMode)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Course:</span>
            <span class="info-value">${formatCourseType(scoreData.courseType)}</span>
          </div>
        </div>
        
        
        <div class="legend" style="display: flex; align-items: center; justify-content: space-between; gap: 15px; flex-wrap: wrap;">
          
            <div style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: linear-gradient(to bottom right, #f0fdf4, #dcfce7); border-radius: 8px; border: 1px solid #86efac;">
              <div style="min-width: 0;">
               
                <div style="font-weight: bold; font-size: 10px; color: #1f2937;"> <span style="margin-right:5px ; font-size: 8px; color: #16a34a; font-weight: 900; text-transform: uppercase;">Course</span> Padang Golf Pangkalan Jati</div>
              </div>
            </div>
         
          
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-left: auto;">
            <div class="legend-item">
              <div class="legend-box eagle"></div>
              <span>Eagle</span>
            </div>
            <div class="legend-item">
              <div class="legend-box birdie"></div>
              <span>Birdie</span>
            </div>
            <div class="legend-item">
              <div class="legend-box par"></div>
              <span>Par</span>
            </div>
            <div class="legend-item">
              <div class="legend-box bogey"></div>
              <span>Bogey</span>
            </div>
            <div class="legend-item">
              <div class="legend-box double"></div>
              <span>Double+</span>
            </div>
          </div>
        </div>
        
        <!-- Score Table -->
        <table class="score-table">
          <thead>
            <!-- OUT/IN Header Row -->
            <tr class="header-out-in">
              <th rowspan="4" class="player-name-cell" style="vertical-align: middle;">Player</th>
              <th colspan="9">OUT</th>
              <th rowspan="4" style="vertical-align: middle; min-width: 35px;">1-9</th>
              <th colspan="9">IN</th>
              <th rowspan="4" style="vertical-align: middle; min-width: 35px;">10-18</th>
              <th rowspan="4" style="vertical-align: middle; min-width: 40px;">TOTAL</th>
            </tr>
            <!-- Hole Numbers Row -->
            <tr class="header-holes">
              ${outHoles.map(hole => `<th style="min-width: 28px;">${hole.holeNumber}</th>`).join('')}
              ${inHoles.map(hole => `<th style="min-width: 28px;">${hole.holeNumber}</th>`).join('')}
            </tr>
            <!-- Par Row -->
            <tr class="header-par">
              ${outHoles.map(hole => `<th>${hole.par}</th>`).join('')}
              ${inHoles.map(hole => `<th>${hole.par}</th>`).join('')}
            </tr>
            <!-- Index Row -->
            <tr class="header-index">
              ${outHoles.map(hole => `<th>${hole.index}</th>`).join('')}
              ${inHoles.map(hole => `<th>${hole.index}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${playersToDisplay.map(player => {
              const outScore = player.scores
                .filter(s => s.holeNumber >= 1 && s.holeNumber <= 9)
                .reduce((sum, s) => sum + s.strokes, 0);
              
              const inScore = player.scores
                .filter(s => s.holeNumber >= 10 && s.holeNumber <= 18)
                .reduce((sum, s) => sum + s.strokes, 0);

              return `
                <tr>
                  <td class="player-name-cell">
                    <div>${player.playerName}</div>
                    ${player.bagTagNumber ? `<div class="player-info">Bag: ${player.bagTagNumber}</div>` : ''}
                    ${player.handicap !== undefined ? `<div class="player-info">HCP: ${player.handicap}</div>` : ''}
                  </td>
                  ${outHoles.map(hole => {
                    const holeScore = player.scores.find(s => s.holeNumber === hole.holeNumber);
                    if (holeScore) {
                      const colorClass = getScoreColor(holeScore.strokes, hole.par);
                      return `<td class="score-cell ${colorClass}">${holeScore.strokes}</td>`;
                    }
                    return `<td class="score-cell">-</td>`;
                  }).join('')}
                  <td class="subtotal-cell">${outScore || '-'}</td>
                  ${inHoles.map(hole => {
                    const holeScore = player.scores.find(s => s.holeNumber === hole.holeNumber);
                    if (holeScore) {
                      const colorClass = getScoreColor(holeScore.strokes, hole.par);
                      return `<td class="score-cell ${colorClass}">${holeScore.strokes}</td>`;
                    }
                    return `<td class="score-cell">-</td>`;
                  }).join('')}
                  <td class="subtotal-cell">${inScore || '-'}</td>
                  <td class="total-cell">${player.totalScore || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <!-- Photos Section -->
        ${photos.length > 0 ? `
          <div class="photos-section">
            <h2>Captured Moments</h2>
            <div class="photos-grid">
              ${photos.map(photo => `
                <div class="photo-item">
                  <img src="${photo.dataUrl}" alt="Golf Photo" />
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="print-footer">
          <p>${formatDate(Date.now())} at ${formatTime(Date.now())} • GolfScoreID • Created by PT DECOM FENO MAHAKA</p>
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
export const printService = new PrintService();
