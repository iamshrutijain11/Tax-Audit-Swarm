import React, { useEffect, useState, useCallback } from 'react';
import { Save, Plus, Trash2, Loader2, Settings as SettingsIcon, BookOpen, User } from 'lucide-react';
import { getAIConfig, updateAIConfig, getKnowledgeRules, addKnowledgeRule, deleteKnowledgeRule, getMe } from '../api/client';
import type { AIConfig, KnowledgeRule } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';

const Settings: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [tab, setTab] = useState<'ai' | 'rules' | 'account'>('ai');

  // AI Config
  const [aiConfig, setAiConfig] = useState<AIConfig>({ confidence_threshold: 0.7, gemini_model: 'gemini-pro', gst_rate: 0.18 });
  const [aiLoading, setAiLoading] = useState(true);
  const [aiSaving, setAiSaving] = useState(false);

  // Knowledge Base
  const [rules, setRules] = useState<KnowledgeRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [addingRule, setAddingRule] = useState(false);
  const [deletingRule, setDeletingRule] = useState<string | null>(null);

  // Account
  const [accountInfo, setAccountInfo] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    getAIConfig().then(setAiConfig).finally(() => setAiLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'rules') loadRules();
    if (tab === 'account' && token) {
      getMe(token).then(setAccountInfo).catch(() => {});
    }
  }, [tab, token]);

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const data = await getKnowledgeRules();
      setRules(data.rules);
    } finally {
      setRulesLoading(false);
    }
  }, []);

  const handleSaveAI = async () => {
    setAiSaving(true);
    try {
      const updated = await updateAIConfig(aiConfig);
      setAiConfig(updated);
      addToast('AI config saved.', 'success');
    } catch {
      addToast('Failed to save AI config.', 'error');
    } finally {
      setAiSaving(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    setAddingRule(true);
    try {
      await addKnowledgeRule(newRule.trim());
      setNewRule('');
      addToast('Rule added.', 'success');
      await loadRules();
    } catch {
      addToast('Failed to add rule.', 'error');
    } finally {
      setAddingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    setDeletingRule(id);
    try {
      await deleteKnowledgeRule(id);
      addToast('Rule deleted.', 'info');
      setRules(prev => prev.filter(r => r.rule_id !== id));
    } catch {
      addToast('Failed to delete rule.', 'error');
    } finally {
      setDeletingRule(null);
    }
  };

  const TABS = [
    { key: 'ai' as const, label: 'AI Config', icon: <SettingsIcon size={14} /> },
    { key: 'rules' as const, label: 'Knowledge Base', icon: <BookOpen size={14} /> },
    { key: 'account' as const, label: 'Account', icon: <User size={14} /> },
  ];

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure AI parameters, compliance rules, and account</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-200 ${
              tab === t.key ? 'border-violet-500 text-violet-300' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* AI Config */}
      {tab === 'ai' && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white">AI Configuration</h2>
          {aiLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 size={16} className="animate-spin" /> Loading…</div>
          ) : (
            <>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-2 block">
                  Confidence Threshold ({(aiConfig.confidence_threshold * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={aiConfig.confidence_threshold}
                  onChange={e => setAiConfig(c => ({ ...c, confidence_threshold: +e.target.value }))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 block">Gemini Model</label>
                <input
                  type="text"
                  className="input-field font-mono"
                  value={aiConfig.gemini_model}
                  onChange={e => setAiConfig(c => ({ ...c, gemini_model: e.target.value }))}
                  placeholder="gemini-pro"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-2 block">
                  GST Rate ({(aiConfig.gst_rate * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={aiConfig.gst_rate}
                  onChange={e => setAiConfig(c => ({ ...c, gst_rate: +e.target.value }))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>

              <button className="btn-primary" onClick={handleSaveAI} disabled={aiSaving}>
                {aiSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save AI Config
              </button>
            </>
          )}
        </div>
      )}

      {/* Knowledge Base */}
      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Add Compliance Rule</h2>
            <form onSubmit={handleAddRule} className="flex gap-2">
              <textarea
                className="input-field resize-none flex-1"
                rows={2}
                placeholder="e.g. Flag invoices where tax amount exceeds 28% of base amount"
                value={newRule}
                onChange={e => setNewRule(e.target.value)}
              />
              <button type="submit" className="btn-primary self-end px-3" disabled={addingRule || !newRule.trim()}>
                {addingRule ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              </button>
            </form>
          </div>

          <div className="glass-card">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Rules ({rules.length})</h2>
            </div>
            {rulesLoading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : rules.length === 0 ? (
              <div className="py-8 text-center text-slate-600 text-sm">No rules configured yet.</div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {rules.map(rule => (
                  <div key={rule.rule_id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />
                    <p className="flex-1 text-sm text-slate-300 leading-relaxed">{rule.text}</p>
                    <button
                      className="flex-shrink-0 p-1 text-slate-600 hover:text-red-400 transition-colors"
                      onClick={() => handleDeleteRule(rule.rule_id)}
                      disabled={deletingRule === rule.rule_id}
                    >
                      {deletingRule === rule.rule_id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account */}
      {tab === 'account' && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white">Account Information</h2>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
            >
              {(accountInfo?.username || user?.username || 'A')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{accountInfo?.username || user?.username || '—'}</p>
              <p className="text-xs text-slate-500">Role: <span className="text-violet-300 capitalize">{accountInfo?.role || user?.role || '—'}</span></p>
            </div>
          </div>
          <p className="text-xs text-slate-500 italic">
            Prototype auth — JWT token stored in localStorage. No password change or 2FA in this version.
          </p>
          <button
            className="w-full py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all duration-200"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;
