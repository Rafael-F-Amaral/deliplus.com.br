# Diário de Bordo - Deliplus Frontend

Este documento mantém o histórico das nossas versões (Commits) e integrações de UI.

---

### Versão: `3edca49`
**Data:** 18 de Setembro de 2026 (12:20)
**Pedido do Usuário:** *"Então descarta o sandbox e implementa o que já temos no projeto como conversamos agora para começarmos a trabalhar. Apenas migre o sandbox para o projeto da forma que combinamos, mas não ligue nenhum motor de supabase, nada, apenas migre e deixe pronto..."*
**O que foi feito:**
- Criada a branch local de segurança `feature/frontend-integration`.
- Migração "seca" (apenas cópia de arquivos) do `deli_sandbox` para a pasta raiz `deliplus.com.br`.
- As telas estáticas do Sandbox foram copiadas para os seus respectivos diretórios oficiais do Dashboard (ex: `app/dashboard/menu`, `app/dashboard/customers`, etc).
- Os componentes base (`Sidebar`, `AppShell`, `KPICard`, etc) foram movidos para `components/`.
- Nenhum motor (Supabase ou Node) foi ligado. Os links internos (ex: `/cardapio` vs `/dashboard/menu`) e os dados do Supabase ainda não foram refatorados, aguardando o início oficial dos trabalhos.
