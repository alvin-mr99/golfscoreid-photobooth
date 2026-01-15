import type { ScoreData, CapturedPhoto } from '../types';

/**
 * PrintService handles printing of score data and photos
 */
class PrintService {
  /**
   * Print score data and selected photos
   * @param scoreData The scoring data to print
   * @param photos Array of selected photos to print
   */
  async printScoreAndPhotos(
    scoreData: ScoreData,
    photos: CapturedPhoto[]
  ): Promise<void> {
    try {
      // Create a hidden print container
      const printContainer = document.createElement('div');
      printContainer.id = 'print-container';
      printContainer.style.display = 'none';
      document.body.appendChild(printContainer);

      // Generate print HTML
      const printHTML = this.generatePrintHTML(scoreData, photos);
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
   * Generate HTML for printing
   */
  private generatePrintHTML(scoreData: ScoreData, photos: CapturedPhoto[]): string {
    const allHoles = Array.from(
      new Set(
        scoreData.players.flatMap(player => 
          player.scores.map(score => score.holeNumber)
        )
      )
    ).sort((a, b) => a - b);

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
      });
    };

    return `
      <style>
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          
          body {
            font-family: 'Outfit', Arial, sans-serif;
            color: #000;
            background: #fff;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid #16a34a;
          }
          
          .print-header h1 {
            font-size: 24px;
            margin: 0 0 10px 0;
            color: #16a34a;
          }
          
          .print-header p {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
          }
          
          .score-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .score-table th {
            background-color: #16a34a;
            color: white;
            padding: 10px 8px;
            text-align: center;
            border: 1px solid #15803d;
            font-size: 12px;
          }
          
          .score-table td {
            padding: 8px;
            border: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
          }
          
          .score-table td:first-child {
            text-align: left;
            font-weight: bold;
          }
          
          .score-table .total-col {
            background-color: #f3f4f6;
            font-weight: bold;
            font-size: 13px;
          }
          
          .score-table tr:nth-child(even) {
            background-color: #f9fafb;
          }
          
          .photos-section {
            margin-top: 30px;
            page-break-before: auto;
          }
          
          .photos-section h2 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #16a34a;
            border-bottom: 2px solid #16a34a;
            padding-bottom: 5px;
          }
          
          .photos-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
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
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #666;
          }
        }
      </style>
      
      <div class="print-content">
        <!-- Header -->
        <div class="print-header">
          <h1>GolfScoreID Photo Booth</h1>
          <p><strong>${scoreData.flightName}</strong></p>
          <p>${formatDate(scoreData.teeOffTime)} • ${formatTime(scoreData.teeOffTime)}</p>
        </div>
        
        <!-- Score Table -->
        <table class="score-table">
          <thead>
            <tr>
              <th>Player</th>
              ${allHoles.map(hole => `<th>${hole}</th>`).join('')}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${scoreData.players.map(player => `
              <tr>
                <td>
                  ${player.playerName}
                  ${player.handicap ? `<br><small>(HCP: ${player.handicap})</small>` : ''}
                </td>
                ${allHoles.map(holeNum => {
                  const holeScore = player.scores.find(s => s.holeNumber === holeNum);
                  return `<td>${holeScore ? holeScore.strokes : '-'}</td>`;
                }).join('')}
                <td class="total-col">${player.totalScore}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Photos Section -->
        ${photos.length > 0 ? `
          <div class="photos-section">
            <h2>Memorable Photos</h2>
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
          <p>Printed on ${formatDate(Date.now())} • GolfScoreID Photo Booth</p>
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
