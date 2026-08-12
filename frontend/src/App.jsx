import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function App() {
  const [criancas, setCriancas] = useState([]);
  const [familiaSelecionada, setFamiliaSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarCriancas();
  }, []);

  const carregarCriancas = () => {
    axios.get('http://localhost:8000/api/criancas')
      .then(res => {
        setCriancas(res.data);
        setLoading(false);
      })
      .catch(err => console.error("Erro ao carregar crianças:", err));
  };

  const abrirModalFamilia = (familiaId) => {
    if (!familiaId) return;
    axios.get(`http://localhost:8000/api/familias/${familiaId}`)
      .then(res => setFamiliaSelecionada(res.data))
      .catch(err => console.error("Erro ao carregar família:", err));
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '24px' }}>📋 Sistema de Gestão de Acolhimento Familiar</h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Tabela Detalhada de Processos, Crianças e Titulares</p>
      </header>

      <main>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', textTransform: 'uppercase', fontSize: '11px', color: '#475569', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 14px' }}>N.º Proc.</th>
                <th style={{ padding: '12px 14px' }}>Nome Criança</th>
                <th style={{ padding: '12px 14px' }}>N.º PPP</th>
                <th style={{ padding: '12px 14px' }}>Data Nasc. (Idade)</th>
                <th style={{ padding: '12px 14px' }}>Nacionalidade</th>
                <th style={{ padding: '12px 14px' }}>Doc. Identificação</th>
                <th style={{ padding: '12px 14px' }}>Infos Fiscais (NIF/NISS/SNS)</th>
                <th style={{ padding: '12px 14px' }}>Gestor & Serviço</th>
                <th style={{ padding: '12px 14px' }}>Acolhimento Anterior</th>
                <th style={{ padding: '12px 14px' }}>Acolhimento Atual</th>
                <th style={{ padding: '12px 14px' }}>Valor</th>
                <th style={{ padding: '12px 14px' }}>Estado</th>
                <th style={{ padding: '12px 14px' }}>Titular de Acolhimento</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="14" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>A carregar dados do sistema...</td>
                </tr>
              ) : criancas.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: c.estado_processo === 'Inativo' ? 0.8 : 1 }}>
                  
                  {/* Processo */}
                  <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#2563eb' }}>{c.no_proc_interno}</td>
                  
                  {/* Nome */}
                  <td style={{ padding: '12px 14px', fontWeight: '600', color: '#0f172a' }}>{c.nome}</td>
                  
                  {/* N.º PPP */}
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#475569' }}>{c.no_ppp}</td>
                  
                  {/* Data de Nascimento e Idade */}
                  <td style={{ padding: '12px 14px' }}>
                    {c.data_nascimento} <span style={{ color: '#64748b' }}>({c.idade} anos)</span>
                  </td>
                  
                  {/* Nacionalidade */}
                  <td style={{ padding: '12px 14px' }}>{c.nacionalidade}</td>
                  
                  {/* Documento de Identificação */}
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontWeight: '500' }}>{c.doc_identificacao}</span>
                    <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>N.º {c.no_doc_identificacao}</div>
                  </td>
                  
                  {/* Infos Fiscais da Criança */}
                  <td style={{ padding: '12px 14px', fontSize: '11px', lineHeight: '1.4' }}>
                    <div><strong style={{ color: '#475569' }}>NIF:</strong> {c.nif}</div>
                    <div><strong style={{ color: '#475569' }}>NISS:</strong> {c.niss}</div>
                    <div><strong style={{ color: '#475569' }}>SNS:</strong> {c.sns}</div>
                  </td>

                  {/* Gestor & Serviço de Gestão */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{c.gestor}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{c.servico}</div>
                  </td>

                  {/* Acolhimento Anterior */}
                  <td style={{ padding: '12px 14px' }}>
                    {c.acolhimento_anterior === "Sim" ? (
                      <span style={{ color: '#d97706', fontWeight: '500' }}>
                        Ent: {c.data_entrada_1a_af} <br/> Saída: {c.data_saida_1a_af}
                      </span>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>Sem histórico</span>
                    )}
                  </td>

                  {/* Acolhimento Atual (Entrada e Saída) */}
                  <td style={{ padding: '12px 14px' }}>
                    <div><strong style={{ color: '#16a34a' }}>Entrada:</strong> {c.data_entrada_af_atual}</div>
                    {/* Se estiver Inativo apresenta Data de Saída, se estiver Ativo fica em branco */}
                    {c.data_saida_af_atual ? (
                      <div><strong style={{ color: '#dc2626' }}>Saída:</strong> {c.data_saida_af_atual}</div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#16a34a', italic: 'true' }}>Em curso</div>
                    )}
                  </td>

                  {/* Valor Calculado (<6 anos = 50€ | >=6 anos = 100€) */}
                  <td style={{ padding: '12px 14px', fontWeight: 'bold', color: c.valor === 50 ? '#0284c7' : '#059669' }}>
                    {c.valor}.00 €
                  </td>

                  {/* Estado bem visível */}
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ 
                      backgroundColor: c.estado_processo === 'Ativo' ? '#dcfce7' : '#fee2e2', 
                      color: c.estado_processo === 'Ativo' ? '#15803d' : '#b91c1c', 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: '800' 
                    }}>
                      ● {c.estado_processo.toUpperCase()}
                    </span>
                  </td>

                  {/* Titular */}
                  <td style={{ padding: '12px 14px' }}>
                    {c.titular_acolhimento}
                    {c.no_certificacao !== 'N/D' && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{c.no_certificacao}</div>}
                  </td>

                  {/* Ação Modal */}
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    {c.familia_id ? (
                      <button
                        onClick={() => abrirModalFamilia(c.familia_id)}
                        style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}
                      >
                        👁️ Ver Família
                      </button>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal da Família */}
      {familiaSelecionada && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', itemsCenter: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <button 
              onClick={() => setFamiliaSelecionada(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>

            <h2 style={{ marginTop: 0, color: '#0f172a', fontSize: '20px' }}>🏠 Titular de Acolhimento</h2>
            <p style={{ color: '#64748b', fontSize: '12px', marginTop: '-8px' }}>N.º Certificação: <strong>{familiaSelecionada.no_certificacao}</strong></p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div><strong>Nome:</strong> {familiaSelecionada.titular_nome}</div>
              <div><strong>Contacto:</strong> {familiaSelecionada.contacto || 'N/D'}</div>
              <div><strong>Email:</strong> {familiaSelecionada.email || 'N/D'}</div>
              <div><strong>Data Revisão:</strong> {familiaSelecionada.data_revisao}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Morada:</strong> {familiaSelecionada.morada || 'N/D'}</div>
            </div>

            <h4 style={{ color: '#334155', marginBottom: '8px', marginTop: '16px' }}>Identificação Exclusiva do Titular</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '12px', textAlign: 'center' }}>
              <div><span style={{ color: '#1e40af', display: 'block' }}>NIF</span><strong>{familiaSelecionada.nif || 'N/D'}</strong></div>
              <div><span style={{ color: '#1e40af', display: 'block' }}>NISS</span><strong>{familiaSelecionada.niss || 'N/D'}</strong></div>
              <div><span style={{ color: '#1e40af', display: 'block' }}>SNS</span><strong>{familiaSelecionada.sns || 'N/D'}</strong></div>
            </div>

            <h3 style={{ color: '#0f172a', marginTop: '24px', fontSize: '16px' }}>👨‍👩‍👧‍👦 Agregado Familiar</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', marginTop: '8px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                  <th style={{ padding: '8px' }}>Nome</th>
                  <th style={{ padding: '8px' }}>Relação</th>
                  <th style={{ padding: '8px' }}>Data Nasc.</th>
                  <th style={{ padding: '8px' }}>Profissão</th>
                  <th style={{ padding: '8px' }}>Registo Criminal</th>
                </tr>
              </thead>
              <tbody>
                {familiaSelecionada.membros_agregado.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>Sem outros membros registados.</td></tr>
                ) : (
                  familiaSelecionada.membros_agregado.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontWeight: '500' }}>{m.nome}</td>
                      <td style={{ padding: '8px' }}>{m.relacao}</td>
                      <td style={{ padding: '8px' }}>{m.data_nascimento}</td>
                      <td style={{ padding: '8px' }}>{m.profissao || 'N/D'}</td>
                      <td style={{ padding: '8px', color: '#64748b' }}>
                        {m.validade_registo_criminal !== 'N/D' ? `Válido até ${m.validade_registo_criminal}` : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

          </div>
        </div>
      )}
    </div>
  );
}