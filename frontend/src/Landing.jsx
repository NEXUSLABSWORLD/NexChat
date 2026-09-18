import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  Globe2,
  Lock,
  ShieldCheck,
  Key,
  Check,
  ChevronDown,
  MessageSquare,
  Zap,
  CreditCard,
  ArrowRight,
  Send,
  User,
  Bot,
  Crown
} from 'lucide-react';
import SubscriptionModal from './components/SubscriptionModal';
import './Landing.css';

export default function Landing({ onGetStarted, onLogin }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [modalTier, setModalTier] = useState('obsidian_pro');

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleOpenPlan = (tier) => {
    setModalTier(tier);
    setIsSubModalOpen(true);
  };

  const faqData = [
    {
      q: "Comment fonctionne le quota de traduction gratuit ?",
      a: "Chaque nouvel utilisateur bénéficie gratuitement de 5 000 mots traduits par mois par notre IA. Une fois ce quota atteint, vous pouvez continuer à chatter normalement ou passer au forfait Obsidian Pro pour débloquer l'illimité."
    },
    {
      q: "Quelle est la différence entre Obsidian Pro et Elite Digital ?",
      a: "Obsidian Pro (5 500 FCFA / ~8,99 € par mois) offre des traductions IA illimitées et les Stories HD. Elite Digital (15 000 FCFA / ~24,99 € par mois) inclut en plus le support IA prioritaire (Gemini 1.5 Pro), la synthèse vocale de groupe et des fichiers jusqu'à 100 Mo."
    },
    {
      q: "Mes conversations et fichiers sont-ils sécurisés ?",
      a: "Absolument. NexChat utilise un chiffrement de bout en bout et des politiques de sécurité strictes (RLS et Tokens Sanctum). Vos données sont stockées sur Supabase Cloud et ne sont jamais revendues ou analysées à des fins publicitaires."
    },
    {
      q: "Quels modes de paiement sont acceptés (Mobile Money / Carte) ?",
      a: "Nous acceptons nativement le Mobile Money (MTN MOMO, Orange Money, Wave, Moov) ainsi que les cartes bancaires (Visa, MasterCard) via notre passerelle sécurisée NotchPay."
    }
  ];

  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <span>NexChat</span>
          <Sparkles size={22} color="#06b6d4" />
        </div>
        <div className="landing-nav-links">
          <a href="#features">Fonctionnalités</a>
          <a href="#security">Sécurité</a>
          <a href="#pricing">Tarifs</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="landing-nav-actions">
          <button className="btn-nav-login" onClick={onLogin}>
            Connexion
          </button>
          <button className="btn-nav-primary" onClick={onGetStarted}>
            S'inscrire
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="hero-content">
          <div className="hero-tag">
            <Zap size={14} style={{ marginRight: '6px' }} />
            NEXCHAT V2.0 // IA CORE ENGINE
          </div>
          <h1 className="hero-title">
            Le Futur de la<br />
            <span>Communication IA</span>
          </h1>
          <p className="hero-subtitle">
            Messagerie instantanée futuriste avec traduction neurale automatique en temps réel,
            sécurité de grade militaire et design d'élite pour vos échanges mondiaux.
          </p>
          <div className="hero-actions">
            <button className="btn-neon-primary" onClick={onGetStarted}>
              Créer un compte gratuitement <ArrowRight size={18} />
            </button>
            <button className="btn-neon-secondary" onClick={onLogin}>
              Se connecter
            </button>
          </div>
        </div>

        {/* Dynamic Chat Interactive Preview Mockup */}
        <div className="hero-visual">
          <div className="mockup-container">
            <div className="mockup-header">
              <div className="mockup-user-info">
                <div className="mockup-avatar">
                  <User size={16} color="#a855f7" />
                </div>
                <div>
                  <div className="mockup-username">Sarah (Tokyo)</div>
                  <div className="mockup-status">● En ligne — En espagnol</div>
                </div>
              </div>
              <div className="mockup-badge">DeepL / Gemini</div>
            </div>

            <div className="mockup-chat-body">
              <div className="mockup-bubble sender">
                <p>Bonjour ! Tu as pu tester la nouvelle version de NexChat ?</p>
                <span className="bubble-time">14:20</span>
              </div>

              <div className="mockup-bubble receiver ai-glow">
                <div className="ai-translation-tag">
                  <Bot size={12} /> TRADUCTION IA EN TEMPS RÉEL
                </div>
                <p>¡Hola! Sí, la traducción automática funciona increíblemente bien. 🔥</p>
                <div className="original-text">Original: "Hi! Yes, automatic translation works amazingly well. 🔥"</div>
                <span className="bubble-time">14:21</span>
              </div>

              <div className="mockup-input-bar">
                <span>Écrivez votre message dans votre langue...</span>
                <button className="mockup-send-btn"><Send size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-tag">PERFORMANCES & INNOVATION</span>
          <h2 className="section-title">Conçu pour une communication <span>sans barrière</span></h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Sparkles size={26} />
            </div>
            <h3>Traduction IA Instantanée</h3>
            <p>Notre moteur hybride Gemini & DeepL traduit en arrière-plan vos messages dans plus de 60 langues simultanément.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon cyan">
              <Shield size={26} />
            </div>
            <h3>Sécurité & Confidentialité</h3>
            <p>Chiffrement robuste, isolation des données via Supabase Row-Level Security et protection des identifiants.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon orange">
              <Globe2 size={26} />
            </div>
            <h3>Médias & Stories HD</h3>
            <p>Partagez vos photos, vidéos, documents lourds et publiez des stories éphémères visibles par votre réseau.</p>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="security-section">
        <div className="security-content">
          <div className="security-tag">ARCHITECTURE DE CONFIANCE</div>
          <h2 className="security-title">Sécurité Obsidienne & <span>Protocole Sanctum</span></h2>
          <p className="security-subtitle">
            Vos conversations et fichiers restent votre propriété exclusive.
            Aucun intermédiaire ne peut accéder à vos données déchiffrées.
          </p>
          <div className="security-grid">
            <div className="security-card">
              <Lock className="security-icon" />
              <h4>Chiffrement E2E</h4>
              <p>Seuls vos destinataires peuvent lire vos messages. Clés sécurisées localement.</p>
            </div>
            <div className="security-card">
              <ShieldCheck className="security-icon" />
              <h4>Isolement RLS Database</h4>
              <p>Chaque utilisateur n'a accès qu'à ses propres données grâce aux politiques Supabase RLS strictes.</p>
            </div>
            <div className="security-card">
              <Key className="security-icon" />
              <h4>Authentification Sanctum</h4>
              <p>Gestion transparente des sessions et protection contre les réutilisations de tokens.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <span className="section-tag">ACCÈS & ABONNEMENTS</span>
          <h2 className="section-title">Choisissez le plan adapté à <span>vos besoins</span></h2>
          <p className="section-subtitle">Paiement flexible par carte bancaire ou Mobile Money (MOMO).</p>
        </div>

        <div className="pricing-grid">
          {/* Plan Gratuit */}
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Gratuit</h3>
              <p>Découverte de l'expérience NexChat</p>
              <div className="pricing-price">
                <span className="amount">0 FCFA</span>
                <span className="period">/ pour toujours (0 €)</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li><Check size={16} color="#06b6d4" /> 5 000 mots traduits par mois</li>
              <li><Check size={16} color="#06b6d4" /> Messagerie temps réel illimitée</li>
              <li><Check size={16} color="#06b6d4" /> Publication de stories éphémères</li>
              <li><Check size={16} color="#06b6d4" /> Envoi de fichiers jusqu'à 10 Mo</li>
            </ul>
            <button className="btn-pricing-secondary" onClick={onGetStarted}>
              Démarrer gratuitement
            </button>
          </div>

          {/* Plan Pro (Populaire) */}
          <div className="pricing-card featured">
            <div className="popular-badge">RECOMMANDÉ</div>
            <div className="pricing-header">
              <h3>Obsidian Pro</h3>
              <p>Pour les utilisateurs fréquents et pros</p>
              <div className="pricing-price">
                <span className="amount">5 500 FCFA</span>
                <span className="period">/ mois (~8,99 €)</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li><Check size={16} color="#a855f7" /> <strong>Traductions IA illimitées</strong></li>
              <li><Check size={16} color="#a855f7" /> Moteur IA Gemini Flash ultra-rapide</li>
              <li><Check size={16} color="#a855f7" /> Envoi de fichiers & médias jusqu'à 500 Mo</li>
              <li><Check size={16} color="#a855f7" /> Stories haute résolution & filtres IA</li>
              <li><Check size={16} color="#a855f7" /> Badge Pro sur votre profil</li>
            </ul>
            <button className="btn-pricing-primary" onClick={() => handleOpenPlan('obsidian_pro')}>
              Passer à Obsidian Pro
            </button>
          </div>

          {/* Plan Elite */}
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Elite Digital</h3>
              <p>L'expérience ultime sans aucune limite</p>
              <div className="pricing-price">
                <span className="amount">15 000 FCFA</span>
                <span className="period">/ mois (~24,99 €)</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li><Check size={16} color="#06b6d4" /> Tout ce qu'inclut Obsidian Pro</li>
              <li><Check size={16} color="#06b6d4" /> Moteur Gemini 1.5 Pro haute précision</li>
              <li><Check size={16} color="#06b6d4" /> Support technique prioritaire 24/7</li>
              <li><Check size={16} color="#06b6d4" /> Stockage illimité sur Supabase Cloud</li>
              <li><Check size={16} color="#06b6d4" /> Badge de certification Elite</li>
            </ul>
            <button className="btn-pricing-secondary" onClick={() => handleOpenPlan('elite_digital')}>
              Rejoindre l'Élite
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="section-header">
          <span className="section-tag">QUESTIONS FRÉQUENTES</span>
          <h2 className="section-title">Tout ce que vous devez <span>savoir</span></h2>
        </div>

        <div className="faq-accordion">
          {faqData.map((item, idx) => (
            <div
              key={idx}
              className={`faq-item ${openFaq === idx ? 'open' : ''}`}
              onClick={() => toggleFaq(idx)}
            >
              <div className="faq-question">
                <h4>{item.q}</h4>
                <ChevronDown className={`faq-icon ${openFaq === idx ? 'rotate' : ''}`} size={20} />
              </div>
              {openFaq === idx && (
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-box">
          <h2>Prêt à révolutionner vos conversations ?</h2>
          <p>Rejoignez des milliers d'utilisateurs qui échangent déjà sans barrière linguistique.</p>
          <button className="btn-neon-primary large" onClick={onGetStarted}>
            Créer mon compte maintenant <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="landing-logo">
              <span>NexChat</span>
              <Sparkles size={20} color="#06b6d4" />
            </div>
            <p>Plateforme de messagerie de nouvelle génération propulsée par l'Intelligence Artificielle.</p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h5>Produit</h5>
              <a href="#features">Fonctionnalités</a>
              <a href="#security">Sécurité</a>
              <a href="#pricing">Tarifs</a>
            </div>
            <div className="footer-col">
              <h5>Ressources</h5>
              <a href="#faq">FAQ</a>
              <a href="#pricing">Moyens de paiement (MOMO)</a>
              <a href="#security">Confidentialité</a>
            </div>
            <div className="footer-col">
              <h5>Compte</h5>
              <span onClick={onLogin} className="footer-click">Connexion</span>
              <span onClick={onGetStarted} className="footer-click">Inscription</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 NexChat V2.0 Inc. Tous droits réservés.</p>
          <p className="footer-dev">Développé pour l'excellence et l'élégance.</p>
        </div>
      </footer>

      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        currentTier="free"
        onRequireAuth={(mode, tier) => {
          localStorage.setItem('pending_subscription_plan', tier);
          setIsSubModalOpen(false);
          if (mode === 'login') {
            onLogin();
          } else {
            onGetStarted();
          }
        }}
      />
    </div>
  );
}
