# Promissão — Apresentação Técnica & Totem Interativo 🏛️

Sistema Integrado de Avaliação de Eventos Municipais desenvolvido para a Prefeitura de Promissão/SP no âmbito das Atividades de Extensão Universitária do curso de Tecnologia em Sistemas para Internet (TSI) — **IFSP Campus Birigui**.

## 👥 Equipe
- Gabriel Soares
- Gustavo Labos
- Livia Gomes
- Lucas Altino

---

## 🚀 Estrutura de Rotas (Vercel)

- **Apresentação Técnica (Slides):**  
  Rota: [`/`](https://promiss-o-apresentacao.vercel.app/) ou [`/slide`](https://promiss-o-apresentacao.vercel.app/slide)
  - 11 slides estruturados em 16:9 com animações CSS.
  - Modelo 3D oficial do Totem (`Montagem1.obj`) renderizado via Three.js com auto-rotação e materiais PBR.
  - Painel de telemetria da Prefeitura com gráficos dinâmicos e tomada de tela (*takeover*) em tempo real ao receber votos.

- **Terminal de Autoatendimento (Totem Kiosk):**  
  Rota: [`/totem`](https://promiss-o-apresentacao.vercel.app/totem)
  - Interface táctil de autoatendimento em 4 etapas sequenciais (CPF, Vínculo territorial, Infraestrutura e Segurança).
  - Emissão de eventos em tempo real via `BroadcastChannel` e sincronização local.
  - Reinício automático e segurança LGPD.
