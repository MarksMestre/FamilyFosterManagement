import os
import json
from datetime import date, datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status 
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, Crianca, Familia, MembroAgregado, Processo, Documento

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:adminpassword@postgres:5432/acolhimento_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Sistema de Acolhimento")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_PATH = os.getenv("STORAGE_PATH", "./storage")
os.makedirs(STORAGE_PATH, exist_ok=True)
app.mount("/storage", StaticFiles(directory=STORAGE_PATH), name="storage")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def parse_date(data_str: Optional[str]):
    if not data_str or str(data_str).strip() in ["", "None", "N/D"]:
        return None
    try:
        return date.fromisoformat(str(data_str).split("T")[0])
    except ValueError:
        return None

# --- SCHEMAS PYDANTIC ---
class LoginRequest(BaseModel):
    username: str
    password: str

class CriancaSchema(BaseModel):
    nome: str
    no_proc_interno: str
    no_ppp: str
    genero: str 
    data_nascimento: str 
    nacionalidade: str 
    morada: str
    nif: str 
    niss: str
    sns: str
    doc_identificacao: str
    no_doc_identificacao: str
    gestor: str
    servico: str
    estado_processo: Optional[str] = "Ativo"
    acolhimento_anterior: str
    data_entrada_1a_af: str
    data_saida_1a_af: str
    data_entrada_af_atual: str
    data_saida_af_atual: str
    observacoes: str
    transicao_para: str
    familia_id: int

class FamiliaSchema(BaseModel):
    no_certificacao: str
    validade_certificacao: Optional[str] = None
    titular_nome: str
    contacto: Optional[str] = None
    email: Optional[str] = None
    morada: Optional[str] = None
    data_revisao: Optional[str] = None
    nif: Optional[str] = None
    niss: Optional[str] = None
    sns: Optional[str] = None

class MembroAgregadoSchema(BaseModel):
    nome: str
    relacao: Optional[str] = None
    data_nascimento: Optional[str] = None
    profissao: Optional[str] = None
    validade_registo_criminal: Optional[str] = None

# --- AUTENTICAÇÃO ---
def carregar_utilizadores():
    caminho = os.path.join(os.path.dirname(__file__), "users.json")
    if os.path.exists(caminho):
        with open(caminho, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.post("/api/login")
def login(dados: LoginRequest):
    utilizadores = carregar_utilizadores()
    user = next((u for u in utilizadores if u["username"] == dados.username and u["password"] == dados.password), None)
    if not user:
        raise HTTPException(status_code=401, detail="Utilizador ou palavra-passe incorretos")
    return {"status": "success", "username": user["username"], "nome": user["nome"], "role": user["role"]}

@app.get("/")
def home():
    return {"status": "ok", "message": "API Backend no ar!"}

# --- ENDPOINTS DAS CRIANÇAS ---
@app.get("/api/criancas")
def listar_criancas(db: Session = Depends(get_db)):
    criancas = db.query(Crianca).all()
    resultado = []
    for c in criancas:
        docs = [{"id": d.id, "nome": d.nome_original, "tipo": d.tipo_documento, "url": f"http://localhost:8000/storage/{d.nome_original}"} for d in c.documentos]
        resultado.append({
            "id": c.id,
            "no_proc_interno": c.processo.no_proc_interno if c.processo else "N/A",
            "nome": c.nome,
            "no_ppp": c.no_ppp or "N/D",
            "genero": c.genero or "N/D",
            "data_nascimento": str(c.data_nascimento) if c.data_nascimento else "",
            "idade": c.idade,
            "nacionalidade": c.nacionalidade or "Portuguesa",
            "morada": getattr(c, 'morada', '') or '',
            "nif": c.nif or "N/D",
            "niss": c.niss or "N/D",
            "sns": c.sns or "N/D",
            "doc_identificacao": c.doc_identificacao or "Cartão de Cidadão",
            "no_doc_identificacao": c.no_doc_identificacao or "N/D",
            "gestor": c.gestor or "Não atribuído",
            "servico": c.servico or "Serviço Social",
            "estado_processo": c.estado_processo or "Ativo",
            "valor": c.valor_calculado,
            "acolhimento_anterior": c.acolhimento_anterior or "Não",
            "data_entrada_1a_af": str(c.data_entrada_1a_af) if c.data_entrada_1a_af else "",
            "data_saida_1a_af": str(c.data_saida_1a_af) if c.data_saida_1a_af else "",
            "data_entrada_af_atual": str(c.data_entrada_af_atual) if c.data_entrada_af_atual else "N/D",
            "data_saida_af_atual": str(c.data_saida_af_atual) if c.data_saida_af_atual else "",
            "observacoes": getattr(c, 'observacoes', '') or '',
            "transicao_para": getattr(c, 'transicao_para', '') or '',
            "titular_acolhimento": c.familia.titular_nome if c.familia else "Não atribuído",
            "no_certificacao": c.familia.no_certificacao if c.familia else "N/D",
            "familia_id": c.familia_id,
            "documentos": docs
        })
    return resultado

@app.post("/api/criancas", status_code=status.HTTP_201_CREATED)
def criar_crianca(dados: CriancaSchema, db: Session = Depends(get_db)):
    novo_processo = Processo(no_proc_interno=dados.no_proc_interno)
    db.add(novo_processo)
    db.commit()
    db.refresh(novo_processo)

    nova_crianca = Crianca(
        processo_id=novo_processo.id,
        nome=dados.nome,
        no_ppp=dados.no_ppp,
        genero=dados.genero,
        data_nascimento=parse_date(dados.data_nascimento),
        nacionalidade=dados.nacionalidade,
        nif=dados.nif,
        niss=dados.niss,
        sns=dados.sns,
        doc_identificacao=dados.doc_identificacao,
        no_doc_identificacao=dados.no_doc_identificacao,
        gestor=dados.gestor,
        servico=dados.servico,
        estado_processo=dados.estado_processo,
        acolhimento_anterior=dados.acolhimento_anterior,
        data_entrada_1a_af=parse_date(dados.data_entrada_1a_af),
        data_saida_1a_af=parse_date(dados.data_saida_1a_af),
        data_entrada_af_atual=parse_date(dados.data_entrada_af_atual),
        data_saida_af_atual=parse_date(dados.data_saida_af_atual),
        familia_id=dados.familia_id
    )
    if hasattr(nova_crianca, 'morada'): nova_crianca.morada = dados.morada
    if hasattr(nova_crianca, 'observacoes'): nova_crianca.observacoes = dados.observacoes
    if hasattr(nova_crianca, 'transicao_para'): nova_crianca.transicao_para = dados.transicao_para

    db.add(nova_crianca)
    db.commit()
    return {"message": "Criança criada com sucesso"}

@app.put("/api/criancas/{crianca_id}")
def atualizar_crianca(crianca_id: int, dados: CriancaSchema, db: Session = Depends(get_db)):
    c = db.query(Crianca).filter(Crianca.id == crianca_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Criança não encontrada")

    if c.processo:
        c.processo.no_proc_interno = dados.no_proc_interno

    c.nome = dados.nome
    c.no_ppp = dados.no_ppp
    c.genero = dados.genero
    c.data_nascimento = parse_date(dados.data_nascimento)
    c.nacionalidade = dados.nacionalidade
    c.nif = dados.nif
    c.niss = dados.niss
    c.sns = dados.sns
    c.doc_identificacao = dados.doc_identificacao
    c.no_doc_identificacao = dados.no_doc_identificacao
    c.gestor = dados.gestor
    c.servico = dados.servico
    c.estado_processo = dados.estado_processo
    c.acolhimento_anterior = dados.acolhimento_anterior
    c.data_entrada_1a_af = parse_date(dados.data_entrada_1a_af)
    c.data_saida_1a_af = parse_date(dados.data_saida_1a_af)
    c.data_entrada_af_atual = parse_date(dados.data_entrada_af_atual)
    c.data_saida_af_atual = parse_date(dados.data_saida_af_atual)
    c.familia_id = dados.familia_id
    
    if hasattr(c, 'morada'): c.morada = dados.morada
    if hasattr(c, 'observacoes'): c.observacoes = dados.observacoes
    if hasattr(c, 'transicao_para'): c.transicao_para = dados.transicao_para

    db.commit()
    return {"message": "Criança atualizada com sucesso"}

@app.delete("/api/criancas/{crianca_id}")
def eliminar_crianca(crianca_id: int, db: Session = Depends(get_db)):
    c = db.query(Crianca).filter(Crianca.id == crianca_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Criança não encontrada")
    if c.processo:
        db.delete(c.processo)
    db.delete(c)
    db.commit()
    return {"message": "Criança eliminada com sucesso"}

# --- ENDPOINTS FAMÍLIA (TITULAR) ---
@app.get("/api/familias")
def listar_familias(db: Session = Depends(get_db)):
    familias = db.query(Familia).all()
    return [{"id": f.id, "no_certificacao": f.no_certificacao, "titular_nome": f.titular_nome} for f in familias]

@app.get("/api/familias/{familia_id}")
def obter_familia(familia_id: int, db: Session = Depends(get_db)):
    fam = db.query(Familia).filter(Familia.id == familia_id).first()
    if not fam:
        raise HTTPException(status_code=404, detail="Família não encontrada")
    
    agregado = [{
        "id": m.id,
        "nome": m.nome,
        "data_nascimento": str(m.data_nascimento) if m.data_nascimento else "",
        "contacto": m.contacto or "",
        "relacao": m.relacao or "",
        "profissao": m.profissao or "",
        "validade_registo_criminal": str(m.validade_registo_criminal) if m.validade_registo_criminal else ""
    } for m in fam.membros_agregado]

    val_cert = getattr(fam, 'validade_certificacao', None)

    return {
        "id": fam.id,
        "no_certificacao": fam.no_certificacao,
        "validade_certificacao": str(val_cert) if val_cert else "",
        "titular_nome": fam.titular_nome,
        "data_revisao": str(fam.data_revisao) if fam.data_revisao else "",
        "contacto": fam.contacto or "",
        "email": fam.email or "",
        "morada": fam.morada or "",
        "nif": fam.nif or "",
        "niss": fam.niss or "",
        "sns": fam.sns or "",
        "membros_agregado": agregado
    }

@app.post("/api/familias", status_code=status.HTTP_201_CREATED)
def criar_familia(dados: FamiliaSchema, db: Session = Depends(get_db)):
    nova_fam = Familia(
        no_certificacao=dados.no_certificacao,
        titular_nome=dados.titular_nome,
        contacto=dados.contacto,
        email=dados.email,
        morada=dados.morada,
        data_revisao=parse_date(dados.data_revisao),
        nif=dados.nif,
        niss=dados.niss,
        sns=dados.sns
    )
    if hasattr(nova_fam, 'validade_certificacao'):
        nova_fam.validade_certificacao = parse_date(dados.validade_certificacao)
    db.add(nova_fam)
    db.commit()
    db.refresh(nova_fam)
    return {"message": "Titular criado com sucesso", "id": nova_fam.id}

@app.put("/api/familias/{familia_id}")
def atualizar_familia(familia_id: int, dados: FamiliaSchema, db: Session = Depends(get_db)):
    fam = db.query(Familia).filter(Familia.id == familia_id).first()
    if not fam:
        raise HTTPException(status_code=404, detail="Família não encontrada")

    fam.no_certificacao = dados.no_certificacao
    fam.titular_nome = dados.titular_nome
    fam.contacto = dados.contacto
    fam.email = dados.email
    fam.morada = dados.morada
    fam.data_revisao = parse_date(dados.data_revisao)
    fam.nif = dados.nif
    fam.niss = dados.niss
    fam.sns = dados.sns
    if hasattr(fam, 'validade_certificacao'):
        fam.validade_certificacao = parse_date(dados.validade_certificacao)

    db.commit()
    return {"message": "Titular atualizado com sucesso"}

# --- ENDPOINTS AGREGADO FAMILIAR (CRUD) ---
@app.post("/api/familias/{familia_id}/membros")
def adicionar_membro_agregado(familia_id: int, dados: MembroAgregadoSchema, db: Session = Depends(get_db)):
    novo_membro = MembroAgregado(
        familia_id=familia_id,
        nome=dados.nome,
        relacao=dados.relacao,
        data_nascimento=parse_date(dados.data_nascimento),
        profissao=dados.profissao,
        validade_registo_criminal=parse_date(dados.validade_registo_criminal)
    )
    db.add(novo_membro)
    db.commit()
    return {"message": "Membro do agregado adicionado"}

@app.put("/api/membros/{membro_id}")
def atualizar_membro_agregado(membro_id: int, dados: MembroAgregadoSchema, db: Session = Depends(get_db)):
    m = db.query(MembroAgregado).filter(MembroAgregado.id == membro_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    m.nome = dados.nome
    m.relacao = dados.relacao
    m.data_nascimento = parse_date(dados.data_nascimento)
    m.profissao = dados.profissao
    m.validade_registo_criminal = parse_date(dados.validade_registo_criminal)
    db.commit()
    return {"message": "Membro do agregado atualizado"}

@app.delete("/api/membros/{membro_id}")
def remover_membro_agregado(membro_id: int, db: Session = Depends(get_db)):
    m = db.query(MembroAgregado).filter(MembroAgregado.id == membro_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    db.delete(m)
    db.commit()
    return {"message": "Membro do agregado removido"}