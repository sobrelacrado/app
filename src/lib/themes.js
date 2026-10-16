// Aspecto visual de cada juego en el panel. Cada tema es un bloque de estilos `.tema-<nombre>` en theme.css.
export const THEMES = ['detective', 'policial', 'egipcio', 'alien']
export const DEFAULT_THEME = 'detective' // el de los juegos que no tienen tema guardado (caso 2)
export const themeOf = (game) => (THEMES.includes(game?.theme) ? game.theme : DEFAULT_THEME)
