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

  // Function to get first 3 words of player name
  const getFirst3Words = (name: string) => {
    const words = name.trim().split(/\s+/);
    return words.slice(0, 3).join(' ');
  };

  // All players are displayed in the table - always show 6 rows
  const MAX_PLAYERS = 6;
  const displayedPlayers = [...scoreData.players];
  
  // Fill empty rows if less than 6 players
  while (displayedPlayers.length < MAX_PLAYERS) {
    displayedPlayers.push({
      playerId: `empty-${displayedPlayers.length}`,
      playerName: '',
      scores: [],
      totalScore: 0,
      bagTagNumber: '',
      handicap: undefined
    });
  }

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

  // Function to render score with color background
  const renderScoreWithColor = (strokes: number, par: number) => {
    const diff = strokes - par;
    
    // Determine display value based on mode
    const displayValue = scoreMode === 'stroke' 
      ? strokes 
      : (diff === 0 ? '0' : (diff > 0 ? `+${diff}` : diff));
    
    // Determine background color based on score
    let bgColor = '';
    let textColor = 'text-gray-900';
    
    if (diff <= -2) {
      // Eagle or better - Yellow
      bgColor = 'bg-yellow-300';
      textColor = 'text-gray-900';
    } else if (diff === -1) {
      // Birdie - Green
      bgColor = 'bg-green-400';
      textColor = 'text-white';
    } else if (diff === 0) {
      // Par - White
      bgColor = 'bg-white';
      textColor = 'text-gray-900';
    } else if (diff === 1) {
      // Bogey - Orange
      bgColor = 'bg-orange-300';
      textColor = 'text-gray-900';
    } else {
      // Double Bogey or worse - Red
      bgColor = 'bg-red-400';
      textColor = 'text-white';
    }
    
    return (
      <div className={`inline-flex items-center justify-center w-full h-full ${bgColor} min-w-[40px]`}>
        <span className={`text-[17px] font-bold ${textColor}`}>{displayValue}</span>
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
              className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-br from-[#618740] to-[#618740] rounded-xl shadow-sm border-2 border-[#618740]-300 hover:border-[#618740]-400 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <svg className="w-6 h-6 text-[#ffffff] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-base font-bold text-white truncate">
                  {getSelectedPlayerName()}
                </span>
              </div>
              <svg 
                className={`w-5 h-5 text-[#ffffff] flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
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
                <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-[#618740] to-[#618740]">
                  <div className="text-sm font-bold text-white text-center">
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
                          ? 'bg-gradient-to-r from-[#618740] to-[#618740] border-l-4 border-[#618740]' 
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                        }
                      `}
                    >
                      {/* Radio Button */}
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected 
                          ? 'border-white' 
                          : 'border-gray-300'
                        }
                      `}>
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-[#618740]"></div>
                        )}
                      </div>
                      
                      {/* Player Info */}
                      <div className="text-left min-w-0 flex-1">
                        <div className={`font-bold text-base truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                          {player.playerName}
                        </div>
                        {(player.bagTagNumber || player.handicap !== undefined) && (
                          <div className={`text-xs mt-0.5 ${isSelected 
                          ? 'text-white' 
                          : 'text-gray'
                        } `}>
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
                          ? 'bg-[#618740] text-white' 
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
            <div className="inline-flex rounded-xl overflow-hidden border-2 border-[#618740]-300 shadow-sm">
              <button
                onClick={() => handleScoreModeChange('stroke')}
                className={`
                  px-6 py-3 font-bold text-base transition-all duration-200
                  ${scoreMode === 'stroke'
                    ? 'bg-gradient-to-br from-[#618740] to-[#618740] text-white'
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
                    ? 'bg-gradient-to-br from-[#618740] to-[#618740] text-white'
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
              <h1 className="text-4xl text-left font-black text-transparent bg-clip-text bg-gradient-to-r from-[#618740] to-[#618740] mb-2 leading-tight">
                Padang Golf Pangkalan Jati
              </h1>
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-6 h-6 text-[#618740]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold text-[20px]">{formatDate(scoreData.teeOffTime)}</span>
                <span className="mx-2 text-[20px]">•</span>
                <svg className="w-6 h-6 text-[#618740]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-[20px]">{formatTime(scoreData.teeOffTime)}</span>
              </div>
            </div>
          </div>

          {/* Kanan: Total Score */}
          {mainPlayer && (
            <div className="text-right">
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-black to-black leading-none mb-2">
                {mainPlayer.totalScore || '-'}
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {mainPlayer.playerName}
              </div>
              {mainPlayer.handicap !== undefined && (
                <div className="text-[17px] text-gray-600 font-medium">
                  HCP: {mainPlayer.handicap}
                </div>
              )}
            </div>
          )}
        </div>

        {/* BARIS 2: Foto Lapangan (25%) & Score Table (75%) */}
        <div className="flex gap-4">
          {/* Kiri: Dua Foto Lapangan Atas Bawah dengan Logo */}
          <div className="w-[25%] flex flex-col gap-4">
            {/* Foto Atas - Sejajar dengan legend sampai akhir OUT table */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl" style={{ height: '428px' }}>
              <img 
                src="/lapangan1.png" 
                alt="Golf Course 1" 
                className="w-full h-full object-cover"
              />
              {/* Logo di pojok kanan atas */}
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg">
                <img 
                  src="/logo-app.png" 
                  alt="Logo" 
                  className="w-20 h-20 object-contain"
                  style={{ transform: 'scale(1.3)'}}
                />
              </div>
            </div>
            {/* Foto Bawah - Sama tinggi dengan IN table */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl" style={{ height: '380px' }}>
              <img 
                src="/lapangan2.png" 
                alt="Golf Course 2" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Kanan: Score Tables */}
          <div className="w-[75%]" style={{ height: '800px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Legend - Di atas table */}
            <div className="flex items-center justify-end gap-4 px-3 py-2 bg-white rounded-lg shadow-sm flex-shrink-0">
              <div className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="12" fill="#fcd34d" stroke="#1f2937" strokeWidth="0.8"/>
                  <circle cx="14" cy="14" r="8" fill="none" stroke="#1f2937" strokeWidth="0.8"/>
                </svg>
                <span className="text-[17px] font-bold text-gray-700">Eagle</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 28 28">
                  <path d="M14 3 L25 23 L3 23 Z" fill="#4ade80" stroke="#1f2937" strokeWidth="0.8"/>
                </svg>
                <span className="text-[17px] font-bold text-gray-700">Birdie</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="10" fill="#ffffff" stroke="#1f2937" strokeWidth="0.8"/>
                </svg>
                <span className="text-[17px] font-bold text-gray-700">Par</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 28 28">
                  <rect x="3" y="3" width="22" height="22" fill="#fdba74" stroke="#1f2937" strokeWidth="0.8"/>
                </svg>
                <span className="text-[17px] font-bold text-gray-700">Bogey</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 28 28">
                  <rect x="2" y="2" width="24" height="24" fill="#f87171" stroke="#1f2937" strokeWidth="0.8"/>
                  <rect x="7" y="7" width="14" height="14" fill="none" stroke="#1f2937" strokeWidth="0.8"/>
                </svg>
                <span className="text-[17px] font-bold text-gray-700">Doubles+</span>
              </div>
            </div>

            {/* OUT Table (Holes 1-9) */}
            <div className="overflow-hidden rounded-xl shadow-lg border-2 border-white" style={{ height: '380px' }}>
              <table className="w-full border-collapse" style={{ height: '100%', tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gradient-to-r from-[#618740] to-[#618740] text-white" style={{ height: '32px' }}>
                    <th className="px-2 py-1 text-left font-bold border border-[#618740]/50 text-[17px]" style={{ width: '115px' }}>OUT</th>
                    {outHoles.map((hole) => (
                      <th key={`out-hole-${hole.holeNumber}`} className="px-1 py-1 text-center font-bold border border-[#618740]/50 text-[17px]" style={{ width: '35px' }}>
                        {hole.holeNumber}
                      </th>
                    ))}
                    <th className="px-1 py-1 text-center font-bold border border-[#618740]/50 bg-[#618740]/50 text-[17px]" style={{ width: '35px' }}>OUT</th>
                  </tr>
                  <tr className="bg-gray-400 text-black" style={{ height: '28px' }}>
                    <th className="px-2 py-1 text-left font-semibold border border-[#618740]/50 text-[17px]">PAR</th>
                    {outHoles.map((hole) => (
                      <th key={`out-par-${hole.holeNumber}`} className="px-1 py-1 text-center font-semibold border border-[#618740]/50 text-[17px]">
                        {hole.par}
                      </th>
                    ))}
                    <th className="px-1 py-1 text-center font-semibold border border-[#618740]/50 bg-gray-400 text-black text-[17px]">
                      {outPar}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPlayers.map((player, idx) => {
                    const isEmptyRow = !player.playerName;
                    const outScore = player.scores
                      .filter(s => s.holeNumber >= 1 && s.holeNumber <= 9)
                      .reduce((sum, s) => sum + s.strokes, 0);

                    return (
                      <tr key={`out-player-${player.playerId}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} style={{ height: '42px' }}>
                        <td className="px-2 font-bold text-gray-800 border border-gray-300/50 text-[17px] text-left align-middle" style={{ width: '115px' }}>
                          {!isEmptyRow ? (
                            <div className="leading-tight truncate" title={player.playerName}>
                              {getFirst3Words(player.playerName)}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-gray-300">-</span>
                            </div>
                          )}
                        </td>
                        {outHoles.map((hole) => {
                          const holeScore = player.scores.find(s => s.holeNumber === hole.holeNumber);
                          return (
                            <td 
                              key={`out-${player.playerId}-${hole.holeNumber}`} 
                              className="px-0 py-0 text-center border border-gray-300/50 align-middle"
                              style={{ width: '35px' }}
                            >
                              {!isEmptyRow && holeScore ? (
                                <div className="flex items-center justify-center h-full w-full">
                                  {renderScoreWithColor(holeScore.strokes, hole.par)}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <span className="text-[17px] text-gray-300">-</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-1 text-center font-bold border border-blue bg-[#618740] text-[#ffffff] text-[17px] align-middle" style={{ width: '35px' }}>
                          {!isEmptyRow && (
                            scoreMode === 'over' 
                              ? (outScore - outPar === 0 ? '0' : (outScore - outPar > 0 ? `+${outScore - outPar}` : outScore - outPar))
                              : (outScore || '-')
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* IN Table (Holes 10-18) */}
            <div className="overflow-hidden rounded-xl shadow-lg border-2 border-white" style={{ height: '380px' }}>
              <table className="w-full border-collapse" style={{ height: '100%', tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gradient-to-r from-[#618740] to-[#618740] text-white" style={{ height: '32px' }}>
                    <th className="px-2 py-1 text-left font-bold border border-green-700/50 text-[17px]" style={{ width: '115px' }}>IN</th>
                    {inHoles.map((hole) => (
                      <th key={`in-hole-${hole.holeNumber}`} className="px-1 py-1 text-center font-bold border border-green-700/50 text-[17px]" style={{ width: '35px' }}>
                        {hole.holeNumber}
                      </th>
                    ))}
                    <th className="px-1 py-1 text-center font-bold border border-[#618740]/50 bg-[#618740]/50 text-[17px]" style={{ width: '35px' }}>IN</th>
                    <th className="px-1 py-1 text-center font-bold border border-green-700/50 bg-gradient-to-r from-gray-700 to-gray-700 text-[17px]" style={{ width: '35px' }}>TOTAL</th>
                  </tr>
                  <tr className="bg-gray-400 text-black" style={{ height: '28px' }}>
                    <th className="px-2 py-1 text-left font-semibold border border-green-600/50 text-[17px]">PAR</th>
                    {inHoles.map((hole) => (
                      <th key={`in-par-${hole.holeNumber}`} className="px-1 py-1 text-center font-semibold border border-[#618740]/50 text-[17px]">
                        {hole.par}
                      </th>
                    ))}
                    <th className="px-1 py-1 text-center font-semibold border border-[#618740]/50 bg-gray-400 text-[17px]">
                      {inPar}
                    </th>
                    <th className="px-1 py-1 text-center font-semibold border border-gray-600/50 bg-gray-600/50 text-[17px]">
                      {totalPar}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPlayers.map((player, idx) => {
                    const isEmptyRow = !player.playerName;
                    const inScore = player.scores
                      .filter(s => s.holeNumber >= 10 && s.holeNumber <= 18)
                      .reduce((sum, s) => sum + s.strokes, 0);

                    return (
                      <tr key={`in-player-${player.playerId}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} style={{ height: '42px' }}>
                        <td className="px-2 font-bold text-gray-800 border border-gray-300/50 text-[17px] text-left align-middle" style={{ width: '115px' }}>
                          {!isEmptyRow ? (
                            <div className="leading-tight truncate" title={player.playerName}>
                              {getFirst3Words(player.playerName)}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-gray-300">-</span>
                            </div>
                          )}
                        </td>
                        {inHoles.map((hole) => {
                          const holeScore = player.scores.find(s => s.holeNumber === hole.holeNumber);
                          return (
                            <td 
                              key={`in-${player.playerId}-${hole.holeNumber}`} 
                              className="px-0 py-0 text-center border border-gray-300/50 align-middle"
                              style={{ width: '35px' }}
                            >
                              {!isEmptyRow && holeScore ? (
                                <div className="flex items-center justify-center h-full w-full">
                                  {renderScoreWithColor(holeScore.strokes, hole.par)}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <span className="text-[17px] text-gray-300">-</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-1 text-center font-bold border border-gray-300/50 bg-[#618740] text-[#ffffff] text-[17px] align-middle" style={{ width: '35px' }}>
                          {!isEmptyRow && (
                            scoreMode === 'over'
                              ? (inScore - inPar === 0 ? '0' : (inScore - inPar > 0 ? `+${inScore - inPar}` : inScore - inPar))
                              : (inScore || '-')
                          )}
                        </td>
                        <td className="px-1 text-center font-bold border border-gray-300/50 bg-gradient-to-br from-gray-400/80 to-gray-200/80 text-gray-900 text-[17px] align-middle" style={{ width: '35px' }}>
                          {!isEmptyRow && (player.totalScore || '-')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t-2 border-gray-200 flex items-center justify-between text-gray-600">
          <div className="flex items-center gap-3">
            <img 
              src="/icon.png" 
              alt="GolfScoreID Icon" 
              className="w-10 h-10 object-contain"
            />
            <span className="font-semibold text-[17px]">GolfScoreID Created by PT DECOM FENO MAHAKA</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[#618740]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-[17px]">Printed: {formatCurrentDateTime()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
