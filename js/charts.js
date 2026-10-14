
const lienzoGeneros = document.querySelector("#grafica-generos");
const lienzoNotas = document.querySelector("#grafica-notas");

const PALETA = [
    "#e62429", "#f5c518", "#2fbf71", "#3b82f6",
    "#a855f7", "#f97316", "#14b8a6", "#ec4899",
];

let graficaGeneros = null;
let graficaNotas = null;


//  FUNCIONES PURAS 

function contarGeneros(items, nombresGeneros) {
    const conteo = {};

    items.forEach(item => {
        item.generoIds.forEach(idGenero => {
            const nombre = nombresGeneros[idGenero];
            if (!nombre) return;  // género desconocido lo saltamos
            conteo[nombre] = (conteo[nombre] ?? 0) + 1;
        });
    });


    return Object.entries(conteo).sort((a, b) => b[1] - a[1]);
}

function mejoresNotas(items, cuantas = 10) {
    return [...items]
        .filter(item => item.nota > 0)
        .sort((a, b) => b.nota - a.nota)
        .slice(0, cuantas);
}


//  COLORES SEGÚN EL TEMA 

function leerColor(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}


//  CREAR LAS GRÁFICAS 
function crearDoughnut(items, nombresGeneros) {
    const datos = contarGeneros(items, nombresGeneros).slice(0, 8);  

    Chart.getChart(lienzoGeneros)?.destroy();

    graficaGeneros = new Chart(lienzoGeneros, {
        type: "doughnut",
        data: {
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
            maintainAspectRatio: false, 
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
            indexAxis: "y",              
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, 
            },
            scales: {
                x: {
                    min: 0,
                    max: 10,              // las notas 
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


//  Funciones para el main.js

export function iniciarGraficas(peliculas, series, nombresGeneros) {
    crearDoughnut([...peliculas, ...series], nombresGeneros);
    crearBarras(peliculas);
}


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