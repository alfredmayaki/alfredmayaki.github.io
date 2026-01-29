import React, { useState, useEffect, useMemo } from 'react';
import { Fixture, UnifiedTimelineItem } from './types';
import MatchHeader from './components/MatchHeader';
import CommentaryTimeline from './components/CommentaryTimeline';
import GeminiInsights from './components/GeminiInsights';
import { fetchMatchData } from './services/sportmonks';

const App: React.FC = () => {
  const [matchData, setMatchData] = useState<Fixture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatchData().then(data => {
      setMatchData(data[0] || null);
      setLoading(false);
    });
  }, []);

  const timelineItems = useMemo(() => {
    if (!matchData) return [];
    const items: UnifiedTimelineItem[] = [];

    matchData.events.forEach(evt => items.push({
      id: `e-${evt.id}`,
      type: 'event',
      minute: evt.minute,
      extra_minute: evt.extra_minute,
      content: `${evt.type.name}: ${evt.player_name}`,
      isGoal: evt.type.code === 'goal',
      participantId: evt.participant_id
    }));

    matchData.comments.forEach(com => items.push({
      id: `c-${com.id}`,
      type: 'comment',
      minute: com.minute ?? 0,
      extra_minute: com.extra_minute,
      content: com.comment,
      isImportant: com.is_important,
      isGoal: com.is_goal
    }));

    return items.sort((a, b) => {
      const timeA = a.minute + (a.extra_minute || 0);
      const timeB = b.minute + (b.extra_minute || 0);
      return timeB - timeA;
    });
  }, [matchData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-500 font-medium">Loading Etihad Match Center...</p>
    </div>
  );

  if (!matchData) return <div className="p-10 text-center">Data unavailable. Please check your API key.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 city-blue rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <span className="font-bold text-slate-800">CityMatch <span className="text-sky-500">Live</span></span>
          </div>
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">FT</div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <MatchHeader fixture={matchData} />
        <GeminiInsights commentary={matchData.comments} />
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
            <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Commentary Feed</h3>
          </div>
          <CommentaryTimeline items={timelineItems} participants={matchData.participants} />
        </div>
      </main>
    </div>
  );
};

export default App;