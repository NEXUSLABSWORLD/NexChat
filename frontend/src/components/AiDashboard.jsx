import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Languages, History, Settings, Bot, ChevronRight, Activity, Globe2, MessageSquare, Send } from 'lucide-react';
import apiClient from '../api/client';
import './AiDashboard.css';

export default function AiDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState({ words_translated: 0, top_languages: [] });
  const [lexicon, setLexicon] = useState([]);
  const [config, setConfig] = useState({ ai_proactive_translation: true, ai_translation_formality: 'auto' });
  const [loading, setLoading] = useState(true);

  // NexBot Chat State
  const [nexbotInput, setNexbotInput] = useState('');
  const [nexbotMessages, setNexbotMessages] = useState([
    { role: 'ai', content: "Bonjour ! Je suis NexBot. Je peux t'aider à t'entraîner dans une autre langue, ou formuler un message complexe. Que puis-je faire pour toi ?" }
  ]);
  const [nexbotLoading, setNexbotLoading] = useState(false);
  const nexbotMessagesEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'nexbot' && nexbotMessagesEndRef.current) {
      nexbotMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [nexbotMessages, activeTab]);

  const handleNexbotSubmit = async (e) => {
    e.preventDefault();
    if (!nexbotInput.trim() || nexbotLoading) return;

    const userMessage = { role: 'user', content: nexbotInput.trim() };
    setNexbotMessages(prev => [...prev, userMessage]);
    setNexbotInput('');
    setNexbotLoading(true);

    try {
      const history = nexbotMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await apiClient.post('/ai/chat', { message: userMessage.content, history });
      if (res.data?.data) {
        setNexbotMessages(prev => [...prev, { role: 'ai', content: res.data.data }]);
      } else {
        setNexbotMessages(prev => [...prev, { role: 'ai', content: "Désolé, une erreur s'est produite lors de la réponse." }]);
      }
    } catch (err) {
      console.error(err);
      setNexbotMessages(prev => [...prev, { role: 'ai', content: "Erreur de connexion au serveur IA." }]);
    } finally {
      setNexbotLoading(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const resStats = await apiClient.get('/ai/stats');
        if (resStats.data?.data) setStats(resStats.data.data);

        const resLexicon = await apiClient.get('/ai/saved-phrases');
        if (resLexicon.data?.data) setLexicon(resLexicon.data.data);

        const resProfile = await apiClient.get('/profile/show');
        if (resProfile.data?.data) {
          setConfig({
            ai_proactive_translation: resProfile.data.data.ai_proactive_translation ?? true,
            ai_translation_formality: resProfile.data.data.ai_translation_formality ?? 'auto'
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleConfigChange = async (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    try {
      await apiClient.put('/ai/config', { [key]: value });
    } catch(e) {}
  };
  
  return (
    <div className="ai-dashboard-container">
      <header className="ai-dashboard-header">
        <div className="ai-dashboard-title">
          <Sparkles size={32} className="ai-icon-glow" />
          <h1>Centre IA <span>Obsidian</span></h1>
        </div>
        <p>Gérez vos traductions, vos apprentissages et l'assistance de NexBot.</p>
      </header>

      <div className="ai-dashboard-layout">
        <aside className="ai-sidebar">
          <button className={`ai-nav-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
            <Activity size={20} /> Statistiques
          </button>
          <button className={`ai-nav-btn ${activeTab === 'lexicon' ? 'active' : ''}`} onClick={() => setActiveTab('lexicon')}>
            <History size={20} /> Lexique
          </button>
          <button className={`ai-nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> Configuration
          </button>
          <button className={`ai-nav-btn ${activeTab === 'nexbot' ? 'active' : ''}`} onClick={() => setActiveTab('nexbot')}>
            <Bot size={20} /> NexBot
          </button>
        </aside>

        <main className="ai-content">
          {activeTab === 'stats' && (
            <div className="ai-panel fade-in">
              <h2>Vue d'ensemble</h2>
              <div className="ai-stats-grid">
                <div className="ai-stat-card">
                  <div className="ai-stat-icon"><Languages size={24} /></div>
                  <div className="ai-stat-value">{stats.words_translated || 0}</div>
                  <div className="ai-stat-label">Mots Traduits</div>
                </div>
                <div className="ai-stat-card">
                  <div className="ai-stat-icon"><Globe2 size={24} /></div>
                  <div className="ai-stat-value">{stats.top_languages && stats.top_languages.length > 0 ? stats.top_languages.join(', ').toUpperCase() : '-'}</div>
                  <div className="ai-stat-label">Langues Fréquentes</div>
                </div>
                <div className="ai-stat-card">
                  <div className="ai-stat-icon"><MessageSquare size={24} /></div>
                  <div className="ai-stat-value">...</div>
                  <div className="ai-stat-label">Résumés Générés</div>
                </div>
              </div>
              <div className="ai-stats-chart-placeholder">
                <p>L'activité IA de cette semaine sera affichée ici.</p>
              </div>
            </div>
          )}

          {activeTab === 'lexicon' && (
            <div className="ai-panel fade-in">
              <h2>Lexique Personnel</h2>
              <p className="ai-subtitle">Phrases sauvegardées lors de vos conversations.</p>
              
              <div className="lexicon-list">
                {loading ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
                ) : lexicon.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Aucune phrase sauvegardée pour le moment.</p>
                ) : (
                  lexicon.map(phrase => (
                    <div className="lexicon-item" key={phrase.id}>
                      <div className="lexicon-langs">
                        <span className="lang-badge">{phrase.source_lang?.toUpperCase() || '?'}</span> <ChevronRight size={14} /> <span className="lang-badge">{phrase.target_lang?.toUpperCase() || '?'}</span>
                      </div>
                      <div className="lexicon-text original">"{phrase.original_text}"</div>
                      {phrase.translated_text && <div className="lexicon-text translated">"{phrase.translated_text}"</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="ai-panel fade-in">
              <h2>Paramètres du Moteur IA</h2>
              
              <div className="ai-setting-group">
                <div className="ai-setting-info">
                  <h3>Traduction Proactive</h3>
                  <p>Traduire automatiquement les messages reçus dans des langues étrangères.</p>
                </div>
                <label className="ai-switch">
                  <input type="checkbox" checked={config.ai_proactive_translation} onChange={(e) => handleConfigChange('ai_proactive_translation', e.target.checked)} />
                  <span className="ai-slider"></span>
                </label>
              </div>

              <div className="ai-setting-group">
                <div className="ai-setting-info">
                  <h3>Niveau de Formalité</h3>
                  <p>Détermine si les traductions générées utilisent le vouvoiement ou le tutoiement.</p>
                </div>
                <select className="ai-select" value={config.ai_translation_formality} onChange={(e) => handleConfigChange('ai_translation_formality', e.target.value)}>
                  <option value="auto">Automatique</option>
                  <option value="informal">Amical (Tutoiement)</option>
                  <option value="formal">Professionnel (Vouvoiement)</option>
                </select>
              </div>
              
              <div className="ai-setting-group">
                <div className="ai-setting-info">
                  <h3>Génération de Réponses (Smart Replies)</h3>
                  <p>Autoriser l'IA à suggérer des réponses rapides.</p>
                </div>
                <label className="ai-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="ai-slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'nexbot' && (
            <div className="ai-panel fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <h2>NexBot (Assistant)</h2>
              <div className="nexbot-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '350px' }}>
                <div className="nexbot-messages" style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {nexbotMessages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role === 'user' ? 'out' : 'in ai-message'}`} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                      <div className="message-bubble" style={{ 
                        padding: '10px 14px', 
                        borderRadius: '12px', 
                        background: msg.role === 'user' ? 'var(--primary-color)' : 'var(--bg-panel)',
                        color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                        border: msg.role === 'user' ? 'none' : '1px solid var(--border-glass)'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {nexbotLoading && (
                    <div className="message in ai-message" style={{ alignSelf: 'flex-start' }}>
                      <div className="message-bubble" style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-panel)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                        NexBot réfléchit... ⚡
                      </div>
                    </div>
                  )}
                  <div ref={nexbotMessagesEndRef} />
                </div>
                <div style={{ display: 'flex', gap: '8px', padding: '8px 15px', overflowX: 'auto', borderTop: '1px solid var(--border-glass)', background: 'var(--bg-hover)' }}>
                  <button type="button" onClick={() => setNexbotInput("Hello! Can we practice my English conversation?")} style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '16px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    🇬🇧 Pratiquer l'anglais
                  </button>
                  <button type="button" onClick={() => setNexbotInput("Aide-moi à rédiger un message professionnel et poli pour mon collègue.")} style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid var(--secondary-color)', color: 'var(--secondary-color)', borderRadius: '16px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    💼 Rédiger un message pro
                  </button>
                  <button type="button" onClick={() => setNexbotInput("Peux-tu relire et corriger les fautes dans mon texte ?")} style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid var(--tertiary-color)', color: 'var(--tertiary-color)', borderRadius: '16px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    ✍️ Corriger mes fautes
                  </button>
                </div>
                <form onSubmit={handleNexbotSubmit} className="nexbot-input">
                  <input 
                    type="text" 
                    placeholder="Discutez avec l'IA..." 
                    value={nexbotInput}
                    onChange={(e) => setNexbotInput(e.target.value)}
                    disabled={nexbotLoading}
                  />
                  <button type="submit" className="btn-send" disabled={nexbotLoading || !nexbotInput.trim()} title="Envoyer le message">
                    <Sparkles size={18} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
