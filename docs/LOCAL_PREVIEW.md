# Pré-visualização local do Dashboard

Esta branch contém somente a superfície do **Dashboard do lojista** sobre a base da `main`. Ela pode ser iniciada sem Clerk ou Supabase para revisão visual e de interação local.

```powershell
yarn install
yarn dev --port 3000
```

Abra `http://localhost:3000/dashboard`.

Para visualizar as duas superfícies ao mesmo tempo, inicie a branch `Storefront` em outra cópia de trabalho, na porta `3001`. O botão **Ver loja** aponta para `http://localhost:3001/casa-noma` por padrão. Esse endereço pode ser substituído com `NEXT_PUBLIC_STOREFRONT_PREVIEW_URL`.

> Este modo não tem autenticação real, persistência compartilhada ou isolamento multi-tenant ativo. Clerk, Supabase, migrations e RLS continuam obrigatórios antes de produção.
