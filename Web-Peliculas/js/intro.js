//  CONSTANTES
const CLAVE_INTRO = "marvelous.introVista"; 
const SIGLAS = "MRVLCN";

// FUNCIÓN PRINCIPAL 
export function iniciarIntro() {
    const intro = document.querySelector("#intro");
    if (!intro) return;               

    let yaVista = false;
    try {
        yaVista = sessionStorage.getItem(CLAVE_INTRO) === "si";
    } catch {
        yaVista = false;
    }

    const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (yaVista || reducirMovimiento) {
        intro.remove();           
        return;
    }

    //  CREAR LAS LETRAS
    const logo = intro.querySelector("#intro-logo");
    const letras = [...SIGLAS].map((letra, i) => {
        const span = document.createElement("span");
        span.className = "intro-letra";
        span.textContent = letra;
        span.style.setProperty("--i", i);    
        span.setAttribute("aria-hidden", "true");
        return span;
    });
    logo.append(...letras);

    //  CERRAR LA INTRO 
    function cerrar() {
        intro.remove();
        document.removeEventListener("keydown", alPulsarTecla);   
        try {
            sessionStorage.setItem(CLAVE_INTRO, "si");         
        } catch {
        }
    }

    function alPulsarTecla(e) {
        if (e.key === "Escape") cerrar();
    }

    intro.addEventListener("animationend", (e) => {
        if (e.target === intro && e.animationName === "intro-salida") cerrar();
    });

    intro.querySelector("#intro-saltar").addEventListener("click", cerrar);
    document.addEventListener("keydown", alPulsarTecla);
}