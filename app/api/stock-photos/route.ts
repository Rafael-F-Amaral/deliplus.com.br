import { NextResponse } from "next/server";

export interface StockPhoto {
  id: string;
  title: string;
  category: string;
  tags: string[];
  url: string;
  thumb_url: string;
  photographer: string;
  photographer_url: string;
  source: "unsplash" | "pexels" | "curated";
}

// Catálogo Curado Oficial DeliPlus (Alta resolução 1400px, proporção panorâmica ideal para vitrine)
const CURATED_FOOD_COVERS: StockPhoto[] = [
  // 🍕 1. PIZZAS & FORNO A LENHA
  {
    id: "pizza-1",
    title: "Pizza Margherita Artesanal",
    category: "pizza",
    tags: ["pizza", "margherita", "forno", "queijo", "manjericão", "italiana"],
    url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Ivan Torres",
    photographer_url: "https://unsplash.com/@itoffee",
    source: "curated",
  },
  {
    id: "pizza-2",
    title: "Forno a Lenha Tradicional em Brasa",
    category: "pizza",
    tags: ["forno", "lenha", "fogo", "pizza", "artesanal", "pizzaria"],
    url: "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Kelvin T",
    photographer_url: "https://unsplash.com/@kelvin255",
    source: "curated",
  },
  {
    id: "pizza-3",
    title: "Fatias de Pizza Pepperoni Crocante",
    category: "pizza",
    tags: ["pizza", "pepperoni", "calabresa", "queijo", "massa"],
    url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Sahand Babali",
    photographer_url: "https://unsplash.com/@sahandbabali",
    source: "curated",
  },
  {
    id: "pizza-4",
    title: "Mesa Rústica com Ingredientes de Pizza",
    category: "pizza",
    tags: ["farinha", "tomate", "azeite", "massa", "artesanal", "bancada"],
    url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Aurélien Lemasson",
    photographer_url: "https://unsplash.com/@aurelienlemasson",
    source: "curated",
  },
  {
    id: "pizza-5",
    title: "Pizza Gourmet Quatro Queijos",
    category: "pizza",
    tags: ["pizza", "queijos", "gourmet", "crocante", "forno"],
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Chad Montano",
    photographer_url: "https://unsplash.com/@briewilly",
    source: "curated",
  },

  // 🍔 2. HAMBÚRGUERES & GRELHA
  {
    id: "burger-1",
    title: "Smash Burger Artesanal com Queijo Derretido",
    category: "burger",
    tags: ["hamburguer", "burger", "smash", "cheddar", "bacon", "artesanal"],
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "amirali mirhashemian",
    photographer_url: "https://unsplash.com/@amir_v_ali",
    source: "curated",
  },
  {
    id: "burger-2",
    title: "Hambúrguer Gourmet com Batata Rústica",
    category: "burger",
    tags: ["burger", "hamburguer", "batata", "fritas", "artesanal", "lanche"],
    url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Shourav Sheikh",
    photographer_url: "https://unsplash.com/@shouravsheikh",
    source: "curated",
  },
  {
    id: "burger-3",
    title: "Carnes Sendo Grelhadas na Brasa",
    category: "burger",
    tags: ["grelha", "carne", "fogo", "churrasco", "brasa", "smoke"],
    url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Lukas",
    photographer_url: "https://unsplash.com/@lukasblazek",
    source: "curated",
  },
  {
    id: "burger-4",
    title: "Duplo Bacon Burger com Pão Brioche",
    category: "burger",
    tags: ["burger", "bacon", "duplo", "cheddar", "artesanal", "hamburgueria"],
    url: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Jonathan Borba",
    photographer_url: "https://unsplash.com/@jonathanborba",
    source: "curated",
  },

  // 🥗 3. SAUDÁVEL, SALADAS & BOWLS
  {
    id: "healthy-1",
    title: "Bowl Nutritivo de Grãos e Vegetais Frescos",
    category: "healthy",
    tags: ["saudavel", "bowl", "vegetais", "salada", "fit", "fitness", "organico"],
    url: "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Dan Gold",
    photographer_url: "https://unsplash.com/@danielcgold",
    source: "curated",
  },
  {
    id: "healthy-2",
    title: "Salada Mediterrânea com Ervas e Azeite",
    category: "healthy",
    tags: ["salada", "saudavel", "mediterranea", "azeite", "fresco", "vegetariano"],
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Brooke Lark",
    photographer_url: "https://unsplash.com/@brookelark",
    source: "curated",
  },
  {
    id: "healthy-3",
    title: "Bowl Tropical com Abacate e Sementes",
    category: "healthy",
    tags: ["abacate", "poke", "bowl", "saudavel", "fit", "verdes"],
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Ella Olsson",
    photographer_url: "https://unsplash.com/@ellaolsson",
    source: "curated",
  },

  // 🍣 4. SUSHI & CULINÁRIA JAPONESA
  {
    id: "japanese-1",
    title: "Combinado Premium de Sushis e Sashimis",
    category: "japanese",
    tags: ["sushi", "sashimi", "japones", "japonesa", "salmao", "temaki"],
    url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Vinicius Benedit",
    photographer_url: "https://unsplash.com/@viniciusbennedit",
    source: "curated",
  },
  {
    id: "japanese-2",
    title: "Rolls de Salmão com Hashi e Molho Shoyu",
    category: "japanese",
    tags: ["sushi", "roll", "shoyu", "japones", "peixe", "oriental"],
    url: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Mahmoud Fawzy",
    photographer_url: "https://unsplash.com/@mahmoudfawzyy",
    source: "curated",
  },
  {
    id: "japanese-3",
    title: "Tigela Tradicional de Ramen Quente",
    category: "japanese",
    tags: ["ramen", "lamen", "japones", "caldo", "oriental", "massa"],
    url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Mae Mu",
    photographer_url: "https://unsplash.com/@itsmaemu",
    source: "curated",
  },

  // 🍝 5. MASSAS & CULINÁRIA ITALIANA
  {
    id: "pasta-1",
    title: "Fettuccine com Cogumelos e Parmesão Ralado",
    category: "pasta",
    tags: ["massa", "macarrao", "pasta", "italiana", "queijo", "parmesao"],
    url: "https://images.unsplash.com/photo-1621996346565-e3d5d628178c?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1621996346565-e3d5d628178c?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Eiliv Aceron",
    photographer_url: "https://unsplash.com/@eilivaceron",
    source: "curated",
  },
  {
    id: "pasta-2",
    title: "Spaghetti Clássico com Molho de Tomates Frescos",
    category: "pasta",
    tags: ["spaghetti", "macarrao", "tomate", "italiana", "manjericao"],
    url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Kenta Kikuchi",
    photographer_url: "https://unsplash.com/@kenta_kikuchi",
    source: "curated",
  },

  // 🍇 6. AÇAÍ, SORVETES & SOBREMESAS
  {
    id: "acai-1",
    title: "Tigela de Açaí Cremoso com Banana e Granola",
    category: "dessert",
    tags: ["acai", "sorvete", "sobremesa", "frutas", "granola", "doce"],
    url: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Mariana Medvedeva",
    photographer_url: "https://unsplash.com/@medvedevaphoto",
    source: "curated",
  },
  {
    id: "acai-2",
    title: "Taça Artesanal de Gelato Italiano",
    category: "dessert",
    tags: ["gelato", "sorvete", "sobremesa", "doces", "gelateria"],
    url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Lukas",
    photographer_url: "https://unsplash.com/@lukasblazek",
    source: "curated",
  },
  {
    id: "acai-3",
    title: "Bolo de Chocolate Artesanal com Cobertura Brilhante",
    category: "dessert",
    tags: ["bolo", "chocolate", "doce", "confeitaria", "sobremesa", "torta"],
    url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "American Heritage Chocolate",
    photographer_url: "https://unsplash.com/@heritageschocolates",
    source: "curated",
  },

  // ☕ 7. CAFÉ, PADARIA & BRUNCH
  {
    id: "bakery-1",
    title: "Café Espresso com Latte Art e Grãos Selecionados",
    category: "bakery",
    tags: ["cafe", "coffee", "espresso", "latte", "cafeteria", "barista"],
    url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Nathan Dumlao",
    photographer_url: "https://unsplash.com/@nate_dumlao",
    source: "curated",
  },
  {
    id: "bakery-2",
    title: "Pães Artesanais de Fermentação Natural e Croissants",
    category: "bakery",
    tags: ["pao", "padaria", "croissant", "fermentacao", "brunch", "artesanal"],
    url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Mae Mu",
    photographer_url: "https://unsplash.com/@itsmaemu",
    source: "curated",
  },

  // 🥩 8. CARNES, CHURRASCO & ESPETOS
  {
    id: "meat-1",
    title: "Corte Nobre de Picanha Fatiada na Tábua de Madeira",
    category: "meat",
    tags: ["carne", "churrasco", "picanha", "grelha", "artesanal", "churrascaria"],
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Eiliv Aceron",
    photographer_url: "https://unsplash.com/@eilivaceron",
    source: "curated",
  },
  {
    id: "meat-2",
    title: "Costela Defumada no Estilo American BBQ",
    category: "meat",
    tags: ["costela", "bbq", "churrasco", "defumado", "carne", "smoke"],
    url: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Alexander Kovacs",
    photographer_url: "https://unsplash.com/@alexanderkovacs",
    source: "curated",
  },

  // 🍲 9. COMIDA CASEIRA & MARMITAS
  {
    id: "brazilian-1",
    title: "Feijoada Brasileira Tradicional em Panela de Barro",
    category: "brazilian",
    tags: ["feijoada", "brasileira", "caseira", "marmita", "prato feito", "almoço"],
    url: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Gabriel Bassino",
    photographer_url: "https://unsplash.com/@gabrielbassino",
    source: "curated",
  },

  // 🍻 10. CHOPP, DRINKS & PETISCOS
  {
    id: "drinks-1",
    title: "Chopp Artesanal com Espuma Densa e Petiscos",
    category: "drinks",
    tags: ["chopp", "cerveja", "bar", "petiscos", "choperia", "pub"],
    url: "https://images.unsplash.com/photo-1538488881523-298f007c53e0?auto=format&w=1600&q=85",
    thumb_url: "https://images.unsplash.com/photo-1538488881523-298f007c53e0?auto=format&fit=crop&w=500&h=300&q=80",
    photographer: "Jon Parry",
    photographer_url: "https://unsplash.com/@jonparry",
    source: "curated",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || searchParams.get("query") || "").toLowerCase().trim();
  const category = (searchParams.get("category") || "").toLowerCase().trim();
  const randomize = searchParams.get("random") === "true";

  // 1. Tentar Unsplash API oficial se chave configurada
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplashKey && query) {
    try {
      const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query + " food restaurant"
      )}&per_page=24&orientation=landscape`;
      const res = await fetch(unsplashUrl, {
        headers: { Authorization: `Client-ID ${unsplashKey}` },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        const photos: StockPhoto[] = data.results.map((item: any) => ({
          id: item.id,
          title: item.description || item.alt_description || "Foto de capa gastronômica",
          category: category || "gastronomia",
          tags: item.tags?.map((t: any) => t.title) || [],
          url: `${item.urls.raw}&auto=format&w=1600&q=85`,
          thumb_url: `${item.urls.raw}&auto=format&fit=crop&w=500&h=300&q=80`,
          photographer: item.user.name,
          photographer_url: item.user.links.html,
          source: "unsplash" as const,
        }));

        return NextResponse.json({
          photos,
          total: data.total,
          source: "unsplash",
        });
      }
    } catch (err) {
      console.warn("Unsplash API fallback to curated catalog:", err);
    }
  }

  // 2. Tentar Pexels API oficial se chave configurada
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey && query) {
    try {
      const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        query + " food"
      )}&per_page=24&orientation=landscape`;
      const res = await fetch(pexelsUrl, {
        headers: { Authorization: pexelsKey },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        const photos: StockPhoto[] = data.photos.map((item: any) => ({
          id: String(item.id),
          title: item.alt || "Capa gastronômica Pexels",
          category: category || "gastronomia",
          tags: [query],
          url: item.src.landscape || item.src.large,
          thumb_url: item.src.medium,
          photographer: item.photographer,
          photographer_url: item.photographer_url,
          source: "pexels" as const,
        }));

        return NextResponse.json({
          photos,
          total: data.total_results,
          source: "pexels",
        });
      }
    } catch (err) {
      console.warn("Pexels API fallback to curated catalog:", err);
    }
  }

  // 3. Catálogo Curado Oficial com filtro inteligente e aleatorização
  let filtered = [...CURATED_FOOD_COVERS];

  if (category && category !== "todas" && category !== "all") {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (query) {
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  // Se não buscou por query específica, embaralha para dar opções diferentes a cada lojista
  if (!query && randomize) {
    filtered = [...filtered].sort(() => Math.random() - 0.5);
  }

  return NextResponse.json({
    photos: filtered,
    total: filtered.length,
    source: "curated",
  });
}
