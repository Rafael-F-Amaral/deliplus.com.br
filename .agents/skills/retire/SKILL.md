---
name: retire
description: Remove UI elements, components, texts, buttons, sections, or containers that are enclosed inside red squares or rectangles marked on images/screenshots. Triggered by the /retire slash command or when the user provides images with red bounding boxes to remove elements.
metadata:
  icon: trash-2
---

# /retire — Remoção de Elementos Marcados em Vermelho

Este comando automatiza o processo de analisar imagens/screenshots fornecidas pelo usuário contendo **retângulos ou quadrados vermelhos** desenhados sobre a interface, localizar os elementos correspondentes no código-fonte e removê-los com precisão, mantendo a integridade do layout e da lógica.

---

## Quando Utilizar

- Sempre que o usuário digitar `/retire` no chat.
- Sempre que o usuário enviar um print ou imagem com marcações em vermelho (quadrados, retângulos, círculos ou caixas de seleção desenhadas à mão, via Ferramenta de Captura, Paint, Figma, etc.) solicitando a exclusão ou remoção dos itens assinalados.

---

## Fluxo de Execução Obrigatório

Ao ser acionado pelo comando `/retire`, siga rigorosamente as etapas abaixo:

### 1. Inspeção Visual das Imagens
1. Inspecione todas as imagens anexadas ou referenciadas na mensagem do usuário ou no histórico recente.
2. Identifique cada **quadrado, retângulo ou demarcação vermelha** presente na imagem.
3. Se houver mais de uma demarcação ou múltiplos prints, liste e enumere internamente cada caixa vermelha identificada.
4. Para cada demarcação vermelha, determine com exatidão:
   - Que elemento visual está dentro da caixa (ex: botão específico, badge, coluna de tabela, card, texto explicativo, link, ícone, filtro, container inteiro, tooltip, banner, etc.).
   - Em qual tela, modal ou componente a interface se encontra (ex: `/dashboard/menu`, modal de adicionar item, cabeçalho da página, storefront, etc.).

### 2. Mapeamento no Código-Fonte
1. Localize os arquivos responsáveis por renderizar os elementos identificados:
   - Procure por textos literais, rótulos de botões, atributos `data-*`, `aria-label`, ícones do Lucide/Hugeicons ou classes CSS característicos.
2. Identifique os nós JSX/TSX exatos que compõem o elemento demarcado pela caixa vermelha.
3. Avalie se a intenção da marcação é remover:
   - Apenas o elemento interno (ex: o ícone ou texto dentro de um botão);
   - O elemento interativo completo (ex: o botão inteiro ou o card);
   - Ou a linha/coluna inteira do grid/flexbox.

### 3. Remoção Limpa e Segura
1. Remova o bloco JSX/TSX correspondente do código.
2. **Ajuste de Layout**:
   - Reajuste o espaçamento circundante (`gap`, `margin`, `padding`, `grid-cols-*`, `justify-*`, `items-*`) para evitar vazios estranhos, linhas divisórias órfãs ou desalinhamento dos elementos remanescentes.
3. **Limpeza de Dependências**:
   - Remova imports que se tornaram desnecessários (ícones, componentes UI, hooks).
   - Remova variáveis de estado (`useState`), props, handlers de clique ou callbacks que serviam exclusivamente ao elemento removido.
4. **Preservação**:
   - Não altere nem remova nada que esteja fora das caixas vermelhas.

### 4. Verificação de Integridade
1. Execute a verificação de tipos e lint para certificar que nenhuma referência foi quebrada:
   ```bash
   yarn typecheck
   ```
2. Caso a remoção envolva rotas públicas ou testes específicos, garanta que os testes continuem passando.

### 5. Resposta ao Usuário
Informe de forma concisa e estruturada:
- Quais elementos foram identificados dentro das marcações vermelhas.
- Quais arquivos e componentes foram alterados.
- Confirmação de que a remoção foi concluída e o layout reajustado sem erros de compilação.
