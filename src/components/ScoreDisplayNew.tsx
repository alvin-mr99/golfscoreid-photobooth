import { useState, useEffect, useRef } from 'react';
import type { ScoreData } from '../types';

interface ScoreDisplayProps {
  scoreData: ScoreData;
  onSelectedPlayersChange?: (selectedPlayerIds: string[]) => void;
  scoreMode?: 'stroke' | 'over';
  onScoreModeChange?: (mode: 'stroke' | 'over') => void;
}

export function ScoreDisplayNew({ 
  scoreData, 
  onSelectedPlayersChange,
  scoreMode: externalScoreMode,
  onScoreModeChange
}: ScoreDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    scoreData.players[0]?.playerId || ''
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [internalScoreMode, setInternalScoreMode] = useState<'stroke' | 'over'>('stroke');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use external scoreMode if provided, otherwise use internal state
  const scoreMode = externalScoreMode !== undefined ? externalScoreMode : internalScoreMode;
  
  // Handle score mode change
  const handleScoreModeChange = (mode: 'stroke' | 'over') => {
    if (onScoreModeChange) {
      onScoreModeChange(mode);
    } else {
      setInternalScoreMode(mode);
    }
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update selected player when scoreData changes
  useEffect(() => {
    if (scoreData.players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(scoreData.players[0].playerId);
    }
  }, [scoreData.players, selectedPlayerId]);

  // Notify parent when selected player changes - send all players for table display
  useEffect(() => {
    if (onSelectedPlayersChange) {
      // Always send all players for the score table
      onSelectedPlayersChange(scoreData.players.map(p => p.playerId));
    }
  }, [scoreData.players, onSelectedPlayersChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    return currentTime.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' WIB';
  };

  // Select player for printing
  const selectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setIsDropdownOpen(false);
  };

  // Get selected player name for display
  const getSelectedPlayerName = () => {
    const player = scoreData.players.find(p => p.playerId === selectedPlayerId);
    return player?.playerName || 'Select Player to Print';
  };

  // All players are displayed in the table
  const displayedPlayers = scoreData.players;

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

  // Function to render score with custom symbol
  const renderScoreWithSymbol = (strokes: number, par: number) => {
    const diff = strokes - par;
    
    // Determine display value based on mode
    const displayValue = scoreMode === 'stroke' 
      ? strokes 
      : (diff === 0 ? '0' : (diff > 0 ? `+${diff}` : diff));
    
    // Eagle or better - Double Circle
    if (diff <= -2) {
      return (
        <div className="relative inline-flex items-center justify-center w-7 h-7">
          <svg width="42" height="42" viewBox="0 0 28 28" className="absolute">
            <circle cx="14" cy="14" r="12" fill="none" stroke="#1f2937" strokeWidth="0.5"/>
            <circle cx="14" cy="14" r="8" fill="none" stroke="#1f2937" strokeWidth="0.5"/>
          </svg>
          <span className="relative z-10 text-xs font-bold text-gray-900">{displayValue}</span>
        </div>
      );
    }
    
    // Birdie - Triangle
    if (diff === -1) {
      return (
        <div className="relative inline-flex items-center justify-center w-7 h-7">
          <svg width="42" height="42" viewBox="0 0 28 28" className="absolute">
            <path d="M14 3 L25 23 L3 23 Z" fill="none" stroke="#000000ff" strokeWidth="0.5"/>
          </svg>
          <span className="relative z-10 text-xs font-bold text-gray-900" style={{ marginTop: '3px' }}>{displayValue}</span>
        </div>
      );
    }
    
    // Par - Circle
    if (diff === 0) {
      return (
        <div className="relative inline-flex items-center justify-center w-7 h-7">
          <svg width="42" height="42" viewBox="0 0 28 28" className="absolute">
            <circle cx="14" cy="14" r="10" fill="none" stroke="#1f2937" strokeWidth="0.5"/>
          </svg>
          <span className="relative z-10 text-xs font-bold text-gray-900">{displayValue}</span>
        </div>
      );
    }
    
    // Bogey - Square
    if (diff === 1) {
      return (
        <div className="relative inline-flex items-center justify-center w-7 h-7">
          <svg width="42" height="42" viewBox="0 0 28 28" className="absolute">
            <rect x="3" y="3" width="22" height="22" fill="none" stroke="#1f2937" strokeWidth="0.5"/>
          </svg>
          <span className="relative z-10 text-xs font-bold text-gray-900">{displayValue}</span>
        </div>
      );
    }
    
    // Double Bogey or worse - Double Square (nested)
    return (
      <div className="relative inline-flex items-center justify-center w-7 h-7">
        <svg width="42" height="42" viewBox="0 0 28 28" className="absolute">
          <rect x="2" y="2" width="24" height="24" fill="none" stroke="#000000ff" strokeWidth="0.5"/>
          <rect x="7" y="7" width="14" height="14" fill="none" stroke="#000000ff" strokeWidth="0.5"/>
        </svg>
        <span className="relative z-10 text-xs font-bold text-gray-900">{displayValue}</span>
      </div>
    );
  };

  // Get the selected player for main display (header score)
  const mainPlayer = scoreData.players.find(p => p.playerId === selectedPlayerId);

  return (
    <div className="bg-white rounded-3xl shadow-2xl print:shadow-none border-2 border-white/50">
      {/* Player Selection Dropdown - Hidden when printing */}
      <div className="print:hidden p-4 border-b-2 border-gray-200">
        <div className="flex gap-4 items-end">
          {/* Player Selection Dropdown */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Player Printing Scorecard:
            </label>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border-2 border-blue-300 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-base font-bold text-gray-800 truncate">
                  {getSelectedPlayerName()}
                </span>
              </div>
              <svg 
                className={`w-5 h-5 text-blue-600 flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-50">
                  <div className="text-sm font-bold text-gray-800 text-center">
                  Choose Player for Scorecard
                </div>
              </div>

              {/* Player List */}
              <div className="max-h-80 overflow-y-auto">
                {scoreData.players.map((player) => {
                  const isSelected = selectedPlayerId === player.playerId;
                  return (
                    <button
                      key={player.playerId}
                      onClick={() => selectPlayer(player.playerId)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 transition-all duration-200
                        ${isSelected 
                          ? 'bg-gradient-to-r from-blue-100 to-blue-100 border-l-4 border-blue-600' 
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                        }
                      `}
                    >
                      {/* Radio Button */}
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected 
                          ? 'border-blue-600' 
                          : 'border-gray-300'
                        }
                      `}>
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                        )}
                      </div>
                      
                      {/* Player Info */}
                      <div className="text-left min-w-0 flex-1">
                        <div className={`font-bold text-base truncate ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                          {player.playerName}
                        </div>
                        {(player.bagTagNumber || player.handicap !== undefined) && (
                          <div className="text-xs text-gray-600 mt-0.5">
                            {player.bagTagNumber && `Bag: ${player.bagTagNumber}`}
                            {player.bagTagNumber && player.handicap !== undefined && ' • '}
                            {player.handicap !== undefined && `HCP: ${player.handicap}`}
                          </div>
                        )}
                      </div>

                      {/* Score Badge */}
                      <div className={`
                        px-3 py-1 rounded-lg font-bold text-sm
                        ${isSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700'
                        }
                      `}>
                        {player.totalScore || '-'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          </div>

          {/* Score Mode Switch */}
          <div className="flex-shrink-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Score Display:
            </label>
            <div className="inline-flex rounded-xl overflow-hidden border-2 border-blue-300 shadow-sm">
              <button
                onClick={() => handleScoreModeChange('stroke')}
                className={`
                  px-6 py-3 font-bold text-base transition-all duration-200
                  ${scoreMode === 'stroke'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                Stroke
              </button>
              <button
                onClick={() => handleScoreModeChange('over')}
                className={`
                  px-6 py-3 font-bold text-base transition-all duration-200
                  ${scoreMode === 'over'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                Over
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POSTCARD LAYOUT - Optimized for printing */}
      <div className="p-6 space-y-4">
        {/* BARIS 1: Header dengan Nama Lapangan & Score */}
        <div className="flex items-center justify-between gap-6 pb-4 border-b-2 border-gray-200">
          {/* Kiri: Logo, Nama Lapangan & Tanggal */}
          <div className="flex items-center gap-4 flex-1">
            {/* Logo Pangkalan Jati */}
            <div className="flex-shrink-0">
              <img 
                src="/logo-pangkalan-jati.png" 
                alt="Logo Pangkalan Jati" 
                className="w-20 h-20 object-contain"
              />
            </div>
            
            {/* Nama Lapangan & Tanggal */}
            <div className="flex-1">
              <h1 className="text-4xl text-left font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-600 mb-2 leading-tight">
                Padang Golf Pangkalan Jati
              </h1>
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold text-lg">{formatDate(scoreData.teeOffTime)}</span>
                <span className="mx-2">•</span>
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-lg">{formatTime(scoreData.teeOffTime)}</span>
              </div>
            </div>
          </div>

          {/* Kanan: Total Score */}
          {mainPlayer && (
            <div className="text-right">
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 leading-none mb-2">
                {mainPlayer.totalScore || '-'}
              </div>
              <div className="text-xl font-bold text-gray-800">
                {mainPlayer.playerName}
              </div>
              {mainPlayer.handicap !== undefined && (
                <div className="text-sm text-gray-600 font-medium">
                  HCP: {mainPlayer.handicap}
                </div>
              )}
            </div>
          )}
        </div>

        {/* BARIS 2: Foto Lapangan (40%) & Score Table (60%) */}
        <div className="flex gap-4">
          {/* Kiri: Foto Lapangan dengan Logo */}
          <div className="w-[40%] relative rounded-2xl overflow-hidden shadow-xl">
            <img 
              src="/lapangan.png" 
              alt="Golf Course" 
              className="w-full h-full object-cover"
              style={{ height: '500px' }}
            />
            {/* Logo di pojok kanan atas */}
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg">
              <img 
                src="/logo-app.png" 
                alt="Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>

          {/* Kanan: Score Tables */}
          <div className="w-[60%] space-y-3" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
            {/* OUT Table (Holes 1-9) */}
            <div className="flex-1 overflow-hidden rounded-xl shadow-lg border-2 border-white">
              <table className="w-full border-collapse text-xs h-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="px-2 py-1.5 text-left font-bold border border-blue-700/50 text-xs">OUT</th>
                    {outHoles.map((hole) => (
                      <th key={`out-hole-${hole.holeNumber}`} className="px-1 py-1.5 text-center font-bold border border-blue-700/50 text-xs">
                        {hole.holeNumber}
                      </th>
                    ))}
                    <th className="px-2 py-1.5 text-center font-bold border border-blue-700/50 bg-blue-800/50 text-xs">OUT</th>
                  </tr>
                  <tr className="bg-gray-400 text-white">
                    <th className="px-2 py-1 text-left font-semibold border border-blue-600/50 text-xs">PAR</th>
                    {outHoles.map((hole) => (
                      <th key={`out-par-${hole.holeNumber}`} className="px-1 py-1 text-center font-semibold border border-blue-600/50 text-xs">
                        {hole.par}
                      </th>
                    ))}
                    <th className="px-2 py-1 text-center font-semibold border border-blue-600/50 bg-gray-500 text-white-900 text-xs">
                      {outPar}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPlayers.map((player, idx) => {
                    const outScore = player.scores
                      .filter(s => s.holeNumber >= 1 && s.holeNumber <= 9)
                      .reduce((sum, s) => sum + s.strokes, 0);

                    return (
                      <tr key={`out-player-${player.playerId}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-white'}>
                        <td className="px-2 py-1.5 font-bold text-gray-800 border border-gray-300/50 text-xs truncate">
                          {player.playerName}
                        </td>
                        {outHoles.map((hole) => {
                          const holeScore = player.scores.find(s => s.holeNumber === hole.holeNumber);
                          return (
                            <td 
                              key={`out-${player.playerId}-${hole.holeNumber}`} 
                              className="px-1 py-1.5 text-center border border-gray-300/50 bg-white"
                            >
                              {holeScore ? renderScoreWithSymbol(holeScore.strokes, hole.par) : <span className="text-xs">-</span>}
                            </td>
                          );
                        })}
                        <td className="px-2 py-1.5 text-center font-bold border border-gray-300/50 bg-blue-100 text-blue-900  text-xs">
                          {scoreMode === 'over' 
                            ? (outScore - outPar === 0 ? '0' : (outScore - outPar > 0 ? `+${outScore - outPar}` : outScore - outPar))
                            : (outScore || '-')
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* IN Table (Holes 10-18) */}
            <div className="flex-1 overflow-hidden rounded-xl shadow-lg border-2 border-white">
              <table className="w-full border-collapse text-xs h-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="px-2 py-1.5 text-left font-bold border border-green-700/50 text-xs">IN</th>
                    {inHoles.map((hole) => (
                      <th key={`in-hole-${hole.holeNumber}`} className="px-1 py-1.5 text-center font-bold border border-green-700/50 text-xs">
                        {hole.holeNumber}
                      </th>
                    ))}
                    <th className="px-2 py-1.5 text-center font-bold border border-blue-700/50 bg-blue-800/50 text-xs">IN</th>
                    <th className="px-2 py-1.5 text-center font-bold border border-green-700/50 bg-gradient-to-r from-gray-700 to-gray-700 text-xs">TOTAL</th>
                  </tr>
                  <tr className="bg-gray-400 text-white">
                    <th className="px-2 py-1 text-left font-semibold border border-green-600/50 text-xs">PAR</th>
                    {inHoles.map((hole) => (
                      <th key={`in-par-${hole.holeNumber}`} className="px-1 py-1 text-center font-semibold border border-blue-600/50 text-xs">
                        {hole.par}
                      </th>
                    ))}
                    <th className="px-2 py-1 text-center font-semibold border border-blue-600/50 bg-gray-500 text-xs">
                      {inPar}
                    </th>
                    <th className="px-2 py-1 text-center font-semibold border border-gray-600/50 bg-gray-600/50 text-xs">
                      {totalPar}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPlayers.map((player, idx) => {
                    const inScore = player.scores
                      .filter(s => s.holeNumber >= 10 && s.holeNumber <= 18)
                      .reduce((sum, s) => sum + s.strokes, 0);

                    return (
                      <tr key={`in-player-${player.playerId}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-white'}>
                        <td className="px-2 py-1.5 font-bold text-gray-800 border border-gray-300/50 text-xs truncate">
                          {player.playerName}
                        </td>
                        {inHoles.map((hole) => {
                          const holeScore = player.scores.find(s => s.holeNumber === hole.holeNumber);
                          return (
                            <td 
                              key={`in-${player.playerId}-${hole.holeNumber}`} 
                              className="px-1 py-1.5 text-center border border-gray-300/50 bg-white"
                            >
                              {holeScore ? renderScoreWithSymbol(holeScore.strokes, hole.par) : <span className="text-xs">-</span>}
                            </td>
                          );
                        })}
                        <td className="px-2 py-1.5 text-center font-bold border border-gray-300/50 bg-blue-100/80 text-blue-900 text-xs">
                          {scoreMode === 'over'
                            ? (inScore - inPar === 0 ? '0' : (inScore - inPar > 0 ? `+${inScore - inPar}` : inScore - inPar))
                            : (inScore || '-')
                          }
                        </td>
                        <td className="px-2 py-1.5 text-center font-bold border border-gray-300/50 bg-gradient-to-br from-gray-400/80 to-gray-200/80 text-white-900 text-sm">
                          {player.totalScore || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BARIS 3: Dua Foto Landscape */}
        <div className="flex gap-4">
          <div className="flex-1 rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200">
            <img 
              src="/background-1.jpg" 
              alt="Photo 1" 
              className="w-full h-48 object-cover"
            />
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200">
            <img 
              src="/background-2.jpg" 
              alt="Photo 2" 
              className="w-full h-48 object-cover"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold">GolfScoreID Created by PT DECOM FENO MAHAKA</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Printed: {formatCurrentDateTime()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
