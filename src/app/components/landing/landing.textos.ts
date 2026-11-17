export type Idioma = 'es' | 'en';

export interface TextosLanding {
  nav: { etiqueta: string; como: string; funciones: string; paraQuien: string; contacto: string };
  idiomaGrupo: string;
  cambiarIdioma: string;
  iniciarSesion: string;
  irAlPanel: string;
  abrirMenu: string;
  hero: {
    etiqueta: string;
    titulo: string;
    descripcion: string;
    solicitarDemo: string;
    verComo: string;
    nota: string;
  };
  vista: {
    etiqueta: string;
    sede: string;
    periodo: string;
    costo: string;
    graficoEtiqueta: string;
    pico: string;
    revisar: string;
    alerta: string;
  };
  como: { titulo: string; subtitulo: string; pasos: { titulo: string; texto: string }[] };
  funciones: { titulo: string; items: { icono: string; titulo: string; texto: string }[] };
  roles: { titulo: string; subtitulo: string; items: { titulo: string; texto: string }[] };
  demo: {
    titulo: string;
    texto: string;
    escribenos: string;
    nombre: string;
    empresa: string;
    correo: string;
    sedes: string;
    opcionesSedes: string[];
    enviar: string;
    aceptas: string;
    terminos: string;
    requerido: string;
    correoInvalido: string;
    correoEjemplo: string;
    gracias: string;
    asunto: string;
  };
  pie: {
    descripcion: string;
    producto: string;
    nosotros: string;
    contacto: string;
    legal: string;
    privacidad: string;
    derechos: string;
  };
}

export const TEXTOS: Record<Idioma, TextosLanding> = {
  es: {
    nav: { etiqueta: 'Secciones', como: 'Cómo funciona', funciones: 'Funciones', paraQuien: 'Para quién', contacto: 'Contacto' },
    idiomaGrupo: 'Idioma',
    cambiarIdioma: 'Cambiar idioma a inglés',
    iniciarSesion: 'Iniciar sesión',
    irAlPanel: 'Ir a mi panel',
    abrirMenu: 'Abrir menú',
    hero: {
      etiqueta: 'Para empresas con varias sedes',
      titulo: 'Sabe cuánto consume cada equipo y cuánto te cuesta',
      descripcion:
        'IntelliSave convierte las horas de uso de tus equipos en kWh y soles con la tarifa de cada sede, y te avisa cuando algo consume más de lo normal.',
      solicitarDemo: 'Solicitar demostración',
      verComo: 'Ver cómo funciona',
      nota: 'En computadora y celular · En español e inglés'
    },
    vista: {
      etiqueta: 'Vista previa del dashboard de IntelliSave',
      sede: 'Sede San Borja',
      periodo: 'Octubre, hasta hoy',
      costo: 'con la tarifa de la sede',
      graficoEtiqueta: 'Consumo diario con un pico el 14 de octubre',
      pico: '14 oct · reunión de directorio',
      revisar: 'Para revisar:',
      alerta: 'Aire acondicionado 01 consume el doble que su área.'
    },
    como: {
      titulo: 'Cómo funciona',
      subtitulo: 'Tres pasos, sin instalar medidores.',
      pasos: [
        { titulo: 'Registra tu organización', texto: 'Empresas, sedes, áreas y los equipos de cada área, con su potencia en watts.' },
        { titulo: 'Anota las horas de uso', texto: 'Cada área registra cuántas horas funcionó cada equipo. IntelliSave calcula los kWh y el costo.' },
        { titulo: 'Revisa y actúa', texto: 'El dashboard muestra dónde se va la energía y las alertas te dicen qué equipo revisar primero.' }
      ]
    },
    funciones: {
      titulo: 'Lo que incluye',
      items: [
        { icono: 'bolt', titulo: 'Consumo por sede, área y equipo', texto: 'Cada registro se convierte en kWh y soles con la tarifa vigente de la sede.' },
        { icono: 'notifications', titulo: 'Alertas de consumo anormal', texto: 'Una revisión diaria compara cada equipo con su área y avisa si algo se dispara.' },
        { icono: 'trending_up', titulo: 'Predicción del próximo mes', texto: 'Estima el consumo a partir del historial de cada sede para planificar el gasto.' },
        { icono: 'cloud', titulo: 'Clima de cada sede', texto: 'La temperatura del día, de un servicio meteorológico, para entender el uso del aire acondicionado.' },
        { icono: 'eco', titulo: 'Huella de carbono', texto: 'Convierte los kWh en kg de CO₂ para tus reportes de sostenibilidad.' },
        { icono: 'description', titulo: 'Reportes en PDF y CSV', texto: 'El resumen del periodo por sede, listo para compartir con gerencia.' }
      ]
    },
    roles: {
      titulo: 'Cada persona ve lo que necesita',
      subtitulo: 'Tres roles, y cada uno solo accede a los datos de su empresa.',
      items: [
        { titulo: 'Administrador', texto: 'Gestiona las sedes, áreas y usuarios de su empresa, y decide quién supervisa cada sede.' },
        { titulo: 'Supervisor energético', texto: 'Sigue el consumo y el costo de sus sedes, registra las tarifas y resuelve las alertas.' },
        { titulo: 'Empleado de área', texto: 'Registra desde el celular las horas de uso de los equipos de su área y ve sus alertas.' }
      ]
    },
    demo: {
      titulo: 'Solicita una demostración',
      texto: 'Te mostramos IntelliSave con los equipos de una de tus sedes y te ayudamos a cargar la primera tarifa.',
      escribenos: 'O escríbenos a',
      nombre: 'Nombre',
      empresa: 'Empresa',
      correo: 'Correo corporativo',
      sedes: 'Número de sedes',
      opcionesSedes: ['1 a 3', '4 a 10', 'Más de 10'],
      enviar: 'Enviar solicitud',
      aceptas: 'Al enviar aceptas los',
      terminos: 'Términos y condiciones',
      requerido: 'Este campo es obligatorio.',
      correoInvalido: 'Ingresa un correo válido.',
      correoEjemplo: 'nombre@empresa.pe',
      gracias: 'Gracias. Se abrió tu correo con la solicitud lista para enviar.',
      asunto: 'Solicitud de demostración de IntelliSave'
    },
    pie: {
      descripcion: 'Un producto de Lumen Save para gestionar el consumo eléctrico de empresas con varias sedes.',
      producto: 'Producto',
      nosotros: 'Nosotros',
      contacto: 'Contacto',
      legal: 'Legal',
      privacidad: 'Política de privacidad',
      derechos: '© 2026 Lumen Save. Todos los derechos reservados.'
    }
  },
  en: {
    nav: { etiqueta: 'Sections', como: 'How it works', funciones: 'Features', paraQuien: 'Who it’s for', contacto: 'Contact' },
    idiomaGrupo: 'Language',
    cambiarIdioma: 'Switch language to Spanish',
    iniciarSesion: 'Log in',
    irAlPanel: 'Go to my dashboard',
    abrirMenu: 'Open menu',
    hero: {
      etiqueta: 'For companies with several sites',
      titulo: 'Know how much each device uses and what it costs you',
      descripcion:
        'IntelliSave turns your devices’ hours of use into kWh and soles with each site’s rate, and lets you know when something uses more than usual.',
      solicitarDemo: 'Request a demo',
      verComo: 'See how it works',
      nota: 'On desktop and mobile · In Spanish and English'
    },
    vista: {
      etiqueta: 'Preview of the IntelliSave dashboard',
      sede: 'San Borja site',
      periodo: 'October, to date',
      costo: 'with the site’s rate',
      graficoEtiqueta: 'Daily consumption with a peak on October 14',
      pico: 'Oct 14 · board meeting',
      revisar: 'To review:',
      alerta: 'Air conditioner 01 uses twice as much as its area.'
    },
    como: {
      titulo: 'How it works',
      subtitulo: 'Three steps, no meters to install.',
      pasos: [
        { titulo: 'Set up your organization', texto: 'Companies, sites, areas and each area’s devices, with their power in watts.' },
        { titulo: 'Log the hours of use', texto: 'Each area records how many hours each device ran. IntelliSave works out the kWh and the cost.' },
        { titulo: 'Review and act', texto: 'The dashboard shows where the energy goes, and alerts tell you which device to check first.' }
      ]
    },
    funciones: {
      titulo: 'What’s included',
      items: [
        { icono: 'bolt', titulo: 'Consumption by site, area and device', texto: 'Each record becomes kWh and soles with the site’s current rate.' },
        { icono: 'notifications', titulo: 'Abnormal consumption alerts', texto: 'A daily check compares each device with its area and warns you if something spikes.' },
        { icono: 'trending_up', titulo: 'Next month’s forecast', texto: 'Estimates consumption from each site’s history so you can plan spending.' },
        { icono: 'cloud', titulo: 'Weather at each site', texto: 'The day’s temperature, from a weather service, to understand air conditioning use.' },
        { icono: 'eco', titulo: 'Carbon footprint', texto: 'Turns kWh into kg of CO₂ for your sustainability reports.' },
        { icono: 'description', titulo: 'PDF and CSV reports', texto: 'The period summary by site, ready to share with management.' }
      ]
    },
    roles: {
      titulo: 'Everyone sees what they need',
      subtitulo: 'Three roles, and each one only sees its own company’s data.',
      items: [
        { titulo: 'Administrator', texto: 'Manages the company’s sites, areas and users, and decides who supervises each site.' },
        { titulo: 'Energy supervisor', texto: 'Tracks consumption and cost at their sites, records rates and resolves alerts.' },
        { titulo: 'Area employee', texto: 'Logs the hours of use of their area’s devices from their phone and sees their alerts.' }
      ]
    },
    demo: {
      titulo: 'Request a demo',
      texto: 'We’ll show you IntelliSave with the devices of one of your sites and help you load your first rate.',
      escribenos: 'Or write to us at',
      nombre: 'Name',
      empresa: 'Company',
      correo: 'Work email',
      sedes: 'Number of sites',
      opcionesSedes: ['1 to 3', '4 to 10', 'More than 10'],
      enviar: 'Send request',
      aceptas: 'By sending you accept the',
      terminos: 'Terms and conditions',
      requerido: 'This field is required.',
      correoInvalido: 'Enter a valid email.',
      correoEjemplo: 'name@company.com',
      gracias: 'Thank you. Your email app opened with the request ready to send.',
      asunto: 'IntelliSave demo request'
    },
    pie: {
      descripcion: 'A Lumen Save product to manage the electricity use of companies with several sites.',
      producto: 'Product',
      nosotros: 'About us',
      contacto: 'Contact',
      legal: 'Legal',
      privacidad: 'Privacy policy',
      derechos: '© 2026 Lumen Save. All rights reserved.'
    }
  }
};
