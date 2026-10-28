/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TabType, UserSession } from './types';
import { Navbar } from './components/Navbar';
import { AuthGate } from './components/AuthGate';
import { PublicLanding } from './components/PublicLanding';
import { PrivateInstructorPanel } from './components/PrivateInstructorPanel';
import { SecurityAuditConsole } from './components/SecurityAuditConsole';
import { EmbedGenerator } from './components/EmbedGenerator';
import { ModerationSuite } from './components/ModerationSuite';
import { BotSimulator } from './components/BotSimulator';
import { CodeDocumentation } from './components/CodeDocumentation';
import { QuickVerifyModal } from './components/QuickVerifyModal';
import { ASSETS } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('public');
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isQuickVerifyOpen, setIsQuickVerifyOpen] = useState(false);

  // Restore session from API on load
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUserSession(data.user);
        } else {
          setUserSession(null);
        }
      })
      .catch(() => {
        setUserSession(null);
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });

    // Listen for OAuth Popup PostMessage (Real Discord OAuth2 Flow)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.user) {
        setUserSession(event.data.user);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Login with Discord OAuth2 (Uses Environmental Variables on Server)
  const handleDiscordLogin = async () => {
    try {
      const res = await fetch('/api/auth/url');
      const data = await res.json();
      if (data.url) {
        window.open(data.url, 'discord_oauth', 'width=600,height=700');
      }
    } catch (err) {
      console.error('Error fetching OAuth URL:', err);
    }
  };

  // Logout (Destroys secure JWT cookie on server)
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUserSession(null);
    } catch (err) {
      setUserSession(null);
    }
  };

  // If checking authentication status on initial boot
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-400 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-slate-300">
          Verificando Credenciales Militares de Discord...
        </p>
      </div>
    );
  }

  // MANDATORY AUTHENTICATION GATE:
  // If user is not authenticated, lock the platform behind the Military Discord Gate
  if (!userSession) {
    return (
      <AuthGate
        onLoginClick={handleDiscordLogin}
        onSessionAuthenticated={(user) => setUserSession(user)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* 3-Zone Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userSession={userSession}
        onLoginClick={handleDiscordLogin}
        onLogoutClick={handleLogout}
        onOpenQuickVerify={() => setIsQuickVerifyOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1">
        {activeTab === 'public' && (
          <PublicLanding
            userSession={userSession}
            onLoginClick={handleDiscordLogin}
            onGoToPrivatePanel={() => setActiveTab('private')}
          />
        )}

        {activeTab === 'private' && (
          <PrivateInstructorPanel
            userSession={userSession}
            onLoginClick={handleDiscordLogin}
          />
        )}

        {activeTab === 'security' && <SecurityAuditConsole />}

        {activeTab === 'embed' && <EmbedGenerator />}
        {activeTab === 'moderation' && <ModerationSuite />}
        {activeTab === 'simulator' && <BotSimulator />}
        {activeTab === 'code' && <CodeDocumentation />}
      </main>

      {/* Quick Verification Modal */}
      <QuickVerifyModal
        isOpen={isQuickVerifyOpen}
        onClose={() => setIsQuickVerifyOpen(false)}
      />

      {/* Quiet Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <img src={ASSETS.famEmblem} alt="FAM Emblem" className="w-5 h-5 rounded-full object-cover" />
          <span className="font-bold text-slate-300">FUERZA AÉREA MEXICANA — SISTEMA WEB Y DISCORD OAUTH2 (DEVSECOPS)</span>
        </div>
        <div className="flex items-center justify-center gap-4 text-slate-500 text-[11px] flex-wrap">
          <span>Variables de Entorno Activas</span>
          <span>·</span>
          <span>Discord OAuth2 Strict Protocol</span>
          <span>·</span>
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">
            Términos de Servicio (/terms)
          </a>
          <span>·</span>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">
            Política de Privacidad (/privacy)
          </a>
        </div>
      </footer>

    </div>
  );
}
