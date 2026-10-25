import { execSync } from "child_process";
import fs from "fs";
import http from "http";

// Garantir que os binários do Docker Desktop estejam no PATH do processo
const DOCKER_DESKTOP_PATHS = [
  "C:\\Users\\rafae\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin",
  "C:\\Program Files\\Docker\\Docker\\resources\\bin"
];

for (const p of DOCKER_DESKTOP_PATHS) {
  if (fs.existsSync(p) && !process.env.PATH?.includes(p)) {
    process.env.PATH = `${p};${process.env.PATH || ""}`;
  }
}

function checkHttp(url, timeoutMs = 2500) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.request(
        {
          hostname: u.hostname,
          port: u.port,
          path: u.pathname || "/",
          method: "HEAD",
          timeout: timeoutMs
        },
        () => resolve(true)
      );
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

function isDockerRunning() {
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function status() {
  console.log("\n🔍 Verificando status dos Motores DeliPlus (Docker Desktop)...");

  const isKongUp = await checkHttp("http://127.0.0.1:64321");
  const isStudioUp = await checkHttp("http://localhost:64323");
  const isAppUp = await checkHttp("http://localhost:3000");

  console.log("--------------------------------------------------");
  console.log(` Supabase API (Porta 64321):  ${isKongUp ? "🟢 ONLINE" : "🔴 OFFLINE"}`);
  console.log(` Supabase Studio (64323):     ${isStudioUp ? "🟢 ONLINE" : "🔴 OFFLINE"}`);
  console.log(` DeliPlus Next.js (3000):     ${isAppUp ? "🟢 ONLINE" : "🔴 OFFLINE"}`);
  console.log("--------------------------------------------------\n");

  return { isKongUp, isStudioUp, isAppUp };
}

async function start() {
  console.log("\n🚀 LIGANDO OS MOTORES DO DELIPLUS (DOCKER DESKTOP)...");

  // 1. Verificar Docker Desktop
  process.stdout.write("1. Verificando Docker Desktop... ");
  if (!isDockerRunning()) {
    console.log("\n⚠️ Docker Desktop não está respondendo. Certifique-se de que o Docker Desktop está aberto.");
  } else {
    console.log("✅ Docker ativo!");
  }

  // 2. Verificar Supabase
  process.stdout.write("2. Verificando Supabase (porta 64321)... ");
  let isKongUp = await checkHttp("http://127.0.0.1:64321");
  if (!isKongUp) {
    process.stdout.write("Iniciando containers (npx supabase start)... \n");
    try {
      execSync("npx supabase start", { stdio: "inherit" });
      console.log("✅ Supabase iniciado com sucesso!");
    } catch (err) {
      console.log("\n⚠️ Erro ao iniciar supabase:", err.message);
    }
  } else {
    console.log("✅ Já estava online!");
  }

  // 3. Confirmar portas
  await status();

  console.log("==================================================");
  console.log(" 🎉 MOTORES LIGADOS (DOCKER DESKTOP)!");
  console.log("==================================================");
  console.log(" 🌐 DeliPlus App:       http://localhost:3000");
  console.log(" 📋 Cardápio:           http://localhost:3000/dashboard/menu");
  console.log(" 📦 Pedidos:            http://localhost:3000/dashboard/orders");
  console.log(" 🛠️  Supabase Studio:    http://localhost:64323");
  console.log(" 🔌 Supabase API:       http://127.0.0.1:64321");
  console.log("==================================================");
}

async function stop() {
  console.log("\n🛑 DESLIGANDO OS MOTORES...");

  try {
    process.stdout.write("1. Parando containers do Supabase... ");
    execSync("npx supabase stop", { stdio: "inherit" });
    console.log("✅ Supabase parado com sucesso!");
  } catch (err) {
    console.log("⚠️ Supabase stop notice:", err.message);
  }

  console.log("==================================================");
  console.log(" 💤 MOTORES DESLIGADOS!");
  console.log("==================================================\n");
}

const action = process.argv[2] || "status";
if (action === "start") {
  start();
} else if (action === "stop") {
  stop();
} else {
  status();
}
