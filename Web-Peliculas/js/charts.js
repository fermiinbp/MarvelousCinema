// Gráficas con Chart.js. `Chart` es una variable global: la crea el <script>
// de Chart.js que ya está en index.html (por eso no hay import).

const lienzoGeneros = document.querySelector("#grafica-generos");
const lienzoNotas = document.querySelector("#grafica-notas");

// Paleta para los trozos del doughnut (se repite si hay más géneros que colores).
const PALETA = [
    "#e62429", "#f5c518", "#2fbf71", "#3b82f6",
    "#a855f7", "#f97316", "#14b8a6", "#ec4899",
];

// Guardamos las gráficas para poder recolorearlas al cambiar el tema.
let graficaGeneros = null;
let graficaNotas = null;


// ---------- FUNCIONES PURAS ----------
// "Pura" = solo usa lo que recibe y devuelve un resultado nuevo, sin tocar
// el DOM ni modificar los datos de entrada. Así son fáciles de probar y explicar.

// Cuenta cuántas películas/series hay de cada género.
// Devuelve [["Acción", 18], ["Aventura", 15], ...] ordenado de más a menos.
function contarGeneros(items, nombresGeneros) {
    const conteo = {};

    items.forEach(item => {
        item.generoIds.forEach(idGenero => {
            const nombre = nombresGeneros[idGenero];
            if (!nombre) return;                       // género desconocido: lo saltamos
            conteo[nombre] = (conteo[nombre] ?? 0) + 1; // ?? 0: si no existía, empezamos en 0
        });
    });

    // Object.entries(obj) -> [[clave, valor], ...] para poder ordenar.
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]);
}

// Las N películas con más nota (con votos reales: nota > 0).
// [...items] copia antes de ordenar, porque sort() modifica el array.
function mejoresNotas(items, cuantas = 10) {
    return [...items]
        .filter(item => item.nota > 0)
        .sort((a, b) => b.nota - a.nota)
        .slice(0, cuantas);
}


// ---------- COLORES SEGÚN EL TEMA ----------
// Leemos las variables CSS (--texto-suave, --borde...) para que la gráfica
// combine con el tema claro u oscuro.
function leerColor(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}


// ---------- CREAR LAS GRÁFICAS ----------
function crearDoughnut(items, nombresGeneros) {
    const datos = contarGeneros(items, nombresGeneros).slice(0, 8);  // los 8 más comunes

    // Chart.getChart(canvas) devuelve la gráfica que ya hay en ese canvas (si existe).
    // Hay que destruirla antes de crear otra, o Chart.js da error.
    Chart.getChart(lienzoGeneros)?.destroy();

    graficaGeneros = new Chart(lienzoGeneros, {
        type: "doughnut",
        data: {
            // map para separar los pares [nombre, cantidad] en dos listas.
            labels: datos.map(([nombre]) => nombre),
            datasets: [{
                data: datos.map(([, cantidad]) => cantidad),
                backgroundColor: PALETA,
                borderColor: leerColor("--superficie"),
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,   // se adapta a la altura del contenedor (CSS)
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { color: leerColor("--texto-suave") },
                },
            },
        },
    });
}

function crearBarras(peliculas) {
    const top = mejoresNotas(peliculas, 10);

    Chart.getChart(lienzoNotas)?.destroy();

    graficaNotas = new Chart(lienzoNotas, {
        type: "bar",
        data: {
            labels: top.map(p => p.titulo),
            datasets: [{
                label: "Nota",
                data: top.map(p => p.nota),
                backgroundColor: "#e62429",
                borderRadius: 4,
            }],
        },
        options: {
            indexAxis: "y",               // barras horizontales: los títulos largos caben mejor
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, // con una sola serie la leyenda sobra
            },
            scales: {
                x: {
                    min: 0,
                    max: 10,              // las notas de TMDB son de 0 a 10
                    ticks: { color: leerColor("--texto-suave") },
                    grid: { color: leerColor("--borde") },
                },
                y: {
                    ticks: { color: leerColor("--texto-suave") },
                    grid: { display: false },
                },
            },
        },
    });
}


// ---------- FUNCIONES QUE USA main.js ----------
// `peliculas` y `series` son listas de Pelicula/Serie; `nombresGeneros` el objeto de api.js.
export function iniciarGraficas(peliculas, series, nombresGeneros) {
    crearDoughnut([...peliculas, ...series], nombresGeneros);
    crearBarras(peliculas);
}

// Se llama al cambiar el tema: volvemos a leer los colores y repintamos.
// Si las gráficas aún no existen (el tema se aplica al arrancar), no hacemos nada.
export function actualizarTemaGraficas() {
    if (!graficaGeneros || !graficaNotas) return;

    graficaGeneros.options.plugins.legend.labels.color = leerColor("--texto-suave");
    graficaGeneros.data.datasets[0].borderColor = leerColor("--superficie");

    graficaNotas.options.scales.x.ticks.color = leerColor("--texto-suave");
    graficaNotas.options.scales.x.grid.color = leerColor("--borde");
    graficaNotas.options.scales.y.ticks.color = leerColor("--texto-suave");

    graficaGeneros.update();
    graficaNotas.update();
}