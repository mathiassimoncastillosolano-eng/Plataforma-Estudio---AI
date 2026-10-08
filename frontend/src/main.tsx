import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Aplicacion from "./App";
import { ProveedorAutenticacion } from "./hooks/useAutenticacion";
import { ProveedorAviso } from "./hooks/useAviso";
import { ProveedorTemaVisual } from "./hooks/useTemaVisual";
import { ProveedorBarraLateral } from "./hooks/useBarraLateral";
import "./estilos/tokens.css";
import "./estilos/componentes.css";
import "./estilos/disposicion.css";
import "./estilos/paginas.css";
import "./estilos/oscuro.css";
import "./estilos/temas.css";
import "./estilos/remasterizado.css";
import "./estilos/sistema.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ProveedorTemaVisual>
      <BrowserRouter>
        <ProveedorAutenticacion>
          <ProveedorAviso>
            <ProveedorBarraLateral>
              <Aplicacion />
            </ProveedorBarraLateral>
          </ProveedorAviso>
        </ProveedorAutenticacion>
      </BrowserRouter>
    </ProveedorTemaVisual>
  </React.StrictMode>
);
