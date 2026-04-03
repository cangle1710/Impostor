import Toggle from './Toggle.jsx';
import { wordCategories } from '../data/categories.js';
import { questionCategories } from '../data/qcategories.js';

const DISCUSSION_OPTIONS = [
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' },
];

export default function SettingsPanel({ settings, onChange, playerCount }) {
  const isWord = settings.gameMode === 'WORD';
  const categories = isWord ? wordCategories : questionCategories;

  const update = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  const maxImposters = Math.max(1, playerCount - 1);

  return (
    <div className="flex flex-col gap-4">
      {/* Players & Impostors */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Players</p>
          <p className="text-2xl font-bold text-white">{playerCount}</p>
        </div>
        <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4">
          <p className="text-gray-400 text-xs mb-2">Impostors</p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => update('numImposters', Math.max(1, settings.numImposters - 1))}
              disabled={settings.numImposters <= 1}
              className="w-8 h-8 rounded-lg bg-[#352a5e] text-white font-bold disabled:opacity-30"
            >−</button>
            <span className="text-2xl font-bold">{settings.numImposters}</span>
            <button
              onClick={() => update('numImposters', Math.min(maxImposters, settings.numImposters + 1))}
              disabled={settings.numImposters >= maxImposters}
              className="w-8 h-8 rounded-lg bg-[#352a5e] text-white font-bold disabled:opacity-30"
            >+</button>
          </div>
        </div>
      </div>

      {/* Game Mode */}
      <div>
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Game Mode</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'WORD', icon: 'Tt', title: 'Word Game', sub: "Find who doesn't know the secret word" },
            { id: 'QUESTION', icon: '?', title: 'Question Game', sub: 'Find who got a different question' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => update('gameMode', m.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer
                ${settings.gameMode === m.id
                  ? 'border-purple-500 bg-purple-600/15'
                  : 'border-[#352a5e] bg-[#1e1640] hover:border-purple-600/40'}`}
            >
              <div className={`text-2xl font-bold mb-1 ${settings.gameMode === m.id ? 'text-purple-400' : 'text-gray-400'}`}>
                {m.icon}
              </div>
              <p className="font-semibold text-sm">{m.title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{m.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#352a5e]">
          <p className="font-semibold text-sm">Category</p>
          <select
            value={settings.category}
            onChange={(e) => update('category', e.target.value)}
            className="bg-[#251c4a] border border-[#352a5e] text-purple-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Toggles */}
        {[
          { key: 'showCategoryToImpostor', label: 'Show Category to Impostor', icon: '👁' },
          { key: 'showHintToImpostor', label: 'Show Hint to Impostor', icon: '💡' },
          { key: 'impostersKnowEachOther', label: 'Impostors Know Each Other', icon: '🤝' },
        ].map((t, i, arr) => (
          <div
            key={t.key}
            className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#352a5e]' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{t.icon}</span>
              <p className="text-sm">{t.label}</p>
            </div>
            <Toggle
              checked={settings[t.key]}
              onChange={(v) => update(t.key, v)}
            />
          </div>
        ))}
      </div>

      {/* Optional Rules */}
      <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#352a5e]">
          <p className="font-semibold text-sm">Optional Rules</p>
          <p className="text-gray-500 text-xs mt-0.5">All off by default — original game is the baseline</p>
        </div>
        {[
          { key: 'showRoleFlavor',   label: 'Role Flavors',        icon: '🎭', sub: 'Crewmates get a job title (e.g. "Chef")' },
          { key: 'allowAccusation',  label: 'Early Accusation',    icon: '🫵', sub: 'Players can accuse during discussion' },
          { key: 'allowImpostorGuess', label: 'Impostor Word Guess', icon: '🎯', sub: 'Impostor can guess the secret word' },
          { key: 'trackScores',      label: 'Score Tracking',      icon: '🏆', sub: 'Accumulate points across rounds' },
        ].map((t, i, arr) => (
          <div
            key={t.key}
            className={`flex items-start justify-between px-4 py-3 gap-3 ${i < arr.length - 1 ? 'border-b border-[#352a5e]' : ''}`}
          >
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className="text-base mt-0.5">{t.icon}</span>
              <div>
                <p className="text-sm">{t.label}</p>
                <p className="text-xs text-gray-500">{t.sub}</p>
              </div>
            </div>
            <Toggle
              checked={settings[t.key]}
              onChange={(v) => update(t.key, v)}
            />
          </div>
        ))}
      </div>

      {/* Discussion Timer */}
      <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Discussion Time</p>
        <div className="flex gap-2 flex-wrap">
          {DISCUSSION_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => update('discussionSeconds', o.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                ${settings.discussionSeconds === o.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#352a5e] text-gray-300 hover:bg-[#3d3270]'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
