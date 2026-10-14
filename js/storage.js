import { Pelicula, Serie } from "./modelos.js";

const CLAVE_FAVORITOS = "marvelous.favoritos";
const CLAVE_HISTORIAL = "marvelous.historial";
const CLAVE_TEMA = "marvelous.tema";

const MAX_HISTORIAL = 10;  


// FUNCIONES  

function leerJSON(clave, porDefecto) {
    try {
        return JSON.parse(localStorage.getItem(clave)) ?? porDefecto;
    } catch {
        return porDefecto;
    }
}

function guardarJSON(clave, valor) {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
        console.warn("No se pudo guardar en localStorage:", error.message);
    }
}


//FAVORITOS

function aInstancia(obj) {
    return obj.tipo === "tv" ? new Serie(obj) : new Pelicula(obj);
}

function mismoItem(a, b) {
    return a.tipo === b.tipo && a.id === b.id;
}

export function leerFavoritos() {
    return leerJSON(CLAVE_FAVORITOS, []).map(aInstancia);
}

export function esFavorito(tipo, id) {
    return leerFavoritos().some(f => f.tipo === tipo && f.id === id);
}

export function alternarFavorito(item) {
    const favoritos = leerFavoritos();
    const yaEra = favoritos.some(f => mismoItem(f, item));

    const nuevos = yaEra
        ? favoritos.filter(f => !mismoItem(f, item))
        : [...favoritos, item];

    guardarJSON(CLAVE_FAVORITOS, nuevos);
    return !yaEra;
}


// HISTORIAL DE BÚSQUEDAS 
export function leerHistorial() {
    return leerJSON(CLAVE_HISTORIAL, []);
}

export function guardarBusqueda(texto) {
    const historial = leerHistorial().filter(t => t.toLowerCase() !== texto.toLowerCase());
    historial.unshift(texto);
    guardarJSON(CLAVE_HISTORIAL, historial.slice(0, MAX_HISTORIAL));
}


//TEMA
export function leerTema() {
    return leerJSON(CLAVE_TEMA, false);
}

export function guardarTema(claro) {
    guardarJSON(CLAVE_TEMA, claro);
}