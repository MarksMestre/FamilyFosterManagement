import os
import random
from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, Familia, MembroAgregado, Processo, Crianca, Documento

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:adminpassword@localhost:5432/acolhimento_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

NOMES_MASCULINOS = ["Afonso", "Bernardo", "Dinis", "Duarte", "Francisco", "Gabriel", "Gonçalo", "Guilherme", "João", "Lucas", "Martim", "Miguel", "Pedro", "Rodrigo", "Tiago"]
NOMES_FEMININOS = ["Alice", "Beatriz", "Carolina", "Clara", "Francisca", "Inês", "Leonor", "Margarida", "Maria", "Matilde", "Sofia", "Mariana", "Rita", "Sara"]
NOMES_ADULTOS = ["Ana", "António", "Carlos", "Célia", "Cristina", "Daniel", "Eduardo", "Fernanda", "Helena", "Isabel", "Joaquim", "Jorge", "Luís", "Manuel", "Paulo", "Rui"]
APELIDOS = ["Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues", "Martins", "Sousa", "Fernandes", "Gomes", "Lopes", "Marques", "Ribeiro"]

DOCS_IDENTIFICACAO = ["Cartão de Cidadão", "Título de Residência", "Bilhete de Identidade", "Certidão de Nascimento", "Outro"]
SERVICOS_SOCIAIS = ["Serviço Social do Porto", "Serviço Social de Lisboa", "Centro Distrital de Coimbra", "Serviço Social de Braga", "Serviço Social de Faro"]
GESTORES = ["Dra. Helena Vaz", "Dr. Carlos Mota", "Dra. Patrícia Neves", "Dr. Miguel Ângelo", "Dra. Sofia Carriço"]

RELATIONS = ["Cônjuge", "Filho/a", "Pai/Mãe", "Irmão/Irmã", "Outro Agregado"]
PROFESSIONS = ["Professor/a", "Enfermeiro/a", "Administrativo/a", "Eletricista", "Comerciante", "Estudante", "Reformado/a", "Desempregado/a"]

def random_nif():
    body = [random.choice([1, 2, 3, 5, 6, 8])] + [random.randint(0, 9) for _ in range(7)]
    check = 11 - (sum((9 - i) * body[i] for i in range(8)) % 11)
    if check >= 10: check = 0
    body.append(check)
    return "".join(map(str, body))

def random_niss(): return f"120{random.randint(10000000, 99999999)}"
def random_sns(): return f"{random.randint(100000000, 999999999)}"

def random_date(start_year=2010, end_year=2026):
    start = date(start_year, 1, 1)
    end = date(end_year, 8, 1)
    return start + timedelta(days=random.randint(0, (end - start).days))

def seed_hundreds():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    print("🧹 1. A LIMPAR BASE DE DADOS...")
    db.query(Documento).delete()
    db.query(MembroAgregado).delete()
    db.query(Crianca).delete()
    db.query(Processo).delete()
    db.query(Familia).delete()
    db.commit()

    print("🚀 2. A GERAR DADOS REALISTAS (FAMÍLIAS + AGREGADOS + CRIANÇAS)...")
    
    # 1. Criar Famílias e respetivos Agregados
    familias = []
    total_agregados = 0

    for i in range(1, 81):
        num_membros = random.randint(1, 3)
        
        fam = Familia(
            no_certificacao=f"FA-{i:03d}-24",
            titular_nome=f"{random.choice(NOMES_ADULTOS)} {random.choice(APELIDOS)} {random.choice(APELIDOS)}",
            data_revisao=random_date(2025, 2028),
            morada=f"Rua das Flores, n.º {random.randint(1, 120)}, Porto",
            email=f"titular.{i}@acolhimento.pt",
            contacto=f"9{random.choice([1,2,3,6])}{random.randint(1000000, 9999999)}",
            no_elementos_agregado=num_membros + 1, # Titular + Membros
            niss=random_niss(),
            nif=random_nif(),
            sns=random_sns(),
            validade_registo_criminal=random_date(2025, 2027)
        )
        db.add(fam)
        db.flush() # Força a atribuição do ID do titular/família

        # GERAR MEMBROS DO AGREGADO FAMILIAR (Sem NIF/NISS/SNS, conforme especificado)
        for _ in range(num_membros):
            total_agregados += 1
            membro = MembroAgregado(
                familia_id=fam.id,
                nome=f"{random.choice(NOMES_ADULTOS if random.random() > 0.3 else NOMES_MASCULINOS)} {random.choice(APELIDOS)}",
                data_nascimento=random_date(1965, 2018),
                contacto=f"9{random.choice([1,2,3,6])}{random.randint(1000000, 9999999)}",
                relacao=random.choice(RELATIONS),
                profissao=random.choice(PROFESSIONS),
                validade_registo_criminal=random_date(2025, 2027)
            )
            db.add(membro)

        familias.append(fam)

    db.commit()

    # 2. Criar Processos e Crianças
    hoje = date(2026, 8, 12)
    total_criancas = 0

    for p in range(1, 101):
        proc = Processo(no_proc_interno=f"{p:03d}/2024", observacoes="Processo de acolhimento familiar.")
        db.add(proc)
        db.flush()

        fam_atribuida = random.choice(familias)
        num_criancas = random.choices([1, 2], weights=[0.7, 0.3])[0]

        for _ in range(num_criancas):
            total_criancas += 1
            genero = random.choice(["Masculino", "Feminino"])
            nome = f"{random.choice(NOMES_MASCULINOS if genero == 'Masculino' else NOMES_FEMININOS)} {random.choice(APELIDOS)}"
            estado = random.choices(["Ativo", "Inativo"], weights=[0.8, 0.2])[0]
            
            dt_entrada_atual = random_date(2022, 2025)
            dt_saida_atual = random_date(dt_entrada_atual.year, 2026) if estado == "Inativo" else None

            teve_anterior = random.random() > 0.6
            dt_ent_ant = random_date(2018, 2020) if teve_anterior else None
            dt_sai_ant = (dt_ent_ant + timedelta(days=random.randint(100, 500))) if teve_anterior else None

            crianca = Crianca(
                processo_id=proc.id,
                familia_id=fam_atribuida.id if (fam_atribuida and estado == "Ativo") else None,
                nome=nome,
                no_ppp=f"{random.randint(1000,9999)}/24.1TNLSB",
                genero=genero,
                data_nascimento=random_date(2010, 2024),
                nacionalidade="Portuguesa" if random.random() > 0.15 else "Brasileira",
                doc_identificacao=random.choice(DOCS_IDENTIFICACAO),
                no_doc_identificacao=f"{random.randint(10000000, 99999999)}",
                niss=random_niss(),
                nif=random_nif(),
                sns=random_sns(),
                estado_processo=estado,
                acolhimento_anterior="Sim" if teve_anterior else "Não",
                data_entrada_1a_af=dt_ent_ant,
                data_saida_1a_af=dt_sai_ant,
                data_entrada_af_atual=dt_entrada_atual,
                data_saida_af_atual=dt_saida_atual,
                gestor=random.choice(GESTORES),
                servico=random.choice(SERVICOS_SOCIAIS)
            )
            db.add(crianca)

    db.commit()
    print("==================================================")
    print("✅ BASE DE DADOS POVOADA COM SUCESSO!")
    print(f"📊 Resumo dos Dados:")
    print(f"   • Famílias de Acolhimento: {len(familias)}")
    print(f"   • Membros do Agregado:     {total_agregados}")
    print(f"   • Crianças Registadas:     {total_criancas}")
    print("==================================================")
    db.close()

if __name__ == "__main__":
    seed_hundreds()