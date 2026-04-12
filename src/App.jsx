import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import axios from 'axios';
import steamApps from './assets/steam_apps.json';

/** Steam Web API constants */
const STEAM_OFFICIAL_NEWS_FEED = 'steam_community_announcements';

/** Domains / author strings to exclude (third-party gaming press) */
const STEAM_NEWS_THIRD_PARTY_MARKERS = [
  'pcgamesn', 'pcgamer', 'pc gamer', 'ign.com', '/ign/', ' ign', 'eurogamer',
  'gamespot', 'kotaku', 'polygon', 'rockpapershotgun', 'rock paper shotgun',
  'destructoid', 'vg247', 'gameinformer', 'dualshockers', 'siliconera',
  'dexerto', 'gfinity', 'gamesradar', 'escapist', 'windowscentral', 'dotesports',
];

/** Helper functions for filtering Steam news */
function steamNewsItemSearchBlob(item) {
  return [item.author, item.feedname, item.feedlabel, item.url, item.title]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isLikelyThirdPartySteamNews(item) {
  const blob = steamNewsItemSearchBlob(item);
  return STEAM_NEWS_THIRD_PARTY_MARKERS.some((m) => blob.includes(m));
}

function steamNewsTitleLooksLikePatchNotes(title) {
  const t = (title || '').toLowerCase();
  if (!t) return false;

  const directHints = [
    'patch', 'hotfix', 'changelog', 'patch note', 'patch notes', 'ptb', 'public test',
    'maintenance', 'downtime', 'release note', 'release notes', 'bug fix', 'bugfix',
    'balance', 'balancing', 'tuning', 'deployment', 'mid-chapter', 'rolling update',
    'content update', 'server update', 'client update', 'game update', 'title update',
    'v.0', 'v.1', 'v.2', 'v.3', 'v.4', 'v.5', 'v.6', 'v.7', 'v.8', 'v.9',
    'version ', 'build ', 'fixes', ' fixed', 'weekly update', 'routine maintenance',
    'update is live', 'now live', 'now available', 'patching', 'hot fix',
  ];
  if (directHints.some((h) => t.includes(h))) return true;
  if (/\bupdate\b/.test(t) && /\b(chapter|season|version|vol\.|volume|act)\b/.test(t)) return true;
  return false;
}

function pickPatchNewsItem(newsitems) {
  const items = newsitems ?? [];
  const notPress = (item) => !isLikelyThirdPartySteamNews(item);

  return (
    items.find((item) => notPress(item) && item.feedname === STEAM_OFFICIAL_NEWS_FEED && steamNewsTitleLooksLikePatchNotes(item.title)) ||
    items.find((item) => notPress(item) && item.is_external_url !== true && steamNewsTitleLooksLikePatchNotes(item.title)) ||
    items.find((item) => notPress(item) && steamNewsTitleLooksLikePatchNotes(item.title)) ||
    items.find((item) => notPress(item) && item.feedname === STEAM_OFFICIAL_NEWS_FEED)
  );
}

/** SVG Icons */
const ExpandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-white"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
);
const CompressIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-white"><path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
);

/** UI Components */
const Section = ({ title, color, content, loading, showExpandButton, onExpand, onCollapse, fillHeight }) => {
  // Extract the color from the border class and prepare it for the hover background
  const hoverBgColor = color.replace('border-', 'bg-').replace('500', '500/10');

  const HOVER_COLORS = {
    'border-green-500': 'group-hover/header:bg-green-500/10',
    'border-red-500': 'group-hover/header:bg-red-500/10',
    'border-yellow-500': 'group-hover/header:bg-yellow-500/10',
    'border-gray-500': 'group-hover/header:bg-gray-500/10',
  };

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22] shadow-lg transition-all duration-300 ${fillHeight ? 'h-full min-h-0' : 'h-[75vh]'}`}>
      <div className={`group/header relative flex w-full min-h-[3.25rem] items-center overflow-hidden border-b-2 bg-[#1f242d] px-3 py-3 ${color}`}>
        {/* This is where we pass the hoverBgColor variable */}
        <span className={`pointer-events-none absolute left-1/2 top-1/2 h-full w-full origin-center -translate-x-1/2 -translate-y-1/2 scale-0 opacity-0 transition-all duration-500 group-hover/header:scale-100 group-hover/header:opacity-100 ${HOVER_COLORS[color] || 'group-hover/header:bg-white/10'}`} />
      
        <div className="relative z-[1] flex w-full min-w-0 items-center">
          <div className="min-w-[2.25rem] flex-1" />
          <span className="text-center text-sm font-bold uppercase tracking-widest text-white">{title}</span>
          <div className="flex min-w-[2.25rem] flex-1 justify-end">
            {showExpandButton && <button onClick={(e) => { e.stopPropagation(); onExpand?.(); }} className="rounded-md p-1.5 text-white hover:bg-white/15"><ExpandIcon /></button>}
            {onCollapse && <button onClick={(e) => { e.stopPropagation(); onCollapse(); }} className="rounded-md p-1.5 text-white hover:bg-white/15"><CompressIcon /></button>}
          </div>
        </div>
      </div>
      {/* Content section remains the same... */}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6 text-sm leading-relaxed">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-4 w-3/4 rounded bg-gray-800"></div>
            <div className="h-4 w-full rounded bg-gray-800"></div>
          </div>
        ) : (
          <div className="break-words text-[#adbac7]" dangerouslySetInnerHTML={{ __html: content || "<i class='opacity-40 italic'>Waiting for analysis...</i>" }} />
        )}
      </div>
    </div>
  );
};

const ANALYSIS_COLUMNS = [
  { key: 'buff', title: '🟢 BUFFS', color: 'border-green-500' },
  { key: 'nerf', title: '🔴 NERFS', color: 'border-red-500' },
  { key: 'other', title: '🟡 OTHER', color: 'border-yellow-500' },
  { key: 'misc', title: '⚪ MISC', color: 'border-gray-500' },
];

function App() {
  const [currentPatchTitle, setCurrentPatchTitle] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState({ model: '', status: 'Idle' });
  const [gameSuggestionsDismissed, setGameSuggestionsDismissed] = useState(false);
  const [expandedColumn, setExpandedColumn] = useState(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpMessages, setFollowUpMessages] = useState([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpSending, setFollowUpSending] = useState(false);

  const gameSearchRef = useRef(null);
  const followUpChatRef = useRef(null);

  /** AI Models & Prompting */
  const MODELS = [
    "models/gemini-3.1-flash-lite-preview",
    "models/gemini-3-flash-preview",
    "models/gemini-2.5-pro", 
    "models/gemini-2.5-flash", 
    "models/gemini-2.5-flash-lite"
  ];

  const systemInstruction = `Analyze the following Steam patch notes and categorize them into [SECTION_BUFF], [SECTION_NERF], [SECTION_OTHER], and [SECTION_MISC].
    
    STRICT FORMATTING RULES:
    1. Use <b>Character/Item Name</b> for headers.
    2. Always add a <br> tag after every </b> tag.
    3. Always add a <br> tag before every '▪️' (bullet point icon) symbol to ensure every point is on a new line because '▪️' is a bullet point icon and it's not a text. But don't add a <br> tag after a <b> tag to avoid double <br> tags.
    4. NEVER put a colon (:), dash (-), or bullet point (▪️) on the same line as the <b> header.
    5. Every individual change must start with the '▪️' symbol.
    6. Do NOT use semicolons (;) to separate multiple changes for the same character. Use a new '▪️' symbol for each.
    7. Do NOT leave empty lines between the header and the first bullet point.
    8. Format output as raw HTML suitable for dangerouslySetInnerHTML.`;

  /** Event Handlers */
  useEffect(() => {
    const onPointerDown = (e) => { if (!gameSearchRef.current?.contains(e.target)) setGameSuggestionsDismissed(true); };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const suggestions = useMemo(() => {
    if (searchTerm.length < 3) return [];
    return steamApps.filter(app => app.n.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
  }, [searchTerm]);

  const beautifyResponse = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/\n/g, '<br>');
  };

  const extractSection = (text, startTag, nextTags) => {
    const parts = text.split(startTag);
    if (parts.length < 2) return "<i>No changes found.</i>";
    let content = parts[1];
    let minIndex = content.length;
    nextTags.forEach(tag => {
      const idx = content.indexOf(tag);
      if (idx !== -1 && idx < minIndex) minIndex = idx;
    });
    content = content.substring(0, minIndex).trim();
    return content.replace(/\n/g, '<br>') || "<i>No changes found.</i>";
  };

  /** Core Logic: Steam Fetch & AI Analysis */
  const handleAnalyze = async () => {
    if (!apiKey || !selectedApp) return alert("Missing API Key or Game Selection.");
    setLoading(true);
    setAnalysis(null);
    setFollowUpOpen(false);
    setFollowUpMessages([]);

    try {
      setDebug({ model: 'System', status: 'Fetching Steam Data...' });
      const steamApiUrl = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${selectedApp.i}&count=30`;
      const workerUrl = `https://steam-proxy.knkelbucik-yeniden.workers.dev/?target=${encodeURIComponent(steamApiUrl)}`;
      
      const steamRes = await axios.get(workerUrl);
      const data = typeof steamRes.data === 'string' ? JSON.parse(steamRes.data) : steamRes.data;
      const patchItem = pickPatchNewsItem(data.appnews?.newsitems);

      if (!patchItem) throw new Error("No valid patch notes found.");

      setCurrentPatchTitle(patchItem.title); // Set the title here without waiting for the AI

      const ai = new GoogleGenAI({ apiKey });
      let aiResponse = "";
      let usedModel = "";

      for (const m of MODELS) {
        try {
          setDebug({ model: m, status: 'AI Analysis...' });
          const result = await ai.models.generateContent({
            model: m,
            contents: [{ role: 'user', parts: [{ text: `Analyze: ${patchItem.contents.substring(0, 25000)}` }] }],
            config: { systemInstruction }
          });
          const text = result.text || (result.response && result.response.text());
          if (text) { aiResponse = text; usedModel = m; break; }
        } catch (err) { console.error(`Model ${m} failed:`, err); continue; }
      }

      if (!aiResponse) throw new Error("AI failed to respond.");

      /** Initialize Chat Session for Follow-up */
      followUpChatRef.current = ai.chats.create({
        model: usedModel,
        config: { systemInstruction },
        history: [
          { role: 'user', parts: [{ text: `Analyze notes: ${patchItem.contents.substring(0, 20000)}` }] },
          { role: 'model', parts: [{ text: aiResponse }] },
        ],
      });

      setFollowUpMessages([
        { role: 'user', text: `Analyzing: "${patchItem.title}"` },
        { role: 'model', text: aiResponse },
      ]);

      const tags = ["[SECTION_BUFF]", "[SECTION_NERF]", "[SECTION_OTHER]", "[SECTION_MISC]"];
      setAnalysis({
        title: patchItem.title,
        model: usedModel,
        buff: extractSection(aiResponse, tags[0], [tags[1], tags[2], tags[3]]),
        nerf: extractSection(aiResponse, tags[1], [tags[2], tags[3]]),
        other: extractSection(aiResponse, tags[2], [tags[3]]),
        misc: extractSection(aiResponse, tags[3], [])
      });

    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
      setDebug({ model: '', status: 'Idle' });
    }
  };

  const handleFollowUpSend = async () => {
    const trimmed = followUpInput.trim();
    if (!trimmed || followUpSending) return;
    const chat = followUpChatRef.current;
    
    setFollowUpInput('');
    setFollowUpMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setFollowUpSending(true);

    try {
      const response = await chat.sendMessage({ message: trimmed });
      setFollowUpMessages((prev) => [...prev, { role: 'model', text: response.text }]);
    } catch (err) {
      setFollowUpMessages((prev) => [...prev, { role: 'model', text: `Error: ${err.message}` }]);
    } finally {
      setFollowUpSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#adbac7] p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-[#161b22] p-6 rounded-lg border border-[#30363d] shadow-xl items-end">
          <div className="flex-1 w-full space-y-2">
            <div className="flex justify-start items-center gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">API Key</label>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] font-bold text-blue-500 hover:underline uppercase"
              >
                Get yours here
              </a>
            </div>
            <input type="password" className="w-full bg-[#0d1117] border border-[#30363d] p-3 rounded focus:border-blue-500 outline-none" value={apiKey} onChange={e => setApiKey(e.target.value)} />
          </div>
          <div ref={gameSearchRef} className="relative flex-1 w-full space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Game Name</label>
            <input type="text" className="w-full bg-[#0d1117] border border-[#30363d] p-3 rounded focus:border-blue-500 outline-none" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setGameSuggestionsDismissed(false); }} />
            {suggestions.length > 0 && !gameSuggestionsDismissed && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded border border-[#30363d] bg-[#1c2128] shadow-2xl">
                {suggestions.map(s => <div key={s.i} onClick={() => { setSelectedApp(s); setSearchTerm(s.n.toUpperCase()); setGameSuggestionsDismissed(true); }} className="cursor-pointer border-b border-[#30363d] p-3 hover:bg-[#2d333b]">{s.n.toUpperCase()}</div>)}
              </div>
            )}
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <button onClick={handleAnalyze} disabled={loading} className={`flex-1 md:flex-none md:px-8 rounded py-3 font-bold text-white transition-all ${loading ? 'bg-gray-700' : 'bg-[#238636] hover:bg-[#2ea043]'}`}>{loading ? 'ANALYZING...' : 'RUN ANALYSIS'}</button>
            {analysis && !loading && <button onClick={() => setFollowUpOpen(true)} className="flex-1 md:flex-none md:px-4 rounded border border-[#30363d] bg-[#21262d] py-3 font-bold hover:bg-[#2d333b]">FOLLOW UP</button>}
          </div>
        </div>

        {/* Status Bar */}
        {(analysis || loading) && (
          <div className="flex justify-between items-center mb-6 px-4 py-2 bg-[#1c2128] rounded border border-[#30363d] text-[10px] font-mono">
            <div>STATUS: <span className={loading ? "text-orange-400" : "text-green-400"}>{debug.status}</span></div>
            {/* CENTER SECTION: Patch Title */}
            <div className="text-center truncate px-2">
              {currentPatchTitle ? (
                <span className="text-white font-bold tracking-widest uppercase border-x border-[#30363d] px-4 py-1 animate-pulse">
                  {currentPatchTitle}
                </span>
              ) : (
                <span className="text-gray-600 italic">READY_FOR_SCAN</span>
              )}
            </div>
            {analysis && <span className="text-blue-400">MODEL: {analysis.model}</span>}
          </div>
        )}

        {/* Patch Title Display
        {analysis && !loading && (
          <div className="mb-6 animate-slideIn">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#30363d] to-transparent"></div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight text-center px-4">
                {analysis.title.toUpperCase()}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#30363d] to-transparent"></div>
            </div>
            <p className="text-[10px] text-center text-gray-500 font-bold mt-2 tracking-[0.2em] uppercase">
              Currently Analyzing Latest Official Deployment
            </p>
          </div>
        )}*/}
        
        {/* Main Analysis Grid */}
        <div className="relative">
          <div className={`grid grid-cols-1 gap-6 transition-all md:grid-cols-4 ${expandedColumn ? 'opacity-30 blur-sm' : ''}`}>
            {ANALYSIS_COLUMNS.map(({ key, title, color }) => (
              <Section key={key} title={title} color={color} content={analysis?.[key]} loading={loading} showExpandButton onExpand={() => setExpandedColumn(key)} />
            ))}
          </div>

          {/* Fullscreen Column Modal */}
          {expandedColumn && (
            <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/70" onClick={() => setExpandedColumn(null)}></div>
              <div className="relative w-full max-w-[1200px] h-[85vh]">
                <Section 
                  title={ANALYSIS_COLUMNS.find(c => c.key === expandedColumn).title} 
                  color={ANALYSIS_COLUMNS.find(c => c.key === expandedColumn).color} 
                  content={analysis?.[expandedColumn]} 
                  loading={loading} 
                  fillHeight 
                  onCollapse={() => setExpandedColumn(null)} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Follow-up Chat UI */}
        {followUpOpen && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70" onClick={() => setFollowUpOpen(false)}></div>
            <div className="relative flex flex-col w-full max-w-[520px] max-h-[85vh] bg-[#161b22] rounded-xl border border-[#30363d] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#30363d] bg-[#1c2128] px-4 py-3">
                <h2 className="text-sm font-bold uppercase text-white">Follow-up chat</h2>
                <button onClick={() => setFollowUpOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {followUpMessages.map((msg, i) => (
                  <div key={i} className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'ml-auto bg-blue-600/20' : 'mr-auto bg-[#0d1117] border border-[#30363d]'}`}>
                    <div className="text-[9px] font-bold text-gray-500 mb-1 uppercase">{msg.role}</div>
                    <div dangerouslySetInnerHTML={{ __html: beautifyResponse(msg.text) }} />
                  </div>
                ))}
                {followUpSending && <div className="text-xs italic animate-pulse">Thinking…</div>}
              </div>
              <div className="p-4 border-t border-[#30363d]">
                <textarea value={followUpInput} onChange={e => setFollowUpInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleFollowUpSend())} placeholder="Ask a follow-up..." rows={2} className="w-full bg-[#0d1117] border border-[#30363d] rounded p-3 text-sm outline-none mb-2 focus:border-blue-500" />
                <button onClick={handleFollowUpSend} disabled={followUpSending || !followUpInput.trim()} className="w-full bg-[#238636] py-2 rounded font-bold text-white hover:bg-[#2ea043] disabled:bg-gray-800">SEND</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Footer Section */}
      <footer className="mt-12 py-8 border-t border-[#30363d] text-[#7d8590]">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          
          {/* Left Section: Identity and License */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-bold text-[#adbac7] tracking-tight">PATCH_ANALYZER v0.6</span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm">
              Built with ❤️ for the gaming community. This tool provides automated meta-analysis using advanced LLMs to help competitive players stay ahead. I wanted to make this project for my own need but since I lowkey f with it, decided to share.
            </p>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
              <span>MIT License</span>
              <a 
                href="https://github.com/vittoriocodes/steam-patch-analyzer-web" 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-500 hover:text-blue-400 transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </div>

          {/* Right Section: Legal Disclaimer */}
          <div className="md:text-right space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Legal Disclaimer</span>
            <p className="text-[10px] leading-relaxed max-w-md md:ml-auto">
              This application is not affiliated with, maintained, authorized, endorsed, or sponsored by <span className="font-black text-white">Valve Corporation</span> or <span className="font-black text-white">Steam</span>. 
              All game titles, data, and assets are trademarks of their respective owners. 
              AI-generated summaries may contain inaccuracies; always refer to official developer notes for final confirmation.
            </p>
            <div className="flex flex-wrap md:justify-end gap-x-4 gap-y-1 text-[9px] text-gray-600">
              <span>Powered by Gemini</span>
              <span>•</span>
              <span>React & Vite</span>
              <span>•</span>
              <span>Steam Web API/RSS</span>
            </div>
          </div>

        </div>

        {/* Bottom Divider and Copyright */}
        <div className="mt-8 pt-4 border-t border-[#30363d]/50 flex justify-between items-center text-[9px] uppercase tracking-widest">
          <span>© {new Date().getFullYear()} - All Rights Reserved</span>
          <span className="opacity-50">Data retrieved via secure proxy layer</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
