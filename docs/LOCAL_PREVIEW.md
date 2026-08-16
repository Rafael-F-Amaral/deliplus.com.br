# Pré-visualização local do Storefront

Esta branch contém somente a superfície pública do **Storefront** sobre a base da `main`. Ela reproduz o layout e os fluxos visuais da demo Casa Noma para validação local.

```powershell
yarn install
yarn dev --port 3001
```

Abra `http://localhost:3001/casa-noma`.

Para visualizar as duas superfícies ao mesmo tempo, inicie a branch `Dashboard` em outra cópia de trabalho, na porta `3000`. O link **Acessar painel do lojista** aponta para `http://localhost:3000/dashboard` por padrão. Esse endereço pode ser substituído com `NEXT_PUBLIC_DASHBOARD_PREVIEW_URL`.

> Esta pré-visualização não substitui o fluxo de pedidos persistente. A configuração real exige Supabase, validações no servidor, migrations e RLS antes de produção.
