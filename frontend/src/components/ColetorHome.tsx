import React, { useState, useEffect, useRef, useCallback } from 'react'; // Adicionamos useCallback
import './Coletas.css';
import { FaMapMarkerAlt, FaBoxOpen, FaInfoCircle, FaTimes, FaWarehouse, FaStar, FaSpinner } from 'react-icons/fa'; // Mudei para fa6

// Importações do Leaflet
import { MapContainer, TileLayer, useMap } from 'react-leaflet'; // Importamos o useMap
import L, { LatLng } from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Correção para o Bug dos Ícones
delete (L.Icon.Default.prototype as any)._getIconUrl; 
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// --- DADOS DE EXEMPLO (MOCK DATA) ---
const mockCooperativasDisponiveis = [
  {
    id: 'coop01',
    nome: 'Cooperativa Recicla Bem',
    endereco: 'Av. Industrial, 500, Bairro Industrial',
    lat: -5.0885,
    lng: -42.8016,
    materiaisInteresse: [
      { categoria: 'Plástico', preco: 'R$ 2,50/kg' },
      { categoria: 'Papel', preco: 'R$ 1,20/kg' },
      { categoria: 'Metal', preco: 'R$ 5,00/kg' },
    ],
  },
  {
    id: 'coop02',
    nome: 'Central Verde',
    endereco: 'Rua das Árvores, 99, Bairro Ecológico',
    lat: -5.0930,
    lng: -42.8100,
    materiaisInteresse: [
      { categoria: 'Vidro', preco: 'R$ 0,80/kg' },
      { categoria: 'Eletrônico', preco: 'Sob consulta' },
      { categoria: 'Papel', preco: 'R$ 1,35/kg' },
    ],
  },
];
const mockColetasDisponiveis = [
    {
      id: 'c001',
      distancia: '1.2 km',
      produtor: {
        nome: 'Ana Luiza',
        endereco: 'Rua das Flores, 123, Bairro Centro',
      },
      itens: [
        { id: 'i1', descricao: 'Cerca de 10 garrafas PET', categoria: 'Plástico' },
        { id: 'i2', descricao: 'Jornais e 1 caixa de papelão', categoria: 'Papel' },
      ],
    },
    {
      id: 'c002',
      distancia: '3.5 km',
      produtor: {
        nome: 'Mercado Bom Preço',
        endereco: 'Av. Principal, 1020, Bairro Sul',
      },
      itens: [
        { id: 'i3', descricao: 'Muitas caixas de papelão desmontadas', categoria: 'Papel' },
        { id: 'i4', descricao: 'Latas de alumínio (aprox. 2 sacos)', categoria: 'Metal' },
      ],
    },
  ];

// --- NOVO COMPONENTE DE ROTA ---
// Este componente é feito para ser colocado DENTRO de um <MapContainer>
interface RouteCalculatorProps {
  pontoA: LatLng;
  pontoB: LatLng;
  onSummary: (summary: string) => void;
}

const RouteCalculator: React.FC<RouteCalculatorProps> = ({ pontoA, pontoB, onSummary }) => {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const markerARef = useRef<L.Marker | null>(null);
  const markerBRef = useRef<L.Marker | null>(null);

  // Ícones personalizados
const iconColetor = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const iconCooperativa = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

  useEffect(() => {
    
    if (!map) return;

    let isUnmounted = false;
    let created = false;
    let readyTimeout: number | null = null;

    const handleRoutesFound = (e: any) => {
      if (isUnmounted) return;
      try {
        const routes = e.routes;
        if (!routes || routes.length === 0) return;
        const summary = routes[0].summary;
        const totalDistance = (summary.totalDistance / 1000).toFixed(1) + ' km';
        const totalTime = Math.round(summary.totalTime / 60) + ' min';
        onSummary(`Distância: ${totalDistance}  |  Tempo Estimado: ${totalTime}`);
      } catch (err) {
        console.error('Erro ao processar rota:', err);
      }
    };

    const createRouting = () => {
      if (isUnmounted) return;
      // limpa antigos (com checagens para evitar erros)
      try {
        if (routingControlRef.current) {
          const old = routingControlRef.current as any;
          try { old.off && old.off('routesfound', handleRoutesFound); } catch {}
          if (old._map) {
            try { map.removeControl(old); } catch (err) { /* ignore */ }
          }
          routingControlRef.current = null;
        }
      } catch (err) {
        console.warn('Erro ao limpar control antigo (ignored):', err);
      }

      try {
        if (markerARef.current && map.hasLayer(markerARef.current)) {
          map.removeLayer(markerARef.current);
        }
      } catch (err) {}
      markerARef.current = null;

      try {
        if (markerBRef.current && map.hasLayer(markerBRef.current)) {
          map.removeLayer(markerBRef.current);
        }
      } catch (err) {}
      markerBRef.current = null;

      // adiciona marcadores
      try {
        markerARef.current = L.marker(pontoA, { icon: iconColetor })
          .addTo(map)
          .bindPopup('🧍 Sua localização');

        markerBRef.current = L.marker(pontoB, { icon: iconCooperativa })
          .addTo(map)
          .bindPopup('🏭 Cooperativa');

      } catch (err) {
        console.warn('Erro ao adicionar marcadores:', err);
      }

      // cria controle de rota
      try {
        routingControlRef.current = (L.Routing.control({
          waypoints: [pontoA, pontoB],
          show: false,
          addWaypoints: false,
          routeWhileDragging: false,
          draggableWaypoints: false,
          createMarker: () => null,
          lineOptions: {
            styles: [{ color: '#28a745', opacity: 0.8, weight: 6 }]
          }
        } as any)).addTo(map);

        const ctrl = routingControlRef.current as any;
        if (ctrl && typeof ctrl.on === 'function') {
          ctrl.on('routesfound', handleRoutesFound);
          // opcional: ouvir erro de rota e tratar
          ctrl.on && ctrl.on('routingerror', (err: any) => {
            if (isUnmounted) return;
            console.warn('Routing error:', err);
            onSummary('Não foi possível calcular a rota.');
          });
        }
        created = true;
      } catch (err) {
        console.error('Erro ao criar routing control:', err);
      }
    };

    // Tentamos criar a rota somente quando o mapa estiver pronto.
    // Quando dentro de modal o mapa pode já estar "ready" mas a div ainda com animação
    // então usamos whenReady + um pequeno timeout como fallback.
    try {
      map.whenReady(() => {
        // força invalidateSize (ajusta tamanho) e cria rota com pequeno delay
        try { map.invalidateSize(); } catch (err) {}
        // delay para evitar problemas com animações de modal
        readyTimeout = window.setTimeout(() => createRouting(), 120);
      });
      // fallback: se whenReady não disparar em X ms (raro), criamos mesmo assim
      const fallback = window.setTimeout(() => {
        if (!created && !isUnmounted) {
          try { map.invalidateSize(); } catch (err) {}
          createRouting();
        }
      }, 1000);
      // limpamos fallback no cleanup
      return () => {
        isUnmounted = true;
        try { clearTimeout(fallback); } catch {}
        if (readyTimeout) {
          try { clearTimeout(readyTimeout); } catch {}
        }

        // removendo listeners antes de remover controle (para evitar callbacks tardios)
        try {
          if (routingControlRef.current) {
            const ctrl = routingControlRef.current as any;
            try { ctrl.off && ctrl.off('routesfound', handleRoutesFound); } catch {}
            try { ctrl.off && ctrl.off('routingerror'); } catch {}
            // tenta abortar requisição pendente (se houver)
            try {
              // várias implementações internas do LRM usam xhr/requests com nomes diferentes,
              // tentamos alguns caminhos comuns dentro de try/catch
              if (ctrl._router) {
                if (ctrl._router._xhr && typeof ctrl._router._xhr.abort === 'function') {
                  ctrl._router._xhr.abort();
                }
                if (ctrl._router.abort && typeof ctrl._router.abort === 'function') {
                  ctrl._router.abort();
                }
                // algumas versões colocam algo como _routingEngine/_requests
                if (ctrl._router._routingEngine && typeof ctrl._router._routingEngine.abort === 'function') {
                  ctrl._router._routingEngine.abort();
                }
              }
            } catch (err) { /* ignore abort errors */ }

            // remove controle somente se ainda ligado a um mapa
            try {
              if (ctrl._map && typeof map.removeControl === 'function') {
                map.removeControl(routingControlRef.current);
              }
            } catch (err) {
              // ignore
            }
            routingControlRef.current = null;
          }
        } catch (err) {
          console.warn('Erro durante cleanup do routing control (ignored):', err);
        }

        // remove marcadores de forma segura
        try {
          if (markerARef.current && map.hasLayer(markerARef.current)) {
            map.removeLayer(markerARef.current);
          }
        } catch (err) {}
        markerARef.current = null;

        try {
          if (markerBRef.current && map.hasLayer(markerBRef.current)) {
            map.removeLayer(markerBRef.current);
          }
        } catch (err) {}
        markerBRef.current = null;
      };
    } catch (err) {
      console.error('Erro no setup do RouteCalculator:', err);
      // cleanup se falhar no setup inicial
      return () => {};
    }
  }, [map, pontoA, pontoB, onSummary]);

  return null;
};


// --- COMPONENTE PRINCIPAL (ATUALIZADO) ---
const ColetorHome = () => {
  const [coletaSelecionada, setColetaSelecionada] = useState<typeof mockColetasDisponiveis[0] | null>(null);
  const [routeDetails, setRouteDetails] = useState<{ pontoA: LatLng, coopName: string, pontoB: LatLng } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [routeSummary, setRouteSummary] = useState<string | null>(null);

  // --- ESTA É A CORREÇÃO ---
  // Envolvemos a função 'setRouteSummary' em 'useCallback'.
  // Isso garante que a função 'handleSummary' tenha sempre a
  // mesma referência, impedindo que o 'useEffect' do 'RouteCalculator'
  // rode a limpeza (o removeControl) desnecessariamente.
  const handleSummary = useCallback((summary: string) => {
    setRouteSummary(summary);
  }, []); // O array vazio [] garante que a função nunca mude.
  // --- FIM DA CORREÇÃO ---


  const handleAceitarColeta = (coletaId: string, cooperativa: typeof mockCooperativasDisponiveis[0]) => {
    
    setMapLoading(true); 
    setColetaSelecionada(null); 
    setRouteSummary(null); 

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const pontoA = new LatLng(latitude, longitude);
        const pontoB = new LatLng(cooperativa.lat, cooperativa.lng);

        setRouteDetails({ pontoA, pontoB, coopName: cooperativa.nome });
        setMapLoading(false); 
        
        console.log(`Coleta ${coletaId} aceita! Rota: Minha Posição -> ${cooperativa.nome}`);
      },
      (error) => {
        console.error("Erro ao obter geolocalização:", error);
        alert("Erro ao obter sua localização. Verifique as permissões do navegador.");
        setMapLoading(false); 
      }
    );
  };

  return (
    <div className="coletas-disponiveis-container">
      <h1>Coletas Disponíveis Próximas a Você</h1>
      <div className="coletas-grid">
        {mockColetasDisponiveis.map((coleta) => (
          <div key={coleta.id} className="coleta-card">
            <div className="card-header">
              <h3>{coleta.produtor.nome}</h3>
              <span className="distancia-badge"><FaMapMarkerAlt /> {coleta.distancia}</span>
            </div>
            <p className="endereco-produtor">{coleta.produtor.endereco}</p>
            <div className="itens-preview"><FaBoxOpen /> {coleta.itens.length} tipo(s) de material</div>
            <div className="card-actions">
              <button className="details-button" onClick={() => setColetaSelecionada(coleta)}>
                <FaInfoCircle /> Ver Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL 1: DETALHES DA COLETA --- */}
      {coletaSelecionada && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal-btn" onClick={() => setColetaSelecionada(null)}><FaTimes /></button>
            <h2>Detalhes da Coleta #{coletaSelecionada.id}</h2>

            <div className="modal-section">
              <h4>Produtor</h4>
              <p><strong>Nome:</strong> {coletaSelecionada.produtor.nome}</p>
              <p><strong>Endereço:</strong> {coletaSelecionada.produtor.endereco}</p>
            </div>
            <div className="modal-section">
              <h4>Itens a Coletar</h4>
              <ul className="modal-itens-list">
                {coletaSelecionada.itens.map(item => (
                  <li key={item.id}>
                    <span className="item-descricao">{item.descricao}</span>
                    <span className="item-categoria">{item.categoria}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="modal-section">
              <h4><FaWarehouse /> Escolha uma Cooperativa para a Entrega</h4>
              <div className="cooperativas-sugeridas-list">
                {mockCooperativasDisponiveis.map(coop => {
                  const itensDeInteresseNestaColeta = coletaSelecionada.itens.filter(itemDaColeta =>
                    coop.materiaisInteresse.some(itemDeInteresse => itemDeInteresse.categoria === itemDaColeta.categoria)
                  );
                  return (
                    <div key={coop.id} className="cooperativa-sugerida-card">
                      <div className="coop-card-header">
                        <h5>{coop.nome}</h5>
                        <span>{coop.endereco}</span>
                      </div>
                      <div className="coop-card-body">
                        <strong>Itens de interesse nesta coleta:</strong>
                        {itensDeInteresseNestaColeta.length > 0 ? (
                          <div className="itens-interesse-list">
                            {itensDeInteresseNestaColeta.map(item => {
                              const interesse = coop.materiaisInteresse.find(i => i.categoria === item.categoria);
                              return (
                                <div key={item.id} className="item-interesse">
                                  <FaStar className="star-icon" /> {item.categoria}
                                  <span className="preco-tag">{interesse?.preco}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="nenhum-interesse-msg">Nenhum item de alto interesse nesta coleta.</p>
                        )}
                      </div>
                      <div className="coop-card-footer">
                        <button className="accept-button" onClick={() => handleAceitarColeta(coletaSelecionada.id, coop)}>
                          Aceitar e Ver Rota
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- OVERLAY DE LOADING DO GPS --- */}
      {mapLoading && (
        <div className="modal-overlay loading-overlay">
          <FaSpinner className="loading-spinner" />
          <p>Obtendo sua localização GPS...</p>
        </div>
      )}

      {/* --- MODAL 2: MAPA DA ROTA (ATUALIZADO) --- */}
      {routeDetails && (
        <div className="modal-overlay map-modal-overlay">
          <div className="modal-content map-modal-content">
          <div className="map-legend">
            <div><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" width="15" /> Sua Localização</div>
            <div><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" width="15" /> Cooperativa</div>
          </div>
            <button className="close-modal-btn" onClick={() => setRouteDetails(null)}><FaTimes /></button>
            <h2>Rota para {routeDetails.coopName}</h2>
            
            <p className="route-summary">
              {routeSummary || 'Calculando rota pelas ruas...'}
            </p>
            
            
            {/* ATUALIZADO: O MapContainer agora vive aqui */}
            <MapContainer 
              center={routeDetails.pontoA} 
              zoom={13} 
              style={{ height: '400px', width: '100%', borderRadius: '10px' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {/* ATUALIZADO: Passa a função estável 'handleSummary' */}
              <RouteCalculator 
                pontoA={routeDetails.pontoA} 
                pontoB={routeDetails.pontoB} 
                onSummary={handleSummary}
              />
            </MapContainer>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default ColetorHome;