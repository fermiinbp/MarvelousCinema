import { obtenerDetalle } from "./api.js";
import { Pelicula, Serie } from "./modelos.js";
import { esFavorito, alternarFavorito, leerTema } from "./storage.js";
import { pintarMapa } from "./map.js";


//  LEER LA URL 

const params = new URLSearchParams(location.search);
const tipo = params.get("tipo");
const id = Number(params.get("id"));   


//  DOM 
const estado = document.querySelector("#estado");
const ficha = document.querySelector("#ficha");
const fichaHero = document.querySelector("#ficha-hero");
const fichaPoster = document.querySelector("#ficha-poster");
const fichaTipo = document.querySelector("#ficha-tipo");
const fichaTitulo = document.querySelector("#ficha-titulo");
const fichaLema = document.querySelector("#ficha-lema");
const fichaMeta = document.querySelector("#ficha-meta");
const fichaGeneros = document.querySelector("#ficha-generos");
const fichaNota = document.querySelector("#ficha-nota");
const fichaVotos = document.querySelector("#ficha-votos");
const fichaBarra = document.querySelector("#ficha-barra");
const botonFav = document.querySelector("#ficha-favorito");
const fichaSinopsis = document.querySelector("#ficha-sinopsis");
const fichaTecnica = document.querySelector("#ficha-tecnica");
const bloqueTrailer = document.querySelector("#bloque-trailer");
const fichaTrailer = document.querySelector("#ficha-trailer");
const fichaReparto = document.querySelector("#ficha-reparto");
const bloqueMapa = document.querySelector("#bloque-mapa");
const mapa = document.querySelector("#mapa");
const volver = document.querySelector("#volver");

let itemActual = null;  


//  UTILS 
function crear(etiqueta, clase, texto = "") {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    elemento.textContent = texto;
    return elemento;
}

function mostrarError(texto) {
    estado.textContent = `Ups: ${texto}`;
}


const formatoDinero = new Intl.NumberFormat("es-ES", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
});

const dinero = (n) => n > 0 ? formatoDinero.format(n) : "";


//  VISTA 
function pintarCabecera(item, detalle) {
    document.title = `${item.titulo} · Marvelous Cinema`;

    // Fondo del hero con la imagen horizontal.
    if (item.backdropUrl) fichaHero.style.backgroundImage = `url("${item.backdropUrl}")`;

    if (item.posterUrl) {
        fichaPoster.src = item.posterUrl;
        fichaPoster.alt = `Póster de ${item.titulo}`;
    }

    fichaTipo.textContent = item.tipo === "tv" ? "Serie" : "Película";
    fichaTitulo.textContent = item.titulo;
    fichaLema.textContent = detalle.tagline ?? "";   

    
    fichaMeta.textContent = [item.anio, item.infoExtra].filter(Boolean).join(" · ");

    fichaGeneros.replaceChildren(
        ...(detalle.genres ?? []).map(g => crear("li", "ficha-genero", g.name))
    );

    fichaNota.textContent = item.nota > 0 ? `★ ${item.nota.toFixed(1)}` : "★ —";
    fichaVotos.textContent = detalle.vote_count > 0
        ? `/ 10 · ${detalle.vote_count.toLocaleString("es-ES")} votos`
        : "/ 10 · sin votos todavía";
    fichaBarra.style.width = `${item.nota * 10}%`;   // 8.4 -> 84%

    fichaSinopsis.textContent = item.sinopsis || "Todavía no hay sinopsis en español.";
}

function pintarFichaTecnica(item, detalle, creditos) {
    const autores = item.tipo === "tv"
        ? detalle.created_by ?? []
        : creditos.crew.filter(p => p.job === "Director");

    // Lista de pares.
    const filas = [
        [item.tipo === "tv" ? "Creada por" : "Dirección", autores.map(p => p.name).join(", ")],
        ["Estreno", item.fechaTexto],
        [item.tipo === "tv" ? "Temporadas" : "Duración", item.infoExtra],
        ["Episodios", item.episodios ? String(item.episodios) : ""],   // solo en series
        ["Estado", detalle.status ?? ""],
        ["Idioma original", detalle.original_language?.toUpperCase() ?? ""],
        ["Presupuesto", dinero(detalle.budget)],      // solo en películas
        ["Recaudación", dinero(detalle.revenue)],
    ];

    const filasValidas = filas.filter(([, valor]) => valor);

    // flatMap hace map y cada par los convierte en un dt y un dd
    fichaTecnica.replaceChildren(
        ...filasValidas.flatMap(([etiqueta, valor]) => [crear("dt", "", etiqueta), crear("dd", "", valor)])
    );
}

function pintarTrailer(item, trailerKey) {
    if (!trailerKey) {
        bloqueTrailer.hidden = true;
        return;
    }
    const iframe = document.createElement("iframe");
    iframe.className = "ficha-trailer";
    // youtube-nocookie.com no deja cookies hasta que se pulsa play
    iframe.src = `https://www.youtube-nocookie.com/embed/${trailerKey}`;
    iframe.title = `Tráiler de ${item.titulo}`;
    iframe.loading = "lazy";
    iframe.allowFullscreen = true;
    fichaTrailer.replaceChildren(iframe);
}

function pintarReparto(creditos) {
    const actores = creditos.cast.slice(0, 15);

    if (actores.length === 0) {
        fichaReparto.replaceChildren(crear("li", "vacio", "Reparto no disponible."));
        return;
    }

    fichaReparto.replaceChildren(...actores.map(actor => {
        const li = crear("li", "ficha-actor");

        if (actor.profile_path) {
            const foto = document.createElement("img");
            foto.className = "ficha-actor-foto";
            foto.src = `https://image.tmdb.org/t/p/w185${actor.profile_path}`;
            foto.alt = actor.name;
            foto.loading = "lazy";
            li.append(foto);
        } else {
            li.append(crear("div", "ficha-actor-foto"));
        }

        li.append(
            crear("p", "ficha-actor-nombre", actor.name),
            crear("p", "ficha-actor-papel", actor.character || "")
        );
        return li;
    }));
}

function pintarBotonFav(esFav) {
    botonFav.setAttribute("aria-pressed", String(esFav));
    botonFav.textContent = esFav ? "♥ En favoritos" : "♥ Añadir a favoritos";
}


//  CARGA DE DATOS 
async function iniciar() {
   
    if (!["movie", "tv"].includes(tipo) || !Number.isInteger(id)) {
        mostrarError("El enlace no es válido.");
        return;
    }

    estado.textContent = "Cargando ficha...";
    try {
    
        const { detalle, creditos, trailerKey } = await obtenerDetalle(tipo, id);

        itemActual = tipo === "tv" ? Serie.desdeTMDB(detalle) : Pelicula.desdeTMDB(detalle);

        ficha.hidden = false;
        estado.textContent = "";

        pintarCabecera(itemActual, detalle);
        pintarFichaTecnica(itemActual, detalle, creditos);
        pintarTrailer(itemActual, trailerKey);
        pintarReparto(creditos);
        pintarBotonFav(esFavorito(itemActual.tipo, itemActual.id));

        const hayMapa = pintarMapa(mapa, detalle.production_countries ?? []);
        bloqueMapa.hidden = !hayMapa;

    } catch (error) {
        mostrarError(error.message);
    }
}


//  EVENTOS 
botonFav.addEventListener("click", () => {
    if (!itemActual) return;
    pintarBotonFav(alternarFavorito(itemActual));
});

volver.addEventListener("click", (e) => {
    if (document.referrer.includes(location.host)) {
        e.preventDefault();
        history.back();
    }
});


//  ARRANQUE 
document.documentElement.dataset.tema = leerTema() ? "claro" : "oscuro";
iniciar();