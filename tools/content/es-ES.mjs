import neutralSpanish from "./es.mjs";

function adapt(value) {
  if (Array.isArray(value)) return value.map(adapt);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, adapt(item)]));
  }
  if (typeof value !== "string") return value;
  return value
    .replaceAll('href="/es/', 'href="/es-ES/')
    .replaceAll("Rey de la cancha", "Rey de la pista")
    .replaceAll("canchas", "pistas")
    .replaceAll("cancha", "pista")
    .replaceAll("Canchas", "Pistas")
    .replaceAll("Cancha", "Pista")
    .replaceAll("posiciones", "clasificación")
    .replaceAll("Posiciones", "Clasificación");
}

const content = adapt(neutralSpanish);
content.lang = "es-ES";
content.prefix = "es-ES/";
content.meta.landingTitle = "TourneySmith | Organiza torneos de deportes de raqueta";
content.meta.landingDescription = "Organiza torneos de deportes de raqueta con cuadros en vivo, horarios, resultados, clasificación, invitaciones, grupos de jugadores y sincronización en Android y iOS.";
content.landing.cards[1].body = "Reutiliza jugadores guardados, añade jugadores provisionales, organiza grupos y selecciona hasta cuatro grupos al crear un torneo. TourneySmith admite individuales y dobles cuando cada deporte lo permite.";
content.landing.cards[2].body = "Invita a jugadores, espectadores y coorganizadores. Los torneos compartidos reúnen cuadros en vivo, clasificación, resultados y registro de marcadores para que todos sigan el mismo evento.";

export default content;
