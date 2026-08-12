from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, date

Base = declarative_base()

class Familia(Base):
    __tablename__ = "familias"

    id = Column(Integer, primary_key=True, index=True)
    no_certificacao = Column(String(50), unique=True, nullable=False, index=True) # Ex: FA-NNN-NN
    titular_nome = Column(String(255), nullable=False)
    data_revisao = Column(Date, nullable=True)
    morada = Column(Text, nullable=True)
    email = Column(String(100), nullable=True)
    contacto = Column(String(30), nullable=True)
    no_elementos_agregado = Column(Integer, default=1)
    
    # Identificadores apenas para o Titular
    niss = Column(String(20), nullable=True)
    nif = Column(String(20), nullable=True)
    sns = Column(String(20), nullable=True)
    
    registo_criminal = Column(String(255), nullable=True) # Link/Nome do ficheiro
    validade_registo_criminal = Column(Date, nullable=True)
    atestado_saude = Column(String(255), nullable=True) # Link/Nome do ficheiro
    no_criancas_acolhidas = Column(Integer, default=0)

    # Relações
    criancas = relationship("Crianca", back_populates="familia")
    membros_agregado = relationship("MembroAgregado", back_populates="familia", cascade="all, delete-orphan")
    documentos = relationship("Documento", back_populates="familia")


class MembroAgregado(Base):
    __tablename__ = "membros_agregado"

    id = Column(Integer, primary_key=True, index=True)
    familia_id = Column(Integer, ForeignKey("familias.id"), nullable=False)
    nome = Column(String(255), nullable=False)
    data_nascimento = Column(Date, nullable=True)
    contacto = Column(String(30), nullable=True)
    relacao = Column(String(50), nullable=True) # Ex: Cônjuge, Filho, etc.
    profissao = Column(String(100), nullable=True)
    
    registo_criminal = Column(String(255), nullable=True)
    validade_registo_criminal = Column(Date, nullable=True)
    atestado_saude = Column(String(255), nullable=True)

    familia = relationship("Familia", back_populates="membros_agregado")


class Processo(Base):
    __tablename__ = "processos"

    id = Column(Integer, primary_key=True, index=True)
    no_proc_interno = Column(String(50), unique=True, nullable=False, index=True) # Ex: NNN/YYYY
    observacoes = Column(Text, nullable=True)
    transicao_para = Column(String(255), nullable=True)

    criancas = relationship("Crianca", back_populates="processo")
    documentos = relationship("Documento", back_populates="processo")


class Crianca(Base):
    __tablename__ = "criancas"

    id = Column(Integer, primary_key=True, index=True)
    processo_id = Column(Integer, ForeignKey("processos.id"), nullable=False)
    familia_id = Column(Integer, ForeignKey("familias.id"), nullable=True)
    
    nome = Column(String(255), nullable=False)
    no_ppp = Column(String(50), nullable=True) # Ex: NNNN/NN.NTNLLL
    genero = Column(String(20), nullable=True)
    data_nascimento = Column(Date, nullable=True)
    nacionalidade = Column(String(50), default="Portuguesa")
    morada = Column(Text, nullable=True)
    
    doc_identificacao = Column(String(50), nullable=True) # Ex: Cartão de Cidadão, Passaporte
    no_doc_identificacao = Column(String(50), nullable=True)
    niss = Column(String(20), nullable=True)
    nif = Column(String(20), nullable=True)
    sns = Column(String(20), nullable=True)
    
    estado_processo = Column(String(20), default="Ativo") # "Ativo" ou "Inativo"
    acolhimento_anterior = Column(Text, nullable=True)
    modalidade = Column(String(100), nullable=True)
    
    data_entrada_1a_af = Column(Date, nullable=True)
    data_saida_1a_af = Column(Date, nullable=True)
    data_entrada_af_atual = Column(Date, nullable=True)
    data_saida_af_atual = Column(Date, nullable=True)
    
    gestor = Column(String(100), nullable=True)
    servico = Column(String(100), nullable=True)
    
    # Relações
    processo = relationship("Processo", back_populates="criancas")
    familia = relationship("Familia", back_populates="criancas")
    documentos = relationship("Documento", back_populates="crianca")

    @property
    def idade(self) -> int:
        """Calcula a idade dinâmica com base na data de nascimento."""
        if not self.data_nascimento:
            return 0
        today = date.today()
        return today.year - self.data_nascimento.year - (
            (today.month, today.day) < (self.data_nascimento.month, self.data_nascimento.day)
        )

    @property
    def valor_calculado(self) -> float:
        """Regra de negócio: < 6 anos = 50.0€ | >= 6 anos = 100.0€"""
        return 50.00 if self.idade < 6 else 100.00


class Documento(Base):
    __tablename__ = "documentos"

    id = Column(Integer, primary_key=True, index=True)
    processo_id = Column(Integer, ForeignKey("processos.id"), nullable=True)
    crianca_id = Column(Integer, ForeignKey("criancas.id"), nullable=True)
    familia_id = Column(Integer, ForeignKey("familias.id"), nullable=True)
    
    nome_original = Column(String(255), nullable=False)
    tipo_documento = Column(String(100), nullable=True) # Ex: Atestado de Saúde, Registo Criminal, Cartão Cidadão
    caminho_disco = Column(Text, nullable=False)
    url_download = Column(Text, nullable=True) # Link direto para download no browser
    texto_ocr = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    processo = relationship("Processo", back_populates="documentos")
    crianca = relationship("Crianca", back_populates="documentos")
    familia = relationship("Familia", back_populates="documentos")