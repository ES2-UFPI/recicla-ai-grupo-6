import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L, { LatLng } from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "./Coletas.css"; // Importar o novo CSS
import api from "../apiFetch";
import { FaMapMarkerAlt, FaClock, FaCheck, FaTruck, FaRoute } from "react-icons/fa";

// =============================
// ÍCONES CUSTOMIZADOS
// =============================
const iconOrigem = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const iconDestino = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

delete (L.Icon.Default.prototype as any)._getIconUrl;

// =============================
// DADOS E TIPOS
// =============================
const COOPERATIVA_FIXA = {
  nome: "Cooperativa Recicla Bem",
  lat: -5.0885,
  lng: -42.8016,
};

// =============================
// COMPONENTE DE ROTA
// =============================
function Rota({ pontoA, pontoB, onResumo, routeKey }: any) {
  const map = useMap();
  const roteadorRef = useRef<any>(null);
  const marcadoresRef = useRef<any[]>([]);
  const linhaRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // Limpa tudo antes de criar novo
    const limparTudo = () => {
      // Remove linha da rota
      if (linhaRef.current && map.hasLayer(linhaRef.current)) {
        map.removeLayer(linhaRef.current);
        linhaRef.current = null;
      }

      // Remove marcadores
      marcadoresRef.current.forEach((m) => {
        if (map.hasLayer(m)) {
          map.removeLayer(m);
        }
      });
      marcadoresRef.current = [];

      // Remove controle do routing (causa do erro)
      if (roteadorRef.current) {
        try {
          roteadorRef.current.off();

          if (map && map.removeControl) {
            map.removeControl(roteadorRef.current);
          }

        } catch (e) {
          console.warn("Erro ao limpar roteador", e);
        }

        roteadorRef.current = null;
      }

      // Remove containers do DOM
      setTimeout(() => {
        document.querySelectorAll(".leaflet-routing-container").forEach((e) => e.remove());
      }, 50);
    };

    limparTudo();

    // Adiciona marcadores
    const marcadorA = L.marker(pontoA, { icon: iconOrigem }).addTo(map);
    const marcadorB = L.marker(pontoB, { icon: iconDestino }).addTo(map);
    marcadoresRef.current = [marcadorA, marcadorB];

    // Ajusta zoom para mostrar ambos os pontos
    const bounds = L.latLngBounds([pontoA, pontoB]);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Cria roteador
    const roteador = L.Routing.control({
      waypoints: [pontoA, pontoB],
      lineOptions: { 
        styles: [{ color: "#28a745", weight: 6, opacity: 0.8 }],
        extendToWaypoints: false,
        missingRouteTolerance: 0
      },
      addWaypoints: false,
      draggableWaypoints: false,
      showAlternatives: false,
      show: false,
      createMarker: () => null,
      routeWhileDragging: false,
      fitSelectedRoutes: false,
    } as any);

    // Adiciona ao mapa apenas se ainda não foi adicionado
    try {
      roteador.addTo(map);
      roteadorRef.current = roteador;
    } catch (e) {
      console.warn("Erro ao adicionar roteador:", e);
      return;
    }

    // Listener de rota encontrada
    const handleRouteFound = (e: any) => {
      try {
        const r = e.routes[0];
        const distancia = (r.summary.totalDistance / 1000).toFixed(1) + " km";
        const tempo = Math.round(r.summary.totalTime / 60) + " min";
        onResumo({ distancia, tempo });

        // Guarda referência da linha da rota
        if (e.routes[0] && e.routes[0].coordinates) {
          linhaRef.current = L.polyline(e.routes[0].coordinates, {
            color: "#28a745",
            weight: 6,
            opacity: 0.8
          });
        }
      } catch (err) {
        console.warn("Erro ao processar rota:", err);
      }
    };

    roteador.on("routesfound", handleRouteFound);

    // Cleanup
    return () => {
      limparTudo();
    };
  }, [map, pontoA, pontoB, onResumo, routeKey]);

  return null;
}

// =============================
// COMPONENTE PRINCIPAL
// =============================
export default function ColetorHome() {
  const [coletas, setColetas] = useState<any[]>([]);
  const [selecionada, setSelecionada] = useState<any>(null);
  const [etapa, setEtapa] = useState<"INICIO" | "R1" | "R2">("INICIO");
  const [resumo, setResumo] = useState<{ distancia: string; tempo: string } | null>(null);
  const [pontoA, setPontoA] = useState<any>(null);
  const [pontoB, setPontoB] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleResumo = useCallback((r: any) => setResumo(r), []);

  // BUSCAR COLETAS DO BANCO DE DADOS
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resp = await api.request("/api/coletas/disponiveis/");
        const dados = await resp.json();
        console.log("=== DADOS RECEBIDOS DA API ===");
        console.log("Coletas:", dados);
        if (dados.length > 0) {
          console.log("Primeira coleta:", dados[0]);
          console.log("Estrutura do produtor:", dados[0].produtor);
          console.log("Itens:", dados[0].itens);
        }
        console.log("==============================");
        setColetas(dados);
      } catch (e) {
        console.error("Erro ao buscar coletas", e);
        setColetas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ACEITAR COLETA
  const aceitarColeta = async (c: any) => {
    console.log("=== ACEITAR COLETA ===");
    console.log("Coleta completa:", c);
    console.log("ID da coleta:", c.id);
    console.log("Produtor completo:", c.produtor);
    
    if (c.produtor) {
      console.log("Latitude:", c.produtor.latitude);
      console.log("Longitude:", c.produtor.longitude);
    }
    console.log("=====================");
    
    // Validações
    if (!c.produtor) {
      alert("Erro: Dados do produtor não encontrados!");
      return;
    }
    
    if (!c.produtor.latitude || !c.produtor.longitude) {
      alert("Erro: Coordenadas do produtor não encontradas!");
      return;
    }
    
    try {
      console.log("Tentando atualizar status para ACEITA...");
      
      // Tenta várias possibilidades de rota
      let response;
      const endpoints = [
        `/api/coletas/${c.id}/status/`,
        `http://localhost:8000/api/coletas/${c.id}/status/`,
        `/coletas/${c.id}/status/`,
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log("Tentando endpoint:", endpoint);
          response = await fetch(endpoint, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "SOLICITADA" }),
          });
          
          if (response.ok) {
            console.log("Sucesso com endpoint:", endpoint);
            break;
          } else {
            console.log(`Endpoint ${endpoint} falhou: ${response.status}`);
          }
        } catch (err) {
          console.log(`Erro ao tentar ${endpoint}:`, err);
        }
      }

     /* if (!response || !response.ok) {
       alert("Erro ao aceitar coleta. O status NÃO foi alterado.");
        return; // <<< ESSENCIAL
      }
        */

      console.log("Solicitando localização do GPS...");
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origem = new LatLng(pos.coords.latitude, pos.coords.longitude);
          const destino = new LatLng(
            parseFloat(c.produtor.latitude),
            parseFloat(c.produtor.longitude)
          );

          setSelecionada(c);
          setPontoA(origem);
          setPontoB(destino);
          setEtapa("R1");  // <<< só aqui!!
        },
        (error) => {
          alert("Não foi possível obter sua localização.");
        }
      );
    } catch (e) {
      console.error("Erro ao aceitar coleta:", e);
      // Não mostra alert, apenas continua
      setSelecionada(c);
      setEtapa("R1");
    }
  };

  // CONFIRMAR COLETA
  const confirmarColeta = async () => {
    try {
      // Usando fetch direto
      const response = await fetch(`http://localhost:8000/api/coletas/${selecionada.id}/status/`, {

        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CONFIRMADA" }),
      });

      if (!response.ok) {
        const txt = await response.text();
        console.error("ERRO NO PATCH (confirmar coleta)", response.status, txt);
        throw new Error(`Erro ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }

      setEtapa("R2");
      setResumo(null);

      const latP = parseFloat(selecionada.produtor.latitude);
      const lngP = parseFloat(selecionada.produtor.longitude);
      setPontoA(new LatLng(latP, lngP));
      setPontoB(new LatLng(COOPERATIVA_FIXA.lat, COOPERATIVA_FIXA.lng));
    } catch (e) {
      console.error("Erro ao confirmar coleta:", e);
      alert("Erro ao confirmar coleta. Tente novamente.");
    }
  };

const cancelarColetaOuEntrega = async () => {
  try {
    const response = await fetch(`http://localhost:8000/api/coletas/${selecionada.id}/status/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SOLICITADA" }),
    });

    const txt = await response.text();
    console.log("DEBUG CANCELAMENTO:", response.status, txt);

    if (!response.ok) {
      alert("Erro ao cancelar. Tente novamente.");
      return;
    }

    // Resetar tudo
    setEtapa("INICIO");
    setSelecionada(null);
    setPontoA(null);
    setPontoB(null);
    setResumo(null);

    // Recarrega lista
    setLoading(true);
    const resp = await api.request("/api/coletas/disponiveis/");
    const dados = await resp.json();
    setColetas(dados);
    setLoading(false);

  } catch (err) {
    console.error("Erro ao cancelar:", err);
    alert("Não foi possível cancelar a coleta.");
  }
};


  // CONCLUIR ENTREGA
  const concluirEntrega = async () => {
    try {
      // Usando fetch direto
      const response = await fetch(`/api/coletas/${selecionada.id}/status/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CONCLUIDA" }),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }

      alert("Coleta concluída com sucesso!");
      
      // Volta para a tela inicial e recarrega as coletas
      setEtapa("INICIO");
      setSelecionada(null);
      setPontoA(null);
      setPontoB(null);
      setResumo(null);
      
      // Recarrega a lista de coletas
      setLoading(true);
      const resp = await api.request("/api/coletas/disponiveis/");
      const dados = await resp.json();
      setColetas(dados);
      setLoading(false);
    } catch (e) {
      console.error("Erro ao concluir entrega:", e);
      alert("Erro ao concluir entrega. Tente novamente.");
    }
  };

  // =============================
  // TELA: LISTA DE COLETAS
  // =============================
  if (etapa === "INICIO") {
    if (loading) {
      return (
        <div className="list-container">
          <h2>Carregando coletas...</h2>
        </div>
      );
    }

    if (!coletas || coletas.length === 0) {
      return (
        <div className="list-container">
          <h2>Coletas Disponíveis</h2>
          <p>Nenhuma solicitação encontrada.</p>
        </div>
      );
    }

    return (
      <div className="list-container">
        <h2>Coletas Disponíveis</h2>
        {coletas.map((c) => (
          <div className="coleta-card" key={c.id}>
            <div className="card-content">
              <h3>{c.produtor?.nome || "Produtor não identificado"}</h3>
              <p className="address">
                {c.produtor?.rua || "Rua"}, {c.produtor?.numero || "S/N"} — {c.produtor?.bairro || "Bairro"}
              </p>
              <div className="material-info">
                {c.itens?.length || 0} tipo(s) de material
              </div>
            </div>

            <button className="btn-primary" onClick={() => aceitarColeta(c)}>
              <FaCheck /> Aceitar Coleta
            </button>
          </div>
        ))}
      </div>
    );
  }

  // =============================
  // TELA: ROTAS (MAPA)
  // =============================
  return (
    <div className="route-container">
      <h2>{etapa === "R1" ? "Rota até o Produtor" : "Rota até a Cooperativa"}</h2>

      {/* CARD DE RESUMO */}
      <div className="route-card">
        {/* LEGENDA */}
        <div className="legend">
          <span>
            <div className="marker origin"></div> Origem
          </span>
          <span>
            <div className="marker dest"></div> Destino
          </span>
        </div>

        {/* RESUMO DE TEMPO/DISTÂNCIA */}
        <div className="summary">
          <div className="item">
            <FaRoute /> {resumo?.distancia || "Calculando..."}
          </div>
          <div className="item">
            <FaClock /> {resumo?.tempo || "Calculando..."}
          </div>
        </div>
      </div>

      {/* MAPA */}
      {pontoA && pontoB && (
        <MapContainer
          center={pontoA}
          zoom={14}
          key={etapa} // Força remontagem do mapa ao trocar de etapa
          style={{
            height: "450px",
            width: "100%",
            borderRadius: "12px",
            marginTop: "20px",
          }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Rota 
            pontoA={pontoA} 
            pontoB={pontoB} 
            onResumo={handleResumo} 
            routeKey={etapa} // Força recriação da rota
          />
        </MapContainer>
      )}

      {/* BOTÕES */}
      {etapa === "R1" && (
        <>
          <button className="action-button primary-action" onClick={confirmarColeta}>
            <FaCheck /> Confirmar retirada (Ir para cooperativa)
          </button>

          <button className="action-button danger-action" onClick={cancelarColetaOuEntrega}>
            ❌ Cancelar coleta
          </button>
        </>
      )}

      {etapa === "R2" && (
        <>
          <button className="action-button success-action" onClick={concluirEntrega}>
            <FaTruck /> Concluir entrega
          </button>

          <button className="action-button danger-action" onClick={cancelarColetaOuEntrega}>
            ❌ Cancelar entrega
          </button>
        </>
      )}
    </div>
  );
}