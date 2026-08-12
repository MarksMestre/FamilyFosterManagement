import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';

const API_BASE_URL = `http://${window.location.hostname}:8000`;

export default function App() {
  const [user, setUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [criancas, setCriancas] = useState([]);
  const [familiaSelecionada, setFamiliaSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);

  // ESTADOS DE MODAL DE FORMULÁRIO (Criar / Editar)
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [criancaEmEdicao, setCriancaEmEdicao] = useState(null);
  const [formData, setFormData] = useState({
    no_proc_interno: '',
    nome: '',
    no_ppp: '',
    genero: 'Masculino',
    data_nascimento: '',
    nacionalidade: 'Portuguesa',
    nif: '',
    niss: '',
    sns: '',
    doc_identificacao: 'Cartão de Cidadão',
    no_doc_identificacao: '',
    gestor: '',
    servico: 'Serviço Social',
    estado_processo: 'Ativo',
    data_entrada_af_atual: '',
    data_saida_af_atual: ''
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      carregarCriancas();
    }
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    axios.post(`${API_BASE_URL}/api/login`, {
      username: usernameInput,
      password: passwordInput
    })
    .then(res => {
      const userData = res.data;
      setUser(userData);
      localStorage.setItem('user_session', JSON.stringify(userData));
    })
    .catch(() => {
      setLoginError('Utilizador ou palavra-passe incorretos.');
    });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user_session');
  };

  const carregarCriancas = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/criancas`)
      .then(res => {
        setCriancas(res.data);
        setLoading(false);
      })
      .catch(err => console.error("Erro ao carregar crianças:", err));
  };

  const abrirModalFamilia = (familiaId) => {
    if (!familiaId) return;
    axios.get(`${API_BASE_URL}/api/familias/${familiaId}`)
      .then(res => setFamiliaSelecionada(res.data))
      .catch(err => console.error("Erro ao carregar família:", err));
  };

  // --- AÇÕES DO ADMIN (CRIAR, EDITAR, ELIMINAR) ---
  const abrirModalCriar = () => {
    setCriancaEmEdicao(null);
    setFormData({
      no_proc_interno: '',
      nome: '',
      no_ppp: '',
      genero: 'Masculino',
      data_nascimento: '',
      nacionalidade: 'Portuguesa',
      nif: '',
      niss: '',
      sns: '',
      doc_identificacao: 'Cartão de Cidadão',
      no_doc_identificacao: '',
      gestor: '',
      servico: 'Serviço Social',
      estado_processo: 'Ativo',
      data_entrada_af_atual: '',
      data_saida_af_atual: ''
    });
    setModalFormAberto(true);
  };

  const abrirModalEditar = (c) => {
    setCriancaEmEdicao(c.id);
    setFormData({
      no_proc_interno: c.no_proc_interno !== 'N/A' ? c.no_proc_interno : '',
      nome: c.nome,
      no_ppp: c.no_ppp !== 'N/D' ? c.no_ppp : '',
      genero: c.genero !== 'N/D' ? c.genero : 'Masculino',
      data_nascimento: c.data_nascimento || '',
      nacionalidade: c.nacionalidade || 'Portuguesa',
      nif: c.nif !== 'N/D' ? c.nif : '',
      niss: c.niss !== 'N/D' ? c.niss : '',
      sns: c.sns !== 'N/D' ? c.sns : '',
      doc_identificacao: c.doc_identificacao || 'Cartão de Cidadão',
      no_doc_identificacao: c.no_doc_identificacao !== 'N/D' ? c.no_doc_identificacao : '',
      gestor: c.gestor !== 'Não atribuído' ? c.gestor : '',
      servico: c.servico || 'Serviço Social',
      estado_processo: c.estado_processo || 'Ativo',
      data_entrada_af_atual: c.data_entrada_af_atual !== 'N/D' ? c.data_entrada_af_atual : '',
      data_saida_af_atual: c.data_saida_af_atual || ''
    });
    setModalFormAberto(true);
  };

  const handleEliminar = (id, nome) => {
    if (window.confirm(`Tem a certeza que deseja eliminar o registo de "${nome}"?`)) {
      axios.delete(`${API_BASE_URL}/api/criancas/${id}`)
        .then(() => carregarCriancas())
        .catch(err => alert("Erro ao eliminar registo: " + err.message));
    }
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (criancaEmEdicao) {
      // Atualizar
      axios.put(`${API_BASE_URL}/api/criancas/${criancaEmEdicao}`, formData)
        .then(() => {
          setModalFormAberto(false);
          carregarCriancas();
        })
        .catch(err => alert("Erro ao atualizar: " + err.message));
    } else {
      // Criar Novo
      axios.post(`${API_BASE_URL}/api/criancas`, formData)
        .then(() => {
          setModalFormAberto(false);
          carregarCriancas();
        })
        .catch(err => alert("Erro ao criar: " + err.message));
    }
  };

  // 🔒 ECRÃ DE LOGIN
  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '380px', border: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '20px', color: '#0f172a', margin: 0 }}>🔒 Acesso Restrito</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>Gestão de Acolhimento Familiar</p>
          </div>
          {loginError && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center', fontWeight: '500' }}>
              ⚠️ {loginError}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Utilizador</label>
              <input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="Introduza o utilizador" required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Palavra-passe</label>
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Entrar no Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 📋 ECRÃ PRINCIPAL
  const isAdmin = user.role === 'admin';

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      <header style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '24px' }}>📋 Sistema de Gestão de Acolhimento Familiar</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', margin: 0 }}>
            Sessão iniciada como: <strong style={{ color: '#0f172a' }}>{user.nome}</strong> ({user.role.toUpperCase()})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Botão de Adicionar Registo (Apenas Admin) */}
          {isAdmin && (
            <button onClick={abrirModalCriar} style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              ➕ Nova Criança
            </button>
          )}

          <button onClick={handleLogout} style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
            🚪 Sair da Conta
          </button>
        </div>
      </header>

      <main>
        <div className="table-container">
          <table className="sticky-table">
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', textTransform: 'uppercase', fontSize: '11px', color: '#475569', letterSpacing: '0.5px' }}>
                <th className="col-sticky-1" style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>N.º Proc.</th>
                <th className="col-sticky-2" style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>Nome Criança</th>
                <th style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>N.º PPP</th>
                <th style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>Data Nasc. (Idade)</th>
                <th style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>Nacionalidade</th>
                <th style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>Doc. Identificação</th>
                <th style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>Infos Fiscais (NIF/NISS/SNS)</th>
                <th style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>Gestor & Serviço</th>
                <th style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>Acolhimento Anterior</th>
                <th style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>Acolhimento Atual</th>
                <th style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>Valor</th>
                <th style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>Estado</th>
                <th style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0' }}>Titular de Acolhimento</th>
                <th style={{ padding: '12px 14px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="14" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>A carregar dados do sistema...</td>
                </tr>
              ) : criancas.map((c) => {
                const isInativo = c.estado_processo === 'Inativo';
                return (
                  <tr key={c.id} style={{ opacity: isInativo ? 0.8 : 1 }}>
                    <td className="col-sticky-1" style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', color: '#2563eb' }}>
                      {c.no_proc_interno}
                    </td>
                    <td className="col-sticky-2" style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: '600', color: '#0f172a' }}>
                      {c.nome}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', color: '#475569' }}>{c.no_ppp}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      {c.data_nascimento} <span style={{ color: '#64748b' }}>({c.idade} anos)</span>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>{c.nacionalidade}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: '500' }}>{c.doc_identificacao}</span>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>N.º {c.no_doc_identificacao}</div>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '11px', lineHeight: '1.4' }}>
                      <div><strong style={{ color: '#475569' }}>NIF:</strong> {c.nif}</div>
                      <div><strong style={{ color: '#475569' }}>NISS:</strong> {c.niss}</div>
                      <div><strong style={{ color: '#475569' }}>SNS:</strong> {c.sns}</div>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{c.gestor}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{c.servico}</div>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      {c.acolhimento_anterior === "Sim" ? (
                        <span style={{ color: '#d97706', fontWeight: '500' }}>
                          Ent: {c.data_entrada_1a_af} <br/> Saída: {c.data_saida_1a_af}
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>Sem histórico</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <div><strong style={{ color: '#16a34a' }}>Entrada:</strong> {c.data_entrada_af_atual}</div>
                      {c.data_saida_af_atual ? (
                        <div><strong style={{ color: '#dc2626' }}>Saída:</strong> {c.data_saida_af_atual}</div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#16a34a', fontStyle: 'italic' }}>Em curso</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', color: c.valor === 50 ? '#0284c7' : '#059669' }}>
                      {c.valor}.00 €
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ backgroundColor: c.estado_processo === 'Ativo' ? '#dcfce7' : '#fee2e2', color: c.estado_processo === 'Ativo' ? '#15803d' : '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                        ● {c.estado_processo.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      {c.titular_acolhimento}
                      {c.no_certificacao !== 'N/D' && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{c.no_certificacao}</div>}
                    </td>

                    {/* COLUNA DE AÇÕES (EDITAR / ELIMINAR / VER FAMÍLIA) */}
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {c.familia_id && (
                          <button onClick={() => abrirModalFamilia(c.familia_id)} title="Ver Família" style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
                            👁️
                          </button>
                        )}
                        
                        {/* Ações restritas ao Admin */}
                        {isAdmin && (
                          <>
                            <button onClick={() => abrirModalEditar(c)} title="Editar Criança" style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
                              ✏️
                            </button>
                            <button onClick={() => handleEliminar(c.id, c.nome)} title="Eliminar Criança" style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
                              🗑️
                            </button>
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

      {/* 📝 MODAL DE CRIAR / EDITAR CRIANÇA */}
      {modalFormAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setModalFormAberto(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            <h2 style={{ marginTop: 0, color: '#0f172a', fontSize: '18px' }}>
              {criancaEmEdicao ? '✏️ Editar Processo da Criança' : '➕ Registar Nova Criança'}
            </h2>

            <form onSubmit={handleSubmitForm} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>N.º Processo Interno *</label>
                <input type="text" required value={formData.no_proc_interno} onChange={e => setFormData({...formData, no_proc_interno: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Nome Completo *</label>
                <input type="text" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>N.º PPP</label>
                <input type="text" value={formData.no_ppp} onChange={e => setFormData({...formData, no_ppp: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Data de Nascimento</label>
                <input type="date" value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>NIF</label>
                <input type="text" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>NISS</label>
                <input type="text" value={formData.niss} onChange={e => setFormData({...formData, niss: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>SNS</label>
                <input type="text" value={formData.sns} onChange={e => setFormData({...formData, sns: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Gestor de Caso</label>
                <input type="text" value={formData.gestor} onChange={e => setFormData({...formData, gestor: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Estado do Processo</label>
                <select value={formData.estado_processo} onChange={e => setFormData({...formData, estado_processo: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Data Entrada Acolhimento</label>
                <input type="date" value={formData.data_entrada_af_atual} onChange={e => setFormData({...formData, data_entrada_af_atual: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '12px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModalFormAberto(false)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#0f172a', color: '#ffffff', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  {criancaEmEdicao ? 'Guardar Alterações' : 'Criar Registo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal da Família */}
      {familiaSelecionada && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setFamiliaSelecionada(null)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            <h2 style={{ marginTop: 0, color: '#0f172a', fontSize: '20px' }}>🏠 Titular de Acolhimento</h2>
            <p style={{ color: '#64748b', fontSize: '12px', marginTop: '-8px' }}>N.º Certificação: <strong>{familiaSelecionada.no_certificacao}</strong></p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div><strong>Nome:</strong> {familiaSelecionada.titular_nome}</div>
              <div><strong>Contacto:</strong> {familiaSelecionada.contacto || 'N/D'}</div>
              <div><strong>Email:</strong> {familiaSelecionada.email || 'N/D'}</div>
              <div><strong>Data Revisão:</strong> {familiaSelecionada.data_revisao}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Morada:</strong> {familiaSelecionada.morada || 'N/D'}</div>
            </div>
            <h3 style={{ color: '#0f172a', marginTop: '24px', fontSize: '16px' }}>👨‍👩‍👧‍👦 Agregado Familiar</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', marginTop: '8px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                  <th style={{ padding: '8px' }}>Nome</th>
                  <th style={{ padding: '8px' }}>Relação</th>
                  <th style={{ padding: '8px' }}>Data Nasc.</th>
                  <th style={{ padding: '8px' }}>Profissão</th>
                </tr>
              </thead>
              <tbody>
                {familiaSelecionada.membros_agregado.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontWeight: '500' }}>{m.nome}</td>
                    <td style={{ padding: '8px' }}>{m.relacao}</td>
                    <td style={{ padding: '8px' }}>{m.data_nascimento}</td>
                    <td style={{ padding: '8px' }}>{m.profissao || 'N/D'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}