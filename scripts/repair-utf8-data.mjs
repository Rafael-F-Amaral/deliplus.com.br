import { createClient } from "@supabase/supabase-js";

import fs from "fs";

// Carregar variáveis do .env.local se não existirem no process.env
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:64321";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const sb = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Iniciando reparo de codificação UTF-8 no Supabase...");

  // 1. Produtos
  const products = [
    {
      id: "19618803-19b4-4f1b-a3dc-b81d757e042f",
      name: "Dadinhos de Tapioca",
      description: "Queijo coalho e tapioca granulada crocantes, acompanhados de geleia de pimenta defumada.",
      tags: ["Entradas", "Mais pedido"]
    },
    {
      id: "1b17ddbb-eba2-4621-95bc-cd7ffb5031d3",
      name: "Kombucha Hibisco e Limão",
      description: "Bebida fermentada naturalmente probiótica com infusão de flores de hibisco e limão.",
      tags: ["Bebidas"]
    },
    {
      id: "1bebd082-1334-4d96-9750-205d58783672",
      name: "Poke Clássico de Atum",
      description: "Atum fresco marinado, arroz shari, avocado, nori, pepino e molho ponzu especial.",
      tags: ["Bowls", "Destaque"]
    },
    {
      id: "26eb08b6-4937-40de-b93e-e7b7d6dbf0bd",
      name: "Bowl Frango Teriyaki",
      description: "Filé de frango grelhado ao molho teriyaki, quinoa real, brócolis ao vapor e gergelim.",
      tags: ["Bowls"]
    },
    {
      id: "2d4f538d-bc2c-4b16-bd87-f78c31bf2457",
      name: "Cheesecake Frutas Vermelhas",
      description: "Base crocante de amêndoas com creme leve de cream cheese e calda artesanal de amoras e framboesas.",
      tags: ["Sobremesas"]
    },
    {
      id: "5897f4ef-7c00-4353-96f3-08da9cf79441",
      name: "Açaí Especial Noma 400ml",
      description: "Açaí puro batido com banana, granola crocante artesanal, morangos frescos e mel.",
      tags: ["Sobremesas"]
    },
    {
      id: "78b53fff-f16b-4551-bef3-4ba096cb96d6",
      name: "Suco detox verde",
      description: "Couve, maçã verde, pepino, limão e gengibre prensados a frio.",
      tags: ["Bebidas"]
    },
    {
      id: "a98c8a4d-4f84-4f5c-a914-60dfbc6ec08b",
      name: "Brownie de chocolate",
      description: "Brownie úmido com cacau belga e gotas de chocolate nobre.",
      tags: ["Sobremesas"]
    },
    {
      id: "d7d4f471-e31d-4456-bf91-8756d801e1f0",
      name: "M Bowl Noma",
      description: "Salmão grelhado, arroz cateto, edamame, manga, repolho roxo, cenoura, gergelim e molho da casa.",
      tags: ["Bowls", "Mais pedido"]
    },
    {
      id: "eebf9b7e-0697-4e6d-b77f-d66cee9527bc",
      name: "Chá da casa",
      description: "Blend de ervas orgânicas da estação. Leve, aromático e reconfortante.",
      tags: ["Bebidas", "Orgânico"]
    },
    {
      id: "fe851a94-273c-4759-b8de-63038bfdf2db",
      name: "Bowl Vegano Raízes",
      description: "Abóbora assada, grão de bico crocante, rúcula, castanhas e molho tahine.",
      tags: ["Bowls", "Vegano"]
    }
  ];

  for (const p of products) {
    const { error } = await sb.from("products").update({
      name: p.name,
      description: p.description,
      tags: p.tags
    }).eq("id", p.id);
    if (error) console.error("Erro produto:", p.name, error);
  }
  console.log("✅ 11 produtos atualizados com sucesso!");

  // 2. Adicionais
  const complements = [
    {
      id: "991e99a1-80a5-49b5-abfc-a3ee5cb7b76a",
      name: "Edamame Fresco",
      description: "Porção adicional de edamame selecionado"
    },
    {
      id: "a62505e5-9bdf-4659-9e03-6b8ec70819b7",
      name: "Salmão Grelhado Extra",
      description: "100g de salmão fresco grelhado"
    },
    {
      id: "b20344e3-82fe-43f6-bf73-f70f3ae60d2a",
      name: "Quinoa Real em Dobro",
      description: "Porção extra de quinoa real cozida no vapor"
    }
  ];

  for (const c of complements) {
    const { error } = await sb.from("product_complements").update({
      name: c.name,
      description: c.description
    }).eq("id", c.id);
    if (error) console.error("Erro complemento:", c.name, error);
  }
  console.log("✅ Adicionais atualizados com sucesso!");

  // 3. Itens do Estoque
  const inventoryItems = [
    { id: "b7a20fa2-bdce-48ba-a432-d42f9a3c7c4c", name: "Feijão Carioca" },
    { id: "ef3006e1-2276-4d3f-b861-5ba59f4bfee7", name: "Óleo de Soja" },
    { id: "e78b3c1a-10a9-4222-b6e1-b0efc5a21540", name: "Açúcar Refinado" },
    { id: "bf94faa1-4cdf-4a40-8a29-ac97f9909363", name: "Macarrão Espaguete" },
    { id: "526990ff-dbe4-4788-ad72-d66382467a59", name: "Testejessée22222" }
  ];

  for (const item of inventoryItems) {
    const { error } = await sb.from("inventory_items").update({ name: item.name }).eq("id", item.id);
    if (error) console.error("Erro estoque:", item.name, error);
  }
  console.log("✅ Itens de estoque corrigidos com sucesso!");

  // 4. Categorias do Estoque
  const { error: catErr } = await sb
    .from("inventory_categories")
    .update({ name: "Testejessée" })
    .eq("id", "017f4650-864e-469e-ad24-255bbeb44e6f");
  if (catErr) console.error("Erro cat estoque:", catErr);
  else console.log("✅ Categorias de estoque corrigidas com sucesso!");

  // 5. Garantir status do pedido 28 como Cancelado
  await sb.from("orders").update({ status: "Cancelado" }).eq("order_number", 28);
  console.log("✅ Pedido #0028 configurado como Cancelado!");

  console.log("🎉 Reparo de UTF-8 finalizado 100%!");
}

main().catch(console.error);
