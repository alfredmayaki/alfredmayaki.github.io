
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
      eventType: evt.type.code,
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

    return items.sort((a, b) => (b.minute + (b.extra_minute || 0)) - (a.minute + (a.extra_minute || 0)));
  }, [matchData]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!matchData) return <div>Match data unavailable.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <MatchHeader fixture={matchData} />
      <GeminiInsights commentary={matchData.comments} />
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm tracking-widest uppercase">Live Commentary</h3>
          <span className="text-xs text-slate-400 font-medium">Automatic Updates Enabled</span>
        </div>
        <CommentaryTimeline items={timelineItems} participants={matchData.participants} />
      </div>
    </div>
  );
};

export default App;
