# 📋 Projeto de Extensão: Gestão e Avaliação de Eventos Municipais (Promissão/SP)

> **Documento Mestre de Contexto e Visão Geral da Arquitetura**  
> **Disciplina:** Projeto de Extensão Universitária – 4º Semestre  
> **Município Alvo:** Promissão - SP (~35 mil habitantes)  
> **Integrantes:** Gabriel Soares, Gustavo Labos, Livia Gomes, Lucas Altino  

---

## 1. Contexto e Motivação

### O Cenário
* **População:** Promissão possui cerca de 35 mil habitantes, com perfil demográfico caracterizado por grande parcela de adultos, idosos e moradores da zona rural.
* **Escala dos Eventos:** Eventos municipais, datas comemorativas, festas culturais e atrações turísticas reúnem entre **2.000 e 5.000 pessoas**.
* **Gargalos do Fluxo Atual:**
  * **Coleta arcaica:** Servidores municipais utilizam **papel e caneta** para colher opiniões durante os eventos.
  * **Falta de dados estruturados:** As anotações em papel demoram dias para serem tabuladas (retrabalho manual) ou se perdem, impedindo relatórios em tempo real para a Diretoria de Turismo e prefeitura.
  * **Divulgação passiva:** Calendário estático no site oficial, dependente do "boca a boca", sem notificações.
  * **Barreira digital:** Apenas disponibilizar um link online tem baixa adesão, pois o público não é estimulado a responder espontaneamente.

---

## 2. Visão Geral da Solução e Arquitetura

O sistema propõe um **ecossistema integrado de coleta de feedback, divulgação de eventos, engajamento cidadão e inteligência de dados**, unificado centralmente pelo **CPF** do cidadão/turista.

```
                      ┌────────────────────────────────────────┐
                      │            BACKEND CENTRAL             │
                      │  (Banco de Dados Unificado por CPF)    │
                      └──────────────────┬─────────────────────┘
                                         │
       ┌─────────────────────────────────┼────────────────────────────────┐
       │                                 │                                │
       ▼                                 ▼                                ▼
┌───────────────────────────┐     ┌──────────────┐                 ┌──────────────┐
│       PAINEL ADMIN        │     │    TOTEM     │                 │    APP DO    │
│  • Gestão Central (Web)   │     │  NO EVENTO   │                 │   TURISTA    │
│  • App de Campo (Servidor)│     │  (Modo Kiosk)│                 │   (Mobile)   │
└───────────────────────────┘     └──────────────┘                 └──────────────┘
```

---

## 3. Índice de Especificações por Ponto de Acesso

Cada ponto de acesso possui um documento detalhado dedicado à sua usabilidade, fluxos de tela e regras de negócio:

| Documento | Ponto de Acesso | Público / Papel | Resumo das Funcionalidades |
| :--- | :--- | :--- | :--- |
| [**`DOC_ADMIN_CENTRAL.md`**](file:///c:/Users/soares/Documents/Faculdade/4º%20semestre/enxtensão2/DOC_ADMIN_CENTRAL.md) | **Painel Web de Gestão** | Gestores e Diretoria de Turismo | Dashboards e BI em tempo real, construtor de formulários dinâmicos com pontuação, banco de perguntas recorrentes, histórico comparativo de eventos, relatórios executivos em PDF/Excel e CMS de notícias. |
| [**`DOC_TOTEM_AUTOATENDIMENTO.md`**](file:///c:/Users/soares/Documents/Faculdade/4º%20semestre/enxtensão2/DOC_TOTEM_AUTOATENDIMENTO.md) | **Totem Físico no Evento** | Munícipes e Turistas nos eventos | Modo Kiosk travado, zero fricção (identificação apenas por CPF), perguntas 100% objetivas por toque, auto-reset instantâneo e crédito retroativo de pontos. |
| [**`DOC_APP_FUNCIONARIO_CAMPO.md`**](file:///c:/Users/soares/Documents/Faculdade/4º%20semestre/enxtensão2/DOC_APP_FUNCIONARIO_CAMPO.md) | **App do Servidor em Campo** | Servidores Municipais e Entrevistadores | Substituição de papel e caneta, coleta rápida presencial, campo de relato/observação opcional, métricas de produtividade do aparelho e scanner QR para validação de brindes. |
| [**`DOC_APP_TURISTA_CIDADAO.md`**](file:///c:/Users/soares/Documents/Faculdade/4º%20semestre/enxtensão2/DOC_APP_TURISTA_CIDADAO.md) | **App Mobile do Turista** | Cidadãos e Visitantes | Calendário dinâmico de eventos, notícias da cidade, formulários com pergunta descritiva de sugestão aberta, extrato de pontos e Passaporte Cidadão (níveis gamificados). |

---

## 4. Regras de Negócio Globais do Ecossistema

1. **Âncora de Identificação pelo CPF:**
   * Toda interação (totem, campo ou mobile) referencia o CPF como identificador único para histórico e pontuação.
2. **Pontuação Retroativa Inteligente:**
   * Usuários que respondem no totem sem possuir cadastro acumulam pontos no CPF. Ao criarem conta no app no futuro, o saldo acumulado é vinculado automaticamente.
3. **Diferenciação de Formulários:**
   * **Totens:** Formulários 100% objetivos (escalas e emojis).
   * **App Mobile:** Formulários objetivos + 1 pergunta descritiva livre.
   * **App de Campo:** Formulários objetivos + campo opcional de anotação rápida do servidor.
4. **Resiliência e Tolerância a Falhas (Offline-First):**
   * Tanto o Totem quanto o App do Servidor armazenam respostas localmente na ausência temporária de sinal de internet, sincronizando assim que a rede for restabelecida.
5. **Privacidade e LGPD:**
   * Acesso restrito a dados pessoais e geração de relatórios anonimizados para a gestão municipal.
