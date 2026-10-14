import { API_KEY } from "./config.js";

const BASE_URL = "https://api.themoviedb.org/3";

const PRODUCTORAS_MARVEL = "420|7505";

//  FUNCIÓN BASE 

async function pedirTMDB(url, params = {}) {
    const query = new URLSearchParams({ api_key: API_KEY, language: "es-ES", ...params });
    const res = await fetch(`${BASE_URL}/${url}?${query}`);

    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    return res.json();
}

// LISTADOS

export async function descubrirMarvel(tipo, orden, pagina, extra = {}) {
    const datos = await pedirTMDB(`discover/${tipo}`, {
        with_companies: PRODUCTORAS_MARVEL,
        sort_by: orden,
        page: pagina,
        ...extra,
    });
    return { resultados: datos.results, totalPaginas: datos.total_pages };
}

//  BUSCADOR 

export async function buscarMarvel(texto, paginas = 3) {
    const respuestas = await Promise.all(
        Array.from({ length: paginas }, (_, i) =>
            pedirTMDB("search/multi", { query: texto, page: i + 1 })
        )
    );
    const resultados = respuestas
        .flatMap(r => r.results)
        .filter(r => r.media_type === "movie" || r.media_type === "tv");
    return { resultados, totalPaginas: respuestas[0].total_pages };
}

//DOOMSDAY 

export async function obtenerPorIds(ids) {
    return Promise.all(ids.map(id => pedirTMDB(`movie/${id}`)));
}

//DETALLE 
export async function obtenerDetalle(tipo, id) {
    const [detalle, creditos, videos] = await Promise.all([
        pedirTMDB(`${tipo}/${id}`),
        pedirTMDB(`${tipo}/${id}/credits`),
        pedirTMDB(`${tipo}/${id}/videos`, { language: "en-US" }),
    ]);

    const trailer = videos.results.find(v => v.site === "YouTube" && v.type === "Trailer");

    return { detalle, creditos, trailerKey: trailer?.key ?? null };
}

//IDs DE TODO EL CATÁLOGO MARVEL 
export async function idsMarvel(tipo) {
    const ids = new Set();
    let pagina = 1;
    let totalPaginas = 1;

    while (pagina <= totalPaginas) {
        const datos = await descubrirMarvel(tipo, "popularity.desc", pagina);
        datos.resultados.forEach(r => ids.add(r.id));
        totalPaginas = Math.min(datos.totalPaginas, 10);   
        pagina++;
    }
    return ids;
}

//GÉNEROS 

export async function obtenerGeneros() {
    const [peliculas, series] = await Promise.all([
        pedirTMDB("genre/movie/list"),
        pedirTMDB("genre/tv/list"),
    ]);

    return Object.fromEntries(
        [...peliculas.genres, ...series.genres].map(g => [g.id, g.name])
    );
}