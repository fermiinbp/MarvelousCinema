const carrusel = document.querySelector("#carrusel");
const pista = document.querySelector("#carrusel-pista");
const botonAnterior = document.querySelector("#carrusel-anterior");
const botonSiguiente = document.querySelector("#carrusel-siguiente");
const puntos = document.querySelector("#carrusel-puntos");
const heroEtiqueta = document.querySelector("#hero-etiqueta");
const heroEstreno = document.querySelector("#hero-estreno");

const INTERVALO = 6000;

let lista = [];
let indice = 0;
let temporizador = null;


//  HERO 

function crearSlide(item) {
    const slide = document.createElement("a");
    slide.className = "carrusel-slide";
    slide.href = `detalle.html?tipo=${item.tipo}&id=${item.id}`;
    slide.setAttribute("aria-label", `Ver ficha de ${item.titulo}`);

    const imagen = document.createElement("img");
    imagen.className = "carrusel-imagen";
    imagen.src = item.backdropUrl;
    imagen.alt = `Imagen de ${item.titulo}`;
    imagen.draggable = false;   // evita arrastrar la imagen en lugar de deslizar

    slide.append(imagen);
    return slide;
}

function crearPunto(i, titulo) {
    const punto = document.createElement("button");
    punto.className = "carrusel-punto";
    punto.type = "button";
    punto.setAttribute("aria-label", `Ir a ${titulo}`);
    punto.addEventListener("click", () => {
        irA(i);
        programar();
    });
    return punto;
}

function irA(i) {
    const total = lista.length;
    const destino = (i + total) % total;
    pista.scrollTo({ left: destino * pista.clientWidth, behavior: "smooth" });
}

function actualizar(i) {
    indice = i;
    const item = lista[i];

    [...puntos.children].forEach((punto, n) => {
        punto.setAttribute("aria-current", String(n === i));
    });

    const hoy = new Date().toISOString().slice(0, 10);
    const yaEstrenada = item.fecha !== "" && item.fecha <= hoy;

    heroEtiqueta.textContent = yaEstrenada ? "Disponible ya" : "Próximo estreno";
    heroEstreno.textContent = `${item.titulo} · ${item.fechaTexto}`;
}

function programar() {
    clearInterval(temporizador);

    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sinMovimiento || lista.length < 2) return;

    temporizador = setInterval(() => {
        if (document.hidden || carrusel.matches(":hover")) return;
        irA(indice + 1);
    }, INTERVALO);
}

botonAnterior.addEventListener("click", () => {
    irA(indice - 1);
    programar();
});

botonSiguiente.addEventListener("click", () => {
    irA(indice + 1);
    programar();
});

pista.addEventListener("scroll", () => {
    const i = Math.round(pista.scrollLeft / pista.clientWidth);
    if (i !== indice && lista[i]) actualizar(i);
});

pista.addEventListener("pointerdown", programar);

export function iniciarCarrusel(items) {
    lista = items.filter(item => item.backdropUrl);
    if (lista.length === 0) return;

    pista.replaceChildren(...lista.map(crearSlide));
    puntos.replaceChildren(...lista.map((item, i) => crearPunto(i, item.titulo)));

    actualizar(0);
    programar();
}


//  FILAS DE TARJETAS 
function crearFlecha(lado, simbolo, etiqueta) {
    const boton = document.createElement("button");
    boton.className = `fila-boton fila-${lado}`;
    boton.type = "button";
    boton.textContent = simbolo;
    boton.setAttribute("aria-label", etiqueta);
    return boton;
}

export function iniciarFilas() {
    document.querySelectorAll(".fila-tarjetas").forEach(fila => {
        const envoltorio = document.createElement("div");
        envoltorio.className = "fila";
        fila.before(envoltorio);

        const anterior = crearFlecha("anterior", "‹", "Ver anteriores");
        const siguiente = crearFlecha("siguiente", "›", "Ver siguientes");
        envoltorio.append(anterior, fila, siguiente);

        function actualizarFlechas() {
            anterior.hidden = fila.scrollLeft <= 4;
            siguiente.hidden = fila.scrollLeft + fila.clientWidth >= fila.scrollWidth - 4;
        }

        anterior.addEventListener("click", () => {
            fila.scrollBy({ left: -fila.clientWidth * 0.8, behavior: "smooth" });
        });
        siguiente.addEventListener("click", () => {
            fila.scrollBy({ left: fila.clientWidth * 0.8, behavior: "smooth" });
        });

        fila.addEventListener("scroll", actualizarFlechas);
        window.addEventListener("resize", actualizarFlechas);
        new MutationObserver(actualizarFlechas).observe(fila, { childList: true });

        actualizarFlechas();
    });
}