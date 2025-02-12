import React from "react";
import "./App.css";
import { Text, View, Button } from "react-native";

function App() {
  return (
    <div className="App">
      <Text style={{ fontSize: 24 }}>Preview de Componentes</Text>
      <Button title="Testar Botão" onPress={() => alert("Botão clicado!")} />
    </div>
  );
}

export default App;
