/**
 * Metadatos legales centralizados. Al publicar una versión NUEVA del Aviso
 * de Privacidad o de los Términos, incrementa POLICY_VERSION: los usuarios
 * que hayan aceptado una versión anterior verán de nuevo la compuerta de
 * aceptación (consentimiento re-otorgado y registrado con la nueva versión).
 */
export const POLICY_VERSION = '2026-07-03';

/** Fecha de entrada en vigor mostrada en los documentos. */
export const POLICY_EFFECTIVE_DATE = '3 de julio de 2026';

/** Última actualización mostrada en los documentos. */
export const POLICY_LAST_UPDATED = '3 de julio de 2026';

/** Datos del responsable/titular del tratamiento (editar con datos reales). */
export const LEGAL_ENTITY = {
  appName: 'Vocaciones STEAM',
  responsible: 'el equipo de Vocaciones STEAM',
  contactEmail: 'privacidad@vocacionessteam.app',
  supportEmail: 'soporte@vocacionessteam.app',
  jurisdiction: 'Estados Unidos Mexicanos',
};
