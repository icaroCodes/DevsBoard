# DevsBoard — MVP Oficial

Um painel completo, limpo e produtivo para organizar **finanças, tarefas, rotinas, metas e projetos** — tudo em um único lugar. Pensado para devs que valorizam produtividade real e clareza total.

---

# 1. Dados Básicos

## Nome do Projeto
**DevsBoard** v1.1

## Conceito
Plataforma web que consolida a rotina do desenvolvedor em uma experiência única e enxuta. O nome une **Dev** (desenvolvedor) + **Board** (quadro), reforçando a ideia de painel pessoal de comando.

## Objetivo Geral
Oferecer um ambiente centralizado, rápido e funcional para organizar vida profissional e pessoal sem depender de mil aplicativos diferentes.

## Problema Resolvido
Desenvolvedores costumam dispersar informações em vários apps: um para tarefas, outro para finanças, outro para metas, outro para projetos. O DevsBoard elimina essa fragmentação e entrega **simplicidade, velocidade e controle total**.

## Público-Alvo
Desenvolvedores, estudantes de tecnologia e pequenas empresas.

## Escopo Inicial (v1.0 — MVP)

### Primeira Experiência
- Landing Page intuitiva.
- login.
- Dashboard com estatísticas gerais.
- Destaques rápidos dos principais movimentos financeiros.

### Finanças
- Acesso completo ao painel financeiro.
- Exibição de entradas, despesas e saldo total.
- Filtros: Entrada | Despesa | Todas.
- Criar transações com categoria, descrição, valor, tipo e data.
- Sugestões de categorias.
- Histórico completo.
- Editar ou excluir registros.

### Tarefas
- Criar tarefas com título e descrição.
- Prioridade: baixa | média | alta.
- Marcar e desmarcar como concluída.
- Editar e remover tarefas.

### Rotinas
- Criar rotinas.
- Definir tipo visual: diária | semanal | mensal.
- Editar e excluir rotinas.
- Criar tarefas internas com as mesmas funcionalidades das tarefas gerais.

### Metas
- Criar metas com nome e tipo.
- Definir tipo: Meta de desempenho ou Meta financeira

**Meta de Desempenho**
- Definir prazo: mensal, anual, ou prazo indefinido.
- Concluir e desfazer conclusão.
- Editar.
- Excluir.

**Meta Financeira**
- Definir valor da meta.
- Definir prazo: mensal, anual, ou prazo indefinido.
- Adicionar valores ao dinheiro guardado.
- Remover valores para Finanças.
- Progresso automático em porcentagem.
- Exibir total acumulado.
- Excluir somente após depositar valores guardados.

### Projetos
- Criar projetos com:
  - Nome
  - Conceito
  - Objetivo
  - Problema que resolve
  - Público-alvo
  - Escopo inicial
  - Requisitos funcionais
  - Requisitos de interface
- Editar e excluir projeto.

### Configurações
- Editar nome.
- Excluir conta.

---


## Escopo Inicial (v1.1 — Próxima versão)


### Projetos
- UpLoad de imagens
  - Logo
  - Protótipo
  - Requisitos não funcionais
  - Stack
  - Rotas
  - EndPoints


---


# 2. Requisitos Funcionais (RF)

- **RF01** – autenticação (Google e GitHub).
- **RF02** – Gerenciamento de Finanças, Tarefas, Rotinas, Metas e Projetos.
- **RF03** – Criar, listar, atualizar e excluir registros. CRUD
- **RF04** – Exibir movimentos principais da conta.
- **RF05** – Atualizar perfil.
- **RF06** – Excluir conta definitivamente.
- **RF07** – Feedback visual claro (sucesso, erro, carregamento).
- **RF08** – Sincronização e persistência completa dos dados do usuário.

---

# 3. Requisitos de Interface (UI/UX)

- **Layout responsivo** com barra lateral fixa.
- **Menu hambúrguer** em todos os dispositivos.
- **Ícones:** Lucide.
- **Fonte:** Inter, Regular.
- **Navegação:** menu lateral

### Telas Obrigatórias
- Landing Page.
- Login.
- Dashboard.
- Finanças.
- Tarefas.
- Rotinas.
- Metas.
- Projetos.
- Configurações.

---

# 4. Requisitos Não Funcionais (RNF)

## Desempenho
- **RNF02** – Dashboard em até 1.5s.

## Segurança

- **RNF03 – Autenticação via OAuth (Google e GitHub)**  
  Autenticação feita exclusivamente por provedores OAuth (Google e GitHub), sem armazenamento nem uso de senhas locais.  
  **Por quê:** elimina a responsabilidade de gerenciar credenciais (hash, reset, políticas de senha) e transfere a segurança da autenticação para provedores maduros que oferecem 2FA, detecção de anomalias e proteção contra fraudes. Reduz significativamente a superfície de ataque relacionada ao login.

- **RNF04 – Uso de JWT para autenticação e autorização**  
  Após validação do provedor OAuth, o backend emite um JWT assinado que o cliente envia em requisições subsequentes para autorizar acesso a recursos.  
  **Por quê:** JWT permite que o sistema identifique e autorize usuários sem precisar armazenar sessões no servidor (stateless). Isso torna a autenticação mais rápida, escalável e segura, já que cada token contém apenas as informações essenciais (como userId, permissões e data de expiração) e pode ser verificado rapidamente a cada requisição.


- **RNF05 – Validação do token OAuth no backend antes de emitir JWT**  
  O backend deve verificar diretamente com o provedor (endpoints do Google/GitHub) que o token recebido é válido, não expirou e pertence ao usuário que afirma ser. Só então o backend cria e emite o JWT interno.  
  **Por quê:** evita aceitação de tokens forjados ou manipulados pelo cliente. A validação de servidor para servidor garante a legitimidade da identidade antes de conceder acesso dentro do sistema. [Usuário] ---> "Login com Google" ---> [Google] ---> token do Google ---> [Seu Backend] ---> JWT interno.
  
## Segurança – Autenticação
- Token inválido ou expirado retorna **401 – Unauthorized**.
- Rota não existe. Página não encontrada **404 - Not Found**

---

# 5. Requisitos Técnicos

- **RT01** – Frontend: React(JSX) + Tailwind + Vite + Motion + lucide React Hooks
- **RT02** – Backend: Node.js + Express.
- **RT03** – Banco: MySQL.
- **RT04** – API REST modular.

---

# 6. Rotas

- **Domínio** - mydevsboardvercelapp.vercel.app.vercel.app/
- **Landing Page Inicial** - mydevsboardvercelapp.vercel.app.vercel.app/
- **Login** - mydevsboardvercelapp.vercel.app.vercel.app/auth
- **DashBoard** - mydevsboardvercelapp.vercel.app.vercel.app/dashboard
- **Finances** - mydevsboardvercelapp.vercel.app.vercel.app/finances
- **Tasks** - mydevsboardvercelapp.vercel.app.vercel.app/tasks
- **Routines** - mydevsboardvercelapp.vercel.app.vercel.app/routines
- **Goals** - mydevsboardvercelapp.vercel.app.vercel.app/goals
- **Projects** - mydevsboardvercelapp.vercel.app.vercel.app/projects
- **Settings** - mydevsboardvercelapp.vercel.app.vercel.app/settings

---

# 7. Endpoints

- **Landing Page Inicial**
  - **Endpoint:** `/`
  - **Método:** GET
  - **Descrição:** Retorna a página inicial do site.

- **Login (OAuth)**
  - **Endpoint:** `/auth/oauth/google`
  - **Método:** POST
  - **Descrição:** Recebe o token do Google OAuth e autentica o usuário no sistema, retornando um JWT interno.
  - **Endpoint:** `/auth/oauth/github`
  - **Método:** POST
  - **Descrição:** Recebe o token do GitHub OAuth e autentica o usuário no sistema, retornando um JWT interno.

- **Dashboard**
  - **Endpoint:** `/dashboard`
  - **Método:** GET
  - **Descrição:** Retorna dados principais do usuário para exibição no dashboard (resumo financeiro, tarefas, metas).

- **Finances**
  - **Endpoint:** `/finances`
  - **Método:** GET
  - **Descrição:** Lista todas as transações do usuário.
  - **Endpoint:** `/finances`
  - **Método:** POST
  - **Descrição:** Cria nova transação financeira.
  - **Endpoint:** `/finances/:id`
  - **Método:** PUT
  - **Descrição:** Atualiza uma transação existente.
  - **Endpoint:** `/finances/:id`
  - **Método:** DELETE
  - **Descrição:** Exclui uma transação.

- **Tasks**
  - **Endpoint:** `/tasks`
  - **Método:** GET
  - **Descrição:** Lista todas tarefas do usuário.
  - **Endpoint:** `/tasks`
  - **Método:** POST
  - **Descrição:** Cria nova tarefa.
  - **Endpoint:** `/tasks/:id`
  - **Método:** PUT
  - **Descrição:** Atualiza tarefa existente.
  - **Endpoint:** `/tasks/:id`
  - **Método:** DELETE
  - **Descrição:** Remove tarefa.

- **Routines**
  - **Endpoint:** `/routines`
  - **Método:** GET
  - **Descrição:** Lista todas rotinas do usuário.
  - **Endpoint:** `/routines`
  - **Método:** POST
  - **Descrição:** Cria nova rotina.
  - **Endpoint:** `/routines/:id`
  - **Método:** PUT
  - **Descrição:** Atualiza rotina existente.
  - **Endpoint:** `/routines/:id`
  - **Método:** DELETE
  - **Descrição:** Remove rotina.

- **Goals**
  - **Endpoint:** `/goals`
  - **Método:** GET
  - **Descrição:** Lista todas metas do usuário.
  - **Endpoint:** `/goals`
  - **Método:** POST
  - **Descrição:** Cria nova meta (Meta de Desempenho ou Meta Financeira).
  - **Endpoint:** `/goals/:id`
  - **Método:** PUT
  - **Descrição:** Atualiza meta existente, incluindo tipo, prazo ou valores.
  - **Endpoint:** `/goals/:id`
  - **Método:** DELETE
  - **Descrição:** Exclui meta (Meta Financeira apenas se saldo zerado).

- **Projects**
  - **Endpoint:** `/projects`
  - **Método:** GET
  - **Descrição:** Lista todos projetos do usuário.
  - **Endpoint:** `/projects`
  - **Método:** POST
  - **Descrição:** Cria novo projeto.
  - **Endpoint:** `/projects/:id`
  - **Método:** PUT
  - **Descrição:** Atualiza projeto existente.
  - **Endpoint:** `/projects/:id`
  - **Método:** DELETE
  - **Descrição:** Remove projeto.

- **Settings**
  - **Endpoint:** `/settings`
  - **Método:** GET
  - **Descrição:** Retorna configurações do usuário.
  - **Endpoint:** `/settings`
  - **Método:** PUT
  - **Descrição:** Atualiza configurações do usuário, incluindo nome ou preferências.
  - **Endpoint:** `/settings`
  - **Método:** DELETE
  - **Descrição:** Exclui conta permanentemente.


---

**DevsBoard — Seu ambiente único de organização real.**