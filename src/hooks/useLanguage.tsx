import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Language = "es" | "en" | "ca" | "fr" | "de" | "nl";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getLanguageName: (lang: Language) => string;
  translateCategory: (categoryTitle: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    "welcome.title": "Casa Vista Hermosa",
    "welcome.subtitle": "¡Bienvenido! Tu estancia comienza aquí ✨",
    "welcome.guestsRegistered": "Huéspedes registrados",
    "welcome.completeRegistration": "Completar mi registro",
    "welcome.step": "Paso 1 de 3",
    "welcome.share": "Compartir enlace",
    "welcome.viewAccommodation": "Ver alojamiento",
    "welcome.dataProtected": "🔒 Tus datos están protegidos y encriptados",
    "welcome.compliance":
      "Cumplimos con el RGPD y normativa española de hospedaje",
    "welcome.timeEstimate": "📋 Completa tu registro en solo 3 minutos",
    "welcome.contact": "Contactar",

    // Dashboard - Reservation Card
    "dashboard.guestManagement": "Gestión de Huéspedes",
    "dashboard.registeredGuests": "Huéspedes registrados",
    "dashboard.pendingGuest": "Huésped pendiente",
    "dashboard.copyLink": "Compartir enlace",
    "dashboard.responsibleWarningTitle": "¡Importante!",
    "dashboard.responsibleWarning":
      'No olvides registrarte como el usuario responsable respondiendo a la pregunta "¿Eres tú quien realizó la reserva?". Sin un responsable definido, no tendrás acceso a las funciones de Apertura de Puertas.',
    "dashboard.myStay": "Mi Estancia",
    "dashboard.myReservation": "Mi Reserva",
    "dashboard.accommodation": "Alojamiento",
    "dashboard.reservationId": "ID",
    "dashboard.checkIn": "Check-in",
    "dashboard.checkOut": "Check-out",
    "dashboard.openPortal": "Abrir Portal",
    "dashboard.openAccommodation": "Abrir Alojamiento",
    "dashboard.downloadContract": "Descargar Contrato PDF",
    "dashboard.downloadContractModel": "Descargar Modelo de Contrato",

    // Dashboard - General
    "dashboard.preferences": "Preferencias de Estancia",
    "dashboard.yourHost": "Tu Anfitrión",
    "dashboard.accommodationInfo": "Información del Alojamiento",
    "dashboard.wifiNetwork": "Red WiFi",
    "dashboard.wifiPassword": "Contraseña WiFi",
    "dashboard.welcomeVideo": "Video",
    "dashboard.localGuide": "Guía Local",
    "dashboard.customerSupport": "Información de Interés",
    "dashboard.completeToUnlock": "Completa tu registro para desbloquear",
    "dashboard.sendMessage": "💬 Enviar mensaje",
    "dashboard.callNow": "📞 Llamar ahora",
    "dashboard.sendEmail": "📧 Enviar email",
    "dashboard.missingGuests": "Faltan huéspedes por registrar",
    "dashboard.someFeaturesLimited":
      "Algunas funciones están limitadas hasta que todos los huéspedes se registren",

    // Dashboard - Doors & Unlock
    "dashboard.portal": "Portal",
    "dashboard.unlockHistory": "Historial de Aperturas",
    "dashboard.unlockSuccess": "Puerta abierta exitosamente",
    "dashboard.unlockFailed": "Error al abrir la puerta",
    "dashboard.noUnlockHistory": "No hay aperturas registradas",
    "dashboard.unlockHistoryDescription": "Registro de aperturas desde la app",
    "dashboard.confirmUnlock": "¿Abrir puerta?",
    "dashboard.confirmUnlockDescription":
      "Confirma que quieres abrir la puerta",
    "dashboard.doorOpened": "¡Puerta abierta!",
    "dashboard.doorOpenedDescription": "La puerta se ha abierto correctamente",
    "dashboard.noRaixerTitle": "¡Estamos para ayudarte!",
    "dashboard.noRaixerMessage":
      "Por favor, contacta con tu anfitrión para obtener los códigos de acceso",
    "dashboard.noRaixerMessageBefore": "¡Tu estancia está cada vez más cerca! Tus códigos de acceso se activarán automáticamente el día de tu reserva una vez que todos los huéspedes estéis registrados. ¡Estamos deseando recibirte!",
    "dashboard.noRaixerMessageActivePending": "¡Ya ha llegado el gran día! Solo falta que todos los huéspedes completen su registro para revelar tus códigos de acceso y que podáis disfrutar de vuestra estancia.",
    "dashboard.accessCodesTitle": "Códigos del Cajetín",
    "dashboard.accessCodesMessage":
      "Usa estos códigos para abrir el cajetín y retirar las llaves del alojamiento",
    "dashboard.cajetinInfo": "Información del Cajetín",
    "dashboard.code": "Código",
    "dashboard.accessNotYetAvailable": "Acceso aún no disponible",
    "dashboard.accessFinished": "Acceso finalizado",
    "dashboard.accessAvailableFrom":
      "El acceso a las puertas estará disponible a partir del",
    "dashboard.accessFinishedOn": "El acceso a las puertas finalizó el",
    "dashboard.spainTime": "hora de España",
    "dashboard.loadingAccessInfo": "Cargando información de acceso...",
    "dashboard.codeRevealedOnCheckin": "El código será revelado el día de su reserva",

    // Dashboard - Preferences
    "dashboard.arrival": "Llegada",
    "dashboard.doubleBed": "cama doble",
    "dashboard.doubleBeds": "camas dobles",
    "dashboard.singleBed": "cama individual",
    "dashboard.singleBeds": "camas individuales",
    "dashboard.sofaBed": "sofá cama",
    "dashboard.sofaBeds": "sofás cama",
    "dashboard.bunkBed": "litera",
    "dashboard.bunkBeds": "literas",
    "dashboard.cribRequested": "Cuna solicitada",
    "dashboard.petsRequested": "Mascotas incluidas",
    "dashboard.noPreferences": "Sin preferencias configuradas",
    "dashboard.editPreferences": "Editar preferencias",
    "dashboard.saveChanges": "Guardar cambios",
    "dashboard.cancel": "Cancelar",
    "dashboard.preferencesUpdated": "¡Preferencias actualizadas!",
    "dashboard.preferencesSaved":
      "Tus preferencias han sido guardadas correctamente.",
    "dashboard.preferencesWithExtraBeds":
      "Tus preferencias han sido guardadas. El anfitrión será notificado sobre tu solicitud de camas adicionales.",
    "dashboard.extraBedsRequest": "Solicitud de camas adicionales",
    "dashboard.extraBedsWarning": "Estás solicitando",
    "dashboard.beds": "camas",
    "dashboard.for": "para",
    "dashboard.guest": "huésped",
    "dashboard.guests": "huéspedes",
    "dashboard.estimatedArrival": "Hora estimada de llegada",
    "dashboard.additionalInfo": "Información adicional",
    "dashboard.needsCrib": "¿Necesitas cuna?",
    "dashboard.hasPets": "¿Viajas con mascotas?",
    "dashboard.notAvailable": "No disponible en este alojamiento",

    // Dashboard - Incidents
    "dashboard.reportIncident": "Reportar incidencia",
    "dashboard.reportIncidentTitle": "Reportar una Incidencia",
    "dashboard.incidentType": "Tipo de incidencia",
    "dashboard.complaint": "Queja",
    "dashboard.suggestion": "Sugerencia",
    "dashboard.incidentSubject": "Asunto",
    "dashboard.incidentDescription": "Descripción",
    "dashboard.incidentSubmit": "Enviar reporte",
    "dashboard.incidentCancel": "Cancelar",
    "dashboard.incidentSent": "enviada",
    "dashboard.incidentRegistered":
      "Tu mensaje ha sido registrado correctamente",
    "dashboard.yourIncidents": "Tus incidencias",
    "dashboard.noIncidents": "No has reportado ninguna incidencia",
    "dashboard.suggestionsComplaints": "Sugerencias o Quejas",
    "dashboard.yourOpinionHelps": "Tu opinión nos ayuda a mejorar",
    "dashboard.type": "Tipo",
    "dashboard.subjectPlaceholder": "¿De qué trata tu mensaje?",
    "dashboard.descriptionPlaceholder": "Describe tu sugerencia o queja...",
    "dashboard.messageHistory": "Historial de mensajes",
    "dashboard.send": "Enviar",
    "dashboard.visitVacanfly": "Visitar Vacanfly.com",
    "dashboard.festivalsNearby": "Fiestas Patronales y Municipales",
    "dashboard.festivalsNearbyDescription":
      'Esta página web muestra información actualizada de las fiestas patronales y municipales más cercanas en cada fecha, vaya al apartado "Fiestas cerca de mí"',
    "dashboard.visitFestivalsPage": "Ver Fiestas Cercanas",

    // Accommodation Info Categories
    "accommodationInfo.howToArrive": "🗺️ ¿Cómo llegar…?",
    "accommodationInfo.whatIsInAccommodation": "🏡 ¿Qué hay en el alojamiento?",
    "accommodationInfo.howItWorks": "🔧 ¿Cómo funciona?",
    "accommodationInfo.howDoI": "🛠️ ¿Cómo hago?",
    "accommodationInfo.howToContact": "📞 ¿Cómo contacto?",
    "accommodationInfo.accommodationRules": "📋 Normas del alojamiento",
    "accommodationInfo.opening": "🔓 Apertura",

    // Local Guide Categories
    "localGuide.restaurants": "Restaurantes",
    "localGuide.barsDiscosCasinos": "Bares, Discotecas, Casinos",
    "localGuide.museums": "Museos, Centros de Exposiciones, Galerías",
    "localGuide.parks": "Parques Temáticos, Parques Naturales, Jardines",
    "localGuide.monuments": "Monumentos, Patrimonios de Interés",
    "localGuide.beaches": "Playas, Ríos, Lagos",
    "localGuide.gymsFitness": "Gimnasios, Centros de Entrenamiento Físico",
    "localGuide.spas": "Spas, Centros de Relajación, Sanación",
    "localGuide.adventure": "Aventura",
    "localGuide.pharmacies": "Farmacias",
    "localGuide.supermarkets": "Supermercados",
    "localGuide.emergency": "Servicios de Emergencias",
    "localGuide.entertainmentCenter":
      "Cines, Teatros, Centros de Entretenimiento",
    "localGuide.foodSpanish": "Comida Española",
    "localGuide.recommendationsPairs": "Nuestras recomendaciones para parejas",
    "localGuide.recommendationsFamilies":
      "Nuestras recomendaciones para familias o grupos con niños",
    "localGuide.recommendationsFriends":
      "Nuestras recomendaciones para grupos de amigos",
    "localGuide.foodAsian": "Comida Asiática",
    "localGuide.pizzeria": "Pizzería",
    "localGuide.franchises": "Franquicias",
    "localGuide.foodVegetarian": "Comida Vegetariana",
    "localGuide.burgers": "Hamburguesería",
    "localGuide.cafes": "Cafeterías",
    "localGuide.recommendationsEvents":
      "Nuestras recomendaciones en base a fechas y programaciones",
    "localGuide.restaurantViews": "Restaurante con vistas",

    // Contact
    "contact.title": "Contactar Anfitrión",
    "contact.name": "María García",
    "contact.phone": "+34 612 345 678",
    "contact.email": "maria@casavistahermosa.com",
    "contact.available": "Disponible 24/7 para emergencias",
    "contact.problemQuestion":
      "¿Tienes problemas para contactar con tu anfitrión?",
    "contact.superHostMessage":
      "No te preocupes, estamos aquí para asegurarnos de que tu estancia sea perfecta. Si no logras comunicarte con {hostName}, puedes contactar con nuestro Súper Anfitrión, quien estará encantado de ayudarte.",
    "contact.superHostTitle": "Súper Anfitrión",

    // Share
    "share.title": "Compartir Enlace de Registro",
    "share.message": "Completa tu registro para Casa Vista Hermosa",
    "share.copy": "Copiar enlace",
    "share.whatsapp": "Compartir por WhatsApp",
    "share.email": "Compartir por Email",
    "share.copied": "¡Enlace copiado!",

    // Confirmation
    "confirmation.title": "¡Registro Completo!",
    "confirmation.thankYou": "Gracias",
    "confirmation.dataSaved": "Tu información ha sido guardada correctamente",
    "confirmation.groupStatus": "Estado del Grupo",
    "confirmation.of": "de",
    "confirmation.responsible": "Responsable",
    "confirmation.registered": "Registrado",
    "confirmation.adultNotResponsible":
      "No has marcado que eres el responsable de la reserva. ¿Estás seguro de continuar sin ser el responsable?",
    "confirmation.pending": "Pendiente",
    "confirmation.registerNext": "Registrar siguiente huésped",
    "confirmation.pendingPlural": "pendientes",
    "confirmation.pendingSingular": "pendiente",
    "confirmation.allRegistered":
      "¡Todos los huéspedes han completado su registro!",
    "confirmation.allGuestsComplete": "¡Todos los huéspedes registrados!",
    "confirmation.fullAccessUnlocked": "Acceso completo desbloqueado",
    "confirmation.goToDashboard": "Ir a Mi Estancia",
    "confirmation.shareRegistration": "Compartir Registro",
    "confirmation.shareDescription":
      "Envía este enlace a los demás huéspedes para que completen su registro",
    "confirmation.copyLink": "Compartir enlace de registro",
    "confirmation.shareWhatsApp": "Compartir por WhatsApp",
    "confirmation.shareEmail": "Enviar por Email",
    "confirmation.showQR": "Mostrar código QR",
    "confirmation.continueToApp": "Continuar a la app",
    "confirmation.limitedFeatures":
      "Algunas funciones estarán limitadas hasta que todos los huéspedes completen su registro",
    "confirmation.progressSaved": "Tu progreso se ha guardado correctamente",

    // Register - Method Selection
    "register.title": "Registro de Huésped",
    "register.howToRegister": "Elige cómo prefieres introducir tus datos",
    "register.methodTitle": "Método de Registro",
    "register.scanDocument": "Escanear Documento",
    "register.fastAutomatic": "Rápido y automático",
    "register.recommended": "Recomendado",
    "register.aiExtraction": "Extracción automática de datos con IA",
    "register.scanDescription": "Escanea tu DNI/NIE/Pasaporte",
    "register.enterManually": "Introducir manualmente",
    "register.preferWrite": "Prefiero escribir",
    "register.guidedForm": "Formulario guiado paso a paso",
    "register.manualForm": "Formulario Manual",
    "register.manualDescription": "Completa el formulario manualmente",
    "register.tip": "Consejo",
    "register.scanTip": "El escaneo es más rápido y evita errores",

    // Register - Upload Step
    "register.uploadDocument": "Subir Documento",
    "register.uploadPhotoId": "Sube una foto de tu documento de identidad",
    "register.scanningDocument": "Escaneando documento...",
    "register.extractingData": "Extrayendo datos con IA. Por favor espera.",
    "register.selectOrTakePhoto": "Selecciona o toma una foto",
    "register.fileFormats": "PNG, JPG o JPEG (Máx. 10MB)",
    "register.selectFile": "Seleccionar archivo",
    "register.preview": "Vista previa",
    "register.back": "Atrás",
    "register.processing": "Procesando...",
    "register.continue": "Continuar",

    // Register - Personal Info Form
    "register.personalInfo": "Información Personal",
    "register.reviewExtractedData": "Revisa y completa los datos extraídos",
    "register.scannedData": "Datos del documento escaneado",
    "register.reviewScannedData": "Revisa los datos del documento escaneado",
    "register.completeYourData": "Completa tus datos de registro",
    "register.imBookingHolder": "¿Eres tú quien realizó la reserva?",
    "register.bookingHolderInfo":
      "Marca esta casilla si eres la persona que realizó la reserva. Tus datos se cargarán automáticamente.",
    "register.identityDocument": "Documento de Identidad",
    "register.dniFormatCorrect": "Formato de DNI correcto",
    "register.nieFormatCorrect": "Formato de NIE correcto",
    "register.supportNumberHint": "📌 Aparece en la parte superior del DNI/NIE",
    "register.personalData": "Datos Personales",
    "register.firstNames": "Nombres",
    "register.age": "Edad",
    "register.years": "años",
    "register.select": "Seleccionar",
    "register.relationshipWithHolder": "Parentesco con el Responsable",
    "register.responsibleAlreadyExists":
      "Ya hay un huésped responsable registrado para esta reserva",
    "register.responsibleHint":
      "No se ha asignado un huésped responsable. Por ello, no tendrías acceso a las funciones de apertura de puerta hasta que se complete el registro.",
    "register.responsibleDialogTitle": "¿Eres tú el responsable de la reserva?",
    "register.responsibleDialogDescription":
      "Si eres el responsable, tendrás acceso completo al portal incluyendo la apertura de puertas.",
    "register.responsibleDialogCancel": "No, continuar sin ser responsable",
    "register.responsibleDialogConfirm": "Sí, soy el responsable",
    "register.firstNamesPlaceholder": "Nombre(s)",
    "register.optional": "(opcional)",
    "register.secondSurnamePlaceholder": "Apellido materno",
    "register.minorRequiredRelationship":
      "⚠️ Obligatorio para menores de 18 años",
    "register.searching": "Buscando...",
    "register.autoCompletesMunicipality":
      "Se completa automáticamente al seleccionar municipio",
    "register.cityNamePlaceholder": "Nombre de la ciudad",
    "register.addressPlaceholder": "Calle, número, piso, puerta...",
    "register.residenceData": "Datos de Residencia",
    "register.contactInfo": "Información de Contacto",
    "register.autoSave": "💾 Tu progreso se guarda automáticamente",

    // Register - Document Section
    "register.documentSection": "Documento de Identidad",
    "register.documentType": "Tipo de Documento",
    "register.documentNumber": "Número de Documento",
    "register.selectType": "Seleccionar tipo",
    "register.documentPlaceholder": "Número de documento",
    "register.dniPlaceholder": "Ej: 12345678Z",
    "register.niePlaceholder": "Ej: X1234567L",
    "register.passportPlaceholder": "Ej: ABC123456",
    "register.issueDate": "Fecha de Expedición",
    "register.expiryDate": "Fecha de Caducidad",
    "register.supportNumber": "Número de Soporte",
    "register.supportPlaceholder": "Ej: AAA000000",
    "register.documentAlreadyExists":
      "Este documento ya está registrado en esta reserva",

    // Register - Personal Data Section
    "register.personalSection": "Datos Personales",
    "register.nationality": "Nacionalidad",
    "register.searchCountry": "Buscar país...",
    "register.noCountryFound": "No se encontró ningún país",
    "register.firstName": "Nombre",
    "register.firstNamePlaceholder": "Nombre",
    "register.firstSurname": "Primer Apellido",
    "register.firstSurnamePlaceholder": "Primer apellido",
    "register.secondSurname": "Segundo Apellido",
    "register.birthDate": "Fecha de Nacimiento",
    "register.sex": "Sexo",
    "register.selectSex": "Seleccionar sexo",

    // Register - Residence Section
    "register.residenceSection": "Datos de Residencia",
    "register.residenceCountry": "País de Residencia",
    "register.province": "Provincia",
    "register.selectProvince": "Seleccionar provincia",
    "register.municipality": "Municipio",
    "register.searchMunicipality": "Buscar municipio...",
    "register.noMunicipalityFound": "No se encontró ningún municipio",
    "register.selectMunicipalityFirst": "Selecciona primero una provincia",
    "register.cityMunicipality": "Ciudad/Municipio",
    "register.cityPlaceholder": "Ciudad o municipio",
    "register.postalCode": "Código Postal",
    "register.postalCodePlaceholder": "Código postal",
    "register.selectPostalCode": "Seleccionar código postal",
    "register.availablePostalCodes": "códigos postales disponibles",
    "register.loading": "Cargando...",
    "register.fullAddress": "Dirección Completa",
    // Register - Contact Section
    "register.contactSection": "Información de Contacto",
    "register.countryCode": "Código País",
    "register.phoneNumber": "Número de Teléfono",
    "register.phonePlaceholder": "600 000 000",
    "register.email": "Email",
    "register.emailPlaceholder": "tu@email.com",

    // Register - Relationship Section
    "register.relationshipSection": "Relación con el Responsable",
    "register.relationship": "Relación",
    "register.selectRelationship": "Seleccionar relación",

    // Register - Buttons
    "register.previous": "Anterior",
    "register.next": "Siguiente",
    "register.submit": "Completar Registro",
    "register.cancel": "Cancelar",

    // Register - Validation Messages
    "register.requiredField": "Este campo es obligatorio",
    "register.invalidDocument": "Documento inválido",
    "register.invalidEmail": "Email inválido",
    "register.invalidPhone": "Teléfono inválido",
    "register.documentExpired": "El documento ha caducado",
    "register.futureDate": "La fecha no puede ser futura",
    "register.minorAge": "Debes ser mayor de edad",
    "register.minorCannotBeResponsible":
      "Los menores de edad no pueden ser responsables de la reserva",

    // Register - Steps
    "register.step": "Paso",
    "register.of": "de",
    "register.stepMethod": "Método",
    "register.stepScan": "Escanear",
    "register.stepForm": "Formulario",

    // RegisterPreferences
    "preferences.title": "Preferencias de Estancia",
    "preferences.updateTitle": "Actualizar Preferencias de Estancia",
    "preferences.subtitle":
      "Como responsable de la reserva, personaliza los detalles del alojamiento",
    "preferences.updateSubtitle": "Modifica los detalles de tu alojamiento",
    "preferences.responsible": "Responsable de la Reserva",
    "preferences.arrivalTime": "Hora de Llegada Estimada",
    "preferences.arrivalHelp": "Nos ayuda a preparar tu alojamiento",
    "preferences.needsCrib": "¿Necesitas cuna?",
    "preferences.hasPets": "¿Viajas con mascotas?",
    "preferences.freeOfCharge": "Sin coste adicional",
    "preferences.notAvailable": "No disponible",
    "preferences.bedConfiguration": "Configuración de Camas",
    "preferences.loadingAvailability": "Cargando disponibilidad...",
    "preferences.doubleBeds": "Camas Dobles",
    "preferences.singleBeds": "Camas Individuales",
    "preferences.sofaBeds": "Sofá Cama",
    "preferences.bunkBeds": "Literas",
    "preferences.max": "Máx",
    "preferences.notAvailableAccommodation":
      "No disponible en este alojamiento",
    "preferences.extraBedsTitle": "Solicitud de camas adicionales",
    "preferences.extraBedsNotification":
      "El anfitrión será notificado sobre esta solicitud especial.",
    "preferences.additionalInfo": "Información Adicional (Opcional)",
    "preferences.additionalInfoPlaceholder":
      "Peticiones especiales, comentarios...",
    "preferences.characters": "caracteres",
    "preferences.back": "Atrás",
    "preferences.continue": "Continuar",
    "preferences.autoSave": "💾 Tu progreso se guarda automáticamente",
    "preferences.step": "Paso",
    "preferences.of": "de",
    "preferences.warning": "Advertencia",
    "preferences.bedLoadError":
      "No se pudo cargar la disponibilidad de camas. Podrás continuar pero puede haber limitaciones.",
    "preferences.additionalBedsRequest": "Solicitud de camas adicionales",
    "preferences.bedsRequestMessage1": "Estás solicitando",
    "preferences.bedsRequestMessage2": "para",
    "preferences.bedsRequestMessage3":
      "El anfitrión será notificado sobre esta solicitud especial.",
    "preferences.beds": "camas",
    "preferences.guest": "huésped",
    "preferences.guests": "huéspedes",
    "preferences.guestPlural": "es",

    // RegisterTerms
    "terms.title": "Contrato de Hospedaje",
    "terms.subtitle": "Lee y acepta los términos para completar tu registro",
    "terms.termsAndConditions": "Términos y Condiciones",
    "terms.keySummary": "Resumen de Puntos Clave",
    "terms.checkInTime": "Horario de check-in: 15:00 - 20:00",
    "terms.checkOutTime": "Horario de check-out: hasta las 11:00",
    "terms.noSmoking": "Prohibido fumar en el interior",
    "terms.noPets": "No se permiten mascotas",
    "terms.maxCapacity": "Capacidad máxima: según reserva",
    "terms.accommodationRules": "Normas del Alojamiento",
    "terms.cancellationPolicy": "Política de Cancelación",
    "terms.responsibilities": "Responsabilidades",
    "terms.dataProtection": "Protección de Datos",
    "terms.legalTerms": "Términos Legales",
    "terms.acceptCheckbox":
      "He leído y acepto el contrato de hospedaje y los términos y condiciones",
    "terms.signHere": "Firma aquí:",
    "terms.clear": "Limpiar",
    "terms.signatureHelp":
      "Dibuja tu firma usando el ratón o tu dedo en pantallas táctiles",
    "terms.back": "Atrás",
    "terms.complete": "Completar Registro",
    "terms.saving": "Guardando...",
    "terms.step": "Paso",
    "terms.of": "de",

    // Months
    "months.january": "Enero",
    "months.february": "Febrero",
    "months.march": "Marzo",
    "months.april": "Abril",
    "months.may": "Mayo",
    "months.june": "Junio",
    "months.july": "Julio",
    "months.august": "Agosto",
    "months.september": "Septiembre",
    "months.october": "Octubre",
    "months.november": "Noviembre",
    "months.december": "Diciembre",

    // MobileDatePicker
    "register.selectDate": "Seleccionar fecha",
    "register.swipeToChange": "Desliza para cambiar el día, mes y año.",
    "register.confirm": "Confirmar",

    // NotFound
    "notFound.title": "Página no encontrada",
    "notFound.message": "Lo sentimos, la página que buscas no existe",
    "notFound.goHome": "Volver al inicio",
  },
  en: {
    "welcome.title": "Casa Vista Hermosa",
    "welcome.subtitle": "Welcome! Your stay begins here ✨",
    "welcome.guestsRegistered": "Registered guests",
    "welcome.completeRegistration": "Complete my registration",
    "welcome.step": "Step 1 of 3",
    "welcome.share": "Share link",
    "welcome.viewAccommodation": "View accommodation",
    "welcome.dataProtected": "🔒 Your data is protected and encrypted",
    "welcome.compliance": "We comply with GDPR and Spanish hosting regulations",
    "welcome.timeEstimate": "📋 Complete your registration in just 3 minutes",
    "welcome.contact": "Contact",

    // Dashboard - Reservation Card
    "dashboard.guestManagement": "Guest Management",
    "dashboard.registeredGuests": "Registered guests",
    "dashboard.pendingGuest": "Pending guest",
    "dashboard.copyLink": "Share link",
    "dashboard.responsibleWarningTitle": "Important!",
    "dashboard.responsibleWarning":
      "Don't forget to register as the responsible user by answering the question \"Are you the one who made the reservation?\". Without a defined responsible, you won't have access to the Door Opening functions.",
    "dashboard.myStay": "My Stay",
    "dashboard.myReservation": "My Reservation",
    "dashboard.accommodation": "Accommodation",
    "dashboard.reservationId": "ID",
    "dashboard.checkIn": "Check-in",
    "dashboard.checkOut": "Check-out",
    "dashboard.openPortal": "Open Portal",
    "dashboard.openAccommodation": "Open Accommodation",
    "dashboard.downloadContract": "Download Contract PDF",
    "dashboard.downloadContractModel": "Download Contract Template",

    // Dashboard - General
    "dashboard.preferences": "Stay Preferences",
    "dashboard.yourHost": "Your Host",
    "dashboard.accommodationInfo": "Accommodation Information",
    "dashboard.wifiNetwork": "WiFi Network",
    "dashboard.wifiPassword": "WiFi Password",
    "dashboard.welcomeVideo": "Video",
    "dashboard.localGuide": "Local Guide",
    "dashboard.customerSupport": "Useful Information",
    "dashboard.completeToUnlock": "Complete your registration to unlock",
    "dashboard.sendMessage": "💬 Send message",
    "dashboard.callNow": "📞 Call now",
    "dashboard.sendEmail": "📧 Send email",
    "dashboard.missingGuests": "Missing guests to register",
    "dashboard.someFeaturesLimited":
      "Some features are limited until all guests register",

    // Dashboard - Doors & Unlock
    "dashboard.portal": "Portal",
    "dashboard.unlockHistory": "Unlock History",
    "dashboard.unlockSuccess": "Door opened successfully",
    "dashboard.unlockFailed": "Failed to open door",
    "dashboard.noUnlockHistory": "No unlock records",
    "dashboard.unlockHistoryDescription": "Unlock records from the app",
    "dashboard.confirmUnlock": "Open door?",
    "dashboard.confirmUnlockDescription": "Confirm you want to open the door",
    "dashboard.doorOpened": "Door opened!",
    "dashboard.doorOpenedDescription": "The door has been opened successfully",
    "dashboard.noRaixerTitle": "We're here to help!",
    "dashboard.noRaixerMessage":
      "Please contact your host to obtain access codes and key box locations",
    "dashboard.noRaixerMessageBefore": "Your stay is getting closer! Your access codes will be automatically activated on the day of your reservation once all guests are registered. We look forward to welcoming you!",
    "dashboard.noRaixerMessageActivePending": "The big day is here! All that's left is for all guests to complete their registration to reveal your access codes so you can enjoy your stay.",
    "dashboard.accessCodesTitle": "Key Box Codes",
    "dashboard.accessCodesMessage":
      "Use these codes to open the key box and retrieve the accommodation keys",
    "dashboard.cajetinInfo": "Key Box Information",
    "dashboard.code": "Code",
    "dashboard.accessNotYetAvailable": "Access not yet available",
    "dashboard.accessFinished": "Access finished",
    "dashboard.accessAvailableFrom": "Door access will be available from",
    "dashboard.accessFinishedOn": "Door access ended on",
    "dashboard.spainTime": "Spain time",
    "dashboard.loadingAccessInfo": "Loading access information...",
    "dashboard.codeRevealedOnCheckin": "The code will be revealed on the day of your reservation",

    // Dashboard - Preferences
    "dashboard.arrival": "Arrival",
    "dashboard.doubleBed": "double bed",
    "dashboard.doubleBeds": "double beds",
    "dashboard.singleBed": "single bed",
    "dashboard.singleBeds": "single beds",
    "dashboard.sofaBed": "sofa bed",
    "dashboard.sofaBeds": "sofa beds",
    "dashboard.bunkBed": "bunk bed",
    "dashboard.bunkBeds": "bunk beds",
    "dashboard.cribRequested": "Crib requested",
    "dashboard.petsRequested": "Pets included",
    "dashboard.noPreferences": "No preferences set",
    "dashboard.editPreferences": "Edit preferences",
    "dashboard.saveChanges": "Save changes",
    "dashboard.cancel": "Cancel",
    "dashboard.preferencesUpdated": "Preferences updated!",
    "dashboard.preferencesSaved":
      "Your preferences have been saved successfully.",
    "dashboard.preferencesWithExtraBeds":
      "Your preferences have been saved. The host will be notified about your request for additional beds.",
    "dashboard.extraBedsRequest": "Additional beds request",
    "dashboard.extraBedsWarning": "You are requesting",
    "dashboard.beds": "beds",
    "dashboard.for": "for",
    "dashboard.guest": "guest",
    "dashboard.guests": "guests",
    "dashboard.estimatedArrival": "Estimated arrival time",
    "dashboard.additionalInfo": "Additional information",
    "dashboard.needsCrib": "Do you need a crib?",
    "dashboard.hasPets": "Are you traveling with pets?",
    "dashboard.notAvailable": "Not available in this accommodation",

    // Dashboard - Incidents
    "dashboard.reportIncident": "Report incident",
    "dashboard.reportIncidentTitle": "Report an Incident",
    "dashboard.incidentType": "Incident type",
    "dashboard.complaint": "Complaint",
    "dashboard.suggestion": "Suggestion",
    "dashboard.incidentSubject": "Subject",
    "dashboard.incidentDescription": "Description",
    "dashboard.incidentSubmit": "Submit report",
    "dashboard.incidentCancel": "Cancel",
    "dashboard.incidentSent": "sent",
    "dashboard.incidentRegistered":
      "Your message has been registered successfully",
    "dashboard.yourIncidents": "Your incidents",
    "dashboard.noIncidents": "You have not reported any incidents",
    "dashboard.suggestionsComplaints": "Suggestions or Complaints",
    "dashboard.yourOpinionHelps": "Your opinion helps us improve",
    "dashboard.type": "Type",
    "dashboard.subjectPlaceholder": "What is your message about?",
    "dashboard.descriptionPlaceholder":
      "Describe your suggestion or complaint...",
    "dashboard.messageHistory": "Message History",
    "dashboard.send": "Send",
    "dashboard.visitVacanfly": "Visit Vacanfly.com",
    "dashboard.festivalsNearby": "Patron Saint and Municipal Festivals",
    "dashboard.festivalsNearbyDescription":
      'This website shows updated information about the nearest patron saint and municipal festivals on each date, go to the "Festivals near me" section',
    "dashboard.visitFestivalsPage": "View Nearby Festivals",

    // Accommodation Info Categories
    "accommodationInfo.howToArrive": "🗺️ How to get here…?",
    "accommodationInfo.whatIsInAccommodation":
      "🏡 What is in the accommodation?",
    "accommodationInfo.howItWorks": "🔧 How does it work?",
    "accommodationInfo.howDoI": "🛠️ How do I...?",
    "accommodationInfo.howToContact": "📞 How to contact?",
    "accommodationInfo.accommodationRules": "📋 Accommodation rules",
    "accommodationInfo.opening": "🔓 Opening",

    // Local Guide Categories
    "localGuide.restaurants": "Restaurants",
    "localGuide.barsDiscosCasinos": "Bars, Nightclubs, Casinos",
    "localGuide.museums": "Museums, Exhibition Centers, Galleries",
    "localGuide.parks": "Theme Parks, Natural Parks, Gardens",
    "localGuide.monuments": "Monuments, Heritage Sites",
    "localGuide.beaches": "Beaches, Rivers, Lakes",
    "localGuide.gymsFitness": "Gyms, Fitness Training Centers",
    "localGuide.spas": "Spas, Relaxation Centers, Healing",
    "localGuide.adventure": "Adventure",
    "localGuide.pharmacies": "Pharmacies",
    "localGuide.supermarkets": "Supermarkets",
    "localGuide.emergency": "Emergency Services",
    "localGuide.entertainmentCenter":
      "Cinemas, Theaters, Entertainment Centers",
    "localGuide.foodSpanish": "Spanish Food",
    "localGuide.recommendationsPairs": "Our recommendations for couples",
    "localGuide.recommendationsFamilies":
      "Our recommendations for families or groups with children",
    "localGuide.recommendationsFriends":
      "Our recommendations for groups of friends",
    "localGuide.foodAsian": "Asian Food",
    "localGuide.pizzeria": "Pizzeria",
    "localGuide.franchises": "Franchises",
    "localGuide.foodVegetarian": "Vegetarian Food",
    "localGuide.burgers": "Burgers",
    "localGuide.cafes": "Cafeterias",
    "localGuide.recommendationsEvents":
      "Our recommendations based on dates and schedules",
    "localGuide.restaurantViews": "Restaurant with views",

    // Contact
    "contact.title": "Contact Host",
    "contact.name": "María García",
    "contact.phone": "+34 612 345 678",
    "contact.email": "maria@casavistahermosa.com",
    "contact.available": "Available 24/7 for emergencies",
    "contact.problemQuestion": "Having trouble contacting your host?",
    "contact.superHostMessage":
      "Don't worry, we're here to make sure your stay is perfect. If you can't reach {hostName}, you can contact our Super Host, who will be happy to help you.",
    "contact.superHostTitle": "Super Host",

    // Share
    "share.title": "Share Registration Link",
    "share.message": "Complete your registration for Casa Vista Hermosa",
    "share.copy": "Copy link",
    "share.whatsapp": "Share via WhatsApp",
    "share.email": "Share via Email",
    "share.copied": "Link copied!",

    // Confirmation
    "confirmation.title": "Registration Complete!",
    "confirmation.thankYou": "Thank you",
    "confirmation.dataSaved": "Your information has been saved correctly",
    "confirmation.groupStatus": "Group Status",
    "confirmation.of": "of",
    "confirmation.responsible": "Responsible",
    "confirmation.registered": "Registered",
    "confirmation.adultNotResponsible":
      "You have not indicated that you are the responsible for the reservation. Are you sure you want to continue without being the responsible?",
    "confirmation.pending": "Pending",
    "confirmation.registerNext": "Register next guest",
    "confirmation.pendingPlural": "pending",
    "confirmation.pendingSingular": "pending",
    "confirmation.allRegistered":
      "All guests have completed their registration!",
    "confirmation.allGuestsComplete": "All guests registered!",
    "confirmation.fullAccessUnlocked": "Full access unlocked",
    "confirmation.goToDashboard": "Go to My Stay",
    "confirmation.shareRegistration": "Share Registration",
    "confirmation.shareDescription":
      "Send this link to other guests so they can complete their registration",
    "confirmation.copyLink": "Share registration link",
    "confirmation.shareWhatsApp": "Share via WhatsApp",
    "confirmation.shareEmail": "Send via Email",
    "confirmation.showQR": "Show QR code",
    "confirmation.continueToApp": "Continue to app",
    "confirmation.limitedFeatures":
      "Some features will be limited until all guests complete their registration",
    "confirmation.progressSaved": "Your progress has been saved correctly",

    // Register - Method Selection
    "register.title": "Guest Registration",
    "register.howToRegister": "Choose how you prefer to enter your data",
    "register.methodTitle": "Registration Method",
    "register.scanDocument": "Scan Document",
    "register.fastAutomatic": "Fast and automatic",
    "register.recommended": "Recommended",
    "register.aiExtraction": "Automatic data extraction with AI",
    "register.scanDescription": "Scan your ID/NIE/Passport",
    "register.enterManually": "Enter manually",
    "register.preferWrite": "I prefer to write",
    "register.guidedForm": "Step-by-step guided form",
    "register.manualForm": "Manual Form",
    "register.manualDescription": "Complete the form manually",
    "register.tip": "Tip",
    "register.scanTip": "Scanning is faster and avoids errors",

    // Register - Upload Step
    "register.uploadDocument": "Upload Document",
    "register.uploadPhotoId": "Upload a photo of your identity document",
    "register.scanningDocument": "Scanning document...",
    "register.extractingData": "Extracting data with AI. Please wait.",
    "register.selectOrTakePhoto": "Select or take a photo",
    "register.fileFormats": "PNG, JPG or JPEG (Max. 10MB)",
    "register.selectFile": "Select file",
    "register.preview": "Preview",
    "register.back": "Back",
    "register.processing": "Processing...",
    "register.continue": "Continue",

    // Register - Personal Info Form
    "register.personalInfo": "Personal Information",
    "register.reviewExtractedData": "Review and complete the extracted data",
    "register.scannedData": "Scanned document data",
    "register.reviewScannedData": "Review the scanned document data",
    "register.completeYourData": "Complete your registration data",
    "register.imBookingHolder": "Are you the one who made the reservation?",
    "register.bookingHolderInfo":
      "Check this box if you are the person who made the reservation. Your data will be loaded automatically.",
    "register.identityDocument": "Identity Document",
    "register.dniFormatCorrect": "DNI format correct",
    "register.nieFormatCorrect": "NIE format correct",
    "register.supportNumberHint": "📌 Appears at the top of the DNI/NIE",
    "register.personalData": "Personal Data",
    "register.firstNames": "First Names",
    "register.age": "Age",
    "register.years": "years",
    "register.select": "Select",
    "register.relationshipWithHolder": "Relationship with Holder",
    "register.responsibleAlreadyExists":
      "There is already a responsible guest registered for this reservation",
    "register.responsibleHint":
      "No responsible guest has been assigned. Therefore, you would not have access to door opening functions until the registration is completed.",
    "register.responsibleDialogTitle":
      "Are you the one who made the reservation?",
    "register.responsibleDialogDescription":
      "If you are the responsible, you will have full access to the portal including door opening.",
    "register.responsibleDialogCancel":
      "No, continue without being responsible",
    "register.responsibleDialogConfirm": "Yes, I am the responsible",
    firstNamesPlaceholder: "First name(s)",
    "register.optional": "(optional)",
    "register.secondSurnamePlaceholder": "Mother's surname",
    "register.minorRequiredRelationship": "⚠️ Required for minors under 18",
    "register.searching": "Searching...",
    "register.autoCompletesMunicipality":
      "Auto-completes when selecting municipality",
    "register.cityNamePlaceholder": "City name",
    "register.addressPlaceholder": "Street, number, floor, door...",
    "register.residenceData": "Residence Data",
    "register.contactInfo": "Contact Information",
    "register.autoSave": "💾 Your progress is saved automatically",

    // Register - Document Section
    "register.documentSection": "Identity Document",
    "register.documentType": "Document Type",
    "register.documentNumber": "Document Number",
    "register.selectType": "Select type",
    "register.documentPlaceholder": "Document number",
    "register.dniPlaceholder": "E.g: 12345678Z",
    "register.niePlaceholder": "E.g: X1234567L",
    "register.passportPlaceholder": "E.g: ABC123456",
    "register.issueDate": "Issue Date",
    "register.expiryDate": "Expiry Date",
    "register.supportNumber": "Support Number",
    "register.supportPlaceholder": "E.g: AAA000000",
    "register.documentAlreadyExists":
      "This document is already registered in this reservation",

    // Register - Personal Data Section
    "register.personalSection": "Personal Data",
    "register.nationality": "Nationality",
    "register.searchCountry": "Search country...",
    "register.noCountryFound": "No country found",
    "register.firstName": "First Name",
    "register.firstNamePlaceholder": "First name",
    "register.firstSurname": "First Surname",
    "register.firstSurnamePlaceholder": "First surname",
    "register.secondSurname": "Second Surname",
    "register.birthDate": "Date of Birth",
    "register.sex": "Sex",
    "register.selectSex": "Select sex",

    // Register - Residence Section
    "register.residenceSection": "Residence Data",
    "register.residenceCountry": "Country of Residence",
    "register.province": "Province",
    "register.selectProvince": "Select province",
    "register.municipality": "Municipality",
    "register.searchMunicipality": "Search municipality...",
    "register.noMunicipalityFound": "No municipality found",
    "register.selectMunicipalityFirst": "Select a province first",
    "register.cityMunicipality": "City/Municipality",
    "register.cityPlaceholder": "City or municipality",
    "register.postalCode": "Postal Code",
    "register.postalCodePlaceholder": "Postal code",
    "register.selectPostalCode": "Select postal code",
    "register.availablePostalCodes": "available postal codes",
    "register.loading": "Loading...",
    "register.fullAddress": "Full Address",
    // Register - Contact Section
    "register.contactSection": "Contact Information",
    "register.countryCode": "Country Code",
    "register.phoneNumber": "Phone Number",
    "register.phonePlaceholder": "600 000 000",
    "register.email": "Email",
    "register.emailPlaceholder": "your@email.com",

    // Register - Relationship Section
    "register.relationshipSection": "Relationship with Responsible",
    "register.relationship": "Relationship",
    "register.selectRelationship": "Select relationship",

    // Register - Buttons
    "register.previous": "Previous",
    "register.next": "Next",
    "register.submit": "Complete Registration",
    "register.cancel": "Cancel",

    // Register - Validation Messages
    "register.requiredField": "This field is required",
    "register.invalidDocument": "Invalid document",
    "register.invalidEmail": "Invalid email",
    "register.invalidPhone": "Invalid phone",
    "register.documentExpired": "The document has expired",
    "register.futureDate": "The date cannot be in the future",
    "register.minorAge": "You must be of legal age",
    "register.minorCannotBeResponsible":
      "Minors cannot be responsible for the reservation. Only an adult can be the responsible.",

    // Register - Steps
    "register.step": "Step",
    "register.of": "of",
    "register.stepMethod": "Method",
    "register.stepScan": "Scan",
    "register.stepForm": "Form",

    // RegisterPreferences
    "preferences.title": "Stay Preferences",
    "preferences.updateTitle": "Update Stay Preferences",
    "preferences.subtitle":
      "As the reservation holder, customize the accommodation details",
    "preferences.updateSubtitle": "Modify your accommodation details",
    "preferences.responsible": "Reservation Holder",
    "preferences.arrivalTime": "Estimated Arrival Time",
    "preferences.arrivalHelp": "Helps us prepare your accommodation",
    "preferences.needsCrib": "Do you need a crib?",
    "preferences.hasPets": "Are you traveling with pets?",
    "preferences.freeOfCharge": "Free of charge",
    "preferences.notAvailable": "Not available",
    "preferences.bedConfiguration": "Bed Configuration",
    "preferences.loadingAvailability": "Loading availability...",
    "preferences.doubleBeds": "Double Beds",
    "preferences.singleBeds": "Single Beds",
    "preferences.sofaBeds": "Sofa Beds",
    "preferences.bunkBeds": "Bunk Beds",
    "preferences.max": "Max",
    "preferences.notAvailableAccommodation":
      "Not available in this accommodation",
    "preferences.extraBedsTitle": "Additional beds request",
    "preferences.extraBedsNotification":
      "The host will be notified about this special request.",
    "preferences.additionalInfo": "Additional Information (Optional)",
    "preferences.additionalInfoPlaceholder": "Special requests, comments...",
    "preferences.characters": "characters",
    "preferences.back": "Back",
    "preferences.continue": "Continue",
    "preferences.autoSave": "💾 Your progress is saved automatically",
    "preferences.step": "Step",
    "preferences.of": "of",
    "preferences.warning": "Warning",
    "preferences.bedLoadError":
      "Could not load bed availability. You can continue but there may be limitations.",
    "preferences.additionalBedsRequest": "Additional Beds Request",
    "preferences.bedsRequestMessage1": "You are requesting",
    "preferences.bedsRequestMessage2": "for",
    "preferences.bedsRequestMessage3":
      "The host will be notified about this special request.",
    "preferences.beds": "beds",
    "preferences.guest": "guest",
    "preferences.guests": "guests",
    "preferences.guestPlural": "s",

    // RegisterTerms
    "terms.title": "Accommodation Contract",
    "terms.subtitle": "Read and accept the terms to complete your registration",
    "terms.termsAndConditions": "Terms and Conditions",
    "terms.keySummary": "Key Points Summary",
    "terms.checkInTime": "Check-in time: 15:00 - 20:00",
    "terms.checkOutTime": "Check-out time: until 11:00",
    "terms.noSmoking": "No smoking indoors",
    "terms.noPets": "No pets allowed",
    "terms.maxCapacity": "Maximum capacity: as per reservation",
    "terms.accommodationRules": "Accommodation Rules",
    "terms.cancellationPolicy": "Cancellation Policy",
    "terms.responsibilities": "Responsibilities",
    "terms.dataProtection": "Data Protection",
    "terms.legalTerms": "Legal Terms",
    "terms.acceptCheckbox":
      "I have read and accept the accommodation contract and terms and conditions",
    "terms.signHere": "Sign here:",
    "terms.clear": "Clear",
    "terms.signatureHelp":
      "Draw your signature using the mouse or your finger on touch screens",
    "terms.back": "Back",
    "terms.complete": "Complete Registration",
    "terms.saving": "Saving...",
    "terms.step": "Step",
    "terms.of": "of",

    // Months
    "months.january": "January",
    "months.february": "February",
    "months.march": "March",
    "months.april": "April",
    "months.may": "May",
    "months.june": "June",
    "months.july": "July",
    "months.august": "August",
    "months.september": "September",
    "months.october": "October",
    "months.november": "November",
    "months.december": "December",

    // MobileDatePicker
    "register.selectDate": "Select date",
    "register.swipeToChange": "Swipe to change day, month and year.",
    "register.confirm": "Confirm",

    // NotFound
    "notFound.title": "Page not found",
    "notFound.message": "Sorry, the page you are looking for does not exist",
    "notFound.goHome": "Go to home",
  },
  ca: {
    "welcome.title": "Casa Vista Hermosa",
    "welcome.subtitle": "Benvingut! La teva estada comença aquí ✨",
    "welcome.guestsRegistered": "Hostes registrats",
    "welcome.completeRegistration": "Completar el meu registre",
    "welcome.step": "Pas 1 de 3",
    "welcome.share": "Compartir enllaç",
    "welcome.viewAccommodation": "Veure allotjament",
    "welcome.dataProtected":
      "🔒 Les teves dades estan protegides i encriptades",
    "welcome.compliance":
      "Complim amb el RGPD i normativa espanyola d'allotjament",
    "welcome.timeEstimate": "📋 Completa el teu registre en només 3 minuts",
    "welcome.contact": "Contactar",

    // Dashboard - Reservation Card
    "dashboard.guestManagement": "Gestió d'Hostes",
    "dashboard.registeredGuests": "Hostes registrats",
    "dashboard.pendingGuest": "Hoste pendent",
    "dashboard.copyLink": "Compartir enllaç",
    "dashboard.responsibleWarningTitle": "Important!",
    "dashboard.responsibleWarning":
      'No oblidis registrar-te com a usuari responsable responent a la pregunta "Ets tu qui va fer la reserva?". Sense un responsable definit, no tindràs accés a les funcions d\'Obertura de Portes.',
    "dashboard.myStay": "La Meva Estada",
    "dashboard.myReservation": "La Meva Reserva",
    "dashboard.accommodation": "Allotjament",
    "dashboard.reservationId": "ID",
    "dashboard.checkIn": "Check-in",
    "dashboard.checkOut": "Check-out",
    "dashboard.openPortal": "Obrir Portal",
    "dashboard.openAccommodation": "Obrir Allotjament",
    "dashboard.downloadContract": "Descarregar Contracte PDF",
    "dashboard.downloadContractModel": "Descarregar Model de Contracte",

    // Dashboard - General
    "dashboard.preferences": "Preferències d'Estada",
    "dashboard.yourHost": "El Teu Amfitrió",
    "dashboard.accommodationInfo": "Informació de l'Allotjament",
    "dashboard.wifiNetwork": "Xarxa WiFi",
    "dashboard.wifiPassword": "Contrasenya WiFi",
    "dashboard.welcomeVideo": "Vídeo",
    "dashboard.localGuide": "Guia Local",
    "dashboard.customerSupport": "Informació d'Interès",
    "dashboard.completeToUnlock": "Completa el teu registre per desbloquejar",
    "dashboard.sendMessage": "💬 Enviar missatge",
    "dashboard.callNow": "📞 Trucar ara",
    "dashboard.sendEmail": "📧 Enviar email",
    "dashboard.missingGuests": "Falten hostes per registrar",
    "dashboard.someFeaturesLimited":
      "Algunes funcions estan limitades fins que tots els hostes es registrin",

    // Dashboard - Doors & Unlock
    "dashboard.portal": "Portal",
    "dashboard.unlockHistory": "Historial d'Obertures",
    "dashboard.unlockSuccess": "Porta oberta amb èxit",
    "dashboard.unlockFailed": "Error en obrir la porta",
    "dashboard.noUnlockHistory": "No hi ha obertures registrades",
    "dashboard.unlockHistoryDescription": "Registre d'obertures des de l'app",
    "dashboard.confirmUnlock": "Obrir porta?",
    "dashboard.confirmUnlockDescription": "Confirma que vols obrir la porta",
    "dashboard.doorOpened": "Porta oberta!",
    "dashboard.doorOpenedDescription": "La porta s'ha obert correctament",
    "dashboard.noRaixerTitle": "Estem per ajudar-te!",
    "dashboard.noRaixerMessage":
      "Si us plau, contacta amb el teu amfitrió per obtenir els codis d'accés i la ubicació dels cajetins",
    "dashboard.noRaixerMessageBefore": "La teva estada és cada cop més a prop! Els teus codis d'accés s'activaran automàticament el dia de la teva reserva un cop tots els hostes estigueu registrats. Tenim moltes ganes de rebre't!",
    "dashboard.noRaixerMessageActivePending": "Ja ha arribat el gran dia! Només falta que tots els hostes completin el seu registre per revelar els teus codis d'accés i que pugueu gaudir de la vostra estada.",
    "dashboard.accessCodesTitle": "Codis del Cajetí",
    "dashboard.accessCodesMessage":
      "Utilitza aquests codis per obrir el cajetí i retirar les claus de l'allotjament",
    "dashboard.cajetinInfo": "Informació de la Caixa de Claus",
    "dashboard.code": "Codi",
    "dashboard.accessNotYetAvailable": "Accés encara no disponible",
    "dashboard.accessFinished": "Accés finalitzat",
    "dashboard.accessAvailableFrom":
      "L'accés a les portes estarà disponible a partir del",
    "dashboard.accessFinishedOn": "L'accés a les portes va finalitzar el",
    "dashboard.spainTime": "hora d'Espanya",
    "dashboard.loadingAccessInfo": "Carregant informació d'accés...",
    "dashboard.codeRevealedOnCheckin": "El codi serà revelat el dia de la seva reserva",

    // Dashboard - Preferences
    "dashboard.arrival": "Arribada",
    "dashboard.doubleBed": "llit doble",
    "dashboard.doubleBeds": "llits dobles",
    "dashboard.singleBed": "llit individual",
    "dashboard.singleBeds": "llits individuals",
    "dashboard.sofaBed": "sofà llit",
    "dashboard.sofaBeds": "sofàs llit",
    "dashboard.bunkBed": "llitera",
    "dashboard.bunkBeds": "lliteres",
    "dashboard.cribRequested": "Bressol sol·licitat",
    "dashboard.petsRequested": "Mascotes incloses",
    "dashboard.noPreferences": "Sense preferències configurades",
    "dashboard.editPreferences": "Editar preferències",
    "dashboard.saveChanges": "Guardar canvis",
    "dashboard.cancel": "Cancel·lar",
    "dashboard.preferencesUpdated": "Preferències actualitzades!",
    "dashboard.preferencesSaved":
      "Les teves preferències s'han guardat correctament.",
    "dashboard.preferencesWithExtraBeds":
      "Les teves preferències s'han guardat. L'amfitrió serà notificat sobre la teva sol·licitud de llits addicionals.",
    "dashboard.extraBedsRequest": "Sol·licitud de llits addicionals",
    "dashboard.extraBedsWarning": "Estàs sol·licitant",
    "dashboard.beds": "llits",
    "dashboard.for": "per",
    "dashboard.guest": "hoste",
    "dashboard.guests": "hostes",
    "dashboard.estimatedArrival": "Hora estimada d'arribada",
    "dashboard.additionalInfo": "Informació adicional",
    "dashboard.needsCrib": "¿Necessites bressol?",
    "dashboard.hasPets": "¿Viatges amb mascotes?",
    "dashboard.notAvailable": "No disponible en aquest allotjament",

    // Dashboard - Incidents
    "dashboard.reportIncident": "Reportar incidència",
    "dashboard.reportIncidentTitle": "Reportar una Incidència",
    "dashboard.incidentType": "Tipus d'incidència",
    "dashboard.complaint": "Queixa",
    "dashboard.suggestion": "Suggeriment",
    "dashboard.incidentSubject": "Assumpte",
    "dashboard.incidentDescription": "Descripció",
    "dashboard.incidentSubmit": "Enviar informe",
    "dashboard.incidentCancel": "Cancel·lar",
    "dashboard.incidentSent": "enviada",
    "dashboard.incidentRegistered":
      "El teu missatge s'ha registrat correctament",
    "dashboard.yourIncidents": "Les teves incidències",
    "dashboard.noIncidents": "No has reportat cap incidència",
    "dashboard.suggestionsComplaints": "Suggeriments o Queixes",
    "dashboard.yourOpinionHelps": "La teva opinió ens ajuda a millorar",
    "dashboard.type": "Tipus",
    "dashboard.subjectPlaceholder": "De què tracta el teu missatge?",
    "dashboard.descriptionPlaceholder":
      "Descriu el teu suggeriment o queixa...",
    "dashboard.messageHistory": "Historial de missatges",
    "dashboard.send": "Enviar",
    "dashboard.visitVacanfly": "Visitar Vacanfly.com",
    "dashboard.festivalsNearby": "Festes Patronals i Municipals",
    "dashboard.festivalsNearbyDescription":
      'Aquesta pàgina web mostra informació actualitzada de les festes patronals i municipals més properes en cada data, aneu a l\'apartat "Festes prop meu"',
    "dashboard.visitFestivalsPage": "Veure Festes Properes",

    // Accommodation Info Categories
    "accommodationInfo.howToArrive": "🗺️ Com arribar…?",
    "accommodationInfo.whatIsInAccommodation": "🏡 Què hi ha en l'allotjament?",
    "accommodationInfo.howItWorks": "🔧 Com funciona?",
    "accommodationInfo.howDoI": "🛠️ Com faig?",
    "accommodationInfo.howToContact": "📞 Com contactar?",
    "accommodationInfo.accommodationRules": "📋 Normes de l'allotjament",
    "accommodationInfo.opening": "🔓 Obertura",

    // Local Guide Categories
    "localGuide.restaurants": "Restaurants",
    "localGuide.barsDiscosCasinos": "Bars, Discoteques, Casinos",
    "localGuide.museums": "Museus, Centres d'Exposicions, Galeries",
    "localGuide.parks": "Parcs Temàtics, Parcs Naturals, Jardins",
    "localGuide.monuments": "Monuments, Patrimonis d'Interès",
    "localGuide.beaches": "Platges, Rius, Llacs",
    "localGuide.gymsFitness": "Gimnasos, Centres d'Entrenament Físic",
    "localGuide.spas": "Spas, Centres de Relaxació, Sanació",
    "localGuide.adventure": "Aventura",
    "localGuide.pharmacies": "Farmàcies",
    "localGuide.supermarkets": "Supermercats",
    "localGuide.emergency": "Serveis d'Emergències",
    "localGuide.entertainmentCenter": "Cines, Teatres, Centres d'Entreteniment",
    "localGuide.foodSpanish": "Menjar Espanyol",
    "localGuide.recommendationsPairs":
      "Les nostres recomanacions per a parelles",
    "localGuide.recommendationsFamilies":
      "Les nostres recomanacions per a famílies o grups amb nens",
    "localGuide.recommendationsFriends":
      "Les nostres recomanacions per a grups d'amics",
    "localGuide.foodAsian": "Menjar Asiàtic",
    "localGuide.pizzeria": "Pizzeria",
    "localGuide.franchises": "Franquícies",
    "localGuide.foodVegetarian": "Menjar Vegetarià",
    "localGuide.burgers": "Hamburgueseria",
    "localGuide.cafes": "Cafeteries",
    "localGuide.recommendationsEvents":
      "Les nostres recomanacions basades en dates i programacions",
    "localGuide.restaurantViews": "Restaurant amb vistes",

    // Contact
    "contact.title": "Contactar Amfitrió",
    "contact.name": "María García",
    "contact.phone": "+34 612 345 678",
    "contact.email": "maria@casavistahermosa.com",
    "contact.available": "Disponible 24/7 per emergències",

    // Share
    "share.title": "Compartir Enllaç de Registre",
    "share.message": "Completa el teu registre per Casa Vista Hermosa",
    "share.copy": "Copiar enllaç",
    "share.whatsapp": "Compartir per WhatsApp",
    "share.email": "Compartir per Email",
    "share.copied": "Enllaç copiat!",

    // Confirmation
    "confirmation.title": "Registre Complet!",
    "confirmation.thankYou": "Gràcies",
    "confirmation.dataSaved": "La teva informació s'ha guardat correctament",
    "confirmation.groupStatus": "Estat del Grup",
    "confirmation.of": "de",
    "confirmation.responsible": "Responsable",
    "confirmation.registered": "Registrat",
    "confirmation.adultNotResponsible":
      "No has indicat que ets el responsable de la reserva. Estàs segur que vols continuar sense ser el responsable?",
    "confirmation.pending": "Pendent",
    "confirmation.registerNext": "Registrar següent hoste",
    "confirmation.pendingPlural": "pendents",
    "confirmation.pendingSingular": "pendent",
    "confirmation.allRegistered":
      "Tots els hostes han completat el seu registre!",
    "confirmation.allGuestsComplete": "Tots els hostes registrats!",
    "confirmation.fullAccessUnlocked": "Accés complet desbloquejat",
    "confirmation.goToDashboard": "Anar a La Meva Estada",
    "confirmation.shareRegistration": "Compartir Registre",
    "confirmation.shareDescription":
      "Envia aquest enllaç als altres hostes perquè completin el seu registre",
    "confirmation.copyLink": "Compartir enllaç de registre",
    "confirmation.shareWhatsApp": "Compartir per WhatsApp",
    "confirmation.shareEmail": "Enviar per Email",
    "confirmation.showQR": "Mostrar codi QR",
    "confirmation.continueToApp": "Continuar a l'app",
    "confirmation.limitedFeatures":
      "Algunes funcions estaran limitades fins que tots els hostes completin el seu registre",
    "confirmation.progressSaved": "El teu progrés s'ha guardat correctament",

    // Register - Method Selection
    "register.title": "Registre d'Hoste",
    "register.howToRegister": "Tria com prefereixes introduir les teves dades",
    "register.methodTitle": "Mètode de Registre",
    "register.scanDocument": "Escanejar Document",
    "register.fastAutomatic": "Ràpid i automàtic",
    "register.recommended": "Recomanat",
    "register.aiExtraction": "Extracció automàtica de dades amb IA",
    "register.scanDescription": "Escaneja el teu DNI/NIE/Passaport",
    "register.enterManually": "Introduir manualment",
    "register.preferWrite": "Prefereixo escriure",
    "register.guidedForm": "Formulari guiat pas a pas",
    "register.manualForm": "Formulari Manual",
    "register.manualDescription": "Completa el formulari manualment",
    "register.tip": "Consell",
    "register.scanTip": "L'escaneig és més ràpid i evita errors",

    // Register - Upload Step
    "register.uploadDocument": "Pujar Document",
    "register.uploadPhotoId": "Puja una foto del teu document d'identitat",
    "register.scanningDocument": "Escanejant document...",
    "register.extractingData": "Extraient dades amb IA. Si us plau espera.",
    "register.selectOrTakePhoto": "Selecciona o fes una foto",
    "register.fileFormats": "PNG, JPG o JPEG (Màx. 10MB)",
    "register.selectFile": "Seleccionar arxiu",
    "register.preview": "Vista prèvia",
    "register.back": "Enrere",
    "register.processing": "Processant...",
    "register.continue": "Continuar",

    // Register - Personal Info Form
    "register.personalInfo": "Informació Personal",
    "register.reviewExtractedData": "Revisa i completa les dades extretes",
    "register.scannedData": "Dades del document escanejat",
    "register.reviewScannedData": "Revisa les dades del document escanejat",
    "register.completeYourData": "Completa les teves dades de registre",
    "register.imBookingHolder": "Ets tu qui va fer la reserva?",
    "register.bookingHolderInfo":
      "Marca aquesta casella si ets la persona que va fer la reserva. Les teves dades es carregaran automàticament.",
    "register.identityDocument": "Document d'Identitat",
    "register.dniFormatCorrect": "Format de DNI correcte",
    "register.nieFormatCorrect": "Format de NIE correcte",
    "register.supportNumberHint": "📌 Apareix a la part superior del DNI/NIE",
    "register.personalData": "Dades Personals",
    "register.firstNames": "Noms",
    "register.age": "Edat",
    "register.years": "anys",
    "register.select": "Seleccionar",
    "register.relationshipWithHolder": "Parentiu amb el Responsable",
    "register.responsibleAlreadyExists":
      "Ja hi ha un hoste responsable registrat per aquesta reserva",
    "register.responsibleHint":
      "No s'ha assignat un hoste responsable. Per tant, no tindràs accés a les funcions d'obertura de porta fins que es completi el registre.",
    "register.responsibleDialogTitle": "Ets tu qui va fer la reserva?",
    "register.responsibleDialogDescription":
      "Si ets el responsable, tindràs accés complet al portal incloent l'obertura de portes.",
    "register.responsibleDialogCancel": "No, continuar sense ser responsable",
    "register.responsibleDialogConfirm": "Sí, sóc el responsable",
    "register.firstNamesPlaceholder": "Nom(s)",
    "register.optional": "(opcional)",
    "register.secondSurnamePlaceholder": "Cognom matern",
    "register.minorRequiredRelationship":
      "⚠️ Obligatori per a menors de 18 anys",
    "register.searching": "Buscant...",
    "register.autoCompletesMunicipality":
      "Es completa automàticament en seleccionar municipi",
    "register.cityNamePlaceholder": "Nom de la ciutat",
    "register.addressPlaceholder": "Carrer, número, pis, porta...",
    "register.residenceData": "Dades de Residència",
    "register.contactInfo": "Informació de Contacte",
    "register.autoSave": "💾 El teu progrés es guarda automàticament",

    // Register - Document Section
    "register.documentSection": "Document d'Identitat",
    "register.documentType": "Tipus de Document",
    "register.documentNumber": "Número de Document",
    "register.selectType": "Seleccionar tipus",
    "register.documentPlaceholder": "Número de document",
    "register.dniPlaceholder": "Ex: 12345678Z",
    "register.niePlaceholder": "Ex: X1234567L",
    "register.passportPlaceholder": "Ex: ABC123456",
    "register.issueDate": "Data d'Expedició",
    "register.expiryDate": "Data de Caducitat",
    "register.supportNumber": "Número de Suport",
    "register.supportPlaceholder": "Ex: AAA000000",
    "register.documentAlreadyExists":
      "Aquest document ja està registrat en aquesta reserva",

    // Register - Personal Data Section

    // Register - Personal Data Section
    "register.personalSection": "Dades Personals",
    "register.nationality": "Nacionalitat",
    "register.searchCountry": "Buscar país...",
    "register.noCountryFound": "No s'ha trobat cap país",
    "register.firstName": "Nom",
    "register.firstNamePlaceholder": "Nom",
    "register.firstSurname": "Primer Cognom",
    "register.firstSurnamePlaceholder": "Primer cognom",
    "register.secondSurname": "Segon Cognom",
    "register.birthDate": "Data de Naixement",
    "register.sex": "Sexe",
    "register.selectSex": "Seleccionar sexe",

    // Register - Residence Section
    "register.residenceSection": "Dades de Residència",
    "register.residenceCountry": "País de Residència",
    "register.province": "Província",
    "register.selectProvince": "Seleccionar província",
    "register.municipality": "Municipi",
    "register.searchMunicipality": "Buscar municipi...",
    "register.noMunicipalityFound": "No s'ha trobat cap municipi",
    "register.selectMunicipalityFirst": "Selecciona primer una província",
    "register.cityMunicipality": "Ciutat/Municipi",
    "register.cityPlaceholder": "Ciutat o municipi",
    "register.postalCode": "Codi Postal",
    "register.postalCodePlaceholder": "Codi postal",
    "register.selectPostalCode": "Seleccionar codi postal",
    "register.availablePostalCodes": "codis postals disponibles",
    "register.loading": "Carregant...",
    "register.fullAddress": "Adreça Completa",
    // Register - Contact Section
    "register.contactSection": "Informació de Contacte",
    "register.countryCode": "Codi País",
    "register.phoneNumber": "Número de Telèfon",
    "register.phonePlaceholder": "600 000 000",
    "register.email": "Email",
    "register.emailPlaceholder": "el.teu@email.com",

    // Register - Relationship Section
    "register.relationshipSection": "Relació amb el Responsable",
    "register.relationship": "Relació",
    "register.selectRelationship": "Seleccionar relació",

    // Register - Buttons
    "register.previous": "Anterior",
    "register.next": "Següent",
    "register.submit": "Completar Registre",
    "register.cancel": "Cancel·lar",

    // Register - Validation Messages
    "register.requiredField": "Aquest camp és obligatori",
    "register.invalidDocument": "Document invàlid",
    "register.invalidEmail": "Email invàlid",
    "register.invalidPhone": "Telèfon invàlid",
    "register.documentExpired": "El document ha caducat",
    "register.futureDate": "La data no pot ser futura",
    "register.minorAge": "Has de ser major d'edat",
    "register.minorCannotBeResponsible":
      "Els menors d'edat no poden ser responsables de la reserva. Només un adult pot ser el responsable.",

    // Register - Steps
    "register.step": "Pas",
    "register.of": "de",
    "register.stepMethod": "Mètode",
    "register.stepScan": "Escanejar",
    "register.stepForm": "Formulari",

    // RegisterPreferences
    "preferences.title": "Preferències d'Estada",
    "preferences.updateTitle": "Actualitzar Preferències d'Estada",
    "preferences.subtitle":
      "Com a responsable de la reserva, personalitza els detalls de l'allotjament",
    "preferences.updateSubtitle": "Modifica els detalls del teu allotjament",
    "preferences.responsible": "Responsable de la Reserva",
    "preferences.arrivalTime": "Hora d'Arribada Estimada",
    "preferences.arrivalHelp": "Ens ajuda a preparar el teu allotjament",
    "preferences.needsCrib": "¿Necessites bressol?",
    "preferences.hasPets": "¿Viatges amb mascotes?",
    "preferences.freeOfCharge": "Sense cost addicional",
    "preferences.notAvailable": "No disponible",
    "preferences.bedConfiguration": "Configuració de Llits",
    "preferences.loadingAvailability": "Carregant disponibilitat...",
    "preferences.doubleBeds": "Llits Dobles",
    "preferences.singleBeds": "Llits Individuals",
    "preferences.sofaBeds": "Sofàs Llit",
    "preferences.bunkBeds": "Lliteres",
    "preferences.max": "Màx",
    "preferences.notAvailableAccommodation":
      "No disponible en aquest allotjament",
    "preferences.extraBedsTitle": "Sol·licitud de llits addicionals",
    "preferences.extraBedsNotification":
      "L'amfitrió serà notificat sobre aquesta sol·licitud especial.",
    "preferences.additionalInfo": "Informació Adicional (Opcional)",
    "preferences.additionalInfoPlaceholder":
      "Peticionss,  especials, comentaris...",
    "preferences.characters": "caràcters",
    "preferences.back": "Enrere",
    "preferences.continue": "Continuar",
    "preferences.autoSave": "💾 El teu progrés s'ha guardat automàticament",
    "preferences.step": "Pas",
    "preferences.of": "de",

    // RegisterTerms
    "terms.title": "Contracte d'Allotjament",
    "terms.subtitle":
      "Llegeix i accepta els termes per completar el teu registre",
    "terms.termsAndConditions": "Termes i Condicions",
    "terms.keySummary": "Resum de Punts Clau",
    "terms.checkInTime": "Horari de check-in: 15:00 - 20:00",
    "terms.checkOutTime": "Horari de check-out: fins les 11:00",
    "terms.noSmoking": "Prohibit fumar a l'interior",
    "terms.noPets": "No es permeten mascotes",
    "terms.maxCapacity": "Capacitat màxima: segons reserva",
    "terms.accommodationRules": "Normes de l'Allotjament",
    "terms.cancellationPolicy": "Política de Cancel·lació",
    "terms.responsibilities": "Responsabilitats",
    "terms.dataProtection": "Protecció de Dades",
    "terms.legalTerms": "Termes Legals",
    "terms.acceptCheckbox":
      "He llegit i accepto el contracte d'allotjament i els termes i condicions",
    "terms.signHere": "Firma aquí:",
    "terms.clear": "Netejar",
    "terms.signatureHelp":
      "Dibuixa la teva signatura amb el ratolí o el dit en pantalles tàctils",
    "terms.back": "Enrere",
    "terms.complete": "Completar Registre",
    "terms.saving": "Guardant...",
    "terms.step": "Pas",
    "terms.of": "de",

    // Months
    "months.january": "Gener",
    "months.february": "Febrer",
    "months.march": "Març",
    "months.april": "Abril",
    "months.may": "Maig",
    "months.june": "Juny",
    "months.july": "Juliol",
    "months.august": "Agost",
    "months.september": "Setembre",
    "months.october": "Octubre",
    "months.november": "Novembre",
    "months.december": "Desembre",

    // MobileDatePicker
    "register.selectDate": "Seleccionar data",
    "register.swipeToChange": "Llisca per canviar el dia, mes i any.",
    "register.confirm": "Confirmar",

    // NotFound
    "notFound.title": "Pàgina no trobada",
    "notFound.message": "Ho sentim, la pàgina que busques no existeix",
    "notFound.goHome": "Tornar a l'inici",
  },
  fr: {
    "welcome.title": "Casa Vista Hermosa",
    "welcome.subtitle": "Bienvenue! Votre séjour commence ici ✨",
    "welcome.guestsRegistered": "Invités enregistrés",
    "welcome.completeRegistration": "Compléter mon inscription",
    "welcome.step": "Étape 1 sur 3",
    "welcome.share": "Partager le lien",
    "welcome.viewAccommodation": "Voir l'hébergement",
    "welcome.dataProtected": "🔒 Vos données sont protégées et cryptées",
    "welcome.compliance":
      "Nous respectons le RGPD et la réglementation espagnole",
    "welcome.timeEstimate":
      "📋 Complétez votre inscription en seulement 3 minutes",
    "welcome.contact": "Contacter",

    // Dashboard - Reservation Card
    "dashboard.guestManagement": "Gestion des Invités",
    "dashboard.registeredGuests": "Invités enregistrés",
    "dashboard.pendingGuest": "Invité en attente",
    "dashboard.copyLink": "Partager le lien",
    "dashboard.responsibleWarningTitle": "Important !",
    "dashboard.responsibleWarning":
      "N'oubliez pas de vous enregistrer en tant qu'utilisateur responsable en répondant à la question \"Êtes-vous celui qui a effectué la réservation ?\". Sans responsable défini, vous n'aurez pas accès aux fonctions d'ouverture de portes.",
    "dashboard.myStay": "Mon Séjour",
    "dashboard.myReservation": "Ma Réservation",
    "dashboard.accommodation": "Hébergement",
    "dashboard.reservationId": "ID",
    "dashboard.checkIn": "Check-in",
    "dashboard.checkOut": "Check-out",
    "dashboard.openPortal": "Ouvrir le Portail",
    "dashboard.openAccommodation": "Ouvrir l'Hébergement",
    "dashboard.downloadContract": "Télécharger le Contrat PDF",
    "dashboard.downloadContractModel": "Télécharger le Modèle de Contrat",

    // Dashboard - General
    "dashboard.preferences": "Préférences de Séjour",
    "dashboard.yourHost": "Votre Hôte",
    "dashboard.accommodationInfo": "Informations sur l'Hébergement",
    "dashboard.wifiNetwork": "Réseau WiFi",
    "dashboard.wifiPassword": "Mot de passe WiFi",
    "dashboard.welcomeVideo": "Vidéos",
    "dashboard.localGuide": "Guide Local",
    "dashboard.customerSupport": "Informations Utiles",
    "dashboard.completeToUnlock":
      "Complétez votre inscription pour déverrouiller",
    "dashboard.sendMessage": "💬 Envoyer un message",
    "dashboard.callNow": "📞 Appeler maintenant",
    "dashboard.sendEmail": "📧 Envoyer un email",
    "dashboard.missingGuests": "Invités manquants à enregistrer",
    "dashboard.someFeaturesLimited":
      "Certaines fonctionnalités sont limitées jusqu'à ce que tous les invités s'enregistrent",

    // Dashboard - Doors & Unlock
    "dashboard.portal": "Portail",
    "dashboard.unlockHistory": "Historique des Ouvertures",
    "dashboard.unlockSuccess": "Porte ouverte avec succès",
    "dashboard.unlockFailed": "Échec de l'ouverture de la porte",
    "dashboard.noUnlockHistory": "Aucune ouverture enregistrée",
    "dashboard.unlockHistoryDescription":
      "Enregistrements d'ouvertures depuis l'app",
    "dashboard.confirmUnlock": "Ouvrir la porte?",
    "dashboard.confirmUnlockDescription":
      "Confirmez que vous voulez ouvrir la porte",
    "dashboard.doorOpened": "Porte ouverte!",
    "dashboard.doorOpenedDescription": "La porte a été ouverte avec succès",
    "dashboard.noRaixerTitle": "Nous sommes là pour vous aider!",
    "dashboard.noRaixerMessage":
      "Veuillez contacter votre hôte pour obtenir les codes d'accès et l'emplacement des boîtes à clés",
    "dashboard.noRaixerMessageBefore": "Votre séjour approche à grands pas ! Vos codes d'accès seront automatiquement activés le jour de votre réservation une fois que tous les invités seront inscrits. Nous avons hâte de vous accueillir !",
    "dashboard.noRaixerMessageActivePending": "Le grand jour est arrivé ! Il ne reste plus qu'à tous les invités de compléter leur inscription pour révéler vos codes d'accès afin que vous puissiez profiter de votre séjour.",
    "dashboard.accessCodesTitle": "Codes de la Boîte à Clés",
    "dashboard.accessCodesMessage":
      "Utilisez ces codes pour ouvrir la boîte à clés et récupérer les clés du logement",
    "dashboard.cajetinInfo": "Informations Boîte à Clés",
    "dashboard.code": "Code",
    "dashboard.accessNotYetAvailable": "Accès pas encore disponible",
    "dashboard.accessFinished": "Accès terminé",
    "dashboard.accessAvailableFrom":
      "L'accès aux portes sera disponible à partir du",
    "dashboard.accessFinishedOn": "L'accès aux portes s'est terminé le",
    "dashboard.spainTime": "heure d'Espagne",
    "dashboard.loadingAccessInfo": "Chargement des informations d'accès...",
    "dashboard.codeRevealedOnCheckin": "Le code sera révélé le jour de votre réservation",

    // Dashboard - Preferences
    "dashboard.arrival": "Arrivée",
    "dashboard.doubleBed": "lit double",
    "dashboard.doubleBeds": "lits doubles",
    "dashboard.singleBed": "lit simple",
    "dashboard.singleBeds": "lits simples",
    "dashboard.sofaBed": "canapé-lit",
    "dashboard.sofaBeds": "canapés-lits",
    "dashboard.bunkBed": "lit superposé",
    "dashboard.bunkBeds": "lits superposés",
    "dashboard.cribRequested": "Berceau demandé",
    "dashboard.noPreferences": "Aucune préférence configurée",
    "dashboard.editPreferences": "Modifier les préférences",
    "dashboard.saveChanges": "Enregistrer les modifications",
    "dashboard.cancel": "Annuler",
    "dashboard.preferencesUpdated": "Préférences mises à jour!",
    "dashboard.preferencesSaved":
      "Vos préférences ont été enregistrées avec succès.",
    "dashboard.preferencesWithExtraBeds":
      "Vos préférences ont été enregistrées. L'hôte sera informé de votre demande de lits supplémentaires.",
    "dashboard.extraBedsRequest": "Demande de lits supplémentaires",
    "dashboard.extraBedsWarning": "Vous demandez",
    "dashboard.beds": "lits",
    "dashboard.for": "pour",
    "dashboard.guest": "invité",
    "dashboard.guests": "invités",
    "dashboard.estimatedArrival": "Heure d'arrivée estimée",
    "dashboard.additionalInfo": "Informations supplémentaires",
    "dashboard.needsCrib": "Avez-vous besoin d'un berceau ?",
    "dashboard.hasPets": "Voyagez-vous avec des animaux ?",
    "dashboard.notAvailable": "Non disponible dans cet hébergement",

    // Dashboard - Incidents
    "dashboard.reportIncident": "Signaler un incident",
    "dashboard.reportIncidentTitle": "Signaler un Incident",
    "dashboard.incidentType": "Type d'incident",
    "dashboard.complaint": "Plainte",
    "dashboard.suggestion": "Suggestion",
    "dashboard.incidentSubject": "Sujet",
    "dashboard.incidentDescription": "Description",
    "dashboard.incidentSubmit": "Envoyer le rapport",
    "dashboard.incidentCancel": "Annuler",
    "dashboard.incidentSent": "envoyée",
    "dashboard.incidentRegistered":
      "Votre message a été enregistré avec succès",
    "dashboard.yourIncidents": "Vos incidents",
    "dashboard.noIncidents": "Vous n'avez signalé aucun incident",
    "dashboard.suggestionsComplaints": "Suggestions ou Réclamations",
    "dashboard.yourOpinionHelps": "Votre avis nous aide à nous améliorer",
    "dashboard.type": "Type",
    "dashboard.subjectPlaceholder": "De quoi parle votre message?",
    "dashboard.descriptionPlaceholder":
      "Décrivez votre suggestion ou réclamation...",
    "dashboard.messageHistory": "Historique des messages",
    "dashboard.send": "Envoyer",
    "dashboard.visitVacanfly": "Visiter Vacanfly.com",
    "dashboard.festivalsNearby": "Fêtes Patronales et Municipales",
    "dashboard.festivalsNearbyDescription":
      'Ce site web affiche des informations mises à jour sur les fêtes patronales et municipales les plus proches à chaque date, allez dans la section "Fêtes près de moi"',
    "dashboard.visitFestivalsPage": "Voir les Fêtes Proches",

    // Accommodation Info Categories
    "accommodationInfo.howToArrive": "🗺️ Comment arriver…?",
    "accommodationInfo.whatIsInAccommodation":
      "🏡 Que trouve-t-on dans le logement?",
    "accommodationInfo.howItWorks": "🔧 Comment ça marche?",
    "accommodationInfo.howDoI": "🛠️ Comment faire?",
    "accommodationInfo.howToContact": "📞 Comment contacter?",
    "accommodationInfo.accommodationRules": "📋 Règles du logement",
    "accommodationInfo.opening": "🔓 Ouverture",

    // Local Guide Categories
    "localGuide.restaurants": "Restaurants",
    "localGuide.barsDiscosCasinos": "Bars, Discothèques, Casinos",
    "localGuide.museums": "Musées, Centres d'Exposition, Galeries",
    "localGuide.parks": "Parcs à Thème, Parcs Naturels, Jardins",
    "localGuide.monuments": "Monuments, Patrimoines d'Intérêt",
    "localGuide.beaches": "Plages, Rivières, Lacs",
    "localGuide.gymsFitness": "Gymnases, Centres d'Entraînement Physique",
    "localGuide.spas": "Spas, Centres de Relaxation, Guérison",
    "localGuide.adventure": "Aventure",
    "localGuide.pharmacies": "Pharmacies",
    "localGuide.supermarkets": "Supermarchés",
    "localGuide.emergency": "Services d'Urgence",
    "localGuide.entertainmentCenter":
      "Cinémas, Théâtres, Centres de Divertissement",
    "localGuide.foodSpanish": "Cuisine Espagnole",
    "localGuide.recommendationsPairs": "Nos recommandations pour les couples",
    "localGuide.recommendationsFamilies":
      "Nos recommandations pour les familles ou les groupes avec enfants",
    "localGuide.recommendationsFriends":
      "Nos recommandations pour les groupes d'amis",
    "localGuide.foodAsian": "Cuisine Asiatique",
    "localGuide.pizzeria": "Pizzeria",
    "localGuide.franchises": "Franchises",
    "localGuide.foodVegetarian": "Cuisine Végétarienne",
    "localGuide.burgers": "Burgers",
    "localGuide.cafes": "Cafétérias",
    "localGuide.recommendationsEvents":
      "Nos recommandations basées sur les dates et les horaires",
    "localGuide.restaurantViews": "Restaurant avec vue",
    "contact.title": "Contacter l'Hôte",
    "contact.name": "María García",
    "contact.phone": "+34 612 345 678",
    "contact.email": "maria@casavistahermosa.com",
    "contact.available": "Disponible 24h/24 pour les urgences",
    "share.title": "Partager le Lien d'Inscription",
    "share.message": "Complétez votre inscription pour Casa Vista Hermosa",
    "share.copy": "Copier le lien",
    "share.whatsapp": "Partager via WhatsApp",
    "share.email": "Partager par Email",
    "share.copied": "Lien copié!",
    "confirmation.title": "Inscription Terminée!",
    "confirmation.thankYou": "Merci",
    "confirmation.dataSaved":
      "Vos informations ont été enregistrées correctement",
    "confirmation.groupStatus": "État du Groupe",
    "confirmation.of": "de",
    "confirmation.responsible": "Responsable",
    "confirmation.registered": "Enregistré",
    "confirmation.adultNotResponsible":
      "Vous n'avez pas indiqué que vous êtes le responsable de la réservation. Êtes-vous sûr de vouloir continuer sans être le responsable?",
    "confirmation.pending": "En attente",
    "confirmation.registerNext": "Enregistrer l'invité suivant",
    "confirmation.pendingPlural": "en attente",
    "confirmation.pendingSingular": "en attente",
    "confirmation.allRegistered":
      "Tous les invités ont terminé leur inscription!",
    "confirmation.allGuestsComplete": "Tous les invités enregistrés!",
    "confirmation.fullAccessUnlocked": "Accès complet déverrouillé",
    "confirmation.goToDashboard": "Aller à Mon Séjour",
    "confirmation.shareRegistration": "Partager l'Inscription",
    "confirmation.shareDescription":
      "Envoyez ce lien aux autres invités pour qu'ils terminent leur inscription",
    "confirmation.copyLink": "Partager le lien d'inscription",
    "confirmation.shareWhatsApp": "Partager via WhatsApp",
    "confirmation.shareEmail": "Envoyer par Email",
    "confirmation.showQR": "Afficher le code QR",
    "confirmation.continueToApp": "Continuer vers l'app",
    "confirmation.limitedFeatures":
      "Certaines fonctionnalités seront limitées jusqu'à ce que tous les invités terminent leur inscription",
    "confirmation.progressSaved":
      "Votre progression a été enregistrée correctement",

    // Register - Method Selection
    "register.title": "Enregistrement de l'Invité",
    "register.howToRegister": "Choisissez how you préférez saisir vos données",
    "register.methodTitle": "Méthode d'Enregistrement",
    "register.scanDocument": "Scanner le Document",
    "register.fastAutomatic": "Rapide et automatique",
    "register.recommended": "Recommandé",
    "register.aiExtraction": "Extraction automatique des données avec IA",
    "register.scanDescription": "Scannez votre DNI/NIE/Passeport",
    "register.enterManually": "Saisir manuellement",
    "register.tip": "Conseil",
    "register.scanTip": "Le scan est plus rapide et évite les erreurs",

    // Register - Upload Step
    "register.uploadDocument": "Télécharger le Document",
    "register.uploadPhotoId":
      "Téléchargez une photo de votre document d'identité",
    "register.scanningDocument": "Scan du document...",
    "register.extractingData":
      "Extraction des données avec IA. Veuillez patienter.",
    "register.selectOrTakePhoto": "Sélectionnez ou prenez une photo",
    "register.fileFormats": "PNG, JPG ou JPEG (Max. 10MB)",
    "register.selectFile": "Sélectionner un fichier",
    "register.preview": "Aperçu",
    "register.back": "Retour",
    "register.processing": "Traitement...",
    "register.continue": "Continuer",
    "register.preferWrite": "Je préfère écrire",
    "register.guidedForm": "Formulaire guidé étape par étape",
    "register.manualForm": "Formulaire Manuel",
    "register.manualDescription": "Remplissez le formulaire manuellement",

    // Register - Personal Info Form
    "register.personalInfo": "Informations Personnelles",
    "register.reviewExtractedData":
      "Vérifiez et complétez les données extraites",
    "register.scannedData": "Données du document scanné",
    "register.reviewScannedData": "Vérifiez les données du document scanné",
    "register.completeYourData": "Complétez vos données d'enregistrement",
    "register.imBookingHolder":
      "Êtes-vous la personne qui a fait la réservation ?",
    "register.bookingHolderInfo":
      "Cochez cette case si vous êtes la personne qui a effectué la réservation. Vos données seront chargées automatiquement.",
    "register.identityDocument": "Document d'Identité",
    "register.dniFormatCorrect": "Format DNI correct",
    "register.nieFormatCorrect": "Format NIE correct",
    "register.supportNumberHint": "📌 Apparaît en haut du DNI/NIE",
    "register.personalData": "Données Personnelles",
    "register.firstNames": "Prénoms",
    "register.age": "Âge",
    "register.years": "ans",
    "register.select": "Sélectionner",
    "register.relationshipWithHolder": "Lien avec le Titulaire",
    "register.responsibleAlreadyExists":
      "Il y a déjà un invité responsable enregistré pour cette réservation",
    "register.responsibleHint":
      "Aucun invité responsable n'a été assigné. Par conséquent, vous n'aurez pas accès aux fonctions d'ouverture de porte avant la fin de l'inscription.",
    "register.responsibleDialogTitle":
      "Êtes-vous celui qui a effectué la réservation?",
    "register.responsibleDialogDescription":
      "Si vous êtes le responsable, vous aurez un accès complet au portail, y compris l'ouverture des portes.",
    "register.responsibleDialogCancel": "Non, continuer sans être responsable",
    "register.responsibleDialogConfirm": "Oui, je suis le responsable",
    "register.firstNamesPlaceholder": "Prénom(s)",
    "register.optional": "(optionnel)",
    "register.secondSurnamePlaceholder": "Nom de famille maternel",
    "register.minorRequiredRelationship":
      "⚠️ Obligatoire pour les mineurs de moins de 18 ans",
    "register.searching": "Recherche...",
    "register.autoCompletesMunicipality":
      "Se remplit automatiquement lors de la sélection de la commune",
    "register.cityNamePlaceholder": "Nom de la ville",
    "register.addressPlaceholder": "Rue, numéro, étage, porte...",
    "register.residenceData": "Données de Résidence",
    "register.contactInfo": "Informations de Contact",
    "register.autoSave": "💾 Votre progression est sauvegardée automatiquement",

    // Register - Document Section
    "register.documentSection": "Document d'Identité",
    "register.documentType": "Type de Document",
    "register.documentNumber": "Numéro de Document",
    "register.selectType": "Sélectionner le type",
    "register.documentPlaceholder": "Numéro de document",
    "register.dniPlaceholder": "Ex: 12345678Z",
    "register.niePlaceholder": "Ex: X1234567L",
    "register.passportPlaceholder": "Ex: ABC123456",
    "register.issueDate": "Date d'Émission",
    "register.expiryDate": "Date d'Expiration",
    "register.supportNumber": "Numéro de Support",
    "register.supportPlaceholder": "Ex: AAA000000",
    "register.documentAlreadyExists":
      "Ce document est déjà enregistré dans cette réservation",

    // Register - Personal Data Section
    "register.personalSection": "Données Personnelles",
    "register.nationality": "Nationalité",
    "register.searchCountry": "Rechercher un pays...",
    "register.noCountryFound": "Aucun pays trouvé",
    "register.firstName": "Prénom",
    "register.firstNamePlaceholder": "Prénom",
    "register.firstSurname": "Premier Nom de Famille",
    "register.firstSurnamePlaceholder": "Premier nom de famille",
    "register.secondSurname": "Deuxième nom de famille",
    "register.birthDate": "Date de Naissance",
    "register.sex": "Sexe",
    "register.selectSex": "Sélectionner le sexe",

    // Register - Residence Section
    "register.residenceSection": "Données de Résidence",
    "register.residenceCountry": "Pays de Résidence",
    "register.province": "Province",
    "register.selectProvince": "Sélectionner la province",
    "register.municipality": "Municipalité",
    "register.searchMunicipality": "Rechercher une municipalité...",
    "register.noMunicipalityFound": "Aucune municipalité trouvée",
    "register.selectMunicipalityFirst": "Sélectionnez d'abord une province",
    "register.cityMunicipality": "Ville/Municipalité",
    "register.cityPlaceholder": "Ville ou municipalité",
    "register.postalCode": "Code Postal",
    "register.postalCodePlaceholder": "Code postal",
    "register.selectPostalCode": "Sélectionner le code postal",
    "register.availablePostalCodes": "codes postaux disponibles",
    "register.loading": "Chargement...",
    "register.fullAddress": "Adresse Complète",
    // Register - Contact Section
    "register.contactSection": "Informations de Contact",
    "register.countryCode": "Code Pays",
    "register.phoneNumber": "Numéro de Téléphone",
    "register.phonePlaceholder": "600 000 000",
    "register.email": "Email",
    "register.emailPlaceholder": "votre@email.com",

    // Register - Relationship Section
    "register.relationshipSection": "Relación con el Responsable",
    "register.relationship": "Relation",
    "register.selectRelationship": "Sélectionner la relation",

    // Register - Buttons
    "register.previous": "Précédent",
    "register.next": "Suivant",
    "register.submit": "Terminer l'Inscription",
    "register.cancel": "Annuler",

    // Register - Validation Messages
    "register.requiredField": "Ce champ est obligatoire",
    "register.invalidDocument": "Document invalide",
    "register.invalidEmail": "Email invalide",
    "register.invalidPhone": "Téléphone invalide",
    "register.documentExpired": "Le document a expiré",
    "register.futureDate": "La date ne peut pas être dans le futur",
    "register.minorAge": "Vous devez être majeur",
    "register.minorCannotBeResponsible":
      "Les mineurs ne peuvent pas être responsables de la réservation. Seul un adulte peut être le responsable.",

    // Register - Steps
    "register.step": "Étape",
    "register.of": "de",
    "register.stepMethod": "Méthode",
    "register.stepScan": "Scanner",
    "register.stepForm": "Formulaire",

    // RegisterPreferences
    "preferences.title": "Préférences de Séjour",
    "preferences.updateTitle": "Mettre à Jour les Préférences de Séjour",
    "preferences.subtitle":
      "En tant que titulaire de la réservation, personnalisez les détails de l'hébergement",
    "preferences.responsible": "Titulaire de la Réservation",
    "preferences.arrivalTime": "Heure d'Arrivée Estimée",
    "preferences.arrivalHelp": "Nous aide à préparer votre hébergement",
    "preferences.needsCrib": "Avez-vous besoin d'un berceau ?",
    "preferences.hasPets": "Voyagez-vous avec des animaux ?",
    "preferences.notAvailable": "Non disponible",
    "preferences.bedConfiguration": "Configuration des Lits",
    "preferences.loadingAvailability": "Chargement de la disponibilité...",
    "preferences.doubleBeds": "Lits Doubles",
    "preferences.singleBeds": "Lits Simples",
    "preferences.sofaBeds": "Canapés-lits",
    "preferences.bunkBeds": "Lits Superposés",
    "preferences.max": "Max",
    "preferences.notAvailableAccommodation":
      "Non disponible dans cet hébergement",
    "preferences.extraBedsTitle": "Demande de lits supplémentaires",
    "preferences.bedsRequestMessage1": "Vous demandez",
    "preferences.bedsRequestMessage2": "pour",
    "preferences.bedsRequestMessage3":
      "L'hôte sera informé de cette demande spéciale.",
    "preferences.beds": "lits",
    "preferences.guest": "invité",
    "preferences.guestPlural": "s",
    "preferences.guests": "invités",
    "preferences.extraBedsNotification":
      "L'hôte sera informé de cette demande spéciale.",
    "preferences.additionalInfo": "Informations Supplémentaires (Optionnel)",
    "preferences.additionalInfoPlaceholder":
      "Demandes spéciales, commentaires...",
    "preferences.characters": "caractères",
    "preferences.back": "Retour",
    "preferences.continue": "Continuer",
    "preferences.autoSave":
      "💾 Votre progression est enregistrée automatiquement",
    "preferences.step": "Étape",
    "preferences.of": "de",

    // RegisterTerms
    "terms.title": "Contrat d'Hébergement",
    "terms.subtitle":
      "Lisez et acceptez les termes pour compléter votre inscription",
    "terms.termsAndConditions": "Termes et Conditions",
    "terms.keySummary": "Résumé des Points Clés",
    "terms.checkInTime": "Heure d'arrivée: 15:00 - 20:00",
    "terms.checkOutTime": "Heure de départ: jusqu'à 11:00",
    "terms.noSmoking": "Interdit de fumer à l'intérieur",
    "terms.noPets": "Animaux non admis",
    "terms.maxCapacity": "Capacité maximale: selon réservation",
    "terms.accommodationRules": "Règles de l'Hébergement",
    "terms.cancellationPolicy": "Politique d'Annulation",
    "terms.responsibilities": "Responsabilités",
    "terms.dataProtection": "Protection des Données",
    "terms.legalTerms": "Termes Légaux",
    "terms.acceptCheckbox":
      "J'ai lu et j'accepte le contrat d'hébergement et les termes et conditions",
    "terms.signHere": "Signez ici:",
    "terms.clear": "Effacer",
    "terms.signatureHelp":
      "Dessinez votre signature avec le rat ou votre doigt sur les écrans tactiles",
    "terms.back": "Retour",
    "terms.complete": "Terminer l'Inscription",
    "terms.saving": "Enregistrement...",
    "terms.step": "Étape",
    "terms.of": "de",

    // Months
    "months.january": "Janvier",
    "months.february": "Février",
    "months.march": "Mars",
    "months.april": "Avril",
    "months.may": "Mai",
    "months.june": "Juin",
    "months.july": "Juillet",
    "months.august": "Août",
    "months.september": "Septembre",
    "months.october": "Octobre",
    "months.november": "Novembre",
    "months.december": "Décembre",

    // MobileDatePicker
    "register.selectDate": "Sélectionner une date",
    "register.swipeToChange":
      "Faites glisser pour changer le jour, le mois et l'année.",
    "register.confirm": "Confirmer",

    // NotFound
    "notFound.title": "Page non trouvée",
    "notFound.message": "Désolé, la page que vous recherchez n'existe pas",
    "notFound.goHome": "Retour à l'accueil",
  },
  de: {
    "welcome.title": "Casa Vista Hermosa",
    "welcome.subtitle": "Willkommen! Ihr Aufenthalt beginnt hier ✨",
    "welcome.guestsRegistered": "Registrierte Gäste",
    "welcome.completeRegistration": "Meine Registrierung abschließen",
    "welcome.step": "Schritt 1 von 3",
    "welcome.share": "Link teilen",
    "welcome.viewAccommodation": "Unterkunft ansehen",
    "welcome.dataProtected": "🔒 Ihre Daten sind geschützt und verschlüsselt",
    "welcome.compliance": "Wir erfüllen die DSGVO und spanische Vorschriften",
    "welcome.timeEstimate":
      "📋 Schließen Sie Ihre Registrierung in nur 3 Minuten ab",
    "welcome.contact": "Kontakt",

    // Dashboard - Reservation Card
    "dashboard.guestManagement": "Gästemanagement",
    "dashboard.registeredGuests": "Registrierte Gäste",
    "dashboard.pendingGuest": "Ausstehender Gast",
    "dashboard.copyLink": "Link teilen",
    "dashboard.responsibleWarningTitle": "Wichtig!",
    "dashboard.responsibleWarning":
      'Vergessen Sie nicht, sich als verantwortlicher Benutzer zu registrieren, indem Sie die Frage "Sind Sie die Person, die die Reservierung vorgenommen hat?" beantworten. Ohne definierten Verantwortlichen haben Sie keinen Zugang zu Türöffnungsfunktionen.',
    "dashboard.myStay": "Mein Aufenthalt",
    "dashboard.myReservation": "Meine Reservierung",
    "dashboard.accommodation": "Unterkunft",
    "dashboard.reservationId": "ID",
    "dashboard.checkIn": "Check-in",
    "dashboard.checkOut": "Check-out",
    "dashboard.openPortal": "Portal Öffnen",
    "dashboard.openAccommodation": "Unterkunft öffnen",
    "dashboard.downloadContract": "Vertrag PDF herunterladen",
    "dashboard.downloadContractModel": "Vertragsvorlage herunterladen",

    // Dashboard - General
    "dashboard.preferences": "Aufenthaltspräferenzen",
    "dashboard.yourHost": "Ihr Gastgeber",
    "dashboard.accommodationInfo": "Unterkunftsinformationen",
    "dashboard.wifiNetwork": "WLAN-Netzwerk",
    "dashboard.wifiPassword": "WLAN-Passwort",
    "dashboard.welcomeVideo": "Willkommensvideo",
    "dashboard.localGuide": "Lokaler Führer",
    "dashboard.customerSupport": "Nützliche Informationen",
    "dashboard.completeToUnlock":
      "Schließen Sie Ihre Registrierung ab zum Entsperren",
    "dashboard.sendMessage": "💬 Nachricht senden",
    "dashboard.callNow": "📞 Jetzt anrufen",
    "dashboard.sendEmail": "📧 E-Mail senden",
    "dashboard.missingGuests": "Fehlende Gäste zu registrieren",
    "dashboard.someFeaturesLimited":
      "Einige Funktionen sind eingeschränkt, bis sich alle Gäste registrieren",

    // Dashboard - Doors & Unlock
    "dashboard.portal": "Portal",
    "dashboard.unlockHistory": "Öffnungsverlauf",
    "dashboard.unlockSuccess": "Tür erfolgreich geöffnet",
    "dashboard.unlockFailed": "Fehler beim Öffnen der Tür",
    "dashboard.noUnlockHistory": "Keine Öffnungen aufgezeichnet",
    "dashboard.unlockHistoryDescription": "Öffnungsaufzeichnungen aus der App",
    "dashboard.confirmUnlock": "Tür öffnen?",
    "dashboard.confirmUnlockDescription":
      "Bestätigen Sie, dass Sie die Tür öffnen möchten",
    "dashboard.doorOpened": "Tür geöffnet!",
    "dashboard.doorOpenedDescription": "Die Tür wurde erfolgreich geöffnet",
    "dashboard.noRaixerTitle": "Wir sind hier, um zu helfen!",
    "dashboard.noRaixerMessage":
      "Bitte kontaktieren Sie Ihren Gastgeber, um Zugangscodes und Schlüsselkastenstandorte zu erhalten",
    "dashboard.noRaixerMessageBefore": "Ihr Aufenthalt rückt immer näher! Ihre Zugangscodes werden am Tag Ihrer Reservierung automatisch aktiviert, sobald alle Gäste registriert sind. Wir freuen uns darauf, Sie begrüßen zu dürfen!",
    "dashboard.noRaixerMessageActivePending": "Der große Tag ist da! Es fehlt nur noch, dass alle Gäste ihre Registrierung abschließen, um Ihre Zugangscodes freizuschalten, damit Sie Ihren Aufenthalt genießen können.",
    "dashboard.accessCodesTitle": "Schlüsselkasten-Codes",
    "dashboard.accessCodesMessage":
      "Verwenden Sie diese Codes, um den Schlüsselkasten zu öffnen und die Unterkunftsschlüssel zu entnehmen",
    "dashboard.cajetinInfo": "Schlüsselkasten Information",
    "dashboard.code": "Code",
    "dashboard.accessNotYetAvailable": "Zugang noch nicht verfügbar",
    "dashboard.accessFinished": "Zugang beendet",
    "dashboard.accessAvailableFrom": "Der Türzugang wird verfügbar sein ab",
    "dashboard.accessFinishedOn": "Der Türzugang endete am",
    "dashboard.spainTime": "Spanische Zeit",
    "dashboard.loadingAccessInfo": "Zugriffsinformationen werden geladen...",
    "dashboard.codeRevealedOnCheckin": "Der Code wird am Tag Ihrer Reservierung bekannt gegeben",

    // Dashboard - Preferences
    "dashboard.arrival": "Ankunft",
    "dashboard.doubleBed": "Doppelbett",
    "dashboard.doubleBeds": "Doppelbetten",
    "dashboard.singleBed": "Einzelbett",
    "dashboard.singleBeds": "Einzelbetten",
    "dashboard.sofaBed": "Schlafsofa",
    "dashboard.sofaBeds": "Schlafsofas",
    "dashboard.bunkBed": "Etagenbett",
    "dashboard.bunkBeds": "Etagenbetten",
    "dashboard.cribRequested": "Kinderbett angefordert",
    "dashboard.noPreferences": "Keine Präferenzen konfiguriert",
    "dashboard.editPreferences": "Präferenzen bearbeiten",
    "dashboard.saveChanges": "Änderungen speichern",
    "dashboard.cancel": "Abbrechen",
    "dashboard.preferencesUpdated": "Präferenzen aktualisiert!",
    "dashboard.preferencesSaved":
      "Ihre Präferenzen wurden erfolgreich gespeichert.",
    "dashboard.preferencesWithExtraBeds":
      "Ihre Präferenzen wurden gespeichert. Der Gastgeber wird über Ihre Anfrage nach zusätzlichen Betten informiert.",
    "dashboard.extraBedsRequest": "Anfrage für zusätzliche Betten",
    "dashboard.extraBedsWarning": "Sie fordern an",
    "dashboard.beds": "Betten",
    "dashboard.for": "für",
    "dashboard.guest": "Gast",
    "dashboard.guests": "Gäste",
    "dashboard.estimatedArrival": "Geschätzte Ankunftszeit",
    "dashboard.additionalInfo": "Zusätzliche Informationen",
    "dashboard.needsCrib": "Benötigen Sie ein Kinderbett?",
    "dashboard.hasPets": "Reisen Sie mit Haustieren?",
    "dashboard.notAvailable": "Nicht verfügbar in dieser Unterkunft",

    // Dashboard - Incidents
    "dashboard.reportIncident": "Vorfall melden",
    "dashboard.reportIncidentTitle": "Einen Vorfall Melden",
    "dashboard.incidentType": "Vorfalltyp",
    "dashboard.complaint": "Beschwerde",
    "dashboard.suggestion": "Vorschlag",
    "dashboard.incidentSubject": "Betreff",
    "dashboard.incidentDescription": "Beschreibung",
    "dashboard.incidentSubmit": "Bericht senden",
    "dashboard.incidentCancel": "Abbrechen",
    "dashboard.incidentSent": "gesendet",
    "dashboard.incidentRegistered":
      "Ihre Nachricht wurde erfolgreich registriert",
    "dashboard.yourIncidents": "Ihre Vorfälle",
    "dashboard.noIncidents": "Sie haben keine Vorfälle gemeldet",
    "dashboard.suggestionsComplaints": "Vorschläge oder Beschwerden",
    "dashboard.yourOpinionHelps": "Ihre Meinung hilft uns, uns zu verbessern",
    "dashboard.type": "Typ",
    "dashboard.subjectPlaceholder": "Worum geht es in Ihrer Nachricht?",
    "dashboard.descriptionPlaceholder":
      "Beschreiben Sie Ihren Vorschlag oder Ihre Beschwerde...",
    "dashboard.messageHistory": "Nachrichtenverlauf",
    "dashboard.send": "Senden",
    "dashboard.visitVacanfly": "Besuchen Sie Vacanfly.com",
    "dashboard.festivalsNearby": "Schutzpatron- und Stadtfeste",
    "dashboard.festivalsNearbyDescription":
      'Diese Website zeigt aktualisierte Informationen über die nächstgelegenen Schutzpatron- und Stadtfeste zu jedem Datum, gehen Sie zum Abschnitt "Feste in meiner Nähe"',
    "dashboard.visitFestivalsPage": "Feste in der Nähe Ansehen",

    // Accommodation Info Categories
    "accommodationInfo.howToArrive": "🗺️ Wie komme ich dort hin…?",
    "accommodationInfo.whatIsInAccommodation":
      "🏡 Was gibt es in der Unterkunft?",
    "accommodationInfo.howItWorks": "🔧 Wie funktioniert es?",
    "accommodationInfo.howDoI": "🛠️ Wie mache ich?",
    "accommodationInfo.howToContact": "📞 Wie kontaktiere ich?",
    "accommodationInfo.accommodationRules": "📋 Unterkunftsregeln",
    "accommodationInfo.opening": "🔓 Öffnung",

    // Local Guide Categories
    "localGuide.restaurants": "Restaurants",
    "localGuide.barsDiscosCasinos": "Bars, Diskotheken, Kasinos",
    "localGuide.museums": "Museen, Ausstellungszentren, Galerien",
    "localGuide.parks": "Themenparks, Naturparks, Gärten",
    "localGuide.monuments": "Denkmäler, Kulturerbe",
    "localGuide.beaches": "Strände, Flüsse, Seen",
    "localGuide.gymsFitness": "Fitnessstudios, Fitnesstrainingszentren",
    "localGuide.spas": "Spas, Entspannungszentren, Heilung",
    "localGuide.adventure": "Abenteuer",
    "localGuide.pharmacies": "Apotheken",
    "localGuide.supermarkets": "Supermärkte",
    "localGuide.emergency": "Notdienste",
    "localGuide.entertainmentCenter": "Kinos, Theater, Unterhaltungszentren",
    "localGuide.foodSpanish": "Spanisches Essen",
    "localGuide.recommendationsPairs": "Unsere Empfehlungen für Paare",
    "localGuide.recommendationsFamilies":
      "Unsere Empfehlungen für Familien oder Gruppen mit Kindern",
    "localGuide.recommendationsFriends":
      "Unsere Empfehlungen für Freundesgruppen",
    "localGuide.foodAsian": "Asiatisches Essen",
    "localGuide.pizzeria": "Pizzeria",
    "localGuide.franchises": "Franchisen",
    "localGuide.foodVegetarian": "Vegetarisches Essen",
    "localGuide.burgers": "Burger",
    "localGuide.cafes": "Cafeterias",
    "localGuide.recommendationsEvents":
      "Unsere Empfehlungen basierend auf Terminen und Zeitplänen",
    "localGuide.restaurantViews": "Restaurant mit Aussicht",
    "contact.title": "Gastgeber kontaktieren",
    "contact.name": "María García",
    "contact.phone": "+34 612 345 678",
    "contact.email": "maria@casavistahermosa.com",
    "contact.available": "Verfügbar 24/7 für Notfälle",
    "share.title": "Registrierungslink teilen",
    "share.message":
      "Schließen Sie Ihre Registrierung für Casa Vista Hermosa ab",
    "share.copy": "Link kopieren",
    "share.whatsapp": "Über WhatsApp teilen",
    "share.email": "Per E-Mail teilen",
    "share.copied": "Link kopiert!",
    "confirmation.title": "Registrierung Abgeschlossen!",
    "confirmation.thankYou": "Danke",
    "confirmation.dataSaved": "Ihre Informationen wurden korrekt gespeichert",
    "confirmation.groupStatus": "Gruppenstatus",
    "confirmation.of": "von",
    "confirmation.responsible": "Verantwortlich",
    "confirmation.registered": "Registriert",
    "confirmation.adultNotResponsible":
      "Sie haben nicht angegeben, dass Sie für die Reservierung verantwortlich sind. Sind Sie sicher, dass Sie ohne Verantwortlicher fortfahren möchten?",
    "confirmation.pending": "Ausstehend",
    "confirmation.registerNext": "Nächsten Gast registrieren",
    "confirmation.pendingPlural": "ausstehend",
    "confirmation.pendingSingular": "ausstehend",
    "confirmation.allRegistered":
      "Alle Gäste haben ihre Registrierung abgeschlossen!",
    "confirmation.allGuestsComplete": "Alle Gäste registriert!",
    "confirmation.fullAccessUnlocked": "Voller Zugriff freigeschaltet",
    "confirmation.goToDashboard": "Zu Mein Aufenthalt",
    "confirmation.shareRegistration": "Registrierung teilen",
    "confirmation.shareDescription":
      "Senden Sie diesen Link an andere Gäste, damit sie ihre Registrierung abschließen können",
    "confirmation.copyLink": "Registrierungslink teilen",
    "confirmation.shareWhatsApp": "Über WhatsApp teilen",
    "confirmation.shareEmail": "Per E-Mail senden",
    "confirmation.showQR": "QR-Code anzeigen",
    "confirmation.continueToApp": "Zur App fortfahren",
    "confirmation.limitedFeatures":
      "Einige Funktionen sind eingeschränkt, bis alle Gäste ihre Registrierung abschließen",
    "confirmation.progressSaved": "Ihr Fortschritt wurde korrekt gespeichert",
    "register.step": "Schritt",
    "register.of": "von",
    "register.stepMethod": "Methode",
    "register.stepScan": "Scannen",
    "register.stepForm": "Formular",

    // Register - Method Selection
    "register.title": "Gästeregistrierung",
    "register.howToRegister": "Wählen Sie, wie Sie Ihre Daten eingeben möchten",
    "register.methodTitle": "Registrierungsmethode",
    "register.scanDocument": "Dokument Scannen",
    "register.fastAutomatic": "Schnell und automatisch",
    "register.recommended": "Empfohlen",
    "register.aiExtraction": "Automatische Datenextraktion mit KI",
    "register.scanDescription": "Scannen Sie Ihren Ausweis/NIE/Reisepass",
    "register.enterManually": "Manuell eingeben",
    "register.preferWrite": "Ich schreibe lieber",
    "register.guidedForm": "Schrittweise geführtes Formular",
    "register.manualForm": "Manuelles Formular",
    "register.manualDescription": "Füllen Sie das Formular manuell aus",
    "register.tip": "Tipp",
    "register.scanTip": "Das Scannen ist schneller und vermeidet Fehler",

    // Register - Upload Step
    "register.uploadDocument": "Dokument Hochladen",
    "register.uploadPhotoId": "Laden Sie ein Foto Ihres Ausweisdokuments hoch",
    "register.scanningDocument": "Dokument wird gescannt...",
    "register.extractingData": "Daten werden mit KI extrahiert. Bitte warten.",
    "register.selectOrTakePhoto": "Wählen oder machen Sie ein Foto",
    "register.fileFormats": "PNG, JPG oder JPEG (Max. 10MB)",
    "register.selectFile": "Datei auswählen",
    "register.preview": "Vorschau",
    "register.back": "Zurück",
    "register.processing": "Verarbeitung...",
    "register.continue": "Weiter",

    // Register - Personal Info Form
    "register.personalInfo": "Persönliche Informationen",
    "register.reviewExtractedData":
      "Überprüfen und vervollständigen Sie die extrahierten Daten",
    "register.scannedData": "Gescanntes Dokumentdaten",
    "register.reviewScannedData": "Überprüfen Sie die gescannten Dokumentdaten",
    "register.completeYourData":
      "Vervollständigen Sie Ihre Registrierungsdaten",
    "register.imBookingHolder":
      "Sind Sie die Person, die die Reservierung vorgenommen hat?",
    "register.bookingHolderInfo":
      "Aktivieren Sie dieses Kästchen, wenn Sie die Person sind, die die Reservierung vorgenommen hat. Ihre Daten werden automatisch geladen.",
    "register.identityDocument": "Ausweisdokument",
    "register.dniFormatCorrect": "DNI-Format korrekt",
    "register.nieFormatCorrect": "NIE-Format korrekt",
    "register.supportNumber": "Unterstützungsnummer",
    "register.supportPlaceholder": "z.B: AAA000000",
    "register.supportNumberHint": "📌 Erscheint oben auf dem DNI/NIE",
    "register.documentAlreadyExists":
      "Dieses Dokument ist bereits in dieser Reservierung registriert",
  },
  nl: {
    // Welcome
    "welcome.title": "Casa Vista Hermosa",
    "welcome.subtitle": "Welkom! Uw verblijf begint hier ✨",
    "welcome.guestsRegistered": "Geregistreerde gasten",
    "welcome.completeRegistration": "Mijn registratie voltooien",
    "welcome.step": "Stap 1 van 3",
    "welcome.share": "Link delen",
    "welcome.viewAccommodation": "Accommodatie bekijken",
    "welcome.dataProtected": "🔒 Uw gegevens zijn beschermd en versleuteld",
    "welcome.compliance": "Wij voldoen aan de AVG en Spaanse regelgeving",
    "welcome.timeEstimate": "📋 Voltooi uw registratie in slechts 3 minuten",
    "welcome.contact": "Contact",

    // Dashboard - Reservation Card
    "dashboard.guestManagement": "Gastenbeheer",
    "dashboard.registeredGuests": "Geregistreerde gasten",
    "dashboard.pendingGuest": "Openstaande gast",
    "dashboard.copyLink": "Link delen",
    "dashboard.important": "Belangrijk!",
    "dashboard.noResponsibleWarning":
      'Vergeet niet uzelf te registreren als verantwoordelijke gebruiker door de vraag "Bent u de persoon die de reservering heeft gemaakt?" te beantwoorden. Zonder gedefinieerde verantwoordelijke heeft u geen toegang tot deuropeningsfuncties.',
    "dashboard.myStay": "Mijn verblijf",
    "dashboard.myReservation": "Mijn reservering",
    "dashboard.accommodation": "Accommodatie",
    "dashboard.reservationId": "ID",
    "dashboard.checkIn": "Check-in",
    "dashboard.checkOut": "Check-out",
    "dashboard.openPortal": "Portaal openen",
    "dashboard.openAccommodation": "Accommodatie openen",

    // Dashboard - General
    "dashboard.preferences": "Verblijfsvoorkeuren",
    "dashboard.yourHost": "Uw host",
    "dashboard.accommodationInfo": "Accommodatie-informatie",
    "dashboard.wifiNetwork": "WIFI-netwerk",
    "dashboard.wifiPassword": "WIFI-wachtwoord",
    "dashboard.localGuide": "Lokale gids",
    "dashboard.incidents": "Incidenten",
    "dashboard.newIncident": "Nieuw incident",
    "dashboard.services": "Diensten",
    "dashboard.seeAll": "Alles zien",
    "dashboard.information": "Informatie",
    "dashboard.access": "Toegang",
    "dashboard.codeRevealedOnCheckin": "De code wordt onthuld op de dag van uw reservering",
    "dashboard.noRaixerMessageBefore": "Uw verblijf komt steeds dichterbij! Uw toegangscodes worden automatisch geactiveerd op de dag van uw reservering zodra alle gasten zijn geregistreerd. We kijken ernaar uit u te verwelkomen!",
    "dashboard.noRaixerMessageActivePending": "De grote dag is aangebroken! Het enige wat nog moet gebeuren is dat alle gasten hun registratie voltooien om uw toegangscodes te onthullen, zodat u van uw verblijf kunt genieten.",

    // Register - Document Section
    "register.identityDocument": "Identiteitsdocument",
    "register.dniFormatCorrect": "DNI-formaat correct",
    "register.nieFormatCorrect": "NIE-formaat correct",
    "register.supportNumber": "Ondersteuningsnummer",
    "register.supportPlaceholder": "Bijv.: AAA000000",
    "register.supportNumberHint": "📌 Verschijnt bovenaan het DNI/NIE",
    "register.documentAlreadyExists":
      "Dit document is al geregistreerd in deze reservering",

    // Register - Personal Data Section
    "register.personalSection": "Persoonlijke Gegevens",
    "register.nationality": "Nationaliteit",
    "register.searchCountry": "Land zoeken...",
    "register.noCountryFound": "Geen land gevonden",
    "register.firstName": "Voornaam",
    "register.firstNamePlaceholder": "Voornaam",
    "register.firstSurname": "Eerste Achternaam",
    "register.firstSurnamePlaceholder": "Eerste achternaam",
    "register.secondSurname": "Tweede Achternaam",
    "register.birthDate": "Geboortedatum",
    "register.sex": "Geslacht",
    "register.selectSex": "Geslacht selecteren",

    // Register - Residence Section
    "register.residenceSection": "Woonplaatsgegevens",
    "register.residenceCountry": "Woonland",
    "register.province": "Provincie",
    "register.selectProvince": "Provincie selecteren",
    "register.municipality": "Gemeente",
    "register.searchMunicipality": "Gemeente zoeken...",
    "register.noMunicipalityFound": "Geen gemeente gevonden",
    "register.selectMunicipalityFirst": "Selecteer eerst een provincie",
    "register.cityMunicipality": "Stad/Gemeente",
    "register.cityPlaceholder": "Stad of gemeente",
    "register.postalCode": "Postcode",
    "register.postalCodePlaceholder": "Postcode",
    "register.selectPostalCode": "Selecteer postcode",
    "register.availablePostalCodes": "beschikbare postcodes",
    "register.loading": "Laden...",
    "register.fullAddress": "Volledig Adres",
    // Register - Contact Section
    "register.contactSection": "Contactinformatie",
    "register.countryCode": "Landcode",
    "register.phoneNumber": "Telefoonnummer",
    "register.phonePlaceholder": "600 000 000",
    "register.email": "E-mail",
    "register.emailPlaceholder": "uw@email.com",

    // Register - Relationship Section
    "register.relationshipSection": "Relatie met Verantwoordelijke",
    "register.relationship": "Relatie",
    "register.selectRelationship": "Relatie selecteren",

    // Register - Buttons
    "register.previous": "Vorige",
    "register.next": "Volgende",
    "register.submit": "Registratie Voltooien",
    "register.cancel": "Annuleren",

    // Register - Validation Messages
    "register.requiredField": "Dit veld is verplicht",
    "register.invalidDocument": "Ongeldig document",
    "register.invalidEmail": "Ongeldige e-mail",
    "register.invalidPhone": "Ongeldig telefoonnummer",
    "register.documentExpired": "Het document is verlopen",
    "register.futureDate": "De datum kan niet in de toekomst liggen",
    "register.minorAge": "U moet meerderjarig zijn",

    // Register - Steps
    "register.step": "Stap",
    "register.of": "van",
    "register.stepMethod": "Methode",
    "register.stepScan": "Scannen",
    "register.stepForm": "Formulier",

    // RegisterPreferences
    "preferences.title": "Verblijfsvoorkeuren",
    "preferences.updateTitle": "Verblijfsvoorkeuren Bijwerken",
    "preferences.subtitle":
      "Als reserveringshouder past u de accommodatiedetails aan",
    "preferences.responsible": "Reserveringshouder",
    "preferences.arrivalTime": "Geschatte Aankomsttijd",
    "preferences.arrivalHelp": "Helpt ons uw accommodatie voor te bereiden",
    "preferences.needsCrib": "Heeft u een babybedje nodig?",
    "preferences.hasPets": "Reist u met huisdieren?",
    "preferences.notAvailable": "Niet beschikbaar",
    "preferences.bedConfiguration": "Beddenconfiguratie",
    "preferences.loadingAvailability": "Beschikbaarheid laden...",
    "preferences.doubleBeds": "Tweepersoonsbedden",
    "preferences.singleBeds": "Eenpersoonsbedden",
    "preferences.sofaBeds": "Slaapbanken",
    "preferences.bunkBeds": "Stapelbedden",
    "preferences.max": "Max",
    "preferences.notAvailableAccommodation":
      "Niet beschikbaar in deze accommodatie",
    "preferences.extraBedsTitle": "Verzoek om extra bedden",
    "preferences.extraBedsMessage": "U vraagt",
    "preferences.beds": "bedden",
    "preferences.for": "voor",
    "preferences.guest": "gast",
    "preferences.guests": "gasten",
    "preferences.extraBedsNotification":
      "De gastheer wordt op de hoogte gebracht van dit speciale verzoek.",
    "preferences.additionalInfo": "Aanvullende Informatie (Optioneel)",
    "preferences.additionalInfoPlaceholder":
      "Speciale verzoeken, opmerkingen...",
    "preferences.characters": "tekens",
    "preferences.back": "Terug",
    "preferences.continue": "Doorgaan",
    "preferences.autoSave": "💾 Uw voortgang wordt automatisch opgeslagen",
    "preferences.step": "Stap",
    "preferences.of": "van",
    "preferences.warning": "Waarschuwing",
    "preferences.bedLoadError":
      "Kon bedbeschikbaarheid niet laden. U kunt doorgaan, maar er kunnen beperkingen zijn.",
    "preferences.additionalBedsRequest": "Verzoek voor extra bedden",
    "preferences.bedsRequestMessage1": "U vraagt",
    "preferences.bedsRequestMessage2": "aan voor",
    "preferences.bedsRequestMessage3":
      "De gastheer wordt op de hoogte gesteld van dit speciale verzoek.",
    "preferences.guestPlural": "en",

    // RegisterTerms
    "terms.title": "Accommodatiecontract",
    "terms.subtitle":
      "Lees en accepteer de voorwaarden om uw registratie te voltooien",
    "terms.termsAndConditions": "Algemene Voorwaarden",
    "terms.keySummary": "Samenvatting van Belangrijke Punten",
    "terms.checkInTime": "Inchecktijd: 15:00 - 20:00",
    "terms.checkOutTime": "Uitchecktijd: tot 11:00",
    "terms.noSmoking": "Roken binnen verboden",
    "terms.noPets": "Geen huisdieren toegestaan",
    "terms.maxCapacity": "Maximale capaciteit: volgens reservering",
    "terms.accommodationRules": "Accommodatieregels",
    "terms.cancellationPolicy": "Annuleringsbeleid",
    "terms.responsibilities": "Verantwoordelijkheden",
    "terms.dataProtection": "Gegevensbescherming",
    "terms.legalTerms": "Juridische Voorwaarden",
    "terms.acceptCheckbox":
      "Ik heb het accommodatiecontract en de algemene voorwaarden gelezen en geaccepteerd",
    "terms.signHere": "Teken hier:",
    "terms.clear": "Wissen",
    "terms.signatureHelp":
      "Teken uw handtekening met de muis of uw vinger op touchscreens",
    "terms.back": "Terug",
    "terms.complete": "Registratie Voltooien",
    "terms.saving": "Opslaan...",
    "terms.step": "Stap",
    "terms.of": "van",

    // Months
    "months.january": "Januari",
    "months.february": "Februari",
    "months.march": "Maart",
    "months.april": "April",
    "months.may": "Mei",
    "months.june": "Juni",
    "months.july": "Juli",
    "months.august": "Augustus",
    "months.september": "September",
    "months.october": "Oktober",
    "months.november": "November",
    "months.december": "December",

    // MobileDatePicker
    "register.selectDate": "Datum selecteren",
    "register.swipeToChange": "Veeg om dag, maand en jaar te wijzigen.",
    "register.confirm": "Bevestigen",

    // NotFound
    "notFound.title": "Pagina niet gevonden",
    "notFound.message": "Sorry, de pagina die u zoekt bestaat niet",
    "notFound.goHome": "Terug naar home",
  },
};

const languageNames: Record<Language, string> = {
  es: "Español",
  en: "English",
  ca: "Català",
  fr: "Français",
  de: "Deutsch",
  nl: "Nederlands",
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("language");
    return (stored as Language) || "es";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const getLanguageName = (lang: Language): string => {
    return languageNames[lang];
  };

  // Función para traducir categorías dinámicas de la base de datos
  const translateCategory = (categoryTitle: string): string => {
    if (!categoryTitle) return categoryTitle;

    // Quitar etiquetas HTML para la traducción (ej: <h4>RESTAURANTES</h4> -> RESTAURANTES)
    const cleanTitle = categoryTitle.replace(/<\/?([^>]+)>/g, "");

    // Mapeo de categorías conocidas (español mayúsculas -> clave de traducción)
    const categoryMap: Record<string, string> = {
      RESTAURANTES: "localGuide.restaurants",
      "BARES, DISCOTECAS, CASINOS": "localGuide.barsDiscosCasinos",
      "CINES, TEATROS, CENTROS DE ENTRETENIMIENTO":
        "localGuide.entertainmentCenter",
      "MUSEOS, CENTROS DE EXPOSICIONES, GALERÍAS": "localGuide.museums",
      "PARQUES TEMÁTICOS, PARQUES NATURALES, JARDÍNES": "localGuide.parks",
      "PARQUES TEMÁTICOS, PARQUES NATURALES, JARDINES": "localGuide.parks", // Variación sin tilde
      "MONUMENTOS, PATRIMONIOS DE INTERÉS": "localGuide.monuments",
      "MONUMENTOS, PATRIMONIOS DE INTERÉS.": "localGuide.monuments", // Con punto
      "PLAYAS, RÍOS, LAGOS": "localGuide.beaches",
      "GIMNASIOS, CENTROS DE ENTRENAMIENTO FÍSICO": "localGuide.gymsFitness",
      "SPAS, CENTROS DE RELAJACIÓN, SANACIÓN": "localGuide.spas",
      AVENTURA: "localGuide.adventure",
      FARMACIAS: "localGuide.pharmacies",
      SUPERMERCADOS: "localGuide.supermarkets",
      "SERVICIOS DE EMERGENCIAS": "localGuide.emergency",

      // Subcategorías y Recomendaciones
      "Comida Española": "localGuide.foodSpanish",
      "Nuestras recomendaciones para parejas":
        "localGuide.recommendationsPairs",
      "Nuestras recomendaciones para parejas:":
        "localGuide.recommendationsPairs",
      "Nuestras recomendaciones para familias o grupos con niños":
        "localGuide.recommendationsFamilies",
      "Nuestras recomendaciones para familias o grupos con niños:":
        "localGuide.recommendationsFamilies",
      "Nuestras recomendaciones para grupos de amigos":
        "localGuide.recommendationsFriends",
      "Nuestras recomendaciones para grupos de amigos:":
        "localGuide.recommendationsFriends",
      "Comida Asiática": "localGuide.foodAsian",
      Pizzería: "localGuide.pizzeria",
      Franquicias: "localGuide.franchises",
      "Comida Vegetariana": "localGuide.foodVegetarian",
      Hamburguesería: "localGuide.burgers",
      Cafeterías: "localGuide.cafes",
      "Nuestras recomendaciones en base a fechas y programaciones":
        "localGuide.recommendationsEvents",
      "Restaurante con vistas.": "localGuide.restaurantViews",
    };

    const translationKey = categoryMap[cleanTitle];
    if (translationKey) {
      const translated = translations[language][translationKey] || cleanTitle;
      // Re-envolver con la etiqueta original si existía
      const tagMatch = categoryTitle.match(/^(<[^>]+>).*(<\/[^>]+>)$/);
      if (tagMatch) {
        return `${tagMatch[1]}${translated}${tagMatch[2]}`;
      }
      return translated;
    }

    // Si no hay traducción disponible, devolver el título original
    return categoryTitle;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, getLanguageName, translateCategory }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
