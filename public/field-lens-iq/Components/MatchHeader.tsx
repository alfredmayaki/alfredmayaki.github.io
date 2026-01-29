
import React from 'react';
import { Fixture } from '../types';

export default ({ fixture }: { fixture: Fixture }) => {
  const home = fixture.participants.find(p => p.meta.location === 'home');
  const away = fixture.participants.find(p => p.meta.location === 'away');
  const hScore = fixture.scores.find(s => s.participant_id === home?.id && s.description === 'CURRENT')?.score.goals ?? 0;
  const aScore = fixture.scores.find(s => s.participant_id === away?.id && s.description === 'CURRENT')?.score.goals ?? 0;

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 card-transition">
      <div className="bg-slate-900 py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {fixture.league.name} • {fixture.state.name}
      </div>
      <div className="p-8 md:p-12 flex items-center justify-between">
        <TeamDisplay team={home} />
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-6">
            <span className="text-6xl font-black text-slate-900">{hScore}</span>
            <span className="text-4xl text-slate-200">-</span>
            <span className="text-6xl font-black text-slate-900">{aScore}</span>
          </div>
          <div className="mt-4 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-[10px] font-black uppercase tracking-widest">
            {fixture.state.short_name}
          </div>
        </div>
        <TeamDisplay team={away} />
      </div>
    </div>
  );
};

const TeamDisplay = ({ team }: { team?: any }) => (
  <div className="flex flex-col items-center flex-1">
    <div className="w-20 h-20 mb-3 bg-slate-50 rounded-2xl p-3 flex items-center justify-center shadow-inner">
      <img src={team?.image_path} className="w-full h-full object-contain" alt={team?.name} />
    </div>
    <span className="text-lg font-black text-slate-800 text-center">{team?.name}</span>
    <span className="text-xs text-slate-400 font-bold">{team?.short_code}</span>
  </div>
);
