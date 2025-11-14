import React, { useState, useEffect, useRef, useCallback } from 'react'; // Adicionamos useCallback
import './Coletas.css';
import api from '../apiFetch';
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
          try { old.off && old.off('routesfound', handleRoutesFound); } catch { }
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
      } catch (err) { }
      markerARef.current = null;

      try {
        if (markerBRef.current && map.hasLayer(markerBRef.current)) {
          map.removeLayer(markerBRef.current);
        }
      } catch (err) { }
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
        try { map.invalidateSize(); } catch (err) { }
        // delay para evitar problemas com animações de modal
        readyTimeout = window.setTimeout(() => createRouting(), 120);
      });
      // fallback: se whenReady não disparar em X ms (raro), criamos mesmo assim
      const fallback = window.setTimeout(() => {
        if (!created && !isUnmounted) {
          try { map.invalidateSize(); } catch (err) { }
          createRouting();
        }
      }, 1000);
      // limpamos fallback no cleanup
      return () => {
        isUnmounted = true;
        try { clearTimeout(fallback); } catch { }
        if (readyTimeout) {
          try { clearTimeout(readyTimeout); } catch { }
        }

        // removendo listeners antes de remover controle (para evitar callbacks tardios)
        try {
          if (routingControlRef.current) {
            const ctrl = routingControlRef.current as any;
            try { ctrl.off && ctrl.off('routesfound', handleRoutesFound); } catch { }
            try { ctrl.off && ctrl.off('routingerror'); } catch { }
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
        } catch (err) { }
        markerARef.current = null;

        try {
          if (markerBRef.current && map.hasLayer(markerBRef.current)) {
            map.removeLayer(markerBRef.current);
          }
        } catch (err) { }
        markerBRef.current = null;
      };
    } catch (err) {
      console.error('Erro no setup do RouteCalculator:', err);
      // cleanup se falhar no setup inicial
      return () => { };
    }
  }, [map, pontoA, pontoB, onSummary]);

  return null;
};


// --- COMPONENTE PRINCIPAL (ATUALIZADO) ---
const ColetorHome = () => {
  // Tipagem para a coleta selecionada (detalhada)
  interface ItemSelecionado {
    id: string | number;
    descricao: string;
    categoria: string;
  }
  interface ColetaSelecionadaType {
    id: string | number;
    produtor: { nome: string; endereco: string };
    itens: ItemSelecionado[];
    observacoes?: string;
  }

  const [coletaSelecionada, setColetaSelecionada] = useState<ColetaSelecionadaType | null>(null);
  const [routeDetails, setRouteDetails] = useState<{ pontoA: LatLng, coopName: string, pontoB: LatLng } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [routeSummary, setRouteSummary] = useState<string | null>(null);
  const [dbColetas, setDbColetas] = useState<any[]>([]);
  const [collectorPos, setCollectorPos] = useState<{ lat: number; lng: number } | null>(null);
  const [dbCooperativas, setDbCooperativas] = useState<any[] | null>(null);
  const [geocodeCache, setGeocodeCache] = useState<Record<string, { lat: number; lng: number }>>({});
  const geocodingInProgressRef = useRef<Set<string | number>>(new Set());
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // --- ESTA É A CORREÇÃO ---
  // Envolvemos a função 'setRouteSummary' em 'useCallback'.
  // Isso garante que a função 'handleSummary' tenha sempre a
  // mesma referência, impedindo que o 'useEffect' do 'RouteCalculator'
  // rode a limpeza (o removeControl) desnecessariamente.
  const handleSummary = useCallback((summary: string) => {
    setRouteSummary(summary);
  }, []); // O array vazio [] garante que a função nunca mude.
  // --- FIM DA CORREÇÃO ---


  const handleAceitarColeta = async (coletaId: string | number, cooperativa: typeof mockCooperativasDisponiveis[0]) => {

    setMapLoading(true);
    setColetaSelecionada(null);
    setRouteSummary(null);

    // Chama backend para aceitar/assumir a solicitação (seta coletor_id)
    try {
      const acceptResp = await api.request(`/api/coletas/${coletaId}/aceitar/`, 'POST');
      console.debug('POST /api/coletas/' + coletaId + '/aceitar/ ->', acceptResp.status);
      if (!acceptResp.ok) {
        const text = await acceptResp.text().catch(() => '');
        console.warn('Falha ao aceitar solicitação:', acceptResp.status, text);
        alert('Falha ao aceitar a solicitação. Tente novamente.');
        setMapLoading(false);
        return;
      }
      // Remoção otimista: atualiza a lista local de coletas para refletir a aceitação
      // Isso faz a UI ser reativa sem precisar recarregar a página.
      try {
        setDbColetas(prev => prev.filter(item => String(item.id) !== String(coletaId)));
      } catch (err) {
        console.warn('Erro ao atualizar lista local de coletas (optimistic remove):', err);
      }
    } catch (err) {
      console.error('Erro ao chamar endpoint de aceitar coleta:', err);
      alert('Erro de rede ao aceitar a coleta. Verifique sua conexão.');
      setMapLoading(false);
      return;
    }

    // Obtem a posição do coletor; o callback pode ser async para permitir geocoding se necessário
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // valida coordenadas da cooperativa; se ausentes, tenta geocodificar pelo endereço/nome
        let coopLat: number | undefined = cooperativa.lat as any;
        let coopLng: number | undefined = cooperativa.lng as any;

        if (coopLat == null || coopLng == null || Number.isNaN(coopLat) || Number.isNaN(coopLng)) {
          try {
            const query = cooperativa.endereco || cooperativa.nome || '';
            if (!query) throw new Error('Endereço da cooperativa não disponível para geocoding');
            // usa Nominatim (OpenStreetMap) para uma tentativa simples de geocoding
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
            const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (!resp.ok) throw new Error('Falha no geocoding');
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) {
              coopLat = parseFloat(data[0].lat);
              coopLng = parseFloat(data[0].lon);
            } else {
              throw new Error('Nenhum resultado encontrado no geocoding');
            }
          } catch (err) {
            console.warn('Geocoding falhou para cooperativa:', cooperativa, err);
            alert('Não foi possível obter coordenadas da cooperativa selecionada. Verifique o endereço ou escolha outra cooperativa.');
            setMapLoading(false);
            return;
          }
        }

        // checa novamente se temos valores válidos
        if (typeof coopLat !== 'number' || typeof coopLng !== 'number' || Number.isNaN(coopLat) || Number.isNaN(coopLng)) {
          alert('Coordenadas inválidas da cooperativa. Ação cancelada.');
          setMapLoading(false);
          return;
        }

        try {
          const pontoA = new LatLng(latitude, longitude);
          const pontoB = new LatLng(coopLat, coopLng);

          setRouteDetails({ pontoA, pontoB, coopName: cooperativa.nome });
          setMapLoading(false);

          console.log(`Coleta ${coletaId} aceita! Rota: Minha Posição -> ${cooperativa.nome}`);
        } catch (err) {
          console.error('Erro ao criar pontos LatLng:', err);
          alert('Erro interno ao processar coordenadas do mapa.');
          setMapLoading(false);
        }
      },
      (error) => {
        console.error("Erro ao obter geolocalização:", error);
        alert("Erro ao obter sua localização. Verifique as permissões do navegador.");
        setMapLoading(false);
      }
    );
  };

  // Busca coletas disponíveis no backend (tabela solicitacao_coleta)
  useEffect(() => {
    // tenta obter posição do coletor para calcular distâncias locais
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.debug('Got collectorPos:', pos.coords.latitude, pos.coords.longitude);
          setCollectorPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.debug('Geolocation não disponível ou negada:', err),
        { enableHighAccuracy: false, maximumAge: 1000 * 60 * 5, timeout: 5000 }
      );
    } catch (err) {
      console.debug('Geolocation não suportada:', err);
    }
    let mounted = true;
    (async () => {
      setDbLoading(true);
      setDbError(null);
      try {
        const resp = await api.request('/api/coletas/disponiveis/');
        console.debug('GET /api/coletas/disponiveis/ ->', resp.status);
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          console.warn('Resposta não OK ao buscar coletas disponiveis:', resp.status, text);
          if (mounted) setDbError(`Erro HTTP ${resp.status}`);
          return;
        }
        const data = await resp.json();
        console.debug('Dados recebidos de /api/coletas/disponiveis/:', data);
        // DRF pode retornar uma lista ou um objeto paginado { results: [...] }
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
        if (mounted) setDbColetas(list);
      } catch (err: any) {
        console.error('Erro ao buscar coletas disponiveis:', err);
        if (mounted) setDbError(String(err));
      } finally {
        if (mounted) setDbLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Helper: haversine distance (km)
  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // tenta extrair coordenadas do produtor (vários formatos possíveis)
  const getProducerCoords = (c: any): { lat?: number; lng?: number } => {
    if (!c || !c.produtor) return {};
    const p = c.produtor;
    // casos comuns: p.lat & p.lng, p.latitude & p.longitude, p.geom.coordinates (GeoJSON: [lng, lat])
    if (typeof p.lat === 'number' && typeof p.lng === 'number') return { lat: p.lat, lng: p.lng };
    if (typeof p.latitude === 'number' && typeof p.longitude === 'number') return { lat: p.latitude, lng: p.longitude };
    if (p.geom && Array.isArray(p.geom.coordinates) && p.geom.coordinates.length >= 2) {
      const [lng, lat] = p.geom.coordinates;
      return { lat: Number(lat), lng: Number(lng) };
    }
    // fallback: check geocode cache (keyed by coleta id when possible)
    try {
      const key = c.id ?? c._id ?? (p.nome ? `${p.nome}-${p.endereco || ''}` : JSON.stringify(p));
      if (geocodeCache && geocodeCache[key]) {
        return { lat: geocodeCache[key].lat, lng: geocodeCache[key].lng };
      }
    } catch (err) {
      // ignore
    }
    return {};
  };

  // Geocode producer address via Nominatim (cached, avoids duplicate requests)
  const geocodeProducerAddress = async (c: any) => {
    if (!c || !c.produtor) return;
    const p = c.produtor;
    const key = c.id ?? c._id ?? (p.nome ? `${p.nome}-${p.endereco || ''}` : JSON.stringify(p));
    if (geocodingInProgressRef.current.has(key)) return;
    if (geocodeCache && geocodeCache[key]) return; // already have

    // build a reasonable query string from available parts
    const parts: string[] = [];
    if (p.endereco) parts.push(String(p.endereco));
    if (p.rua) parts.push(String(p.rua));
    if (p.numero) parts.push(String(p.numero));
    if (p.bairro) parts.push(String(p.bairro));
    if (p.cidade) parts.push(String(p.cidade));
    if (parts.length === 0 && p.nome) parts.push(String(p.nome));
    const query = parts.filter(Boolean).join(', ');
    if (!query) return;

    geocodingInProgressRef.current.add(key);
    try {
      const params = new URLSearchParams({
        q: `${query}, Brasil`,
        format: 'json',
        limit: '1',
        addressdetails: '1',
        countrycodes: 'br',
        'accept-language': 'pt-BR'
      });
      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      const resp = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'ReciclaAi/1.0 (contato@exemplo.com)' } });
      if (!resp.ok) {
        console.debug('Nominatim response not ok', resp.status);
        return;
      }
      const data = await resp.json().catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setGeocodeCache(prev => ({ ...prev, [key]: { lat, lng } }));
        console.debug('Geocoded producer', key, lat, lng);
      } else {
        console.debug('Nominatim returned no results for', query);
      }
    } catch (err) {
      console.debug('Geocoding error:', err);
    } finally {
      geocodingInProgressRef.current.delete(key);
    }
  };

  // Busca cooperativas do backend (se existir endpoint)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await api.request('/api/cooperativas/');
        // Se endpoint não existir, ignore silenciosamente
        if (!resp.ok) {
          console.debug('GET /api/cooperativas/ não disponível:', resp.status);
          if (mounted) setDbCooperativas([]);
          return;
        }
        const data = await resp.json();
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
        if (!mounted) return;
        // Mapeia nomes/endereços para o mesmo formato usado no UI
        const mapped = list.map((coop: any) => {
          const nome = coop.nome_empresa || coop.nome || coop.razao_social || '';
          const ruaVal = (coop.rua || '').trim();
          const numeroVal = coop.numero ? String(coop.numero).trim() : '';
          const bairroVal = (coop.bairro || '').trim();
          const cidadeVal = (coop.cidade || '').trim();
          // Se houver número, colocamos uma vírgula antes dele: "Rua Exemplo, 123"
          let streetPart = '';
          if (ruaVal && numeroVal) {
            streetPart = `${ruaVal}, ${numeroVal}`;
          } else {
            streetPart = ruaVal || numeroVal;
          }
          const enderecoParts = [streetPart, bairroVal, cidadeVal].filter(Boolean).map(s => s.trim());
          const endereco = enderecoParts.join(', ');
          return { id: coop.id ?? coop.id_recompensa ?? coop.pk ?? nome, nome, endereco, lat: coop.lat, lng: coop.lng };
        });
        console.debug('DB cooperativas fetched:', mapped);
        setDbCooperativas(mapped);
      } catch (err) {
        console.debug('Erro ao buscar cooperativas (silencioso):', err);
        if (mounted) setDbCooperativas([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // decide quais cooperativas mostrar no modal (DB -> fallback para mocks)
  const cooperativasParaMostrar = (dbCooperativas && dbCooperativas.length > 0) ? dbCooperativas : mockCooperativasDisponiveis;
  console.debug('cooperativasParaMostrar (computed):', cooperativasParaMostrar);

  // Busca detalhes completos (incluindo itens) de uma coleta pelo backend
  const abrirDetalhesDaColeta = async (coletaId: number | string) => {
    try {
      setDbError(null);
      const resp = await api.request(`/api/coletas/${coletaId}/`);
      console.debug(`GET /api/coletas/${coletaId}/ ->`, resp.status);
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        console.warn('Resposta não OK ao buscar detalhes da coleta:', resp.status, text);
        alert('Erro ao carregar detalhes da coleta.');
        return;
      }
      const data = await resp.json();

      // Log bruto para inspecionar formato dos itens retornados pelo backend
      console.debug('Detalhes da coleta (raw itens):', data.itens);

      // Mapeia itens com fallbacks para id/descricao/categoria para evitar keys undefined
      const itensMapeados = (data.itens || []).map((it: any, idx: number) => ({
        id: it.id_item ?? it.id ?? it.pk ?? it.item_id ?? `${data.id ?? coletaId}-${idx}`,
        descricao: (`${it.quantidade ?? it.qtd ?? ''} ${it.unidade_medida ?? ''}`.trim()) || it.descricao || '',
        categoria: it.tipo_residuo ?? it.categoria ?? it.tipo ?? 'Desconhecido'
      }));

      console.debug('Itens mapeados para frontend:', itensMapeados);

      const ruaVal = (data.produtor?.rua || '').trim();
      const numeroVal = data.produtor?.numero ? String(data.produtor.numero).trim() : '';
      const bairroVal = (data.produtor?.bairro || '').trim();
      const cidadeVal = (data.produtor?.cidade || '').trim();
      const streetPart = [ruaVal, numeroVal].filter(Boolean).join(' ').trim();
      const endereco = [streetPart, bairroVal, cidadeVal].filter(Boolean).map(s => s.trim()).join(', ');

      setColetaSelecionada({
        id: data.id,
        produtor: { nome: data.produtor?.nome || '', endereco },
        itens: itensMapeados,
        observacoes: data.observacoes || ''
      } as any);
    } catch (err) {
      console.error('Erro ao obter detalhes da coleta:', err);
      alert('Erro ao carregar itens da coleta.');
    }
  };

  return (
    <div className="coletas-disponiveis-container">
      <h1>Coletas Disponíveis Próximas a Você</h1>
      <div>
        {dbLoading ? (
          <div>Carregando coletas do servidor...</div>
        ) : dbError ? (
          <div style={{ color: 'var(--danger, #c00)' }}>Erro ao carregar coletas: {dbError}</div>
        ) : dbColetas.length === 0 ? (
          <div>Nenhuma coleta disponível no momento.</div>
        ) : (
          <div className="coletas-grid">
            {dbColetas.map((c) => {
              const ruaVal = (c.produtor?.rua || '').trim();
              const numeroVal = c.produtor?.numero ? String(c.produtor.numero).trim() : '';
              const bairroVal = (c.produtor?.bairro || '').trim();
              const cidadeVal = (c.produtor?.cidade || '').trim();
              const streetPart = [ruaVal, numeroVal].filter(Boolean).join(' ').trim();
              const endereco = [streetPart, bairroVal, cidadeVal].filter(Boolean).map(s => s.trim()).join(', ');
              // calcula distância entre o coletor (logado) e o produtor desta coleta, quando possível
              const prodCoords = getProducerCoords(c);
              console.debug('Distance calc input: collectorPos=', collectorPos, 'prodCoords=', prodCoords);
              let distanceDisplay = '-';
              if (collectorPos && prodCoords.lat != null && prodCoords.lng != null) {
                try {
                  const dkm = haversineKm(collectorPos.lat, collectorPos.lng, prodCoords.lat, prodCoords.lng);
                  console.debug('Computed distance (km):', dkm);
                  distanceDisplay = `${dkm.toFixed(1)} km`;
                } catch (err) {
                  console.debug('Error computing haversine distance:', err);
                  distanceDisplay = '-';
                }
              } else {
                // se não houver coords do produtor, tentamos geocodificar o endereço (assíncrono)
                const key = c.id ?? c._id ?? (c.produtor?.nome ? `${c.produtor.nome}-${c.produtor?.endereco || ''}` : JSON.stringify(c.produtor || {}));
                if (!geocodeCache[key] && !geocodingInProgressRef.current.has(key)) {
                  geocodeProducerAddress(c);
                }
                // fallback: usa valor retornado pelo backend se houver
                if (c.distancia) {
                  console.debug('Fallback backend distancia for coleta', c.id, '=', c.distancia);
                  distanceDisplay = String(c.distancia);
                }
              }
              return (
                <div key={c.id} className="coleta-card">
                  <div className="card-header">
                    <h3>{c.produtor?.nome || 'Produtor'}</h3>
                    <span className="distancia-badge"><FaMapMarkerAlt /> {distanceDisplay}</span>
                  </div>
                  <p className="endereco-produtor">{endereco}</p>
                  <div className="itens-preview"><FaBoxOpen /> {c.itens_count || 0} tipo(s) de material</div>
                  <div className="card-actions">
                    <button className="details-button" onClick={() => abrirDetalhesDaColeta(c.id)}>
                      <FaInfoCircle /> Ver Detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* cooperativas agora serão mostradas dentro do modal de detalhes de cada coleta */}

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
                {coletaSelecionada.itens.map((item, idx) => (
                  <li key={item.id ?? `item-${idx}`}>
                    <span className="item-descricao">{item.descricao}</span>
                    <span className="item-categoria">{item.categoria}</span>
                  </li>
                ))}
              </ul>
            </div>
            {coletaSelecionada.observacoes && (
              <div className="modal-section">
                <h4>Observações</h4>
                <p>{coletaSelecionada.observacoes}</p>
              </div>
            )}
            <div className="modal-section">
              <h4><FaWarehouse /> Escolha uma Cooperativa para a Entrega</h4>
              <div className="cooperativas-sugeridas-list">
                {(!cooperativasParaMostrar || cooperativasParaMostrar.length === 0) ? (
                  <div className="nenhuma-cooperativa-msg">Nenhuma cooperativa disponível no momento.</div>
                ) : cooperativasParaMostrar.map(coop => {
                  const itensDeInteresseNestaColeta = coletaSelecionada.itens.filter(itemDaColeta =>
                    (coop.materiaisInteresse && Array.isArray(coop.materiaisInteresse))
                      ? coop.materiaisInteresse.some((itemDeInteresse: any) => itemDeInteresse.categoria === itemDaColeta.categoria)
                      : false
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
                              const interesse = (coop.materiaisInteresse && Array.isArray(coop.materiaisInteresse)) ? coop.materiaisInteresse.find((i: any) => i.categoria === item.categoria) : undefined;
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