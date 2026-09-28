import en from "./content/en.mjs";
import es from "./content/es.mjs";
import esES from "./content/es-ES.mjs";
import ptBR from "./content/pt-BR.mjs";
import fr from "./content/fr.mjs";
import it from "./content/it.mjs";

export const localeOrder = ["en", "es", "es-ES", "pt-BR", "fr", "it"];
export const locales = {en, es, "es-ES": esES, "pt-BR": ptBR, fr, it};
