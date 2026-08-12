import os
import json
from fastapi import FastAPI, Depends, HTTPException
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

# Cria as tabelas na base de dados no arranque
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Sistema de Acolhimento")


class LoginRequest(BaseModel):
    username: str
    password: str

def carregar_utilizadores():
    caminho = os.path.join(os.path.dirname(__file__), "users.json")
    if os.path.exists(caminho):
        with open(caminho, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.post("/api/login")
def login(dados: LoginRequest):
    utilizadores = carregar_utilizadores()
    
    # Procura se existe algum utilizador com aquele username E aquela password exata
    user = next((u for u in utilizadores if u["username"] == dados.username and u["password"] == dados.password), None)
    
    if not user:
        raise HTTPException(status_code=401, detail="Utilizador ou palavra-passe incorretos")

    return {
        "status": "success",
        "username": user["username"],
        "nome": user["nome"],
        "role": user["role"]
    }

# CORS
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

@app.get("/")
def home():
    return {"status": "ok", "message": "API Backend no ar!"}

# Endpoint Completo de Crianças
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
            "data_nascimento": str(c.data_nascimento) if c.data_nascimento else "N/D",
            "idade": c.idade,
            "nacionalidade": c.nacionalidade or "Portuguesa",
            
            # Informações Fiscais da Criança
            "nif": c.nif or "N/D",
            "niss": c.niss or "N/D",
            "sns": c.sns or "N/D",
            
            # Documento de Identificação
            "doc_identificacao": c.doc_identificacao or "Cartão de Cidadão",
            "no_doc_identificacao": c.no_doc_identificacao or "N/D",
            
            # Informações do Processo e Gestão
            "gestor": c.gestor or "Não atribuído",
            "servico": c.servico or "Serviço Social",
            "estado_processo": c.estado_processo or "Ativo",
            "valor": c.valor_calculado,
            
            # Histórico de Acolhimento
            "acolhimento_anterior": c.acolhimento_anterior or "Não",
            "data_entrada_1a_af": str(c.data_entrada_1a_af) if c.data_entrada_1a_af else None,
            "data_saida_1a_af": str(c.data_saida_1a_af) if c.data_saida_1a_af else None,
            
            # Acolhimento Atual
            "data_entrada_af_atual": str(c.data_entrada_af_atual) if c.data_entrada_af_atual else "N/D",
            # Regra de negócio: Se o processo estiver Ativo, não apresenta data de saída
            "data_saida_af_atual": str(c.data_saida_af_atual) if (c.estado_processo == "Inativo" and c.data_saida_af_atual) else None,
            
            # Relação com Família
            "titular_acolhimento": c.familia.titular_nome if c.familia else "Não atribuído",
            "no_certificacao": c.familia.no_certificacao if c.familia else "N/D",
            "familia_id": c.familia_id,
            "documentos": docs
        })
    return resultado

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