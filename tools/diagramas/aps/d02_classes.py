"""02 — Diagrama de classes do DF Coleta."""

from pathlib import Path

from lib_drawio import (
    ASSOC, COMP, Diagram, GEN, NOTE, OUT, SMALL, class_box, enum_box, text,
)


def gerar() -> Path:
    d = Diagram("classes", 1640, 1380, "Classes — DF Coleta")

    # ------------------------------------------------------------------
    # Classes
    # ------------------------------------------------------------------
    class_box(d, "horario", "HorarioFuncionamento", [
        "- id: int",
        "- diaSemana: String",
        "- horaAbertura: Time",
        "- horaFechamento: Time",
        "- ordem: int",
    ], [], 20, 340, 290)

    class_box(d, "ponto", "PontoColeta", [
        "- id: int",
        "- nome: String",
        "- tipo: TipoPonto",
        "- endereco: String",
        "- cidade: String",
        "- latitude: Double",
        "- longitude: Double",
        "- telefone: String",
        "- status: StatusPonto",
        "- criadoEm: DateTime",
        "- atualizadoEm: DateTime",
    ], [
        "+ exibirDetalhes(): void",
        "+ calcularDistancia(lat, lng): double",
        "+ alterarStatus(status): void",
    ], 390, 300, 340)

    class_box(d, "residuo", "Residuo", [
        "- id: int",
        "- nome: String",
        "- icone: String",
        "- descricao: String",
    ], [], 845, 340, 260)

    class_box(d, "admin", "Administrador", [
        "- id: int",
        "- nome: String",
        "- email: String",
        "- senha: String",
    ], [
        "+ autenticar(): boolean",
        "+ cadastrarPonto(): void",
        "+ editarPonto(): void",
        "+ excluirPonto(): void",
        "+ gerenciarResiduos(): void",
    ], 845, 520, 300)

    class_box(d, "comentario", "Comentario", [
        "- id: int",
        "- nomeAutor: String",
        "- emailAutor: String",
        "- textoComentario: String",
        "- curtidas: int",
        "- respostaA: int",
        "- oficial: boolean",
        "- data: DateTime",
    ], [
        "+ comentar(): void",
        "+ curtir(): void",
        "+ responder(): void",
    ], 40, 760, 330)

    class_box(d, "problema", "ProblemaRelato", [
        "- id: int",
        "- nomeAutor: String",
        "- emailAutor: String",
        "- tipoProblema: String",
        "- textoProblema: String",
        "- severidade: Severidade",
        "- status: StatusProblema",
        "- data: DateTime",
    ], [
        "+ relatar(): void",
        "+ alterarStatus(status): void",
    ], 400, 760, 350)

    class_box(d, "sugestao", "SugestaoPonto", [
        "- id: int",
        "- nomeLocal: String",
        "- endereco: String",
        "- cidade: String",
        "- nomeAutor: String",
        "- emailAutor: String",
        "- textoSugestao: String",
        "- residuosSugeridos: String",
        "- status: StatusSugestao",
        "- data: DateTime",
    ], [
        "+ enviar(): void",
        "+ aprovar(): void",
        "+ rejeitar(): void",
    ], 845, 760, 360)

    class_box(d, "contribuicao", "Contribuicao", [
        "- id: int",
        "- nomeAutor: String",
        "- emailAutor: String",
        "- data: DateTime",
    ], [
        "+ registrar(): void",
    ], 420, 1080, 360, abstract=True)

    # ------------------------------------------------------------------
    # Enumerações
    # ------------------------------------------------------------------
    text(d, "enum_note", "Enumerações referenciadas pelos atributos",
         1265, 288, 300, 40, SMALL)
    enum_box(d, "e_status_ponto", "StatusPonto", ["ATIVO", "INATIVO"], 1265, 340, 300)
    enum_box(d, "e_tipo_ponto", "TipoPonto", [
        "ECOPONTO", "COOPERATIVA", "FARMACIA", "COMERCIO", "COMUNITARIO", "ESCOLA",
    ], 1265, 470, 300)
    enum_box(d, "e_status_sug", "StatusSugestao", ["PENDENTE", "APROVADO", "REJEITADO"],
             1265, 650, 300)
    enum_box(d, "e_status_prob", "StatusProblema", ["PENDENTE", "EM_ANALISE", "RESOLVIDO"],
             1265, 780, 300)
    enum_box(d, "e_severidade", "Severidade", ["BAIXA", "MEDIA", "ALTA"],
             1265, 910, 300)

    # ------------------------------------------------------------------
    # Relacionamentos
    # ------------------------------------------------------------------
    # Composição: PontoColeta é o todo; HorarioFuncionamento é a parte.
    d.e("comp_horario", "ponto", "horario", "", COMP)
    text(d, "lbl_comp", "possui", 320, 326, 70, 18, SMALL)
    text(d, "mult_comp_ponto", "1", 366, 378, 18, 18, SMALL)
    text(d, "mult_comp_horario", "0..*", 318, 378, 34, 18, SMALL)

    # Associação N:N entre ponto e resíduo.
    d.e("assoc_residuo", "ponto", "residuo", "", ASSOC)
    text(d, "lbl_residuo", "aceita", 752, 344, 60, 18, SMALL)
    text(d, "mult_res_ponto", "0..*", 734, 380, 34, 18, SMALL)
    text(d, "mult_res_residuo", "0..*", 800, 380, 34, 18, SMALL)

    # Administrador gerencia pontos.
    d.e("assoc_admin", "ponto", "admin", "gerencia", ASSOC)
    text(d, "mult_admin", "1", 826, 556, 18, 18, SMALL)
    text(d, "mult_admin_ponto", "0..*", 736, 568, 34, 18, SMALL)

    # Associações das contribuições com o ponto.
    d.e("assoc_comentario", "ponto", "comentario", "refere-se a", ASSOC)
    d.e("assoc_problema", "ponto", "problema", "pertence a", ASSOC)
    d.e("assoc_sugestao", "ponto", "sugestao", "pode originar", ASSOC)

    text(d, "mult_comentario", "0..*", 210, 738, 34, 18, SMALL)
    text(d, "mult_comentario_ponto", "1", 418, 600, 18, 18, SMALL)
    text(d, "mult_problema", "0..*", 590, 738, 34, 18, SMALL)
    text(d, "mult_problema_ponto", "1", 566, 600, 18, 18, SMALL)
    text(d, "mult_sugestao", "0..1", 806, 748, 34, 18, SMALL)
    text(d, "mult_sugestao_ponto", "0..1", 700, 600, 34, 18, SMALL)

    # Herança: as três contribuições herdam de Contribuicao.
    d.e("gen_comentario", "comentario", "contribuicao", "", GEN,
        points=[(205, 1020), (205, 1144), (420, 1144)])
    d.e("gen_problema", "problema", "contribuicao", "", GEN)
    d.e("gen_sugestao", "sugestao", "contribuicao", "", GEN,
        points=[(1000, 1060), (1000, 1144), (780, 1144)])

    # Autoassociação de comentário (resposta a outro comentário).
    d.ep("self_comentario", (40, 850), (40, 930), "resposta a", ASSOC,
         points=[(4, 850), (4, 930)])
    text(d, "mult_self_1", "0..1", 10, 824, 30, 18, SMALL)
    text(d, "mult_self_2", "0..*", 10, 930, 30, 18, SMALL)

    # Nota de apoio
    text(d, "nota_contrib", (
        "Contribuicao generaliza Comentario, ProblemaRelato e SugestaoPonto "
        "(id, nomeAutor, emailAutor, data). A associação N:N com Residuo é "
        "resolvida pela tabela ponto_residuos no Supabase. Administrador é "
        "classe de domínio: o login é validado pelo Supabase Auth, sem tabela "
        "de administradores. Mapas e API externa são serviços do front end, "
        "detalhados no diagrama de componentes."
    ), 390, 1220, 430, 130, NOTE)

    out = OUT / "02-classes" / "classes.drawio"
    d.save(out)
    return out


if __name__ == "__main__":
    print(gerar())
