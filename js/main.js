import {
    descubrirMarvel, obtenerPorIds, buscarMarvel, idsMarvel, obtenerGeneros,
} from "./api.js";
import { aplicarFiltros } from "./filtros.js";
import { Pelicula, Serie } from "./modelos.js";
import {
    leerFavoritos, esFavorito, alternarFavorito,
    leerHistorial, guardarBusqueda,
    leerTema, guardarTema,
} from "./storage.js";
import { iniciarIntro } from "./intro.js";
import { iniciarCarrusel, iniciarFilas } from "./carrusel.js";
import { iniciarGraficas, actualizarTemaGraficas } from "./charts.js";


//CONSTANTES
const TITULOS_HERO = /doomsday|brand new day|endgame/i;

const IDS_DOOMSDAY = [
    299536, // Vengadores: Infinity War
    299534, // Vengadores: Endgame
    453395, // Doctor Strange en el multiverso de la locura
    634649, // Spider-Man: No Way Home
    533535, // Deadpool y Lobezno
    986056, // Thunderbolts
    617126, // Los 4 Fantásticos: Primeros pasos
];

const PAGINAS_FILA = 2;    
const MAX_PAGINAS = 25;    


const SECCIONES = {
    recomendadas: {
        titulo: "Recomendadas",
        fuentes: [
            ["movie", "vote_average.desc", { "vote_count.gte": 300 }],
            ["tv", "vote_average.desc", { "vote_count.gte": 100 }],
        ],
        comparar: (a, b) => b.nota - a.nota,
    },
    peliculas: {
        titulo: "Películas",
        fuentes: [["movie", "popularity.desc"]],
        comparar: null,
    },
    series: {
        titulo: "Series",
        fuentes: [["tv", "popularity.desc"]],
        comparar: null,
    },
};


//DOM 
const estado = document.querySelector("#estado");
const contenido = document.querySelector("#contenido");

const gridNovedades = document.querySelector("#grid-novedades");
const gridRecomendadas = document.querySelector("#grid-recomendadas");
const gridMaraton = document.querySelector("#grid-maraton");
const gridPeliculas = document.querySelector("#grid-peliculas");
const gridSeries = document.querySelector("#grid-series");
const gridFavoritos = document.querySelector("#grid-favoritos");
const favoritosVacio = document.querySelector("#favoritos-vacio");

const buscador = document.querySelector("#buscador");
const buscadorInput = document.querySelector("#buscador-input");
const historialDatos = document.querySelector("#historial-datos");
const resultados = document.querySelector("#resultados");
const resultadosTitulo = document.querySelector("#resultados-titulo");
const gridResultados = document.querySelector("#grid-resultados");
const resultadosVacio = document.querySelector("#resultados-vacio");

const catalogo = document.querySelector("#catalogo");
const catalogoTitulo = document.querySelector("#catalogo-titulo");
const catalogoFiltros = document.querySelector("#catalogo-filtros");
const gridCatalogo = document.querySelector("#grid-catalogo");
const catalogoVacio = document.querySelector("#catalogo-vacio");
const catalogoMas = document.querySelector("#catalogo-mas");
const catalogoCerrar = document.querySelector("#catalogo-cerrar");

const navLogo = document.querySelector(".nav-logo");
const navToggle = document.querySelector("#nav-toggle");
const navLista = document.querySelector("#nav-lista");
const interruptorTema = document.querySelector("#interruptor-tema");

const gridsFila = {
    recomendadas: gridRecomendadas,
    peliculas: gridPeliculas,
    series: gridSeries,
};


//  ESTADO 
let idsPelis = new Set();
let idsSeries = new Set();
let nombresGeneros = {};
let itemsFila = {};
const filtrosFila = {};

let claveCatalogo = null;
let paginaCatalogo = 0;
let totalPaginasCatalogo = 1;
let itemsCatalogo = [];
let filtrosCatalogo = { genero: 0, nota: 0 };
let cargandoCatalogo = false;

// Guarda cada Pelicula/Serie
const registro = new Map();


//  UTILS 
function mostrarError(texto) {
    estado.textContent = `Ups: ${texto}`;
}

function claveItem(tipo, id) {
    return `${tipo}-${id}`;
}

function pintar(grid, lista, opciones) {
    lista.forEach(item => registro.set(claveItem(item.tipo, item.id), item));
    grid.replaceChildren(...lista.map(item => item.toCard({ ...opciones, esFavorita: esFavorito(item.tipo, item.id) })
    ));
}

function debounce(funcion, espera = 400) {
    let temporizador;
    return (valor) => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => funcion(valor), espera);
    };
}


//  DATOS 
async function cargarSeccion(clave, pagina) {
    const { fuentes, comparar } = SECCIONES[clave];

    const respuestas = await Promise.all(
        fuentes.map(([tipo, orden, extra]) => descubrirMarvel(tipo, orden, pagina, extra))
    );

    const items = respuestas.flatMap((respuesta, i) => {
        const tipo = fuentes[i][0];
        return respuesta.resultados.map(json =>
            tipo === "movie" ? Pelicula.desdeTMDB(json) : Serie.desdeTMDB(json)
        );
    });
    //Por si existiera el comparar 
    if (comparar) items.sort(comparar);
    const totalPaginas = Math.max(...respuestas.map(r => r.totalPaginas));
    return { items, totalPaginas };
}

async function cargarFila(clave) {
    const paginas = await Promise.all(
        Array.from({ length: PAGINAS_FILA }, (_, i) => cargarSeccion(clave, i + 1))
    );
    const items = paginas.flatMap(p => p.items);
    const { comparar } = SECCIONES[clave];
    return comparar ? items.sort(comparar) : items;
}

async function cargarNovedades() {
    const [pelis, series] = await Promise.all([
        descubrirMarvel("movie", "primary_release_date.desc", 1),
        descubrirMarvel("tv", "first_air_date.desc", 1),
    ]);

    return [
        ...pelis.resultados.map(json => Pelicula.desdeTMDB(json)),
        ...series.resultados.map(json => Serie.desdeTMDB(json)),
    ]
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .slice(0, 12);
}


//  FILTROS  
function crearFiltros(filtros, alCambiar) {
    const caja = document.createElement("div");
    caja.className = "filtros";

    const selGenero = document.createElement("select");
    selGenero.className = "filtro";
    selGenero.setAttribute("aria-label", "Filtrar por género");
    selGenero.append(new Option("Todos los géneros", 0));
    Object.entries(nombresGeneros)
        .sort(([, a], [, b]) => a.localeCompare(b))
        .forEach(([id, nombre]) => selGenero.append(new Option(nombre, id)));

    const selNota = document.createElement("select");
    selNota.className = "filtro";
    selNota.setAttribute("aria-label", "Filtrar por nota mínima");
    [[0, "Cualquier nota"], [6, "★ 6 o más"], [7, "★ 7 o más"], [8, "★ 8 o más"]]
        .forEach(([valor, texto]) => selNota.append(new Option(texto, valor)));

    selGenero.addEventListener("change", () => {
        filtros.genero = Number(selGenero.value);
        alCambiar();
    });
    selNota.addEventListener("change", () => {
        filtros.nota = Number(selNota.value);
        alCambiar();
    });

    caja.append(selGenero, selNota);
    return caja;
}


//  FILAS DE LA PORTADA 
function crearVerMas(clave) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta tarjeta-vermas";
    tarjeta.tabIndex = 0;
    tarjeta.setAttribute("role", "button");
    tarjeta.setAttribute("aria-label", `Ver todo: ${SECCIONES[clave].titulo}`);
    tarjeta.dataset.seccion = clave;

    const icono = document.createElement("span");
    icono.className = "tarjeta-vermas-icono";
    icono.textContent = "→";
    icono.setAttribute("aria-hidden", "true");

    const texto = document.createElement("span");
    texto.textContent = "Ver todo";

    tarjeta.append(icono, texto);
    return tarjeta;
}

function pintarFila(clave) {
    const grid = gridsFila[clave];
    pintar(grid, aplicarFiltros(itemsFila[clave], filtrosFila[clave]));
    grid.append(crearVerMas(clave));
    grid.scrollLeft = 0;
}


//  PANEL DE VER TODO 
function pintarCatalogo() {
    const visibles = aplicarFiltros(itemsCatalogo, filtrosCatalogo);
    pintar(gridCatalogo, visibles);
    catalogoVacio.hidden = visibles.length > 0;
}

async function cargarMasCatalogo() {
    if (!claveCatalogo || cargandoCatalogo || paginaCatalogo >= totalPaginasCatalogo) return;

    const clave = claveCatalogo;
    cargandoCatalogo = true;
    catalogoMas.disabled = true;

    try {
        const siguiente = paginaCatalogo + 1;
        const { items, totalPaginas } = await cargarSeccion(clave, siguiente);
        if (clave !== claveCatalogo) return;   // respuesta vieja se descarta

        itemsCatalogo = [...itemsCatalogo, ...items];
        paginaCatalogo = siguiente;
        totalPaginasCatalogo = Math.min(totalPaginas, MAX_PAGINAS);
        pintarCatalogo();

        // Reobservamos el botón: si sigue a la vista, vuelve a cargar.
        observador.unobserve(catalogoMas);
        observador.observe(catalogoMas);
    } catch (error) {
        mostrarError(error.message);
    } finally {
        cargandoCatalogo = false;
        catalogoMas.disabled = false;
        catalogoMas.hidden = paginaCatalogo >= totalPaginasCatalogo;
    }
}

// Scroll infinito
const observador = new IntersectionObserver((entradas) => {
    if (entradas[0].isIntersecting) cargarMasCatalogo();
});
observador.observe(catalogoMas);

function abrirCatalogo(clave) {
    claveCatalogo = clave;
    itemsCatalogo = [];
    paginaCatalogo = 0;
    totalPaginasCatalogo = 1;
    filtrosCatalogo = { genero: 0, nota: 0 };
    cargandoCatalogo = false;

    catalogoTitulo.textContent = SECCIONES[clave].titulo;
    catalogoFiltros.replaceChildren(crearFiltros(filtrosCatalogo, pintarCatalogo));
    gridCatalogo.replaceChildren();
    catalogoVacio.hidden = true;
    catalogoMas.hidden = false;
    catalogo.hidden = false;
    catalogo.scrollTop = 0;

    cargarMasCatalogo();
}

function cerrarCatalogo() {
    catalogo.hidden = true;
    claveCatalogo = null;
}


//  DETALLE 
function abrirDetalle(tarjeta) {
    const { tipo, id } = tarjeta.dataset;
    location.href = `detalle.html?tipo=${tipo}&id=${id}`;
}


function activarTarjeta(tarjeta) {
    if (tarjeta.dataset.seccion) abrirCatalogo(tarjeta.dataset.seccion);
    else abrirDetalle(tarjeta);
}


// HERO 
function elegirHero(candidatas) {
    const unicas = new Map(
        candidatas
            .filter(p => TITULOS_HERO.test(p.titulo))
            .map(p => [p.id, p])
    );
    return [...unicas.values()];
}


//  CARGA DE DATOS 
async function iniciar() {
    estado.textContent = "Cargando el universo Marvel...";
    try {
        const [novedades, recomendadas, peliculas, series, pelisDoom, generos] =
            await Promise.all([
                cargarNovedades(),
                cargarFila("recomendadas"),
                cargarFila("peliculas"),
                cargarFila("series"),
                obtenerPorIds(IDS_DOOMSDAY),
                obtenerGeneros(),
            ]);

        nombresGeneros = generos;
        itemsFila = { recomendadas, peliculas, series };

        pintar(gridNovedades, novedades);

        Object.keys(itemsFila).forEach(clave => {
            filtrosFila[clave] = { genero: 0, nota: 0 };
            const titulo = gridsFila[clave].closest(".seccion").querySelector(".seccion-titulo");
            titulo.after(crearFiltros(filtrosFila[clave], () => pintarFila(clave)));
            pintarFila(clave);
        });

        const maraton = pelisDoom.map(json => Pelicula.desdeTMDB(json));
        pintar(gridMaraton, maraton, { doomsday: true });

        const hero = elegirHero([...peliculas, ...novedades.filter(n => n.tipo === "movie")]);
        iniciarCarrusel(hero);

        iniciarGraficas(peliculas, series, nombresGeneros);

        estado.textContent = "";
    } catch (error) {
        mostrarError(error.message);
    }
}

//  FAVORITOS 
function pintarFavoritos() {
    const favoritos = leerFavoritos();
    pintar(gridFavoritos, favoritos);
    favoritosVacio.hidden = favoritos.length > 0;
}

function alternarFav(tarjeta) {
    const { tipo, id } = tarjeta.dataset;
    const item = registro.get(claveItem(tipo, id));
    if (!item) return;

    const ahoraEsFavorita = alternarFavorito(item);

    // La misma peli puede estar en varias filas actualizamos todos sus corazones
    document
        .querySelectorAll(`.tarjeta[data-tipo="${tipo}"][data-id="${id}"] .tarjeta-fav`)
        .forEach(boton => {
            boton.setAttribute("aria-pressed", String(ahoraEsFavorita));
            boton.setAttribute("aria-label", ahoraEsFavorita ? "Quitar de favoritos" : "Añadir a favoritos");
        });

    pintarFavoritos();
}


//  HISTORIAL 
function pintarHistorial() {
    historialDatos.replaceChildren(...leerHistorial().map(texto => {
        const opcion = document.createElement("option");
        opcion.value = texto;
        return opcion;
    }));
}


// TEMA Y MENÚ 
function aplicarTema(claro) {
    document.documentElement.dataset.tema = claro ? "claro" : "oscuro";
    interruptorTema.checked = claro;
    actualizarTemaGraficas();
}

function alternarMenu(abrir) {
    navToggle.setAttribute("aria-expanded", String(abrir));
    navToggle.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
}


//  BUSCADOR 
async function cargarIdsMarvel() {
    [idsPelis, idsSeries] = await Promise.all([idsMarvel("movie"), idsMarvel("tv")]);
}

function cerrarResultados() {
    resultados.hidden = true;
}

async function buscar(texto) {
    texto = texto.trim();

    if (texto.length < 2) {
        cerrarResultados();
        return;
    }

    try {
        await idsListos;
        const { resultados: encontrados } = await buscarMarvel(texto);

        // Si ya se escribe otra cosa, descartamos esta respuesta vieja.
        if (buscadorInput.value.trim() !== texto) return;

        const lista = encontrados
            .filter(r => r.media_type === "movie" ? idsPelis.has(r.id) : idsSeries.has(r.id))
            .map(r => r.media_type === "movie" ? Pelicula.desdeTMDB(r) : Serie.desdeTMDB(r));

        resultadosTitulo.textContent = `Resultados para "${texto}"`;
        pintar(gridResultados, lista);
        resultadosVacio.hidden = lista.length > 0;
        resultados.hidden = false;
    } catch (error) {
        mostrarError(error.message);
    }
}

const buscarConEspera = debounce(buscar, 400);


//EVENTOS 
contenido.addEventListener("click", (e) => {
    const tarjeta = e.target.closest(".tarjeta");
    if (!tarjeta) return;

    if (e.target.closest(".tarjeta-fav")) {
        alternarFav(tarjeta);
        return;
    }

    activarTarjeta(tarjeta);
});

contenido.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !e.target.matches(".tarjeta")) return;
    activarTarjeta(e.target);
});

catalogoCerrar.addEventListener("click", cerrarCatalogo);

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !catalogo.hidden) cerrarCatalogo();
});

// el navegador puede restaurar la página desde su caché.
window.addEventListener("pageshow", (e) => {
    if (e.persisted) pintarFavoritos();
});

buscadorInput.addEventListener("input", () => buscarConEspera(buscadorInput.value));

buscador.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texto = buscadorInput.value.trim();
    await buscar(texto);

    if (texto.length >= 2) {
        guardarBusqueda(texto);
        pintarHistorial();
    }
    buscadorInput.blur();
});

buscadorInput.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    buscadorInput.value = "";
    cerrarResultados();
    buscadorInput.blur();
});

navLogo.addEventListener("click", () => {
    buscadorInput.value = "";
    cerrarResultados();
    cerrarCatalogo();
});

navToggle.addEventListener("click", () => {
    alternarMenu(navToggle.getAttribute("aria-expanded") !== "true");
});

navLista.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-enlace")) return;
    alternarMenu(false);
    buscadorInput.value = "";
    cerrarResultados();
    cerrarCatalogo();
});

interruptorTema.addEventListener("change", () => {
    aplicarTema(interruptorTema.checked);
    guardarTema(interruptorTema.checked);
});


//ARRANQUE 
aplicarTema(leerTema());
pintarFavoritos();
pintarHistorial();
iniciarFilas();
iniciarIntro();
iniciar();
const idsListos = cargarIdsMarvel().catch(error => mostrarError(error.message));
