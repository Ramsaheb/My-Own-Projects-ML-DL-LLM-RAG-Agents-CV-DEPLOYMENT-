import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const EXAMPLES = [
  "We are seeking a rockstar ninja who thrives in a fast-paced environment and wears many hats.",
  "Due to shifting macroeconomic conditions, we are right-sizing the workforce to optimize operational agility.",
  "This revolutionary, AI-powered paradigm shift will supercharge your workflow and skyrocket your ROI!",
  "Let's circle back and synergize our core competencies to move the needle on this mission-critical initiative.",
];

function App() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDiff, setShowDiff] = useState(false);

  const sanitize = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/sanitize`, {
        text: inputText.trim()
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
    setError(null);
  };

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-veritas-darker flex flex-col">
      {/* Header */}
      <header className="border-b border-veritas-border bg-veritas-dark/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-veritas-accent to-veritas-accent-dim flex items-center justify-center font-bold text-black text-xl">
                V
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">VERITAS</h1>
                <p className="text-xs text-veritas-muted">Truth Console</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-veritas-surface rounded-full border border-veritas-border">
              <span className="w-2 h-2 rounded-full bg-veritas-accent animate-pulse"></span>
              <span className="text-xs text-gray-400">Signal &gt; Noise</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {/* Examples */}
        <div className="mb-6">
          <p className="text-sm text-veritas-muted mb-2">Quick examples:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((text, i) => (
              <button
                key={i}
                onClick={() => { setInputText(text); setResult(null); }}
                className="text-xs px-3 py-1.5 bg-veritas-surface border border-veritas-border rounded-full text-gray-400 hover:text-veritas-accent hover:border-veritas-accent transition-all truncate max-w-xs"
              >
                {text.substring(0, 40)}...
              </button>
            ))}
          </div>
        </div>

        {/* Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input Panel */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-red-400">●</span>
                <h2 className="text-sm font-semibold text-gray-300">Original Text</h2>
                <span className="text-xs text-veritas-muted">(Noisy / Biased)</span>
              </div>
              <span className="text-xs text-veritas-muted">{inputText.length} chars</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && sanitize()}
              disabled={loading}
              placeholder="Paste corporate jargon here...

Press Ctrl+Enter to sanitize"
              className="w-full h-80 p-4 bg-veritas-surface border border-veritas-border rounded-lg text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-veritas-accent transition-all"
            />
          </div>

          {/* Output Panel */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-veritas-accent">●</span>
                <h2 className="text-sm font-semibold text-gray-300">Veritas Output</h2>
                <span className="text-xs text-veritas-muted">(Neutral / Truth)</span>
              </div>
              {result && <span className="text-xs text-veritas-muted">{result.clean_text.length} chars</span>}
            </div>
            <div className={`w-full h-80 p-4 bg-veritas-surface border rounded-lg overflow-auto ${error ? 'border-red-500/50' : 'border-veritas-border'}`}>
              {loading && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-10 h-10 border-4 border-veritas-accent border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-veritas-muted">Filtering truth...</p>
                </div>
              )}
              {error && !loading && (
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-3xl mb-2">⚠️</span>
                  <p className="text-red-400 text-center">{error}</p>
                </div>
              )}
              {!loading && !error && !result && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="text-4xl mb-3 opacity-30">🎯</span>
                  <p className="text-gray-500">Truth will appear here</p>
                </div>
              )}
              {!loading && !error && result && (
                <div>
                  <p className="text-gray-200 font-mono leading-relaxed">{result.clean_text}</p>
                  <button
                    onClick={() => copyToClipboard(result.clean_text)}
                    className="mt-4 px-3 py-1 text-xs bg-veritas-surface-hover border border-veritas-border rounded hover:border-veritas-accent hover:text-veritas-accent transition-all"
                  >
                    📋 Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          <button
            onClick={sanitize}
            disabled={loading || !inputText.trim()}
            className="px-8 py-3 bg-veritas-accent text-black font-semibold rounded-lg hover:bg-veritas-accent-dim disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-lg"
          >
            {loading ? '⚙️ Processing...' : '⚡ Strip the Noise'}
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-3 bg-veritas-surface border border-veritas-border text-gray-300 rounded-lg hover:bg-veritas-surface-hover transition-all"
          >
            Clear
          </button>
          {result && (
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`px-6 py-3 border rounded-lg transition-all ${showDiff ? 'bg-veritas-accent/10 border-veritas-accent text-veritas-accent' : 'bg-veritas-surface border-veritas-border text-gray-300'}`}
            >
              {showDiff ? '📊 Hide Diff' : '🔍 Show Diff'}
            </button>
          )}
        </div>

        {/* Stats */}
        {result && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className={`p-4 rounded-lg border bg-veritas-surface ${result.token_reduction >= 0.2 ? 'border-veritas-accent/50' : 'border-veritas-border'}`}>
              <p className="text-xs text-veritas-muted mb-1">🔥 Token Reduction</p>
              <p className={`text-xl font-semibold font-mono ${result.token_reduction >= 0.2 ? 'text-veritas-accent' : 'text-gray-200'}`}>
                ↓ {Math.round(result.token_reduction * 100)}%
              </p>
            </div>
            <div className="p-4 rounded-lg border border-veritas-border bg-veritas-surface">
              <p className="text-xs text-veritas-muted mb-1">📝 Original Tokens</p>
              <p className="text-xl font-semibold font-mono text-gray-200">{result.original_tokens}</p>
            </div>
            <div className="p-4 rounded-lg border border-veritas-border bg-veritas-surface">
              <p className="text-xs text-veritas-muted mb-1">✨ Clean Tokens</p>
              <p className="text-xl font-semibold font-mono text-gray-200">{result.clean_tokens}</p>
            </div>
            <div className="p-4 rounded-lg border border-veritas-border bg-veritas-surface">
              <p className="text-xs text-veritas-muted mb-1">🗑️ Words Removed</p>
              <p className="text-xl font-semibold font-mono text-gray-200">{result.words_removed}</p>
            </div>
          </div>
        )}

        {/* Diff View */}
        {result && showDiff && (
          <div className="bg-veritas-surface border border-veritas-border rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">🔍 Diff Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-veritas-muted mb-2 flex items-center gap-2">
                  <span className="text-red-400">●</span> Original
                </p>
                <div className="p-4 bg-veritas-darker rounded-lg font-mono text-sm text-gray-400">
                  {result.original_text}
                </div>
              </div>
              <div>
                <p className="text-xs text-veritas-muted mb-2 flex items-center gap-2">
                  <span className="text-veritas-accent">●</span> Cleaned
                </p>
                <div className="p-4 bg-veritas-darker rounded-lg font-mono text-sm text-veritas-accent">
                  {result.clean_text}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-veritas-border py-4">
        <div className="container mx-auto px-4 max-w-7xl text-center text-xs text-veritas-muted">
          <span className="gradient-text font-semibold">VERITAS</span> • Truth Filter for the AI Age • 🧠 Powered by Fine-tuned T5
        </div>
      </footer>
    </div>
  );
}

export default App;
