
import React from 'react';
import { UnifiedTimelineItem, Participant } from '../types';

export default ({ items, participants }: { items: UnifiedTimelineItem[], participants: Participant[] }) => (
  <div className="divide-y divide-slate-100">
    {items.map(item => {
      const p = participants.find(part => part.id === item.participantId);
      return (
        <div key={item.id} className={`p-5 flex space-x-6 items-start hover:bg-slate-50 transition-colors ${item.isImportant ? 'bg-amber-50/20' : ''}`}>
          <div className="w-12 text-center pt-1 flex-shrink-0">
            <span className={`text-sm font-black ${item.isGoal ? 'text-green-600' : 'text-slate-400'}`}>
              {item.minute}'{item.extra_minute ? `+${item.extra_minute}` : ''}
            </span>
          </div>
          <div className="flex-grow">
             <div className="flex items-center space-x-2 mb-1">
                {p && <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{p.short_code}</span>}
                {item.isImportant && <span className="text-[9px] bg-amber-100 text-amber-700 font-black px-1.5 py-0.5 rounded uppercase">Key Moment</span>}
             </div>
             <p className={`text-sm leading-relaxed ${item.isGoal ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
               {item.content}
             </p>
          </div>
        </div>
      );
    })}
  </div>
);
