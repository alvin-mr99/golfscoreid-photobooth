import { useState, useEffect } from 'react';
import type { ScoreData } from '../types';

interface ScoreDisplayProps {
  scoreData: ScoreData;
}

export function ScoreDisplay({ scoreData }: ScoreDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const formatCurrentDateTime = () => {
    return currentTime.toLocaleString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Get all 18 holes from scoreData
  const holes = scoreData.holes || [];

  // Split holes into OUT (1-9) and IN (10-18)
  const outHoles = holes.slice(0, 9);
  const inHoles = holes.slice(9, 18);

  // Calculate OUT par (holes 1-9)
  const outPar = outHoles.reduce((sum, hole) => sum + hole.par, 0);
  
  // Calculate IN par (holes 10-18)
  const inPar = inHoles.reduce((sum, hole) => sum + hole.par, 0);
  
  // Total par
  const totalPar = outPar + inPar;

  // Function to get score color based on relation to par
  const getScoreColor = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (diff <= -2) return 'bg-yellow-300 text-gray-900 font-bold'; // Eagle or better
    if (diff === -1) return 'bg-green-400 text-white font-bold'; // Birdie
    if (diff === 0) return 'bg-white text-gray-900'; // Par
    if (diff === 1) return 'bg-orange-300 text-gray-900 font-bold'; // Bogey
    return 'bg-red-400 text-white font-bold'; // Double bogey or worse
  };

  // Format game mode for display
  const formatGameMode = (mode: string | undefined) => {
    if (!mode) return 'Stroke Play';
    return mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format course type for display
  const formatCourseType = (type: string | undefined) => {
    if (!type) return '18 Holes';
    if (type === 'FULL') return '18 Holes';
    if (type === 'HALF') return '9 Holes';
    return type;
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-6 print:shadow-none print:p-4 border-2 border-white/50">
      {/* Header */}
      <div className="mb-4 pb-4 border-b-2 border-white/30">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-800">
            {scoreData.flightName}
          </h2>
        </div>
        
        {/* Flight Information Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {/* Tee Off Time */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="min-w-0">
              <div className="text-[9px] text-blue-600 font-semibold uppercase">Tee Off</div>
              <div className="font-bold text-xs text-gray-800 truncate">{formatTime(scoreData.teeOffTime)}</div>
            </div>
          </div>

          {/* Start Hole */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <div className="min-w-0">
              <div className="text-[9px] text-green-600 font-semibold uppercase">Start Hole</div>
              <div className="font-bold text-xs text-gray-800">Hole {scoreData.startHole || 1}</div>
            </div>
          </div>

          {/* Game Mode */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200">
            <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="min-w-0">
              <div className="text-[9px] text-purple-600 font-semibold uppercase">Game Mode</div>
              <div className="font-bold text-xs text-gray-800 truncate">{formatGameMode(scoreData.gameMode)}</div>
            </div>
          </div>

          {/* Course Type */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200">
            <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <div className="min-w-0">
              <div className="text-[9px] text-orange-600 font-semibold uppercase">Course</div>
              <div className="font-bold text-xs text-gray-800">{formatCourseType(scoreData.courseType)}</div>
            </div>
          </div>
        </div>

        {/* Date Display */}
        <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-semibold text-sm text-gray-700">{formatDate(scoreData.teeOffTime)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
        <span className="font-semibold text-gray-700 text-xs">Scoring:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-yellow-300 rounded border border-gray-300"></div>
          <span className="text-[10px] font-medium text-gray-700">Eagle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-green-400 rounded border border-gray-300"></div>
          <span className="text-[10px] font-medium text-gray-700">Birdie</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-white rounded border border-gray-300"></div>
          <span className="text-[10px] font-medium text-gray-700">Par</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-orange-300 rounded border border-gray-300"></div>
          <span className="text-[10px] font-medium text-gray-700">Bogey</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-red-400 rounded border border-gray-300"></div>
          <span className="text-[10px] font-medium text-gray-700">Double+</span>
        </div>
      </div>

      {/* Score Table - Compact for full 18 holes visibility */}
      <div className="overflow-x-auto rounded-2xl shadow-xl">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            {/* OUT/IN Header Row */}
            <tr className="bg-gradient-to-r from-blue-700 to-blue-800 text-white">
              <th className="px-1.5 py-1.5 text-left font-bold border border-blue-800/50 sticky left-0 bg-blue-700 z-10 min-w-[100px] text-[10px]">
                Player
              </th>
              <th colSpan={9} className="px-1 py-1.5 text-center font-bold border border-blue-800/50 bg-blue-600/80 text-[10px]">
                OUT
              </th>
              <th className="px-1 py-1.5 text-center font-bold border border-blue-800/50 bg-blue-700/80 min-w-[35px] text-[10px]">
                1-9
              </th>
              <th colSpan={9} className="px-1 py-1.5 text-center font-bold border border-blue-800/50 bg-blue-600/80 text-[10px]">
                IN
              </th>
              <th className="px-1 py-1.5 text-center font-bold border border-blue-800/50 bg-blue-700/80 min-w-[35px] text-[10px]">
                10-18
              </th>
              <th className="px-1 py-1.5 text-center font-bold border border-blue-800/50 bg-blue-800/80 min-w-[40px] text-[10px]">
                TOTAL
              </th>
            </tr>
            {/* Hole Numbers Row */}
            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <th className="px-1.5 py-1.5 text-left font-bold border border-blue-700/50 sticky left-0 bg-blue-600 z-10 text-[10px]">
                Hole
              </th>
              {outHoles.map((hole, holeIdx) => (
                <th key={`hole-out-${hole.holeNumber}-${holeIdx}`} className="px-0.5 py-1.5 text-center font-bold border border-blue-700/50 min-w-[28px] text-[10px]">
                  {hole.holeNumber}
                </th>
              ))}
              <th className="px-1 py-1.5 text-center font-bold border border-blue-700/50 bg-blue-700/50 text-[10px]">
                
              </th>
              {inHoles.map((hole, holeIdx) => (
                <th key={`hole-in-${hole.holeNumber}-${holeIdx}`} className="px-0.5 py-1.5 text-center font-bold border border-blue-700/50 min-w-[28px] text-[10px]">
                  {hole.holeNumber}
                </th>
              ))}
              <th className="px-1 py-1.5 text-center font-bold border border-blue-700/50 bg-blue-700/50 text-[10px]">
                
              </th>
              <th className="px-1 py-1.5 text-center font-bold border border-blue-700/50 bg-blue-800/50 text-[10px]">
                
              </th>
            </tr>
            {/* Par Row */}
            <tr className="bg-blue-500 text-white">
              <th className="px-1.5 py-1 text-left font-semibold border border-blue-600/50 sticky left-0 bg-blue-500 z-10 text-[10px]">
                Par
              </th>
              {outHoles.map((hole, holeIdx) => (
                <th key={`par-out-${hole.holeNumber}-${holeIdx}`} className="px-0.5 py-1 text-center font-semibold border border-blue-600/50 text-[10px]">
                  {hole.par}
                </th>
              ))}
              <th className="px-1 py-1 text-center font-semibold border border-blue-600/50 bg-blue-600/50 text-[10px]">
                {outPar}
              </th>
              {inHoles.map((hole, holeIdx) => (
                <th key={`par-in-${hole.holeNumber}-${holeIdx}`} className="px-0.5 py-1 text-center font-semibold border border-blue-600/50 text-[10px]">
                  {hole.par}
                </th>
              ))}
              <th className="px-1 py-1 text-center font-semibold border border-blue-600/50 bg-blue-600/50 text-[10px]">
                {inPar}
              </th>
              <th className="px-1 py-1 text-center font-semibold border border-blue-600/50 bg-blue-700/50 text-[10px]">
                {totalPar}
              </th>
            </tr>
            {/* Index Row */}
            <tr className="bg-blue-400 text-white">
              <th className="px-1.5 py-1 text-left font-semibold border border-blue-500/50 sticky left-0 bg-blue-400 z-10 text-[10px]">
                Index
              </th>
              {outHoles.map((hole, holeIdx) => (
                <th key={`index-out-${hole.holeNumber}-${holeIdx}`} className="px-0.5 py-1 text-center font-semibold border border-blue-500/50 text-[10px]">
                  {hole.index}
                </th>
              ))}
              <th className="px-1 py-1 text-center font-semibold border border-blue-500/50 bg-blue-500/50 text-[10px]">
                -
              </th>
              {inHoles.map((hole, holeIdx) => (
                <th key={`index-in-${hole.holeNumber}-${holeIdx}`} className="px-0.5 py-1 text-center font-semibold border border-blue-500/50 text-[10px]">
                  {hole.index}
                </th>
              ))}
              <th className="px-1 py-1 text-center font-semibold border border-blue-500/50 bg-blue-500/50 text-[10px]">
                -
              </th>
              <th className="px-1 py-1 text-center font-semibold border border-blue-500/50 bg-blue-600/50 text-[10px]">
                -
              </th>
            </tr>
          </thead>
          <tbody>
            {scoreData.players.map((player, idx) => {
              // Calculate OUT score (holes 1-9)
              const outScore = player.scores
                .filter(s => s.holeNumber >= 1 && s.holeNumber <= 9)
                .reduce((sum, s) => sum + s.strokes, 0);
              
              // Calculate IN score (holes 10-18)
              const inScore = player.scores
                .filter(s => s.holeNumber >= 10 && s.holeNumber <= 18)
                .reduce((sum, s) => sum + s.strokes, 0);

              return (
                <tr 
                  key={`player-row-${player.playerId}-${idx}`} 
                  className={`${
                    idx % 2 === 0 
                      ? 'bg-white/70 backdrop-blur-sm' 
                      : 'bg-blue-50/70 backdrop-blur-sm'
                  } hover:bg-blue-100/80 transition-colors duration-200`}
                >
                  <td className="px-1.5 py-1.5 font-bold text-gray-800 border border-gray-300/50 sticky left-0 bg-inherit z-10">
                    <div className="text-[10px] leading-tight">
                      <div className="font-bold">{player.playerName}</div>
                      {player.bagTagNumber && (
                        <div className="text-[9px] font-normal text-gray-600">
                          Bag: {player.bagTagNumber}
                        </div>
                      )}
                      {player.handicap !== undefined && (
                        <div className="text-[9px] font-normal text-gray-600">
                          HCP: {player.handicap}
                        </div>
                      )}
                    </div>
                  </td>
                  {/* OUT Holes (1-9) */}
                  {outHoles.map((hole, holeIdx) => {
                    const holeScore = player.scores.find(s => s.holeNumber === hole.holeNumber);
                    return (
                      <td key={`${player.playerId}-hole-out-${hole.holeNumber}-${holeIdx}`} 
                          className={`px-0.5 py-1.5 text-center border border-gray-300/50 ${holeScore ? getScoreColor(holeScore.strokes, hole.par) : ''}`}>
                        {holeScore ? (
                          <div className="font-bold text-[11px]">
                            {holeScore.strokes}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[10px]">-</span>
                        )}
                      </td>
                    );
                  })}
                  {/* OUT Total */}
                  <td className="px-1 py-1.5 text-center font-bold text-[11px] border border-gray-300/50 bg-blue-100/80 text-blue-900">
                    {outScore || '-'}
                  </td>
                  {/* IN Holes (10-18) */}
                  {inHoles.map((hole, holeIdx) => {
                    const holeScore = player.scores.find(s => s.holeNumber === hole.holeNumber);
                    return (
                      <td key={`${player.playerId}-hole-in-${hole.holeNumber}-${holeIdx}`} 
                          className={`px-0.5 py-1.5 text-center border border-gray-300/50 ${holeScore ? getScoreColor(holeScore.strokes, hole.par) : ''}`}>
                        {holeScore ? (
                          <div className="font-bold text-[11px]">
                            {holeScore.strokes}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[10px]">-</span>
                        )}
                      </td>
                    );
                  })}
                  {/* IN Total */}
                  <td className="px-1 py-1.5 text-center font-bold text-[11px] border border-gray-300/50 bg-blue-100/80 text-blue-900">
                    {inScore || '-'}
                  </td>
                  {/* TOTAL */}
                  <td className="px-1 py-1.5 text-center font-bold text-xs border border-gray-300/50 bg-gradient-to-br from-blue-200/80 to-blue-300/80 text-blue-900">
                    {player.totalScore || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t-2 border-white/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-gray-700">GolfScoreID Photo Booth</p>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/60 backdrop-blur-sm rounded-lg shadow-sm">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs sm:text-sm font-medium text-gray-600">
            Printed: {formatCurrentDateTime()}
          </p>
        </div>
      </div>
    </div>
  );
}
