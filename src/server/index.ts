import express from "express";
import WebSocket from "ws";
import chokidar from "chokidar";
import path from "path";

const app = express();
const wss = new WebSocket.Server({ port: 5001 });

app.use(express.static(path.join(__dirname, "../preview/build")));

// Servir uma página simples para testar
app.get("/", (req, res) => {
  console.log("🚀 Diretório atual (__dirname):", __dirname);
  res.send("Servidor React Native Preview rodando!");
});

app.listen(5002, () => {
  console.log("🚀 Servidor rodando na porta 5002");
});

// WebSocket para atualizar o preview em tempo real
wss.on("connection", (ws) => {
  console.log("Novo cliente conectado!");
  ws.send(JSON.stringify({ message: "Conectado ao servidor WebSocket" }));
});

// Monitorar mudanças nos arquivos
chokidar.watch("../src").on("change", (path) => {
  console.log(`Arquivo modificado: ${path}`);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ action: "reload" }));
    }
  });
});
