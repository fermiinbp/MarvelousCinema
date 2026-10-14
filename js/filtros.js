export function filtrarPorGenero(items, genero) {
    if (!genero) return items;
    return items.filter(item => item.generoIds.includes(genero));
}

export function filtrarPorNota(items, notaMin) {
    if (!notaMin) return items;
    return items.filter(item => item.nota >= notaMin);
}

export function aplicarFiltros(items, { genero = 0, nota = 0 } = {}) {
    return filtrarPorNota(filtrarPorGenero(items, genero), nota);
}