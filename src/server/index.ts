import express from "express";
import WebSocket from "ws";
import chokidar from "chokidar";
import fs from "fs";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import * as path from "path";

const app = express();
const wss = new WebSocket.Server({ port: 5001 });
const projectRoot = path.join(__dirname, "../../../../../oi-minha-fibra-frontend/src");

app.use(express.static(path.join(__dirname, "../preview/build")));

app.get("/", (req, res) => {
  console.log("🚀 Diretório atual (__dirname):", __dirname);
  res.sendFile(path.join(__dirname, "../src/preview/build/index.html"));
});

app.get("/components", (req, res) => {
  const components = scanComponents(projectRoot);
  res.json(components);
});

app.listen(5002, () => {
  console.log("🚀 Servidor rodando na porta 5002");
});


wss.on("connection", (ws) => {
  console.log("Novo cliente conectado!");
  ws.send(JSON.stringify({ message: "Conectado ao servidor WebSocket" }));
});

chokidar.watch(`${projectRoot}/**/*.{js,jsx,ts,tsx}`, { ignored: /node_modules|\.git/ }).on("change", () => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ action: "reload" }));
    }
  });
});


const parseCode = (code: string) => {
  return parser.parse(code, {
    sourceType: "module", 
    plugins: [
      "typescript", 
      "jsx", 
    ],
  });
};

function scanComponents(dir: string): string[] {
  let components: string[] = [];
  
  function shouldIgnoreFile(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, "/"); // Para compatibilidade com Windows
    return (
      normalizedPath.includes("/src/utils/") ||
      normalizedPath.includes("/src/hooks/") ||
      normalizedPath.includes("/navigation/") || // Pasta comum para roteamento
      /router|navigator/i.test(path.basename(filePath)) // Nome do arquivo contém "router" ou "navigator"
    );
  }
  
  function isReactNativeComponent(filePath: string): boolean {
    if (shouldIgnoreFile(filePath)) {
      return false;
    }
  
    const code = fs.readFileSync(filePath, "utf-8");
    try {
      const ast = parseCode(code);
      let importsReactNative = false;
      let hasJSX = false;
      let isComponent = false;
  
      traverse(ast, {
        ImportDeclaration({ node }) {
          if (node.source.value === "react-native") {
            importsReactNative = true;
          }
        },
        ReturnStatement({ node }) {
          if (t.isJSXElement(node.argument)) {
            hasJSX = true;
          }
        },
        FunctionDeclaration({ node }) {
          if (node.id && /^[A-Z]/.test(node.id.name)) {
            isComponent = true;
          }
        },
        VariableDeclarator({ node }) {
          if (t.isIdentifier(node.id) && /^[A-Z]/.test(node.id.name)) {
            isComponent = true;
          }
        },
        CallExpression({ node }) {
          if (
            t.isMemberExpression(node.callee) &&
            t.isIdentifier(node.callee.object) &&
            node.callee.object.name === "React" &&
            t.isIdentifier(node.callee.property) &&
            ["memo", "forwardRef"].includes(node.callee.property.name)
          ) {
            isComponent = true;
          }
        },
      });
  
      return importsReactNative && (hasJSX || isComponent);
    } catch (error) {
      return false;
    }
  }
  

  function scanDir(directory: string) {
    fs.readdirSync(directory).forEach((file) => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDir(filePath);
      } else if (/\.(js|jsx|ts|tsx)$/.test(file) && isReactNativeComponent(filePath)) {
        components.push(filePath);
      }
    });
  }

  scanDir(dir);

  console.log(`🔍 Encontrados ${components.length} arquivos de componentes React Native`);

  return components;
}
