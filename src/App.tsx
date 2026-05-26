```react
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import type { User, AuthError } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, getDocs } from 'firebase/firestore';
import type { QuerySnapshot, FirestoreError } from 'firebase/firestore';

// ---------------------------------------------------------
// 1. CONFIGURAÇÃO DO FIREBASE (Suas Credenciais)
// ---------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAhiyFj4ZdrEHZV6l_MsvSKDU3ZNXrGYy4",
  authDomain: "listasdepresenca-2f0d1.firebaseapp.com",
  projectId: "listasdepresenca-2f0d1",
  storageBucket: "listasdepresenca-2f0d1.firebasestorage.app",
  messagingSenderId: "383117663865",
  appId: "1:383117663865:web:20c2072fc745ddb8fdfea8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------------------------------------------------------
// 2. BANCO DE DADOS DE FESTAS (Temas, Cores e Senhas)
// ---------------------------------------------------------
const THEMES = {
  'luiza-monica': {
    id: 'luiza-monica',
    title: 'Luíza em A Turma da Mônica',
    age: '5 ANOS',
    date: '13/06/2026',
    time: '19:00 às 23:00',
    location: 'Buffet Cata-Vento - Ipiranga',
    bgColor: '#fef08a', 
    primaryColor: '#ef4444', 
    secondaryColor: '#38bdf8', 
    message: '"Olá! Esta data vai ser muito importante, e eu espero você para comemorar e brincar comigo!"',
    adminUser: 'luiza',       // LOGIN DOS PAIS
    adminPass: '@14062021'    // SENHA DOS PAIS
  },
  'joao-safari': {
    id: 'joao-safari',
    title: 'O Grande Safári do João',
    age: '3 ANOS',
    date: '20/10/2026',
    time: '14:00 às 18:00',
    location: 'Espaço Selva Feliz',
    bgColor: '#dcfce7', 
    primaryColor: '#15803d', 
    secondaryColor: '#ca8a04', 
    message: '"Prepare o seu binóculo! Vamos explorar a selva juntos no meu aniversário!"',
    adminUser: 'joao',        // LOGIN DOS PAIS
    adminPass: 'safari123'    // SENHA DOS PAIS
  },
  'sofia-frozen': {
    id: 'sofia-frozen',
    title: 'Aventura Congelante da Sofia',
    age: '6 ANOS',
    date: '05/12/2026',
    time: '18:00 às 22:00',
    location: 'Castelo de Cristal Eventos',
    bgColor: '#e0f2fe', 
    primaryColor: '#2563eb', 
    secondaryColor: '#c084fc', 
    message: '"Você quer brincar na neve? A porta já está aberta para a minha festa mágica!"',
    adminUser: 'sofia',       // LOGIN DOS PAIS
    adminPass: 'frozen2026'   // SENHA DOS PAIS
  }
};

interface Guest {
  id: string;
  mainName: string;
  companions: string[];
  createdAt: number;
  timestamp: string;
}

// ---------------------------------------------------------
// 3. COMPONENTE PRINCIPAL (Roteador de Ecrãs)
// ---------------------------------------------------------
export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'invite'>('dashboard');
  const [activePartyId, setActivePartyId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubscribeAuth = onAuthStateChanged(auth, setCurrentUser);
    return () => unsubscribeAuth();
  }, []);

  const openInvite = (partyId: string) => {
    setActivePartyId(partyId);
    setCurrentView('invite');
  };

  if (currentView === 'dashboard') {
    return <DashboardView onOpenInvite={openInvite} />;
  }

  if (currentView === 'invite' && activePartyId) {
    return <PartyInviteView partyId={activePartyId} onClose={() => setCurrentView('dashboard')} currentUser={currentUser} />;
  }

  return null;
}

// ---------------------------------------------------------
// 4. ÁREA RESTRITA: PAINEL DO BUFFET
// ---------------------------------------------------------
function DashboardView({ onOpenInvite }: { onOpenInvite: (id: string) => void }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string) => {
    const fakeLink = `https://seusite.com/convite/${id}`;
    navigator.clipboard.writeText(fakeLink).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b-2 border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800">RSVP Manager PRO</h1>
            <p className="text-slate-500 text-sm mt-1">Painel do Organizador (Buffet)</p>
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border border-green-300">
            Sistema Online
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-700 mb-4">Festas Ativas:</h2>

        <div className="grid gap-4">
          {Object.values(THEMES).map((theme) => (
            <div key={theme.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-300 transition">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex-shrink-0 shadow-inner" style={{ backgroundColor: theme.primaryColor }}></div>
                <div>
                  <h3 className="font-bold text-slate-900">{theme.title}</h3>
                  <div className="text-xs text-slate-600 mt-1 bg-slate-100 p-2 rounded-lg border border-slate-200 inline-block">
                    🔐 <strong>Credenciais dos Pais:</strong><br/>
                    Usuário: <code className="bg-white px-1 rounded">{theme.adminUser}</code> | Senha: <code className="bg-white px-1 rounded">{theme.adminPass}</code>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                <button onClick={() => handleCopyLink(theme.id)} className="flex-1 md:flex-none bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition">
                  {copiedId === theme.id ? '✅ Link Copiado!' : '🔗 Copiar Link'}
                </button>
                <button onClick={() => onOpenInvite(theme.id)} className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition">
                  👁️ Abrir Convite
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// 5. TELA DO CONVIDADO (O que o cliente abre no WhatsApp)
// ---------------------------------------------------------
function PartyInviteView({ partyId, onClose, currentUser }: { partyId: string, onClose: () => void, currentUser: User | null }) {
  const theme = THEMES[partyId as keyof typeof THEMES];
  
  // Nome da coleção dinâmico no Firebase
  const collectionName = `rsvp_${partyId}`;
  
  const [guestList, setGuestList] = useState<Guest[]>([]);
  const [mainName, setMainName] = useState<string>('');
  const [companions, setCompanions] = useState<{ id: number; value: string }[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [summaryName, setSummaryName] = useState<string>('');
  
  // Estados do Modal Administrativo dos Pais
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [loginUser, setLoginUser] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<boolean>(false);
  
  // Alertas
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmConfig, setConfirmConfig] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribeRsvps = onSnapshot(collection(db, collectionName), (snapshot: QuerySnapshot) => {
      const list: Guest[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Guest));
      setGuestList(list.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsubscribeRsvps();
  }, [currentUser, collectionName]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredCompanions = companions.map(c => c.value.trim()).filter(Boolean);
    try {
      await addDoc(collection(db, collectionName), { mainName: mainName.trim(), companions: filteredCompanions, createdAt: Date.now(), timestamp: new Date().toLocaleString('pt-BR') });
      setSummaryName(mainName.trim());
      setIsSubmitted(true);
    } catch {
      alert("Erro ao enviar confirmação.");
    }
  };

  // Funções de Login dos Pais
  const handleOpenPadlock = () => {
    if (isAuthenticatedAdmin) {
      setShowAdminModal(true); 
    } else {
      setLoginUser('');
      setLoginPassword('');
      setLoginError(false);
      setShowLoginModal(true); 
    }
  };

  const handleLoginSubmit = () => {
    if (loginUser.trim().toLowerCase() === theme.adminUser.toLowerCase() && loginPassword.trim() === theme.adminPass) {
      setIsAuthenticatedAdmin(true);
      setShowLoginModal(false);
      setShowAdminModal(true);
    } else {
      setLoginError(true);
    }
  };

  const handleExportCSV = () => {
    let csvContent = "\uFEFFConvidado Responsável;Familiares Acompanhantes;Data/Hora\n";
    guestList.forEach(guest => {
      csvContent += `"${guest.mainName}";"${guest.companions.join(', ')}";"${guest.timestamp || ''}"\n`;
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `lista_presenca_${partyId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 relative"
         style={{ backgroundColor: theme.bgColor, fontFamily: "'Fredoka', 'Comic Neue', sans-serif", backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Fredoka:wght@300..700&display=swap');
        .comic-border { border: 4px solid #000; box-shadow: 6px 6px 0px #000; }
        .comic-button { border: 3px solid #000; box-shadow: 4px 4px 0px #000; }
        .comic-button:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0px #000; }
      `}</style>

      {/* Convite Principal */}
      <main className="w-full max-w-lg bg-white comic-border rounded-3xl p-6 md:p-8 relative overflow-hidden mt-4 transition-all">
        <div className="absolute top-0 left-0 right-0 h-4 border-b-4 border-black" style={{ backgroundColor: theme.primaryColor }}></div>
        <div className="absolute top-4 left-0 right-0 h-2 border-b-2 border-black" style={{ backgroundColor: theme.secondaryColor }}></div>

        <div className="text-center mt-6 mb-8">
          <div className="inline-block text-white text-xs font-bold uppercase px-4 py-1 rounded-full comic-border transform -rotate-2 mb-4" style={{ backgroundColor: theme.primaryColor }}>
            Por favor confirme sua presença
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase" style={{ color: theme.primaryColor, textShadow: '2px 2px 0px #000' }}>{theme.title}</h1>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="bg-white border-2 border-black font-bold px-3 py-1 rounded-lg text-sm">{theme.age}</span>
            <span className="bg-white border-2 border-black font-bold px-3 py-1 rounded-lg text-sm">{theme.date}</span>
          </div>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="bg-white border-4 border-black rounded-2xl p-4 mb-6 text-center text-gray-800 font-medium relative shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
               <p>{theme.message}</p>
            </div>

            <div>
              <label className="block font-bold text-gray-900 mb-2">Seu Nome Completo:</label>
              <input type="text" required placeholder="Ex: João da Silva" value={mainName} onChange={(e) => setMainName(e.target.value)} 
                     className="w-full px-4 py-3 border-3 border-black rounded-xl font-medium outline-none focus:ring-4 focus:ring-yellow-300 transition-all" style={{ border: '3px solid #000', backgroundColor: theme.bgColor }} />
            </div>
            
            <div>
              <label className="block font-bold text-gray-900 mb-1">Acompanhantes?</label>
              <div className="space-y-2 mt-2">
                {companions.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <input type="text" placeholder="Nome do familiar" required value={c.value} onChange={(e) => setCompanions(companions.map(comp => comp.id === c.id ? { ...comp, value: e.target.value } : comp))} className="flex-1 px-3 py-2 border-2 border-black rounded-lg text-sm" />
                    <button type="button" onClick={() => setCompanions(companions.filter(comp => comp.id !== c.id))} className="bg-red-100 px-4 rounded-lg border-2 border-red-400 text-lg">🗑️</button>
                  </div>
                ))}
                <button type="button" onClick={() => setCompanions([...companions, { id: Date.now(), value: '' }])} className="w-full bg-gray-50 border-2 border-dashed border-gray-400 font-bold py-2 rounded-xl text-sm mt-2">
                  ➕ Adicionar Acompanhante
                </button>
              </div>
            </div>
            
            <button type="submit" className="comic-button w-full text-white font-extrabold text-xl py-4 rounded-2xl uppercase mt-4 hover:opacity-90" style={{ backgroundColor: theme.primaryColor }}>
              CONFIRMAR PRESENÇA
            </button>
          </form>
        ) : (
          <div className="text-center py-8">
            <div className="text-5xl mb-4 animate-bounce">✨</div>
            <h2 className="text-2xl font-black uppercase" style={{ color: theme.primaryColor }}>Presença Confirmada!</h2>
            <p className="mt-4 text-gray-600">Obrigado por confirmar, <strong>{summaryName}</strong>!</p>
          </div>
        )}
        <div className="mt-8 pt-4 border-t-2 border-gray-200 text-center text-xs font-bold text-gray-500">{theme.location}</div>
      </main>

      {/* Botão de Cadeado dos Pais */}
      <button onClick={handleOpenPadlock} className="mt-6 text-3xl hover:scale-110 transition-transform mb-8">🔒</button>

      {/* Login Modal dos Pais */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white comic-border rounded-3xl p-6 w-full max-w-sm relative shadow-2xl">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-black font-bold text-lg bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
            <div className="text-center mb-6">
              <span className="text-4xl block mb-2">🔑</span>
              <h3 className="text-xl font-black uppercase mt-1" style={{ color: theme.primaryColor }}>Área dos Pais</h3>
              <p className="text-xs text-gray-500 mt-1">Identifique-se para ver a lista da sua festa</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Usuário:</label>
                <input type="text" placeholder="Ex: luiza" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="w-full px-4 py-3 border-2 border-black rounded-xl font-medium outline-none bg-slate-50 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Senha:</label>
                <input type="password" placeholder="Sua senha" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-4 py-3 border-2 border-black rounded-xl font-medium outline-none bg-slate-50 text-sm" />
              </div>
              {loginError && (<div className="text-red-600 text-xs font-bold text-center bg-red-50 p-2 rounded border border-red-200">❌ Credenciais incorretas!</div>)}
              <button onClick={handleLoginSubmit} className="comic-button w-full text-white font-bold py-3 rounded-xl uppercase text-sm mt-2" style={{ backgroundColor: theme.primaryColor }}>
                Acessar Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Convidados (Modal Admin) */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-lg comic-border flex flex-col max-h-[85vh] shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-black">
              <div>
                <h3 className="font-bold text-lg md:text-xl uppercase" style={{ color: theme.primaryColor }}>📋 Lista de {theme.title.split(' ')[0]}</h3>
                <p className="text-xs text-gray-500 font-bold mt-1">Total: {guestList.length + guestList.reduce((acc, g) => acc + g.companions.length, 0)} Pessoas</p>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="bg-gray-200 px-3 py-1 rounded-lg font-bold border-2 border-black shadow-[2px_2px_0px_#000]">X</button>
            </div>
            
            <div className="overflow-y-auto flex-1 mb-4 bg-slate-50 border-2 border-slate-200 rounded-xl p-2">
              <table className="w-full text-left border-collapse text-sm">
                <thead><tr className="border-b-2 border-slate-300 font-bold text-slate-600"><th className="pb-2 pl-2">Nome</th><th className="pb-2 text-right pr-2">Ação</th></tr></thead>
                <tbody>
                  {guestList.length === 0 ? <tr><td colSpan={2} className="py-8 text-center text-gray-500 font-medium italic">Sua lista está vazia por enquanto.</td></tr> : guestList.map(g => (
                    <tr key={g.id} className="border-b border-gray-200 hover:bg-white transition-colors"><td className="py-3 font-bold pl-2">{g.mainName} <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full ml-1">{g.companions.length} acomp.</span></td><td className="py-3 text-right pr-2"><button onClick={() => deleteDoc(doc(db, collectionName, g.id))} className="text-red-500 font-bold text-xs hover:underline">Excluir</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button onClick={handleExportCSV} className="comic-button flex-1 bg-green-500 text-white font-bold py-3 rounded-xl text-sm shadow-[2px_2px_0px_#000]">📥 Baixar Planilha</button>
            </div>
          </div>
        </div>
      )}

      {/* Botão Apenas de Teste (Pode remover depois) */}
      <button onClick={onClose} className="absolute top-4 right-4 bg-white/80 border-2 border-black rounded-full px-3 py-1 text-xs font-bold z-10 shadow-[2px_2px_0px_#000]">
        ✕ Voltar
      </button>
    </div>
  );
}


```

