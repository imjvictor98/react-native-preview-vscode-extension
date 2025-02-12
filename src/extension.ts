import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand("rn-preview.showPreview", () => {
    const panel = vscode.window.createWebviewPanel(
      "rn-preview",
      "React Native Preview",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    panel.webview.html = getWebviewContent();
  });

  context.subscriptions.push(disposable);
}


function getWebviewContent() {
  return `<!DOCTYPE html>
  <html lang="pt">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Preview</title>
  </head>
  <body>
      <iframe src="http://localhost:5002" width="100%" height="100%" frameborder="0"></iframe>
  </body>
  </html>`;
}
