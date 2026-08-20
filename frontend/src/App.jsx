import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';

const API_BASE_URL = `http://${window.location.hostname}:8000`;

// Opções admitidas para o Tipo de Documento de Identificação
const OPCOES_DOC_IDENTIFICACAO = [
  'Cartão de Cidadão',
  'Passaporte',
  'Autorização de Residência',
  'Cédula Pessoal / Assento de Nascimento',
  'Título de Residência Temporário',
  'Outro'
];

export default function App() {
  const [user, setUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [criancas, setCriancas] = useState([]);
  const [listaFamilias, setListaFamilias] = useState([]);
  const [familiaSelecionada, setFamiliaSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);

  // ESTADOS CRIANÇA
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [criancaEmEdicao, setCriancaEmEdicao] = useState(null);
  const [errosValidacaoCrianca, setErrosValidacaoCrianca] = useState([]);
  const [formData, setFormData] = useState({
    no_proc_interno: '', nome: '', no_ppp: '', genero: 'Masculino',
    data_nascimento: '', nacionalidade: 'Portuguesa', morada: '',
    doc_identificacao: 'Cartão de Cidadão', no_doc_identificacao: '',
    nif: '', niss: '', sns: '', gestor: '', servico: 'Serviço Social',
    estado_processo: 'Ativo', acolhimento_anterior: 'Não',
    data_entrada_1a_af: '', data_saida_1a_af: '',
    data_entrada_af_atual: '', data_saida_af_atual: '',
    observacoes: '', transicao_para: '', familia_id: ''
  });

  // ESTADOS TITULAR E AGREGADO
  const [editandoTitular, setEditandoTitular] = useState(false);
  const [formFamilia, setFormFamilia] = useState({});
  const [membroEmEdicaoId, setMembroEmEdicaoId] = useState(null);
  const [formMembroEdicao, setFormMembroEdicao] = useState({});
  const [novoMembro, setNovoMembro] = useState({ nome: '', relacao: '', data_nascimento: '', profissao: '', validade_registo_criminal: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user) {
      carregarCriancas();
      carregarListaFamilias();
    }
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    axios.post(`${API_BASE_URL}/api/login`, { username: usernameInput, password: passwordInput })
      .then(res => {
        setUser(res.data);
        localStorage.setItem('user_session', JSON.stringify(res.data));
      })
      .catch(() => setLoginError('Utilizador ou palavra-passe incorretos.'));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user_session');
  };

  const carregarCriancas = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/criancas`)
      .then(res => { setCriancas(res.data); setLoading(false); })
      .catch(err => console.error(err));
  };

  const carregarListaFamilias = () => {
    axios.get(`${API_BASE_URL}/api/familias`)
      .then(res => setListaFamilias(res.data))
      .catch(err => console.error(err));
  };

  const abrirModalFamilia = (familiaId) => {
    if (!familiaId) return;
    axios.get(`${API_BASE_URL}/api/familias/${familiaId}`)
      .then(res => {
        setFamiliaSelecionada(res.data);
        setFormFamilia(res.data);
        setEditandoTitular(false);
        setMembroEmEdicaoId(null);
      })
      .catch(err => console.error(err));
  };

  const abrirModalCriar = () => {
    setCriancaEmEdicao(null);
    setErrosValidacaoCrianca([]);
    setFormData({
      no_proc_interno: '', nome: '', no_ppp: '', genero: 'Masculino', data_nascimento: '',
      nacionalidade: 'Portuguesa', morada: '', doc_identificacao: 'Cartão de Cidadão',
      no_doc_identificacao: '', nif: '', niss: '', sns: '', gestor: '', servico: 'Serviço Social',
      estado_processo: 'Ativo', acolhimento_anterior: 'Não', data_entrada_1a_af: '',
      data_saida_1a_af: '', data_entrada_af_atual: '', data_saida_af_atual: '',
      observacoes: '', transicao_para: '', familia_id: ''
    });
    setModalFormAberto(true);
  };

  const abrirModalEditar = (c) => {
    setCriancaEmEdicao(c.id);
    setErrosValidacaoCrianca([]);
    setFormData({
      no_proc_interno: c.no_proc_interno !== 'N/A' ? c.no_proc_interno : '',
      nome: c.nome || '',
      no_ppp: c.no_ppp !== 'N/D' ? c.no_ppp : '',
      genero: c.genero !== 'N/D' ? c.genero : 'Masculino',
      data_nascimento: c.data_nascimento || '',
      nacionalidade: c.nacionalidade || 'Portuguesa',
      morada: c.morada || '',
      doc_identificacao: c.doc_identificacao || 'Cartão de Cidadão',
      no_doc_identificacao: c.no_doc_identificacao !== 'N/D' ? c.no_doc_identificacao : '',
      nif: c.nif !== 'N/D' ? c.nif : '',
      niss: c.niss !== 'N/D' ? c.niss : '',
      sns: c.sns !== 'N/D' ? c.sns : '',
      gestor: c.gestor !== 'Não atribuído' ? c.gestor : '',
      servico: c.servico || 'Serviço Social',
      estado_processo: c.estado_processo || 'Ativo',
      acolhimento_anterior: c.acolhimento_anterior || 'Não',
      data_entrada_1a_af: c.data_entrada_1a_af || '',
      data_saida_1a_af: c.data_saida_1a_af || '',
      data_entrada_af_atual: c.data_entrada_af_atual !== 'N/D' ? c.data_entrada_af_atual : '',
      data_saida_af_atual: c.data_saida_af_atual || '',
      observacoes: c.observacoes || '',
      transicao_para: c.transicao_para || '',
      familia_id: c.familia_id || ''
    });
    setModalFormAberto(true);
  };

  const handleEliminar = (id, nome) => {
    if (window.confirm(`Eliminar registo de "${nome}"?`)) {
      axios.delete(`${API_BASE_URL}/api/criancas/${id}`).then(() => carregarCriancas());
    }
  };

  // --- VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS ---
  const validarFormularioCrianca = () => {
    const camposObrigatorios = [
      { campo: formData.no_proc_interno, nome: 'N.º Processo' },
      { campo: formData.nome, nome: 'Nome Completo' },
      { campo: formData.no_ppp, nome: 'N.º PPP' },
      { campo: formData.data_nascimento, nome: 'Data Nascimento' },
      { campo: formData.nacionalidade, nome: 'Nacionalidade' },
      { campo: formData.doc_identificacao, nome: 'Tipo Doc. Identificação' },
      { campo: formData.no_doc_identificacao, nome: 'N.º Doc. Identificação' },
      { campo: formData.nif, nome: 'NIF' },
      { campo: formData.niss, nome: 'NISS' },
      { campo: formData.sns, nome: 'SNS' },
      { campo: formData.gestor, nome: 'Gestor de Caso' },
      { campo: formData.servico, nome: 'Serviço de Gestão' },
      { campo: formData.estado_processo, nome: 'Estado do Processo' },
      { 
        campo: formData.familia_id, 
        nome: 'Titular de Acolhimento', 
        valido: Boolean(formData.familia_id && formData.familia_id !== '' && formData.familia_id !== 'Nenhum / Não Atribuído')
      }
    ];

    const erros = [];
    camposObrigatorios.forEach(item => {
      if (item.valido !== undefined) {
        if (!item.valido) erros.push(item.nome);
      } else if (!item.campo || String(item.campo).trim() === '' || String(item.campo).trim() === 'N/D' || String(item.campo).trim() === 'N/A') {
        erros.push(item.nome);
      }
    });

    return erros;
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    
    // Executa a verificação dos campos obrigatórios
    const erros = validarFormularioCrianca();
    if (erros.length > 0) {
      setErrosValidacaoCrianca(erros);
      // Faz scroll para o topo da janela modal para o utilizador ver o aviso de imediato
      const modalContent = document.getElementById('modal-crianca-content');
      if (modalContent) modalContent.scrollTop = 0;
      return;
    }

    setErrosValidacaoCrianca([]);
    const payload = { ...formData, familia_id: formData.familia_id ? parseInt(formData.familia_id) : null };
    
    if (criancaEmEdicao) {
      axios.put(`${API_BASE_URL}/api/criancas/${criancaEmEdicao}`, payload)
        .then(() => { setModalFormAberto(false); carregarCriancas(); })
        .catch(err => alert("Erro ao atualizar: " + err.message));
    } else {
      axios.post(`${API_BASE_URL}/api/criancas`, payload)
        .then(() => { setModalFormAberto(false); carregarCriancas(); })
        .catch(err => alert("Erro ao criar: " + err.message));
    }
  };

  const handleGuardarTitular = () => {
    axios.put(`${API_BASE_URL}/api/familias/${familiaSelecionada.id}`, formFamilia)
      .then(() => { setEditandoTitular(false); abrirModalFamilia(familiaSelecionada.id); carregarCriancas(); });
  };

  // AGREGADO FAMILIAR (CRIAR, EDITAR, ELIMINAR)
  const handleAdicionarMembro = (e) => {
    e.preventDefault();
    axios.post(`${API_BASE_URL}/api/familias/${familiaSelecionada.id}/membros`, novoMembro)
      .then(() => {
        setNovoMembro({ nome: '', relacao: '', data_nascimento: '', profissao: '', validade_registo_criminal: '' });
        abrirModalFamilia(familiaSelecionada.id);
      });
  };

  const IniciarEdicaoMembro = (m) => {
    setMembroEmEdicaoId(m.id);
    setFormMembroEdicao({ ...m });
  };

  const handleGuardarMembro = (membroId) => {
    axios.put(`${API_BASE_URL}/api/membros/${membroId}`, formMembroEdicao)
      .then(() => {
        setMembroEmEdicaoId(null);
        abrirModalFamilia(familiaSelecionada.id);
      });
  };

  const handleRemoverMembro = (membroId) => {
    if (window.confirm("Remover este membro do agregado?")) {
      axios.delete(`${API_BASE_URL}/api/membros/${membroId}`).then(() => abrirModalFamilia(familiaSelecionada.id));
    }
  };

  const verificarCaducidadeCertificado = (dataValidadeStr) => {
    if (!dataValidadeStr) return { expiraEmBreve: false, diasRestantes: 999 };
    const dataVal = new Date(dataValidadeStr);
    const hoje = new Date();
    const diffTempo = dataVal.getTime() - hoje.getTime();
    const diffDias = Math.ceil(diffTempo / (1000 * 3600 * 24));
    return { expiraEmBreve: diffDias <= 90, diasRestantes: diffDias };
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '380px', border: '1px solid #e2e8f0' }}>
          <h1 style={{ fontSize: '20px', color: '#0f172a', margin: 0, textAlign: 'center' }}>🔒 Acesso Restrito</h1>
          {loginError && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '8px', borderRadius: '6px', fontSize: '12px', marginTop: '12px' }}>{loginError}</div>}
          <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
            <input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="Utilizador" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' }} />
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Palavra-passe" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px', boxSizing: 'border-box' }} />
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* REGRAS CSS PURAS (CABEÇALHO FIXO NO TOPO + COLUNAS CONGELADAS) */}
      <style>{`
        .table-container { 
          overflow-x: auto !important; 
          overflow-y: auto !important; 
          max-height: 75vh !important; /* Permite o scroll vertical com cabeçalho fixo */
          background-color: #ffffff; 
          border-radius: 12px; 
          border: 1px solid #e2e8f0; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        
        .sticky-table { 
          width: 100%; 
          border-collapse: separate !important; 
          border-spacing: 0 !important; 
          text-align: left; 
          font-size: 12px; 
          white-space: nowrap; 
        }

        /* 📌 FIXAR TODO O CABEÇALHO NO TOPO */
        .sticky-table thead th {
          position: sticky !important;
          top: 0px !important;
          background-color: #f1f5f9 !important;
          z-index: 20 !important;
          border-bottom: 2px solid #cbd5e1 !important;
        }

        /* 📌 COLUNA 1 CONGELADA À ESQUERDA */
        .col-sticky-1 { 
          position: sticky !important; 
          left: 0px !important; 
          background-color: #ffffff !important; 
          z-index: 10 !important; 
          min-width: 110px !important; 
        }

        /* CANTO SUPERIOR ESQUERDO 1 (Cruzamento Topo + Coluna 1) */
        th.col-sticky-1 { 
          background-color: #f1f5f9 !important; 
          z-index: 30 !important; 
        }

        /* 📌 COLUNA 2 CONGELADA À ESQUERDA */
        .col-sticky-2 { 
          position: sticky !important; 
          left: 110px !important; 
          background-color: #ffffff !important; 
          z-index: 10 !important; 
          min-width: 180px !important; 
          box-shadow: 5px 0 8px -3px rgba(0, 0, 0, 0.15) !important; 
        }

        /* CANTO SUPERIOR ESQUERDO 2 (Cruzamento Topo + Coluna 2) */
        th.col-sticky-2 { 
          background-color: #f1f5f9 !important; 
          z-index: 30 !important; 
        }

        .status-badge-ativo { background-color: #dcfce7 !important; color: #15803d !important; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 800; display: inline-block; }
        .status-badge-inativo { background-color: #fee2e2 !important; color: #b91c1c !important; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 800; display: inline-block; }
        .tr-inativo { opacity: 0.55 !important; background-color: #fafafa !important; }

        .erro-validacao-card {
          background-color: #fef2f2;
          border: 1.5px solid #f87171;
          color: #991b1b;
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 12.5px;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.08);
        }
      `}</style>

      <header style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '22px' }}>📋 Sistema de Gestão de Acolhimento Familiar</h1>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Sessão iniciada como: <strong>{user.nome}</strong> ({user.role.toUpperCase()})</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <button onClick={abrirModalCriar} style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              ➕ Nova Criança
            </button>
          )}
          <button onClick={handleLogout} style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>🚪 Sair</button>
        </div>
      </header>

      <main>
        <div className="table-container">
          <table className="sticky-table">
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', fontSize: '11px', color: '#475569' }}>
                <th className="col-sticky-1" style={{ padding: '12px' }}>N.º Proc.</th>
                <th className="col-sticky-2" style={{ padding: '12px' }}>Nome Criança</th>
                <th style={{ padding: '12px' }}>N.º PPP</th>
                <th style={{ padding: '12px' }}>Data Nasc. (Idade)</th>
                <th style={{ padding: '12px' }}>Nacionalidade</th>
                <th style={{ padding: '12px' }}>Doc. Identificação</th>
                <th style={{ padding: '12px' }}>Infos Fiscais</th>
                <th style={{ padding: '12px' }}>Gestor & Serviço</th>
                <th style={{ padding: '12px' }}>Histórico AF</th>
                <th style={{ padding: '12px' }}>AF Atual</th>
                <th style={{ padding: '12px' }}>Estado</th>
                <th style={{ padding: '12px' }}>Titular Acolhimento</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="13" style={{ padding: '24px', textAlign: 'center' }}>A carregar dados...</td></tr>
              ) : criancas.map((c) => {
                const isInativo = c.estado_processo === 'Inativo';
                return (
                  <tr key={c.id} className={isInativo ? 'tr-inativo' : ''}>
                    <td className="col-sticky-1" style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>{c.no_proc_interno}</td>
                    <td className="col-sticky-2" style={{ padding: '12px', fontWeight: '600' }}>{c.nome}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{c.no_ppp}</td>
                    <td style={{ padding: '12px' }}>{c.data_nascimento} ({c.idade} anos)</td>
                    <td style={{ padding: '12px' }}>{c.nacionalidade}</td>
                    <td style={{ padding: '12px' }}>{c.doc_identificacao}<br/><small>{c.no_doc_identificacao}</small></td>
                    <td style={{ padding: '12px', fontSize: '11px' }}>NIF: {c.nif}<br/>NISS: {c.niss}<br/>SNS: {c.sns}</td>
                    <td style={{ padding: '12px' }}><strong>{c.gestor}</strong><br/><small>{c.servico}</small></td>
                    <td style={{ padding: '12px' }}>{c.acolhimento_anterior === "Sim" ? `Sim (${c.data_entrada_1a_af} a ${c.data_saida_1a_af})` : 'Sem histórico'}</td>
                    <td style={{ padding: '12px' }}>Entrada: {c.data_entrada_af_atual}<br/>{c.data_saida_af_atual && `Saída: ${c.data_saida_af_atual}`}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={isInativo ? 'status-badge-inativo' : 'status-badge-ativo'}>
                        ● {c.estado_processo.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{c.titular_acolhimento}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        {c.familia_id && <button onClick={() => abrirModalFamilia(c.familia_id)} title="Ver Ficha da Família" style={{ padding: '4px 8px', cursor: 'pointer' }}>👁️</button>}
                        {isAdmin && (
                          <>
                            <button onClick={() => abrirModalEditar(c)} title="Editar Criança" style={{ padding: '4px 8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => handleEliminar(c.id, c.nome)} title="Eliminar Criança" style={{ padding: '4px 8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* 📝 MODAL CRIAR / EDITAR CRIANÇA COM VALIDAÇÃO DETALHADA A VERMELHO */}
      {modalFormAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div id="modal-crianca-content" style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setModalFormAberto(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            
            <h2 style={{ marginTop: 0, color: '#0f172a' }}>{criancaEmEdicao ? '✏️ Editar Processo da Criança' : '➕ Registar Nova Criança'}</h2>

            {/* 🔴 AVISO EM VERMELHO DE DADOS EM FALTA (SEM POP-UPS) */}
            {errosValidacaoCrianca.length > 0 && (
              <div className="erro-validacao-card">
                <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>
                  ⚠️ Não é possível salvar os dados da criança por faltar os seguintes dados:
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                  {errosValidacaoCrianca.map((erro, idx) => (
                    <li key={idx}><strong>{erro}</strong></li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmitForm} noValidate style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px' }}>
              <div style={{ gridColumn: 'span 3', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', fontWeight: 'bold', color: '#2563eb' }}>1. Dados Pessoais & Identificação</div>
              
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>N.º Processo *</label>
                <input type="text" value={formData.no_proc_interno} onChange={e => setFormData({...formData, no_proc_interno: e.target.value})} placeholder="Ex: PROC-2026-001" style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Nome Completo *</label>
                <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Nome completo" style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>N.º PPP *</label>
                <input type="text" value={formData.no_ppp} onChange={e => setFormData({...formData, no_ppp: e.target.value})} placeholder="Ex: PPP-12345" style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Data Nascimento *</label>
                <input type="date" value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Nacionalidade *</label>
                <input type="text" value={formData.nacionalidade} onChange={e => setFormData({...formData, nacionalidade: e.target.value})} placeholder="Ex: Portuguesa" style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>

              {/* 📌 MENU FLUTUANTE PARA TIPO DE DOCUMENTO DE IDENTIFICAÇÃO */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Tipo Doc. Identificação *</label>
                <select 
                  value={formData.doc_identificacao} 
                  onChange={e => setFormData({...formData, doc_identificacao: e.target.value})} 
                  style={{ width: '100%', padding: '6px', boxSizing: 'border-box', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  {OPCOES_DOC_IDENTIFICACAO.map((opcao, i) => (
                    <option key={i} value={opcao}>{opcao}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>N.º Doc. Identificação *</label>
                <input type="text" value={formData.no_doc_identificacao} onChange={e => setFormData({...formData, no_doc_identificacao: e.target.value})} placeholder="Ex: 12345678 9 ZZ0" style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Morada</label>
                <input type="text" value={formData.morada} onChange={e => setFormData({...formData, morada: e.target.value})} placeholder="Rua, localidade e código postal" style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ gridColumn: 'span 3', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', fontWeight: 'bold', color: '#2563eb', marginTop: '10px' }}>2. Informações Fiscais & Gestão</div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>NIF *</label>
                <input type="text" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} placeholder="9 dígitos" style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>NISS *</label>
                <input type="text" value={formData.niss} onChange={e => setFormData({...formData, niss: e.target.value})} placeholder="11 dígitos" style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>SNS *</label>
                <input type="text" value={formData.sns} onChange={e => setFormData({...formData, sns: e.target.value})} placeholder="9 dígitos" style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Gestor de Caso *</label>
                <input type="text" value={formData.gestor} onChange={e => setFormData({...formData, gestor: e.target.value})} placeholder="Nome do técnico responsável" style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Serviço de Gestão *</label>
                <input type="text" value={formData.servico} onChange={e => setFormData({...formData, servico: e.target.value})} placeholder="Ex: Serviço Social" style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Estado do Processo *</label>
                <select value={formData.estado_processo} onChange={e => setFormData({...formData, estado_processo: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 3', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', fontWeight: 'bold', color: '#2563eb', marginTop: '10px' }}>3. Histórico e Acolhimento Atual</div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Acolhimento Anterior?</label>
                <select value={formData.acolhimento_anterior} onChange={e => setFormData({...formData, acolhimento_anterior: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Entrada AF Anterior</label>
                <input type="date" value={formData.data_entrada_1a_af} onChange={e => setFormData({...formData, data_entrada_1a_af: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Saída AF Anterior</label>
                <input type="date" value={formData.data_saida_1a_af} onChange={e => setFormData({...formData, data_saida_1a_af: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Entrada AF Atual</label>
                <input type="date" value={formData.data_entrada_af_atual} onChange={e => setFormData({...formData, data_entrada_af_atual: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Saída AF Atual</label>
                <input type="date" value={formData.data_saida_af_atual} onChange={e => setFormData({...formData, data_saida_af_atual: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>

              {/* 📌 TITULAR DE ACOLHIMENTO OBRIGATÓRIO */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Titular de Acolhimento *</label>
                <select value={formData.familia_id} onChange={e => setFormData({...formData, familia_id: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  <option value="">Nenhum / Não Atribuído</option>
                  {listaFamilias.map(f => <option key={f.id} value={f.id}>{f.titular_nome} ({f.no_certificacao})</option>)}
                </select>
              </div>

              <div style={{ gridColumn: 'span 3', marginTop: '10px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Transição para:</label>
                <input type="text" value={formData.transicao_para} onChange={e => setFormData({...formData, transicao_para: e.target.value})} placeholder="Ex: Adoção, Maioridade, Autonomia" style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Observações</label>
                <textarea value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} style={{ width: '100%', padding: '6px', height: '60px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalFormAberto(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🏠 MODAL FICHA FAMÍLIA & AGREGADO */}
      {familiaSelecionada && (() => {
        const estadoCert = verificarCaducidadeCertificado(familiaSelecionada.validade_certificacao);
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
              <button onClick={() => setFamiliaSelecionada(null)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>🏠 Ficha do Titular e Agregado</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={`${API_BASE_URL}/storage/documentos/titular_${familiaSelecionada.id}`} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', background: '#475569', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}>
                    📁 Pasta Documentos Titular
                  </a>

                  {isAdmin && !editandoTitular && (
                    <button onClick={() => setEditandoTitular(true)} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                      ✏️ Editar Dados do Titular
                    </button>
                  )}
                </div>
              </div>

              {/* DADOS DO TITULAR */}
              {editandoTitular ? (
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>N.º Certificação (FA-nnn-nnn ou FA-nnn-nnnR)</label>
                    <input type="text" placeholder="Ex: FA-123-456 ou FA-123-456R" value={formFamilia.no_certificacao || ''} onChange={e => setFormFamilia({...formFamilia, no_certificacao: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>Validade do Certificado</label>
                    <input type="date" value={formFamilia.validade_certificacao || ''} onChange={e => setFormFamilia({...formFamilia, validade_certificacao: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} />
                  </div>
                  <div><label style={{ fontWeight: 'bold' }}>Nome Titular *</label><input type="text" value={formFamilia.titular_nome || ''} onChange={e => setFormFamilia({...formFamilia, titular_nome: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontWeight: 'bold' }}>Contacto</label><input type="text" value={formFamilia.contacto || ''} onChange={e => setFormFamilia({...formFamilia, contacto: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontWeight: 'bold' }}>Email</label><input type="email" value={formFamilia.email || ''} onChange={e => setFormFamilia({...formFamilia, email: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontWeight: 'bold' }}>Data Revisão</label><input type="date" value={formFamilia.data_revisao || ''} onChange={e => setFormFamilia({...formFamilia, data_revisao: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={{ fontWeight: 'bold' }}>Morada</label><input type="text" value={formFamilia.morada || ''} onChange={e => setFormFamilia({...formFamilia, morada: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontWeight: 'bold' }}>NIF</label><input type="text" value={formFamilia.nif || ''} onChange={e => setFormFamilia({...formFamilia, nif: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontWeight: 'bold' }}>NISS</label><input type="text" value={formFamilia.niss || ''} onChange={e => setFormFamilia({...formFamilia, niss: e.target.value})} style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }} /></div>

                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    <button onClick={() => setEditandoTitular(false)} style={{ padding: '6px 12px' }}>Cancelar</button>
                    <button onClick={handleGuardarTitular} style={{ padding: '6px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Guardar Titular</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <div><strong>Titular:</strong> {familiaSelecionada.titular_nome}</div>
                  <div>
                    <strong>N.º Certificação:</strong> {familiaSelecionada.no_certificacao}
                    {familiaSelecionada.validade_certificacao && (
                      <div style={{ marginTop: '4px', fontSize: '12px' }}>
                        Validade: <strong>{familiaSelecionada.validade_certificacao}</strong>
                        {estadoCert.expiraEmBreve && (
                          <span style={{ color: '#dc2626', fontWeight: 'bold', marginLeft: '6px', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                            ⚠️ EXPIRA EM BREVE ({estadoCert.diasRestantes} dias)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div><strong>Contacto:</strong> {familiaSelecionada.contacto || 'N/D'}</div>
                  <div><strong>Email:</strong> {familiaSelecionada.email || 'N/D'}</div>
                  <div style={{ gridColumn: 'span 2' }}><strong>Morada:</strong> {familiaSelecionada.morada || 'N/D'}</div>
                  <div><strong>NIF:</strong> {familiaSelecionada.nif || 'N/D'} | <strong>NISS:</strong> {familiaSelecionada.niss || 'N/D'}</div>
                  <div><strong>Data Revisão:</strong> {familiaSelecionada.data_revisao || 'N/D'}</div>
                </div>
              )}

              {/* MEMBROS DO AGREGADO */}
              <h3 style={{ color: '#0f172a', marginTop: '24px', fontSize: '16px' }}>👨‍👩‍👧‍👦 Membros do Agregado Familiar</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '8px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ padding: '8px' }}>Nome</th>
                    <th style={{ padding: '8px' }}>Relação</th>
                    <th style={{ padding: '8px' }}>Data Nasc.</th>
                    <th style={{ padding: '8px' }}>Profissão</th>
                    <th style={{ padding: '8px' }}>Registo Criminal</th>
                    <th style={{ padding: '8px' }}>Documentos</th>
                    {isAdmin && <th style={{ padding: '8px', textAlign: 'center' }}>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {familiaSelecionada.membros_agregado.length === 0 ? (
                    <tr><td colSpan="7" style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>Sem outros membros registados.</td></tr>
                  ) : (
                    familiaSelecionada.membros_agregado.map((m) => {
                      const isEditingThisMembro = membroEmEdicaoId === m.id;
                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {isEditingThisMembro ? (
                            <>
                              <td style={{ padding: '6px' }}><input type="text" value={formMembroEdicao.nome} onChange={e => setFormMembroEdicao({...formMembroEdicao, nome: e.target.value})} style={{ width: '100%' }} /></td>
                              <td style={{ padding: '6px' }}><input type="text" value={formMembroEdicao.relacao} onChange={e => setFormMembroEdicao({...formMembroEdicao, relacao: e.target.value})} style={{ width: '100%' }} /></td>
                              <td style={{ padding: '6px' }}><input type="date" value={formMembroEdicao.data_nascimento} onChange={e => setFormMembroEdicao({...formMembroEdicao, data_nascimento: e.target.value})} style={{ width: '100%' }} /></td>
                              <td style={{ padding: '6px' }}><input type="text" value={formMembroEdicao.profissao} onChange={e => setFormMembroEdicao({...formMembroEdicao, profissao: e.target.value})} style={{ width: '100%' }} /></td>
                              <td style={{ padding: '6px' }}><input type="date" value={formMembroEdicao.validade_registo_criminal} onChange={e => setFormMembroEdicao({...formMembroEdicao, validade_registo_criminal: e.target.value})} style={{ width: '100%' }} /></td>
                              <td style={{ padding: '6px' }}>—</td>
                              <td style={{ padding: '6px', textAlign: 'center' }}>
                                <button onClick={() => handleGuardarMembro(m.id)} style={{ padding: '4px 8px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }}>💾</button>
                                <button onClick={() => setMembroEmEdicaoId(null)} style={{ padding: '4px 8px' }}>✕</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '8px', fontWeight: '500' }}>{m.nome}</td>
                              <td style={{ padding: '8px' }}>{m.relacao}</td>
                              <td style={{ padding: '8px' }}>{m.data_nascimento}</td>
                              <td style={{ padding: '8px' }}>{m.profissao}</td>
                              <td style={{ padding: '8px' }}>{m.validade_registo_criminal}</td>
                              <td style={{ padding: '8px' }}>
                                <a href={`${API_BASE_URL}/storage/documentos/membro_${m.id}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>📂 Abrir Pasta</a>
                              </td>
                              {isAdmin && (
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                  <button onClick={() => IniciarEdicaoMembro(m)} title="Editar Membro" style={{ padding: '2px 6px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }}>✏️</button>
                                  <button onClick={() => handleRemoverMembro(m.id)} title="Remover Membro" style={{ padding: '2px 6px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* FORMULÁRIO NOVO MEMBRO */}
              {isAdmin && (
                <form onSubmit={handleAdicionarMembro} style={{ marginTop: '16px', backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#1e40af' }}>➕ Adicionar Novo Membro ao Agregado</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <input type="text" placeholder="Nome *" required value={novoMembro.nome} onChange={e => setNovoMembro({...novoMembro, nome: e.target.value})} style={{ padding: '6px' }} />
                    <input type="text" placeholder="Relação (ex: Cônjuge)" value={novoMembro.relacao} onChange={e => setNovoMembro({...novoMembro, relacao: e.target.value})} style={{ padding: '6px' }} />
                    <input type="date" placeholder="Data Nascimento" value={novoMembro.data_nascimento} onChange={e => setNovoMembro({...novoMembro, data_nascimento: e.target.value})} style={{ padding: '6px' }} />
                    <input type="text" placeholder="Profissão" value={novoMembro.profissao} onChange={e => setNovoMembro({...novoMembro, profissao: e.target.value})} style={{ padding: '6px' }} />
                    <input type="date" placeholder="Validade Registo Criminal" value={novoMembro.validade_registo_criminal} onChange={e => setNovoMembro({...novoMembro, validade_registo_criminal: e.target.value})} style={{ padding: '6px' }} />
                    <button type="submit" style={{ padding: '6px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Adicionar</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}