import os
import json
from datetime import date
from typing import Optional
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

# 📌 CORS COMPLETO (Permite que o React faça POST/PUT/DELETE sem bloqueios)
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

# Função auxiliar para converter datas com segurança
def parse_date(data_str: Optional[str]):
    if not data_str or data_str.strip() == "":
        return None
    try:
        return date.fromisoformat(data_str)
    except ValueError:
        return None

# --- SCHEMAS PYDANTIC ---
class LoginRequest(BaseModel):
    username: str
    password: str

class CriancaSchema(BaseModel):
    nome: str
    no_proc_interno: str
    no_ppp: Optional[str] = None
    genero: Optional[str] = None
    data_nascimento: Optional[str] = None
    nacionalidade: Optional[str] = "Portuguesa"
    nif: Optional[str] = None
    niss: Optional[str] = None
    sns: Optional[str] = None
    doc_identificacao: Optional[str] = "Cartão de Cidadão"
    no_doc_identificacao: Optional[str] = None
    gestor: Optional[str] = None
    servico: Optional[str] = None
    estado_processo: Optional[str] = "Ativo"
    valor_calculado: Optional[float] = 50.0
    acolhimento_anterior: Optional[str] = "Não"
    data_entrada_af_atual: Optional[str] = None
    data_saida_af_atual: Optional[str] = None
    familia_id: Optional[int] = None

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
    return {
        "status": "success",
        "username": user["username"],
        "nome": user["nome"],
        "role": user["role"]
    }

@app.get("/")
def home():
    return {"status": "ok", "message": "API Backend no ar!"}

# --- ENDPOINTS DAS CRIANÇAS (CRUD) ---

@app.get("/api/criancas")
def listar_criancas(db: Session = Depends(get_db)):
    criancas = db.query(Crianca).all()
    resultado = []
    for c in criancas:
        docs = [{
            "id": d.id, 
            "nome": d.nome_original, 
            "tipo": d.tipo_documento,
            "url": f"http://localhost:8000/storage/{d.nome_original}"
        } for d in c.documentos]

        resultado.append({
            "id": c.id,
            "no_proc_interno": c.processo.no_proc_interno if c.processo else "N/A",
            "nome": c.nome,
            "no_ppp": c.no_ppp or "N/D",
            "genero": c.genero or "N/D",
            "data_nascimento": str(c.data_nascimento) if c.data_nascimento else "",
            "idade": c.idade,
            "nacionalidade": c.nacionalidade or "Portuguesa",
            "nif": c.nif or "",
            "niss": c.niss or "",
            "sns": c.sns or "",
            "doc_identificacao": c.doc_identificacao or "Cartão de Cidadão",
            "no_doc_identificacao": c.no_doc_identificacao or "",
            "gestor": c.gestor or "",
            "servico": c.servico or "",
            "estado_processo": c.estado_processo or "Ativo",
            "valor": c.valor_calculado,
            "acolhimento_anterior": c.acolhimento_anterior or "Não",
            "data_entrada_1a_af": str(c.data_entrada_1a_af) if c.data_entrada_1a_af else None,
            "data_saida_1a_af": str(c.data_saida_1a_af) if c.data_saida_1a_af else None,
            "data_entrada_af_atual": str(c.data_entrada_af_atual) if c.data_entrada_af_atual else "",
            "data_saida_af_atual": str(c.data_saida_af_atual) if c.data_saida_af_atual else "",
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
        # 📌 REMOVIDO: valor_calculado (é uma @property no modelo)
        acolhimento_anterior=dados.acolhimento_anterior,
        data_entrada_af_atual=parse_date(dados.data_entrada_af_atual),
        data_saida_af_atual=parse_date(dados.data_saida_af_atual),
        familia_id=dados.familia_id
    )
    db.add(nova_crianca)
    db.commit()
    db.refresh(nova_crianca)
    return {"message": "Criança criada com sucesso", "id": nova_crianca.id}

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
    # 📌 REMOVIDO: c.valor_calculado = ...
    c.acolhimento_anterior = dados.acolhimento_anterior
    c.data_entrada_af_atual = parse_date(dados.data_entrada_af_atual)
    c.data_saida_af_atual = parse_date(dados.data_saida_af_atual)
    c.familia_id = dados.familia_id

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

@app.get("/api/familias/{familia_id}")
def obter_familia(familia_id: int, db: Session = Depends(get_db)):
    fam = db.query(Familia).filter(Familia.id == familia_id).first()
    if not fam:
        raise HTTPException(status_code=404, detail="Família não encontrada")
    
    agregado = [{
        "id": m.id,
        "nome": m.nome,
        "data_nascimento": str(m.data_nascimento) if m.data_nascimento else "N/D",
        "contacto": m.contacto,
        "relacao": m.relacao,
        "profissao": m.profissao,
        "validade_registo_criminal": str(m.validade_registo_criminal) if m.validade_registo_criminal else "N/D"
    } for m in fam.membros_agregado]

    return {
        "id": fam.id,
        "no_certificacao": fam.no_certificacao,
        "titular_nome": fam.titular_nome,
        "data_revisao": str(fam.data_revisao) if fam.data_revisao else "N/D",
        "contacto": fam.contacto,
        "email": fam.email,
        "morada": fam.morada,
        "no_elementos_agregado": fam.no_elementos_agregado,
        "nif": fam.nif,
        "niss": fam.niss,
        "sns": fam.sns,
        "validade_registo_criminal": str(fam.validade_registo_criminal) if fam.validade_registo_criminal else "N/D",
        "membros_agregado": agregado
    }