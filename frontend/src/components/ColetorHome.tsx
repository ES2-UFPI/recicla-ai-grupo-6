import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L, { LatLng } from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "./Coletas.css"; // Importar o novo CSS
import api from "../apiFetch";
import { FaMapMarkerAlt, FaClock, FaCheck, FaTruck, FaRoute } from "react-icons/fa";
import apiFetch from "../apiFetch";

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
// Trocamos a cooperativa fixa por uma lista (que viria da API)
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
  const [etapa, setEtapa] = useState<"INICIO" | "R1" | "SELECIONAR_COOPERATIVA" | "R2">("INICIO");
  const [resumo, setResumo] = useState<{ distancia: string; tempo: string } | null>(null);
  const [pontoA, setPontoA] = useState<any>(null);
  const [pontoB, setPontoB] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cooperativas, setCooperativas] = useState<any[]>([]);
  const [cooperativaSelecionada, setCooperativaSelecionada] = useState<any>(null);

  const handleResumo = useCallback((r: any) => setResumo(r), []);

  // BUSCAR COLETAS E COOPERATIVAS
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Busca coletas
        const respColetas = await api.request("/api/coletas/disponiveis/");
        const dadosColetas = await respColetas.json();
        setColetas(dadosColetas);

        // Busca cooperativas no backend; em caso de erro, usa o MOCK
        try {
          const respCoop = await api.request("/api/cooperativas/");
          if (respCoop && respCoop.ok) {
            const dadosCoop = await respCoop.json();

            // Função auxiliar para extrair lat/lng de diferentes formatos de `geom`
            const extractLatLng = (geom: any) => {
              if (!geom) return { lat: null, lng: null };
              // GeoJSON: { type: 'Point', coordinates: [lng, lat] }
              if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
                return { lat: geom.coordinates[1], lng: geom.coordinates[0] };
              }
              // String no formato 'POINT(lng lat)'
              if (typeof geom === 'string') {
                const m = geom.match(/POINT\(([-0-9.]+)\s+([-0-9.]+)\)/);
                if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]) };
              }
              // Campos diretos
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
                  // preserva o restante dos campos caso sejam necessários
                  ...coop,
                };
              })
              : LISTA_COOPERATIVAS_MOCK;

            setCooperativas(cooperativasTransformadas);
          } else {
            console.warn('Resposta inválida ao buscar cooperativas, usando MOCK');
            setCooperativas(LISTA_COOPERATIVAS_MOCK);
          }
        } catch (err) {
          console.warn('Erro ao buscar cooperativas, usando MOCK', err);
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

  // ACEITAR COLETA
  const aceitarColeta = async (c: any) => {
    console.log("=== ACEITAR COLETA ===");
    console.log("Coleta completa:", c);

    // Validações
    if (!c.produtor || !c.produtor.latitude || !c.produtor.longitude) {
      alert("Erro: Coordenadas do produtor não encontradas!");
      return;
    }

    try {
      console.log("Aceitar coleta (apenas local) - não atualizando backend ainda.");
      // Observação: a atualização do status/associação do coletor no backend
      // será feita apenas quando o usuário confirmar a cooperativa ("Ir para esta").

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
          setEtapa("R1");
        },
        (error) => {
          alert("Não foi possível obter sua localização.");
        }
      );
    } catch (e) {
      console.error("Erro ao aceitar coleta:", e);
      alert("Erro ao aceitar coleta. Tente novamente.");
    }
  };

  // CONFIRMAR COLETA (Retirada no produtor)
  const confirmarColeta = async () => {
    try {
      // Não atualizamos o status no backend aqui — a alteração para
      // 'CONFIRMADA' (ou o comportamento equivalente) deve ocorrer
      // somente quando o coletor confirmar a cooperativa (clicar "Ir para esta").
      // Aqui fazemos apenas as mudanças locais de UI/estado.

      // 1. Define o Ponto A (origem) como a localização do produtor
      const latP = parseFloat(selecionada.produtor.latitude);
      const lngP = parseFloat(selecionada.produtor.longitude);
      setPontoA(new LatLng(latP, lngP));

      // 2. Limpa o Ponto B (destino) e o resumo
      setPontoB(null);
      setResumo(null);

      // 3. Muda para a nova etapa de seleção
      setEtapa("SELECIONAR_COOPERATIVA");

    } catch (e) {
      console.error("Erro ao confirmar coleta:", e);
      alert("Erro ao confirmar coleta. Tente novamente.");
    }
  };

  // Nova função para lidar com a seleção da cooperativa
  const handleSelecionarCooperativa = async (coop: any) => {
    console.log("Cooperativa selecionada:", coop);

    // 1. Armazena a cooperativa selecionada (pode ser útil)
    setCooperativaSelecionada(coop);

    // Tenta atualizar a cooperativa associada à coleta no backend imediatamente.
    // Isso grava o campo `cooperativa_id` na tabela `solicitacao_coleta` conforme solicitado.
    if (selecionada && selecionada.id) {
      // Verifica token local para evitar 403 silencioso
      const tokenLocal = apiFetch.getToken();
      if (!tokenLocal) {
        alert('Você precisa estar autenticado como coletor para associar uma cooperativa. Faça login novamente.');
      } else {
        try {
          // Envia ambos os campos (`cooperativa_id` e `cooperativa`) para compatibilidade
          const payload: any = { cooperativa_id: coop.id, cooperativa: coop.id };
          // Usa endpoint dedicado que aceita associação de cooperativa (evita problemas de permissões/metodos no detail view)
          const resp = await apiFetch.request(`/api/coletas/${selecionada.id}/associar_cooperativa/`, 'PATCH', payload);
          if (!resp.ok) {
            const txt = await resp.text().catch(() => null);
            console.warn('Falha ao atualizar cooperativa no backend:', resp.status, txt);
            alert('Atenção: não foi possível registrar a cooperativa no servidor. A rota será mostrada localmente.');
          } else {
            console.log('Cooperativa registrada no backend para coleta', selecionada.id);
          }
        } catch (err) {
          console.error('Erro ao atualizar cooperativa no backend:', err);
          alert('Erro ao registrar cooperativa no servidor. A rota será mostrada localmente.');
        }
      }
    } else {
      console.warn('Nenhuma coleta selecionada ao tentar associar cooperativa.');
    }

    // Função para buscar coordenadas via Nominatim a partir do endereço
    const geocodeAddress = async (addressOrStructured: any) => {
      try {
        let url: string;

        if (typeof addressOrStructured === 'string') {
          const params = new URLSearchParams({ q: addressOrStructured, format: 'json', limit: '1' });
          url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        } else {
          // usa parâmetros estruturados quando um objeto é passado
          const params = new URLSearchParams({ format: 'json', limit: '1' });
          if (addressOrStructured.street) params.set('street', addressOrStructured.street);
          if (addressOrStructured.postalcode) params.set('postalcode', addressOrStructured.postalcode);
          if (addressOrStructured.city) params.set('city', addressOrStructured.city);
          if (addressOrStructured.state) params.set('state', addressOrStructured.state);
          // país como Brasil por padrão
          params.set('country', addressOrStructured.country || 'Brasil');
          url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        }

        // Log da URL de pesquisa para depuração (solicitado)
        console.log('Nominatim URL:', url);

        const resp = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'ReciclaAi-Frontend' } });

        if (!resp.ok) {
          const txt = await resp.text().catch(() => null);
          console.warn('Nominatim respondeu com erro:', resp.status, txt, url);
          return null;
        }

        const data = await resp.json();
        if (!Array.isArray(data) || data.length === 0) {
          console.warn('Nominatim retornou vazio para:', url);
          return null;
        }

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
      // Prioriza geocodificar usando `cep` + `rua` conforme solicitado.
      let addressForGeocode = '';

      if (coop.cep && coop.rua) {
        const ruaNum = coop.rua + (coop.numero ? ' ' + coop.numero : '');
        // usa query estruturada: street + postalcode + cidade/estado
        const structured = {
          street: ruaNum,
          postalcode: coop.cep,
          city: coop.cidade,
          state: coop.estado,
          country: 'Brasil',
        };
        const coords = await geocodeAddress(structured);
        console.log('Resultado geocode (estruturado):', coords, 'para', structured);
        if (coords) {
          // CORREÇÃO: atribui explicitamente lat/lng quando a busca estruturada retorna resultado
          lat = coords.lat;
          lng = coords.lng;
        } else {
          // fallback para string caso a estrutura não tenha funcionado
          addressForGeocode = `${ruaNum}, ${coop.bairro || ''}, ${coop.cidade || ''} ${coop.estado || ''} CEP ${coop.cep}`;
        }
      } else {
        // Fallback: tenta montar a partir de outros campos conhecidos
        addressForGeocode = [coop.endereco, coop.rua, coop.numero, coop.bairro, coop.cidade, coop.estado]
          .filter(Boolean)
          .join(', ');
        if (addressForGeocode && addressForGeocode.length > 0) {
          const coords = await geocodeAddress(addressForGeocode);
          console.log('Resultado geocode (fallback string):', coords, 'para', addressForGeocode);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
          } else {
            alert('Não foi possível obter coordenadas para a cooperativa a partir do CEP/rua fornecidos.');
          }
        } else {
          alert('Campos CEP/rua insuficientes para geocodificação da cooperativa.');
        }
      }

      // se usamos structured e ainda não obtivemos coords, tentamos com a string gerada acima
      if (!lat && addressForGeocode) {
        const coords2 = await geocodeAddress(addressForGeocode);
        console.log('Resultado geocode (segunda tentativa):', coords2, 'para', addressForGeocode);
        if (coords2) {
          lat = coords2.lat;
          lng = coords2.lng;
        } else {
          alert('Não foi possível obter coordenadas para a cooperativa a partir do CEP/rua fornecidos.');
        }
      }

    }

    if (lat && lng) {
      console.log('Definindo pontoB com coordenadas:', lat, lng);

      setPontoB(new LatLng(lat, lng));
      // 3. Reseta o resumo da rota
      setResumo(null);
      // 4. Agora sim, vai para a Rota 2 (Mapa)
      setEtapa('R2');
    } else {
      console.warn('Não foram obtidas coordenadas válidas para a cooperativa selecionada:', coop);
    }
  };


  const cancelarColetaOuEntrega = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/coletas/${selecionada.id}/status/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SOLICITADA" }), // Volta para SOLICITADA
      });

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
      setCooperativaSelecionada(null); // Limpar cooperativa

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
      // Verifica se há token e se o usuário é do tipo 'coletor'
      const token = apiFetch.getToken();
      if (!token) {
        alert('Você precisa estar autenticado como coletor para concluir entregas. Faça login e tente novamente.');
        return;
      }
      try {
        // Decodifica payload JWT simples (não valida assinatura)
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(decodeURIComponent(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join('')));
          console.log('Payload do token no frontend:', payload);
          if (payload.user_type !== 'coletor') {
            alert('A conta autenticada não é um coletor. Faça login com uma conta de coletor.');
            return;
          }
        }
      } catch (err) {
        console.warn('Não foi possível decodificar o token localmente:', err);
      }
      // Registra aceitação/associação do coletor no backend antes de concluir.
      if (!selecionada || !selecionada.id) {
        alert('Nenhuma coleta selecionada.');
        return;
      }

      // Atualiza diretamente o status para 'CONCLUIDA' quando o coletor
      // confirmar a entrega (apenas aqui o banco será alterado).
      try {
        const response = await apiFetch.request(`/api/coletas/${selecionada.id}/status/`, 'PATCH', { status: 'CONCLUIDA' });
        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          console.error('Erro ao atualizar status para CONCLUIDA:', errData || response.statusText);
          alert(`Não foi possível concluir a coleta: ${errData?.detail || response.statusText}`);
          return;
        }
      } catch (err) {
        console.error('Erro na requisição de atualização de status (CONCLUIDA):', err);
        alert('Erro ao concluir entrega. Tente novamente.');
        return;
      }

      alert("Coleta concluída com sucesso!");

      // Volta para a tela inicial e recarrega as coletas
      setEtapa("INICIO");
      setSelecionada(null);
      setPontoA(null);
      setPontoB(null);
      setResumo(null);
      setCooperativaSelecionada(null); // Limpar cooperativa

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

    return (
      <div className="list-container">
        <h2>Coletas Disponíveis</h2>
        {(!coletas || coletas.length === 0) ? (
          <p>Nenhuma solicitação encontrada.</p>
        ) : (
          coletas.map((c) => {
            // O endpoint de listagem retorna `itens_count` (inteiro) e agora também `tipos` (lista de strings).
            // Caso `tipos` esteja disponível, priorizamos exibí-los; senão mostramos a quantidade.
            const qtdItens = (typeof c.itens_count === 'number')
              ? c.itens_count
              : (Array.isArray(c.itens) ? c.itens.length : (c.itens ? 1 : 0));

            const tiposArr: string[] = Array.isArray(c.tipos)
              ? c.tipos
              : (Array.isArray(c.itens) ? c.itens.map((it: any) => it.tipo_residuo) : []);

            return (
              <div className="coleta-card" key={c.id}>
                <div className="card-content">
                  <h3>{c.produtor?.nome || "Produtor não identificado"}</h3>
                  <p className="address">
                    {c.produtor?.rua || "Rua"}, {c.produtor?.numero || "S/N"} — {c.produtor?.bairro || "Bairro"}
                  </p>
                  <div className="material-info" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {tiposArr && tiposArr.length > 0 ? (
                      tiposArr.map((t, idx) => (
                        <span
                          key={`${c.id}-tipo-${idx}`}
                          className="material-chip"
                          style={{
                            display: 'inline-block',
                            background: '#e6f4ea',
                            color: '#1b5e20',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.9em',
                          }}
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span>{`${qtdItens} tipo(s) de material`}</span>
                    )}
                  </div>
                </div>

                <button className="btn-primary" onClick={() => aceitarColeta(c)}>
                  <FaCheck /> Aceitar Coleta
                </button>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // =============================
  // TELA: SELECIONAR COOPERATIVA
  // =============================
  if (etapa === "SELECIONAR_COOPERATIVA") {
    return (
      <div className="list-container"> {/* Reaproveitando o estilo da lista */}
        <h2>Escolha a Cooperativa de Destino</h2>

        {cooperativas.map((coop) => (
          <div className="coleta-card" key={coop.id}> {/* Reaproveitando o estilo do card */}
            <div className="card-content">
              <h3>{coop.nome}</h3>
              <p className="address">
                {coop.endereco}
              </p>
            </div>

            <button className="btn-primary" onClick={() => handleSelecionarCooperativa(coop)}>
              <FaMapMarkerAlt /> Ir para esta
            </button>
          </div>
        ))}

        <button
          className="action-button danger-action"
          onClick={cancelarColetaOuEntrega}
          style={{ marginTop: '20px', width: '100%' }} // Adicionando estilo
        >
          ❌ Cancelar (Voltar para lista de coletas disponiveis)
        </button>
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
          key={`${etapa}-${pontoB.lat}-${pontoB.lng}`} // Chave mais específica
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
            routeKey={`${etapa}-${pontoB.lat}-${pontoB.lng}`} // Chave mais específica
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