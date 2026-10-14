import * as L from "https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js";

const COORDENADAS_PAISES = {
    US: [39.8, -98.6],   GB: [54.0, -2.5],    CA: [56.1, -106.3],
    AU: [-25.3, 133.8],  NZ: [-40.9, 174.9],  DE: [51.2, 10.5],
    FR: [46.2, 2.2],     ES: [40.5, -3.7],    IT: [41.9, 12.6],
    NO: [60.5, 8.5],     IS: [64.9, -19.0],   IE: [53.4, -8.2],
    BE: [50.5, 4.5],     NL: [52.1, 5.3],     SE: [60.1, 18.6],
    DK: [56.3, 9.5],     FI: [61.9, 25.7],    PL: [51.9, 19.1],
    CZ: [49.8, 15.5],    HU: [47.2, 19.5],    AT: [47.5, 14.6],
    CH: [46.8, 8.2],     PT: [39.4, -8.2],    GR: [39.1, 21.8],
    RO: [45.9, 25.0],    BG: [42.7, 25.5],    UA: [48.4, 31.2],
    RU: [61.5, 105.3],   TR: [39.0, 35.2],    IL: [31.0, 34.9],
    EG: [26.8, 30.8],    MA: [31.8, -7.1],    ZA: [-30.6, 22.9],
    AE: [23.4, 53.8],    SA: [23.9, 45.1],    IN: [20.6, 78.9],
    CN: [35.9, 104.2],   HK: [22.3, 114.2],   TW: [23.7, 121.0],
    JP: [36.2, 138.3],   KR: [35.9, 127.8],   TH: [15.9, 101.0],
    SG: [1.35, 103.8],   MY: [4.2, 102.0],    ID: [-0.8, 113.9],
    PH: [12.9, 121.8],   VN: [14.1, 108.3],   MX: [23.6, -102.6],
    BR: [-14.2, -51.9],  AR: [-38.4, -63.6],  CL: [-35.7, -71.5],
    CO: [4.6, -74.3],    PE: [-9.2, -75.0],
};

export function pintarMapa(contenedor, paises) {
    const conocidos = paises.filter(p => COORDENADAS_PAISES[p.iso_3166_1]);
    if (conocidos.length === 0) return false;

    const mapa = L.map(contenedor, { scrollWheelZoom: false }).setView([20, 0], 2);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap",
    }).addTo(mapa);

    //marcadores
    const puntos = conocidos.map(pais => {
        const coordenadas = COORDENADAS_PAISES[pais.iso_3166_1];
        L.marker(coordenadas).addTo(mapa).bindPopup(pais.name);
        return coordenadas;
    });
    mapa.fitBounds(puntos, { padding: [40, 40], maxZoom: 5 });

    return true;
}