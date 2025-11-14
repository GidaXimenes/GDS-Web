# GDS Web

O **GDS Web** é uma ferramenta de software projetada para auxiliar professores e educadores na criação de aulas gamificadas que utilizam narrativas (storytelling). A aplicação web simplifica o processo de design de gamificação, permitindo que educadores, mesmo aqueles sem experiência prévia em tecnologia ou design de jogos, possam estruturar conteúdos pedagógicos de forma envolvente.

Este projeto é baseado no **Game Design Storytelling (GDS)**, um método que aplica estruturas narrativas, como a jornada do herói, para organizar elementos de jogos (missões, desafios, recompensas) alinhados aos objetivos de aprendizagem. O GDS Web automatiza esse método, utilizando Inteligência Artificial para gerar propostas de aulas completas e personalizadas.

---

## Como Funciona

A aplicação guia o usuário através de um fluxo simples para coletar os requisitos da aula e gerar o material final:

1.  **Escolha do Formulário**: O usuário inicia escolhendo entre duas opções:
    * **Formulário Rápido**: Para uma geração simples e direta, ideal para quem deseja uma proposta inicial sem muitos detalhes.
    * **Formulário Completo**: Um fluxo detalhado que coleta informações sobre o contexto educacional, personalização, e múltiplas missões (aulas).

2.  **Coleta de Dados**: O usuário preenche os formulários com detalhes sobre a aula, como:
    * Contexto (nível de ensino, número de alunos, formato da aula).
    * Detalhes da Gamificação (interação, tipo de competição, personalização).
    * Temas Narrativos (ex: Aventura Espacial, Mistério, Fantasia).
    * Detalhes da Missão (conteúdo, tipo de avaliação, obstáculos, recompensas).

3.  **Geração com IA**:
    * Os dados dos formulários são compilados em um *prompt* detalhado.
    * Este prompt é enviado ao serviço **Google Generative AI (Gemini)** para gerar a narrativa principal da aula gamificada.
    * A narrativa gerada é então usada para criar um *segundo prompt*, instruindo a IA a gerar diretrizes de slides e alternativas de aplicação (como leitura dramatizada).

4.  **Exibição dos Resultados**: A aplicação exibe os resultados em uma interface com duas abas:
    * **Narrativa**: O texto completo da história e das missões.
    * **Instruções**: Diretrizes passo a passo para o professor criar o material de aula (slides).

5.  **Exportação**: O usuário pode baixar o conteúdo gerado (narrativa e instruções) como um documento **PDF** para uso offline.

---

## Tecnologias Utilizadas

Este projeto foi construído utilizando as seguintes tecnologias:

* **Backend**:
    * **Node.js**: Ambiente de execução JavaScript.
    * **Express.js**: Framework para o servidor web e gerenciamento de rotas.
    * **TypeScript**: Superset do JavaScript para tipagem estática e robustez.
    * **Express-Session**: Gerenciamento de sessão para armazenar os dados dos formulários entre as etapas.

* **Frontend (View Engine)**:
    * **Handlebars.js**: Motor de templates para renderização dinâmica de HTML.
    * **Bootstrap 5**: Framework CSS para estilização e componentização da interface.

* **Inteligência Artificial**:
    * **Google Generative AI (Gemini)**: Utilizado através do SDK `@google/generative-ai` para a geração de todo o conteúdo narrativo e instrucional.

* **Geração de PDF**:
    * **pdfmake** & **html-to-pdfmake**: Bibliotecas usadas para converter o conteúdo HTML gerado (a partir do Markdown) em um documento PDF para download.

* **Desenvolvimento**:
    * **Nodemon**: Monitoramento de arquivos para reinício automático do servidor em desenvolvimento.
