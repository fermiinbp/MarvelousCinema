function crearTarjeta(item, { esFavorita = false, doomsday = false } = {}) {

    const plantilla = document.querySelector("#plantilla-tarjeta");
    const tarjeta = plantilla.content.firstElementChild.cloneNode(true);

    tarjeta.dataset.id = item.id;
    tarjeta.dataset.tipo = item.tipo;

    tarjeta.classList.toggle("tarjeta--doomsday", doomsday);

    const poster = tarjeta.querySelector(".tarjeta-poster");
    if (item.posterUrl) {
        poster.src = item.posterUrl;
        poster.alt = `Póster de ${item.titulo}`;
    } else {
        poster.removeAttribute("src");
        poster.alt = "";
    }

    tarjeta.querySelector(".tarjeta-titulo").textContent = item.titulo;
    tarjeta.querySelector(".tarjeta-fecha").textContent = item.fechaTexto;

    
    tarjeta.querySelector(".tarjeta-nota").textContent =
        item.nota > 0 ? `★ ${item.nota.toFixed(1)}` : "";

    const fav = tarjeta.querySelector(".tarjeta-fav");
    fav.setAttribute("aria-pressed", String(esFavorita));
    fav.setAttribute("aria-label", esFavorita ? "Quitar de favoritos" : "Añadir a favoritos");

    return tarjeta;
}


//CLASE PADRE 
export class Contenido {
    constructor({
        id,
        tipo,
        titulo,
        fecha = "",
        nota = 0,
        poster = null,
        backdrop = null,
        sinopsis = "",
        generoIds = [],
    }) {
        this.id = id;
        this.tipo = tipo;          
        this.titulo = titulo;
        this.fecha = fecha;        
        this.nota = nota;
        this.poster = poster;
        this.backdrop = backdrop;  
        this.sinopsis = sinopsis;
        this.generoIds = generoIds;
    }

    // GETTERS
    get anio() {
        return this.fecha?.slice(0, 4) || "---";
    }

    get fechaTexto() {
        if (!this.fecha) return "Sin fecha";
        return new Date(this.fecha).toLocaleDateString("es-ES", {
            day: "numeric", month: "short", year: "numeric",
        });
    }

    get posterUrl() {
        return this.poster ? `https://image.tmdb.org/t/p/w342${this.poster}` : null;
    }

    get backdropUrl() {
        return this.backdrop ? `https://image.tmdb.org/t/p/w1280${this.backdrop}` : null;
    }

    get infoExtra() {
        return "";
    }

    toCard(opciones) {
        return crearTarjeta(this, opciones);
    }
}


export class Pelicula extends Contenido {
    constructor({
        id,
        titulo,
        fecha,
        nota,
        poster,
        backdrop,
        sinopsis,
        generoIds,
        duracion = null,
    }) {
        super({ id, tipo: "movie", titulo, fecha, nota, poster, backdrop, sinopsis, generoIds });

        this.duracion = duracion;  
    }

    get infoExtra() {
        return this.duracion ? `${this.duracion} min` : "";
    }

    static desdeTMDB({
        id, title, release_date, vote_average, poster_path,
        backdrop_path, overview, genre_ids, genres, runtime,
    }) {
        return new Pelicula({
            id,
            titulo: title,
            fecha: release_date ?? "",
            nota: vote_average ?? 0,      
            poster: poster_path ?? null,
            backdrop: backdrop_path ?? null,
            sinopsis: overview ?? "",
            generoIds: genre_ids ?? genres?.map(g => g.id) ?? [],
            duracion: runtime ?? null,
        });
    }
}


export class Serie extends Contenido {
    constructor({
        id,
        titulo,
        fecha,
        nota,
        poster,
        backdrop,
        sinopsis,
        generoIds,
        temporadas = null,
        episodios = null,
    }) {
        super({ id, tipo: "tv", titulo, fecha, nota, poster, backdrop, sinopsis, generoIds });

        this.temporadas = temporadas;  
        this.episodios = episodios;    
    }

    get infoExtra() {
        if (!this.temporadas) return "";
        return `${this.temporadas} ${this.temporadas === 1 ? "temporada" : "temporadas"}`;
    }

    static desdeTMDB({
        id, name, first_air_date, vote_average, poster_path,
        backdrop_path, overview, genre_ids, genres,
        number_of_seasons, number_of_episodes,
    }) {
        return new Serie({
            id,
            titulo: name,
            fecha: first_air_date ?? "",
            nota: vote_average ?? 0,
            poster: poster_path ?? null,
            backdrop: backdrop_path ?? null,
            sinopsis: overview ?? "",
            generoIds: genre_ids ?? genres?.map(g => g.id) ?? [],
            temporadas: number_of_seasons ?? null,
            episodios: number_of_episodes ?? null,
        });
    }
}