import type { ScoreData } from '../types';

interface ScoreDisplayProps {
  scoreData: ScoreData;
}

export function ScoreDisplay({ scoreData }: ScoreDisplayProps) {
  // Get all unique hole numbers from all players
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 print:shadow-none print:p-4">
      {/* Header */}
      <div className="mb-6 pb-4 border-b-2 border-gray-200">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {scoreData.flightName}
        </h2>
        <div className="flex items-center gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(scoreData.teeOffTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTime(scoreData.teeOffTime)}</span>
          </div>
        </div>
      </div>

      {/* Score Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="px-4 py-3 text-left font-semibold border border-green-700">
                Pemain
              </th>
              {allHoles.map(holeNum => (
                <th key={holeNum} className="px-3 py-3 text-center font-semibold border border-green-700 min-w-[50px]">
                  {holeNum}
                </th>
              ))}
              <th className="px-4 py-3 text-center font-semibold border border-green-700 bg-green-700">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {scoreData.players.map((player, idx) => (
              <tr key={player.playerId} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-3 font-semibold text-gray-800 border border-gray-300">
                  {player.playerName}
                  {player.handicap && (
                    <span className="ml-2 text-sm text-gray-500">
                      (HCP: {player.handicap})
                    </span>
                  )}
                </td>
                {allHoles.map(holeNum => {
                  const holeScore = player.scores.find(s => s.holeNumber === holeNum);
                  return (
                    <td key={holeNum} className="px-3 py-3 text-center border border-gray-300">
                      {holeScore ? (
                        <div>
                          <div className="font-semibold text-lg">
                            {holeScore.strokes}
                          </div>
                          {holeScore.putts !== undefined && (
                            <div className="text-xs text-gray-500">
                              {holeScore.putts}p
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center font-bold text-lg border border-gray-300 bg-gray-100">
                  {player.totalScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
        <p>GolfScoreID Photo Booth - {formatDate(Date.now())}</p>
      </div>
    </div>
  );
}
