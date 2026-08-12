from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from models import Base, Familia, MembroAgregado, Processo, Crianca, Documento

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:adminpassword@localhost:5432/acolhimento_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def povoar_dados_teste():
    db = SessionLocal()
    
    print("A limpar dados antigos...")
    db.query(Documento).delete()
    db.query(MembroAgregado).delete()
    db.query(Crianca).delete()
    db.query(Processo).delete()
    db.query(Familia).delete()
    db.commit()

    print("A inserir Titulares e Agregados Familiares...")
    fam1 = Familia(
        no_certificacao="FA-012-24",
        titular_nome="Maria do Carmo Silva",
        data_revisao=date(2027, 12, 15),
        morada="Rua das Flores, n.º 45, Lisboa",
        email="maria.carmo.silva@email.pt",
        contacto="912 345 678",
        no_elementos_agregado=3,
        niss="12039485761",
        nif="210987654",
        sns="234567891",
        validade_registo_criminal=date(2026, 11, 30),
        registo_criminal="registo_criminal_maria.pdf",
        atestado_saude="atestado_saude_maria.pdf",
        no_criancas_acolhidas=2
    )

    db.add(fam1)
    db.commit()

    # Membros do Agregado (Sem NIF/NISS/SNS)
    membro1 = MembroAgregado(
        familia_id=fam1.id,
        nome="João Pedro Silva (Cônjuge)",
        data_nascimento=date(1980, 5, 20),
        contacto="912 345 679",
        relacao="Cônjuge",
        profissao="Professor",
        validade_registo_criminal=date(2026, 11, 30)
    )

    membro2 = MembroAgregado(
        familia_id=fam1.id,
        nome="Inês Silva (Filha do Titular)",
        data_nascimento=date(2012, 8, 10),
        relacao="Filha",
        profissao="Estudante"
    )

    db.add_all([membro1, membro2])
    db.commit()

    print("A inserir Processos e Crianças...")
    proc1 = Processo(no_proc_interno="012/2024", observacoes="Irmãos em acolhimento.")
    proc2 = Processo(no_proc_interno="045/2024", observacoes="Processo inativo arquivado.")

    db.add_all([proc1, proc2])
    db.commit()

    # Criança < 6 Anos (Valor deve dar 50€)
    crianca_pequena = Crianca(
        processo_id=proc1.id,
        familia_id=fam1.id,
        nome="Lucas Silva Pereira",
        no_ppp="1024/24.1TNLSB",
        genero="Masculino",
        data_nascimento=date(2022, 3, 15), # ~4 Anos -> Valor = 50€
        estado_processo="Ativo",
        gestor="Dra. Helena Vaz",
        servico="Serviço Social do Porto"
    )

    # Criança >= 6 Anos (Valor deve dar 100€)
    crianca_maior = Crianca(
        processo_id=proc1.id,
        familia_id=fam1.id,
        nome="Beatriz Silva Pereira",
        no_ppp="1025/24.1TNLSB",
        genero="Feminino",
        data_nascimento=date(2015, 7, 22), # ~11 Anos -> Valor = 100€
        estado_processo="Ativo",
        gestor="Dra. Helena Vaz",
        servico="Serviço Social do Porto"
    )

    # Criança Inativa
    crianca_inativa = Crianca(
        processo_id=proc2.id,
        familia_id=None,
        nome="Rodrigo Antunes",
        no_ppp="0880/23.0TNPRT",
        genero="Masculino",
        data_nascimento=date(2010, 11, 5), # ~15 Anos -> Valor = 100€
        estado_processo="Inativo",
        gestor="Dr. Carlos Mota"
    )

    db.add_all([crianca_pequena, crianca_maior, crianca_inativa])
    db.commit()

    # Adiciona Documento de Teste
    doc1 = Documento(
        processo_id=proc1.id,
        crianca_id=crianca_pequena.id,
        nome_original="certidao_nascimento_lucas.pdf",
        tipo_documento="Certidão de Nascimento",
        caminho_disco="./storage/certidao_nascimento_lucas.pdf"
    )
    db.add(doc1)
    db.commit()

    print("✅ Novos dados de teste inseridos com sucesso!")
    db.close()

if __name__ == "__main__":
    povoar_dados_teste()