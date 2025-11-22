import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L, { LatLng } from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "./Coletas.css";
import apiFetch from "../apiFetch";
// Mantendo os ícones novos (Spinner e CheckCircle)
import { FaMapMarkerAlt, FaClock, FaCheck, FaTruck, FaRoute, FaSpinner, FaCheckCircle } from "react-icons/fa";

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
// DADOS MOCK (Caso a API falhe)
// =============================
const LISTA_COOPERATIVAS_MOCK = [
  {
    id: 1,
    nome: "Cooperativa Recicla Bem (Centro)",
    endereco: "Av. Frei Serafim, 1234",
    lat: -5.0885,
    lng: -42.8016,
  },
  {
    id: 2,
    nome: "Cooperativa Verde Viver (Zona Leste)",
    endereco: "Rua das Acácias, 500",
    lat: -5.0531,
    lng: -42.7508,
  },
  {
    id: 3,
    nome: "Cooperativa Recicla Sul (Zona Sul)",
    endereco: "Av. Barão de Gurguéia, 3000",
    lat: -5.1129,
    lng: -42.7981,
  }
];

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

    const limparTudo = () => {
      if (linhaRef.current && map.hasLayer(linhaRef.current)) {
        map.removeLayer(linhaRef.current);
        linhaRef.current = null;
      }
      marcadoresRef.current.forEach((m) => {
        if (map.hasLayer(m)) {
          map.removeLayer(m);
        }
      });
      marcadoresRef.current = [];

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
      setTimeout(() => {
        document.querySelectorAll(".leaflet-routing-container").forEach((e) => e.remove());
      }, 50);
    };

    limparTudo();

    const marcadorA = L.marker(pontoA, { icon: iconOrigem }).addTo(map);
    const marcadorB = L.marker(pontoB, { icon: iconDestino }).addTo(map);
    marcadoresRef.current = [marcadorA, marcadorB];

    const bounds = L.latLngBounds([pontoA, pontoB]);
    map.fitBounds(bounds, { padding: [50, 50] });

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

    try {
      roteador.addTo(map);
      roteadorRef.current = roteador;
    } catch (e) {
      console.warn("Erro ao adicionar roteador:", e);
      return;
    }

    const handleRouteFound = (e: any) => {
      try {
        const r = e.routes[0];
        const distancia = (r.summary.totalDistance / 1000).toFixed(1) + " km";
        const tempo = Math.round(r.summary.totalTime / 60) + " min";
        onResumo({ distancia, tempo });

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
  // Estados atualizados com as novas etapas
  const [etapa, setEtapa] = useState<"INICIO" | "R1" | "SELECIONAR_COOPERATIVA" | "R2" | "AGUARDANDO" | "SUCESSO">("INICIO");
  const [resumo, setResumo] = useState<{ distancia: string; tempo: string } | null>(null);
  const [pontoA, setPontoA] = useState<any>(null);
  const [pontoB, setPontoB] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cooperativas, setCooperativas] = useState<any[]>([]);
  const [cooperativaSelecionada, setCooperativaSelecionada] = useState<any>(null);

  const handleResumo = useCallback((r: any) => setResumo(r), []);

  // BUSCAR COLETAS E COOPERATIVAS (Usando a lógica robusta do código antigo)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Busca coletas
        const respColetas = await apiFetch.request("/api/coletas/disponiveis/");
        const dadosColetas = await respColetas.json();
        setColetas(dadosColetas);

        // Busca cooperativas
        try {
          const respCoop = await apiFetch.request("/api/cooperativas/");
          if (respCoop && respCoop.ok) {
            const dadosCoop = await respCoop.json();

            // Lógica antiga de extração de lat/lng (importante!)
            const extractLatLng = (geom: any) => {
              if (!geom) return { lat: null, lng: null };
              if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
                return { lat: geom.coordinates[1], lng: geom.coordinates[0] };
              }
              if (typeof geom === 'string') {
                const m = geom.match(/POINT\(([-0-9.]+)\s+([-0-9.]+)\)/);
                if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]) };
              }
              return { lat: geom.latitude || geom.lat || null, lng: geom.longitude || geom.lng || null };
            };

            const cooperativasTransformadas = Array.isArray(dadosCoop)
              ? dadosCoop.map((coop: any) => {
                const { lat, lng } = extractLatLng(coop.geom);
                return {
                  id: coop.id,
                  nome: coop.nome_empresa || coop.nome || coop.email || `Cooperativa ${coop.id}`,
                  endereco: coop.rua ? `${coop.rua}${coop.numero ? ', ' + coop.numero : ''} — ${coop.bairro || ''}` : coop.endereco || '',
                  lat,
                  lng,
                  ...coop,
                };
              })
              : LISTA_COOPERATIVAS_MOCK;

            setCooperativas(cooperativasTransformadas);
          } else {
            setCooperativas(LISTA_COOPERATIVAS_MOCK);
          }
        } catch (err) {
          console.warn('Erro ao buscar cooperativas', err);
          setCooperativas(LISTA_COOPERATIVAS_MOCK);
        }

      } catch (e) {
        console.error("Erro ao buscar dados iniciais", e);
        setColetas([]);
        setCooperativas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // POLLING: Verifica status a cada 3s se estiver aguardando
  useEffect(() => {
    let intervalId: any;

    if (etapa === 'AGUARDANDO' && selecionada?.id) {
      console.log("Iniciando verificação de status...");
      intervalId = setInterval(async () => {
        try {
          const response = await apiFetch.request(`/api/coletas/${selecionada.id}/`);
          if (response.ok) {
            const data = await response.json();
            // Se o status mudou para CONCLUIDA, avança para tela de sucesso
            if (data.status === 'CONCLUIDA') {
              setEtapa('SUCESSO');
            }
          }
        } catch (error) {
          console.error("Erro ao verificar status:", error);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [etapa, selecionada]);

  // ACEITAR COLETA
  const aceitarColeta = async (c: any) => {
    console.log("=== ACEITAR COLETA ===");
    if (!c.produtor || !c.produtor.latitude || !c.produtor.longitude) {
      alert("Erro: Coordenadas do produtor não encontradas!");
      return;
    }
    try {
      // Chamada ao backend para aceitar
      const response = await apiFetch.request(`/api/coletas/${c.id}/aceitar/`, "POST");
      if (!response.ok) {
        const erroData = await response.json();
        alert(`Erro ao aceitar: ${erroData.detail || response.statusText}`);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origem = new LatLng(pos.coords.latitude, pos.coords.longitude);
          const destino = new LatLng(parseFloat(c.produtor.latitude), parseFloat(c.produtor.longitude));
          setSelecionada(c);
          setPontoA(origem);
          setPontoB(destino);
          setEtapa("R1");
        },
        (error) => { alert("Não foi possível obter sua localização."); }
      );
    } catch (e) { alert("Erro ao aceitar coleta."); }
  };

  // CONFIRMAR COLETA (Retirada)
  const confirmarColeta = async () => {
    try {
      const response = await apiFetch.request(`/api/coletas/${selecionada.id}/status/`, 'PATCH', { status: 'CONFIRMADA' });
      if(!response.ok) throw new Error();

      const latP = parseFloat(selecionada.produtor.latitude);
      const lngP = parseFloat(selecionada.produtor.longitude);
      setPontoA(new LatLng(latP, lngP));
      setPontoB(null);
      setResumo(null);
      setEtapa("SELECIONAR_COOPERATIVA");
    } catch (e) { alert("Erro ao confirmar coleta."); }
  };

  // <<< RESTAUREI A LÓGICA COMPLETA DO SEU CÓDIGO ANTIGO AQUI >>>
  const handleSelecionarCooperativa = async (coop: any) => {
    console.log("Cooperativa selecionada:", coop);
    setCooperativaSelecionada(coop);

    // 1. Associa no Backend
    if (selecionada && selecionada.id) {
      const tokenLocal = apiFetch.getToken();
      if (tokenLocal) {
        try {
          const payload: any = { cooperativa_id: coop.id, cooperativa: coop.id };
          await apiFetch.request(`/api/coletas/${selecionada.id}/associar_cooperativa/`, 'PATCH', payload);
          console.log('Cooperativa associada no backend');
        } catch (err) {
          console.warn('Erro ao associar coop no backend (seguindo localmente):', err);
        }
      }
    }

    // Função interna para Geocode (Do seu código antigo)
    const geocodeAddress = async (addressOrStructured: any) => {
      try {
        let url: string;
        if (typeof addressOrStructured === 'string') {
          const params = new URLSearchParams({ q: addressOrStructured, format: 'json', limit: '1' });
          url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        } else {
          const params = new URLSearchParams({ format: 'json', limit: '1' });
          if (addressOrStructured.street) params.set('street', addressOrStructured.street);
          if (addressOrStructured.postalcode) params.set('postalcode', addressOrStructured.postalcode);
          if (addressOrStructured.city) params.set('city', addressOrStructured.city);
          if (addressOrStructured.state) params.set('state', addressOrStructured.state);
          params.set('country', addressOrStructured.country || 'Brasil');
          url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        }
        const resp = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'ReciclaAi-Frontend' } });
        if (!resp.ok) return null;
        const data = await resp.json();
        if (!Array.isArray(data) || data.length === 0) return null;
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      } catch (err) {
        console.warn('Erro no geocode Nominatim:', err);
        return null;
      }
    };

    // 2. Obtém coordenadas: prefere campos já fornecidos, senão tenta geocodificar pelo endereço
    let lat = coop.lat ?? coop.latitude ?? null;
    let lng = coop.lng ?? coop.longitude ?? null;

    if (!lat || !lng) {
      // Lógica de fallback robusta do código antigo
      let addressForGeocode = '';

      if (coop.cep && coop.rua) {
        const ruaNum = coop.rua + (coop.numero ? ' ' + coop.numero : '');
        const structured = {
          street: ruaNum,
          postalcode: coop.cep,
          city: coop.cidade,
          state: coop.estado,
          country: 'Brasil',
        };
        const coords = await geocodeAddress(structured);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        } else {
          addressForGeocode = `${ruaNum}, ${coop.bairro || ''}, ${coop.cidade || ''} ${coop.estado || ''} CEP ${coop.cep}`;
        }
      } else {
        addressForGeocode = [coop.endereco, coop.rua, coop.numero, coop.bairro, coop.cidade, coop.estado]
          .filter(Boolean)
          .join(', ');
        if (addressForGeocode && addressForGeocode.length > 0) {
          const coords = await geocodeAddress(addressForGeocode);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
          }
        }
      }

      // Tentativa final com string
      if (!lat && addressForGeocode) {
        const coords2 = await geocodeAddress(addressForGeocode);
        if (coords2) {
          lat = coords2.lat;
          lng = coords2.lng;
        }
      }
    }

    // 3. Se encontrou coordenadas, avança
    if (lat && lng) {
      console.log('Coordenadas encontradas:', lat, lng);
      setPontoB(new LatLng(lat, lng));
      setResumo(null);
      setEtapa('R2');
    } else {
      console.warn('Não foram obtidas coordenadas válidas para a cooperativa selecionada:', coop);
      alert('Coordenadas da cooperativa não encontradas. Verifique o cadastro.');
    }
  };

  // CANCELAR
  const cancelarColetaOuEntrega = async () => {
    try {
      await apiFetch.request(`/api/coletas/${selecionada.id}/status/`, 'PATCH', { status: "SOLICITADA" });
      resetarEstado();
    } catch (err) { alert("Não foi possível cancelar."); }
  };

  // CONCLUIR ENTREGA -> Vai para AGUARDANDO
  const concluirEntrega = async () => {
    try {
      const token = apiFetch.getToken();
      if (!token) { alert('Faça login novamente.'); return; }
      if (!selecionada?.id) return;

      const response = await apiFetch.request(`/api/coletas/${selecionada.id}/status/`, 'PATCH', { status: 'AGUARDANDO' });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        alert(`Erro: ${errData?.detail || response.statusText}`);
        return;
      }
      setEtapa("AGUARDANDO");

    } catch (e) { alert("Erro ao processar entrega."); }
  };

  const resetarEstado = async () => {
      setEtapa("INICIO");
      setSelecionada(null);
      setPontoA(null);
      setPontoB(null);
      setResumo(null);
      setCooperativaSelecionada(null);
      setLoading(true);
      try {
        const resp = await apiFetch.request("/api/coletas/disponiveis/");
        const dados = await resp.json();
        setColetas(dados);
      } catch(e) {}
      setLoading(false);
  };

  // =============================
  // RENDERIZAÇÃO
  // =============================

  if (etapa === "INICIO") {
    if (loading) return <div className="list-container"><h2>Carregando...</h2></div>;
    return (
      <div className="list-container">
        <h2>Coletas Disponíveis</h2>
        {coletas.map((c) => {
           const qtdItens = typeof c.itens_count === 'number' ? c.itens_count : (c.itens?.length || 0);
           const tiposArr = c.tipos || (Array.isArray(c.itens) ? c.itens.map((it:any) => it.tipo_residuo) : []);
           return (
            <div className="coleta-card" key={c.id}>
                <div className="card-content">
                  <h3>{c.produtor?.nome || "Produtor"}</h3>
                  <p className="address">{c.produtor?.rua}, {c.produtor?.numero}</p>
                  <div className="material-info">
                     {tiposArr.length > 0 ? tiposArr.join(", ") : `${qtdItens} itens`}
                  </div>
                </div>
                <button className="btn-primary" onClick={() => aceitarColeta(c)}><FaCheck /> Aceitar Coleta</button>
            </div>
           );
        })}
      </div>
    );
  }

  if (etapa === "SELECIONAR_COOPERATIVA") {
    return (
      <div className="list-container">
        <h2>Escolha a Cooperativa de Destino</h2>
        {cooperativas.map((coop) => (
          <div className="coleta-card" key={coop.id}>
            <div className="card-content">
              <h3>{coop.nome}</h3>
              <p className="address">{coop.endereco}</p>
            </div>
            <button className="btn-primary" onClick={() => handleSelecionarCooperativa(coop)}><FaMapMarkerAlt /> Ir para esta</button>
          </div>
        ))}
        <button className="action-button danger-action" onClick={cancelarColetaOuEntrega} style={{ marginTop: '20px' }}>❌ Cancelar</button>
      </div>
    );
  }

  if (etapa === "AGUARDANDO") {
    return (
      <div className="list-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ marginBottom: '30px', fontSize: '3.5rem', color: '#f0ad4e' }}>
          <FaSpinner className="icon-spin" style={{ animation: 'spin 2s linear infinite' }} />
        </div>
        <h2 style={{ color: '#2c3e50' }}>Aguardando Cooperativa...</h2>
        <p style={{ fontSize: '1.2rem', color: '#6c757d' }}>Você chegou em: <strong>{cooperativaSelecionada?.nome}</strong></p>
        <p style={{ fontSize: '1rem', color: '#95a5a6' }}>Aguarde a confirmação no sistema da cooperativa.</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (etapa === "SUCESSO") {
    return (
      <div className="list-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ marginBottom: '30px', fontSize: '4rem', color: '#28a745' }}><FaCheckCircle /></div>
        <h2 style={{ color: '#28a745' }}>Entrega Finalizada!</h2>
        <button className="btn-primary" onClick={resetarEstado} style={{ maxWidth: '300px', margin: '20px auto' }}>Voltar para o Início</button>
      </div>
    );
  }

  return (
    <div className="route-container">
      <h2>{etapa === "R1" ? "Rota até o Produtor" : "Rota até a Cooperativa"}</h2>
      <div className="route-card">
        <div className="legend"><span><div className="marker origin"></div> Origem</span><span><div className="marker dest"></div> Destino</span></div>
        <div className="summary"><div className="item"><FaRoute /> {resumo?.distancia || "..."}</div><div className="item"><FaClock /> {resumo?.tempo || "..."}</div></div>
      </div>
      {pontoA && pontoB && (
        <MapContainer center={pontoA} zoom={14} key={`${etapa}-${pontoB.lat}-${pontoB.lng}`} style={{ height: "450px", width: "100%", borderRadius: "12px", marginTop: "20px" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Rota pontoA={pontoA} pontoB={pontoB} onResumo={handleResumo} routeKey={`${etapa}-${pontoB.lat}-${pontoB.lng}`} />
        </MapContainer>
      )}
      {etapa === "R1" && (
        <>
          <button className="action-button primary-action" onClick={confirmarColeta}><FaCheck /> Confirmar retirada</button>
          <button className="action-button danger-action" onClick={cancelarColetaOuEntrega}>❌ Cancelar coleta</button>
        </>
      )}
      {etapa === "R2" && (
        <>
          <button className="action-button success-action" onClick={concluirEntrega}><FaTruck /> Cheguei (Solicitar Confirmação)</button>
          <button className="action-button danger-action" onClick={cancelarColetaOuEntrega}>❌ Cancelar entrega</button>
        </>
      )}
    </div>
  );
}