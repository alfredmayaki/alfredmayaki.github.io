
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Comment } from '../types';

export default ({ commentary }: { commentary: Comment[] }) => {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const text = commentary.map(c => `[${c.minute}'] ${c.comment}`).join('\n');
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a 3-bullet point tactical summary of Manchester City's performance from this match commentary. Keep it professional.\n\n${text}`
    });
    setData(res.text || 'Analysis failed.');
    setLoading(false);
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-black text-sm uppercase tracking-widest text-sky-400">Tactical Insights</h4>
        {!data && !loading && (
          <button onClick={analyze} className="text-[10px] bg-sky-500 hover:bg-sky-400 px-3 py-1.5 rounded-lg font-black transition-all">GENERATE AI REPORT</button>
        )}
      </div>
      {loading ? <div className="text-xs italic text-slate-500 animate-pulse">Analyzing pitch dynamics...</div> : 
       data ? <div className="text-sm text-slate-300 leading-relaxed italic">{data}</div> : 
       <p className="text-xs text-slate-500">Ready for tactical breakdown of the reigning champions.</p>}
    </div>
  );
};
