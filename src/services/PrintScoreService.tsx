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

    // Always show 6 players (fill with empty rows if needed)
    const MAX_PLAYERS = 6;
    const playersToDisplay = [...scoreData.players];
    
    // Fill empty rows if less than 6 players
    while (playersToDisplay.length < MAX_PLAYERS) {
      playersToDisplay.push({
        playerId: `empty-${playersToDisplay.length}`,
        playerName: '',
        scores: [],
        totalScore: 0,
        bagTagNumber: '',
        handicap: undefined
      });
    }

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

    // Function to render score with color background (matching ScoreDisplayNew.tsx)
    const renderScoreWithColor = (strokes: number, par: number) => {
      const diff = strokes - par;
      
      // Determine display value based on mode
      const displayValue = scoreMode === 'stroke' 
        ? strokes 
        : (diff === 0 ? '0' : (diff > 0 ? `+${diff}` : diff));
      
      // Determine background color class based on score
      let bgClass = '';
      let textColorClass = '';
      
      if (diff <= -2) {
        // Eagle or better - Yellow
        bgClass = 'score-bg-eagle';
        textColorClass = 'text-gray-900';
      } else if (diff === -1) {
        // Birdie - Green
        bgClass = 'score-bg-birdie';
        textColorClass = 'text-white';
      } else if (diff === 0) {
        // Par - White
        bgClass = 'score-bg-par';
        textColorClass = 'text-gray-900';
      } else if (diff === 1) {
        // Bogey - Orange
        bgClass = 'score-bg-bogey';
        textColorClass = 'text-gray-900';
      } else {
        // Double Bogey or worse - Red
        bgClass = 'score-bg-double';
        textColorClass = 'text-white';
      }
      
      return `
        <div class="score-cell-inner ${bgClass}">
          <span style="font-size: 8px; font-weight: bold;" class="${textColorClass}">${displayValue}</span>
        </div>
      `;
    };

    return `
      <style>
        ${isPrint ? '@media print {' : ''}
          @page {
            size: 152mm 102mm landscape;
            margin: 2mm;
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
            width: 100%;
            overflow: hidden;
          }
          
          .print-content {
            width: 152mm;
            height: 102mm;
            background: white;
            border-radius: 8px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 2px solid rgba(255, 255, 255, 0.5);
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          .print-body {
            padding: 3mm 1.5mm 1.5mm 1.5mm;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 0.5mm;
            position: relative;
          }
          
          /* Header Section */
          .header-section {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2mm;
            padding-bottom: 0.8mm;
            border-bottom: 1.5px solid #e5e7eb;
            flex-shrink: 0;
            min-height: 9mm;
          }
          
          .header-left {
            display: flex;
            align-items: center;
            gap: 1.5mm;
            flex: 1;
          }
          
          .logo-container {
            flex-shrink: 0;
          }
          
          .logo-container img {
            width: 6mm;
            height: 6mm;
            object-fit: contain;
          }
          
          .header-title {
            font-size: 9px;
            font-weight: 900;
            background: linear-gradient(to right, #618740, #618740);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 0 0 0.2mm 0;
            line-height: 1;
            text-align: left;
          }
          
          .header-datetime {
            display: flex;
            align-items: center;
            gap: 0.8mm;
            color: #374151;
            font-size: 5.5px;
          }
          
          .header-datetime svg {
            width: 6px;
            height: 6px;
            color: #618740;
            flex-shrink: 0;
          }
          
          .header-datetime span {
            font-weight: 600;
          }
          
          .header-right {
            display: flex;
            align-items: center;
            gap: 3mm;
          }
          
          .legend-container {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 1mm;
            flex-wrap: wrap;
          }
          
          .player-info {
            text-align: right;
          }
          
          .total-score {
            font-size: 16px;
            font-weight: 900;
            background: linear-gradient(to right, #000000, #000000);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1;
            margin-bottom: 0.2mm;
          }
          
          .player-name-header {
            font-size: 7.5px;
            font-weight: bold;
            color: #1f2937;
          }
          
          .player-handicap {
            font-size: 5.5px;
            color: #6b7280;
            font-weight: 500;
          }
          
          /* Main Content Section */
          .main-content {
            display: flex;
            gap: 2mm;
            flex: 1;
            min-height: 0;
            position: relative;
          }
          
          .course-images {
            width: 25%;
            display: flex;
            flex-direction: column;
            gap: 1.5mm;
          }
          
          .course-image-top {
            height: 44mm;
            position: relative;
            border-radius: 2mm;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .course-image-bottom {
            height: 35mm;
            position: relative;
            border-radius: 2mm;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .course-image-top img,
          .course-image-bottom img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
          }
          
          .logo-overlay {
            position: absolute;
            top: 1.5mm;
            right: 1.5mm;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(2px);
            border-radius: 1.5mm;
            padding: 0.8mm;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .logo-overlay img {
            width: 6mm;
            height: 6mm;
            object-fit: contain;
            transform: scale(1.3);
          }
          
          .score-tables {
            width: 75%;
            display: flex;
            flex-direction: column;
            gap: 0.2mm;
            height: 100%;
          }
          
          .legend-container {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 1mm;
            flex-wrap: wrap;
            margin-bottom : -16px;
          }
          
          .legend-item {
            display: flex;
            align-items: center;
            gap: 0.5mm;
          }
          
          .legend-item svg {
            width: 7px;
            height: 7px;
          }
          
          .legend-item span {
            font-size: 5.5px;
            font-weight: bold;
            color: #374151;
          }
          
          .score-table-container {
            flex: 1;
            overflow: hidden;
            border-radius: 2mm;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 2px solid #fff;
          }
          
          .score-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            height: 100%;
            table-layout: fixed;
          }
          
          .score-table th {
            padding: 0.5mm;
            text-align: center;
            border: 0.5px solid rgba(97, 135, 64, 0.5);
            font-weight: bold;
          }
          
          .score-table td {
            padding: 0;
            border: 0.5px solid rgba(209, 213, 219, 0.5);
            text-align: center;
            vertical-align: middle;
          }
          
          .header-out, .header-in {
            background: linear-gradient(to right, #618740, #618740) !important;
            color: white !important;
            font-size: 7px;
            height: 1.5mm;
            padding: 0.3mm 1mm;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .header-par {
            background: #9ca3af !important;
            color: #000000 !important;
            font-size: 7px;
            height: 1.5mm;
            padding: 0.3mm 1mm;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .player-name-cell {
            text-align: left !important;
            font-weight: bold;
            padding: 0.5mm 2mm !important;
            font-size: 8px;
            color: #1f2937;
            width: 20mm;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .score-table tbody tr {
            background: white !important;
            height: 3.5mm;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-table tbody tr:nth-child(even) {
            background: rgba(249, 250, 251, 0.3) !important;
          }
          
          .score-cell {
            font-weight: bold;
            font-size: 8px;
            background: white !important;
            padding: 0 !important;
            width: 5mm;
          }
          
          .score-cell-inner {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            min-width: 5mm;
            padding: 1mm 0;
          }
          
          .score-bg-eagle {
            background: #fcd34d !important;
            color: #1f2937 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-bg-birdie {
            background: #4ade80 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-bg-par {
            background: #ffffff !important;
            color: #1f2937 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-bg-bogey {
            background: #fdba74 !important;
            color: #1f2937 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .score-bg-double {
            background: #f87171 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .subtotal-cell {
            background: #618740 !important;
            color: #ffffff !important;
            font-weight: bold;
            font-size: 8px;
            padding: 0.5mm !important;
            width: 5mm;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .total-cell {
            background: linear-gradient(to bottom right, rgba(156, 163, 175, 0.8), rgba(209, 213, 219, 0.8)) !important;
            color: #1f2937 !important;
            font-weight: bold;
            font-size: 8px;
            padding: 0.5mm !important;
            width: 5mm;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Footer */
          .print-footer {
            position: absolute;
            bottom: 2mm;
            left: 2mm;
            display: flex;
            align-items: center;
            gap: 1mm;
            font-size: 6px;
            color: #6b7280;
            z-index: 10;
          }
          
          .footer-content {
            display: flex;
            align-items: center;
            gap: 1mm;
          }
          
          .footer-content img {
            width: 4mm;
            height: 4mm;
            object-fit: contain;
          }
          
          .footer-text {
            display: flex;
            flex-direction: column;
            gap: 0.2mm;
          }
          
          .footer-brand {
            font-size: 6px;
            font-weight: bold;
            color: #1f2937;
          }
          
          .footer-company {
            font-size: 6px;
             font-weight: bold;
            color: #6b7280;
          }
        ${isPrint ? '}' : ''}
      </style>

      
      <div class="print-content">
        <div class="print-body">
          <!-- Header Section -->
          <div class="header-section">
            <div class="header-left">
              <!-- Logo Pangkalan Jati -->
              <div class="logo-container">
                <img src="/logo-pangkalan-jati.png" alt="Logo Pangkalan Jati" />
              </div>
              
              <!-- Nama Lapangan & Tanggal -->
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
            <div class="header-right">
              <!-- Legend -->
              <div class="legend-container">
                <div class="legend-item">
                  <svg width="7" height="7" viewBox="0 0 28 28">
                    <circle cx="14" cy="14" r="12" fill="#fcd34d" stroke="#1f2937" stroke-width="0.8"/>
                    <circle cx="14" cy="14" r="8" fill="none" stroke="#1f2937" stroke-width="0.8"/>
                  </svg>
                  <span>Eagle</span>
                </div>
                <div class="legend-item">
                  <svg width="7" height="7" viewBox="0 0 28 28">
                    <path d="M14 3 L25 23 L3 23 Z" fill="#4ade80" stroke="#1f2937" stroke-width="0.8"/>
                  </svg>
                  <span>Birdie</span>
                </div>
                <div class="legend-item">
                  <svg width="7" height="7" viewBox="0 0 28 28">
                    <circle cx="14" cy="14" r="10" fill="#ffffff" stroke="#1f2937" stroke-width="0.8"/>
                  </svg>
                  <span>Par</span>
                </div>
                <div class="legend-item">
                  <svg width="7" height="7" viewBox="0 0 28 28">
                    <rect x="3" y="3" width="22" height="22" fill="#fdba74" stroke="#1f2937" stroke-width="0.8"/>
                  </svg>
                  <span>Bogey</span>
                </div>
                <div class="legend-item">
                  <svg width="7" height="7" viewBox="0 0 28 28">
                    <rect x="2" y="2" width="24" height="24" fill="#f87171" stroke="#1f2937" stroke-width="0.8"/>
                    <rect x="7" y="7" width="14" height="14" fill="none" stroke="#1f2937" stroke-width="0.8"/>
                  </svg>
                  <span>Doubles+</span>
                </div>
              </div>
              ${playersToDisplay.length > 0 ? `
                <div class="player-info">
                  <div class="total-score">${playersToDisplay[0].totalScore || '-'}</div>
                  <div class="player-name-header">${playersToDisplay[0].playerName}</div>
                  ${playersToDisplay[0].handicap !== undefined ? `
                    <div class="player-handicap">HCP: ${playersToDisplay[0].handicap}</div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Main Content -->
          <div class="main-content">
            <!-- Course Images (Two Photos Stacked) -->
            <div class="course-images">
              <div class="course-image-top">
                <img src="/lapangan1.png" alt="Golf Course 1" />
                <div class="logo-overlay">
                  <img src="/logo-app.png" alt="Logo" />
                </div>
              </div>
              <div class="course-image-bottom">
                <img src="/lapangan2.png" alt="Golf Course 2" />
              </div>
            </div>
            
            <!-- Score Tables -->
            <div class="score-tables">
              <!-- OUT Table -->
              <div class="score-table-container">
                <table class="score-table">
                  <thead>
                    <tr class="header-out">
                      <th style="text-align: left; padding-left: 2mm; width: 20mm;">OUT</th>
                      ${outHoles.map(hole => `<th style="width: 5mm;">${hole.holeNumber}</th>`).join('')}
                      <th style="background: rgba(97, 135, 64, 0.5) !important; width: 5mm;">OUT</th>
                    </tr>
                    <tr class="header-par">
                      <th style="text-align: left; padding-left: 2mm;">PAR</th>
                      ${outHoles.map(hole => `<th>${hole.par}</th>`).join('')}
                      <th style="background: #9ca3af !important; color: #000000 !important;">${outPar}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${playersToDisplay.map((player, idx) => {
                      const isEmptyRow = !player.playerName;
                      const outScore = player.scores
                        .filter(s => s.holeNumber >= 1 && s.holeNumber <= 9)
                        .reduce((sum, s) => sum + s.strokes, 0);
                      
                      const playerNameWords = player.playerName ? player.playerName.trim().split(/\s+/).slice(0, 3).join(' ') : '';
                      
                      return `
                        <tr style="${idx % 2 === 0 ? 'background: white !important;' : 'background: rgba(249, 250, 251, 0.3) !important;'}">
                          <td class="player-name-cell" title="${player.playerName}">
                            ${!isEmptyRow ? `<div style="line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${playerNameWords}</div>` : '<div style="display: flex; align-items: center; justify-content: center; height: 100%;"><span style="color: #d1d5db;">-</span></div>'}
                          </td>
                          ${outHoles.map(hole => {
                            const holeScore = player.scores.find(s => s.holeNumber === hole.holeNumber);
                            if (!isEmptyRow && holeScore) {
                              return `<td class="score-cell"><div style="display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;">${renderScoreWithColor(holeScore.strokes, hole.par)}</div></td>`;
                            }
                            return `<td class="score-cell"><div style="display: flex; align-items: center; justify-content: center; height: 100%;"><span style="font-size: 8px; color: #d1d5db;">-</span></div></td>`;
                          }).join('')}
                          <td class="subtotal-cell">${
                            !isEmptyRow && outScore > 0 ? (
                              scoreMode === 'over' 
                                ? (outScore - outPar === 0 ? '0' : (outScore - outPar > 0 ? `+${outScore - outPar}` : outScore - outPar))
                                : outScore
                            ) : ''
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
                      <th style="text-align: left; padding-left: 2mm; width: 20mm;">IN</th>
                      ${inHoles.map(hole => `<th style="width: 5mm;">${hole.holeNumber}</th>`).join('')}
                      <th style="background: rgba(97, 135, 64, 0.5) !important; width: 5mm;">IN</th>
                      <th style="background: linear-gradient(to right, #4b5563, #4b5563) !important; width: 5mm;">TOTAL</th>
                    </tr>
                    <tr class="header-par">
                      <th style="text-align: left; padding-left: 2mm;">PAR</th>
                      ${inHoles.map(hole => `<th>${hole.par}</th>`).join('')}
                      <th style="background: #9ca3af !important; color: #000000 !important;">${inPar}</th>
                      <th style="background: rgba(75, 85, 99, 0.5) !important; color: #000000 !important;">${totalPar}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${playersToDisplay.map((player, idx) => {
                      const isEmptyRow = !player.playerName;
                      const inScore = player.scores
                        .filter(s => s.holeNumber >= 10 && s.holeNumber <= 18)
                        .reduce((sum, s) => sum + s.strokes, 0);
                      
                      const playerNameWords = player.playerName ? player.playerName.trim().split(/\s+/).slice(0, 3).join(' ') : '';
                      
                      return `
                        <tr style="${idx % 2 === 0 ? 'background: white !important;' : 'background: rgba(249, 250, 251, 0.3) !important;'}">
                          <td class="player-name-cell" title="${player.playerName}">
                            ${!isEmptyRow ? `<div style="line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${playerNameWords}</div>` : '<div style="display: flex; align-items: center; justify-content: center; height: 100%;"><span style="color: #d1d5db;">-</span></div>'}
                          </td>
                          ${inHoles.map(hole => {
                            const holeScore = player.scores.find(s => s.holeNumber === hole.holeNumber);
                            if (!isEmptyRow && holeScore) {
                              return `<td class="score-cell"><div style="display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;">${renderScoreWithColor(holeScore.strokes, hole.par)}</div></td>`;
                            }
                            return `<td class="score-cell"><div style="display: flex; align-items: center; justify-content: center; height: 100%;"><span style="font-size: 8px; color: #d1d5db;">-</span></div></td>`;
                          }).join('')}
                          <td class="subtotal-cell">${
                            !isEmptyRow && inScore > 0 ? (
                              scoreMode === 'over'
                                ? (inScore - inPar === 0 ? '0' : (inScore - inPar > 0 ? `+${inScore - inPar}` : inScore - inPar))
                                : inScore
                            ) : ''
                          }</td>
                          <td class="total-cell">${!isEmptyRow && player.totalScore ? player.totalScore : ''}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="print-footer">
            <div class="footer-content">
              <img src="/icon.png" alt="GolfScoreID Icon" />
              <div class="footer-text">
                <div class="footer-brand">GolfScoreID <span class="footer-company"> by DECOM FENO MAHAKA</span> </div>
              </div>
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
