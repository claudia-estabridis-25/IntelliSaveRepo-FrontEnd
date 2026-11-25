import { Idioma } from '../../models/idioma';

export interface PasoLanding {
  titulo: string;
  texto: string;
  alt: string;
}

export interface AreaEjemplo {
  nombre: string;
  kwh: string;
  ancho: number;
  destacada: boolean;
}

export interface RolLanding {
  titulo: string;
  texto: string;
  alt: string;
  etiquetaLista: string;
  chips: string[];
}

export interface TextosLanding {
  nav: { etiqueta: string; como: string; funciones: string; paraQuien: string; contacto: string };
  idiomaGrupo: string;
  cambiarIdioma: string;
  otroIdioma: string;
  iniciarSesion: string;
  irAlPanel: string;
  abrirMenu: string;
  cerrarMenu: string;
  hero: {
    etiqueta: string;
    titulo: string;
    descripcion: string;
    solicitarDemo: string;
    verComo: string;
  };
  como: { titulo: string; subtitulo: string; pasos: PasoLanding[] };
  funciones: {
    titulo: string;
    intro: string;
    principal: {
      titulo: string;
      texto: string;
      figura: string;
      areas: AreaEjemplo[];
      pie: string;
      total: string;
      totalDetalle: string;
    };
    alertas: { titulo: string; texto: string; detalle: string };
    prediccion: { titulo: string; texto: string; grafico: string; detalle: string };
    clima: { titulo: string; texto: string; dato: string; lugar: string; detalle: string };
    huella: { titulo: string; texto: string; detalle: string; dato: string; periodo: string };
    reportes: { titulo: string; texto: string; archivos: string[] };
  };
  roles: { titulo: string; subtitulo: string; items: RolLanding[] };
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
    descripcionCorta: string;
    enlaces: string;
    producto: string;
    nosotros: string;
    contacto: string;
    legal: string;
    privacidad: string;
    derechos: string;
    derechosCorto: string;
  };
}

export const TEXTOS: Record<Idioma, TextosLanding> = {
  es: {
    nav: { etiqueta: 'Secciones', como: 'Cómo funciona', funciones: 'Funciones', paraQuien: 'Para quién', contacto: 'Contacto' },
    idiomaGrupo: 'Idioma',
    cambiarIdioma: 'Cambiar idioma a inglés',
    otroIdioma: 'EN',
    iniciarSesion: 'Iniciar sesión',
    irAlPanel: 'Ir a mi panel',
    abrirMenu: 'Abrir menú',
    cerrarMenu: 'Cerrar menú',
    hero: {
      etiqueta: 'Para empresas con varias sedes',
      titulo: 'Conoce cuánto consume cada equipo de tu empresa y cuánto te cuesta',
      descripcion:
        'IntelliSave convierte las horas de uso de tus equipos en kWh y soles con la tarifa de cada sede, y te avisa cuando algo consume más de lo normal.',
      solicitarDemo: 'Solicitar demostración',
      verComo: 'Ver cómo funciona'
    },
    como: {
      titulo: 'Cómo funciona',
      subtitulo: 'Tres pasos, sin instalar medidores.',
      pasos: [
        {
          titulo: 'Registra tu organización',
          texto: 'Empresas, sedes, áreas y los equipos de cada área, con su potencia en watts.',
          alt: 'Una empresa con dos sedes y los equipos de cada área con su potencia en watts'
        },
        {
          titulo: 'Anota las horas de uso',
          texto: 'Cada área registra cuántas horas funcionó cada equipo. IntelliSave calcula los kWh y el costo.',
          alt: 'Un celular con el formulario de horas de uso y el resultado en kWh y soles'
        },
        {
          titulo: 'Revisa y actúa',
          texto: 'El dashboard muestra dónde se va la energía y las alertas te dicen qué equipo revisar primero.',
          alt: 'El dashboard con el consumo del mes y una alerta del aire acondicionado'
        }
      ]
    },
    funciones: {
      titulo: 'Lo que incluye',
      intro: 'Todo lo que necesitas para saber dónde se va la energía de tu empresa, en un solo lugar.',
      principal: {
        titulo: 'Consumo por sede, área y equipo',
        texto: 'Cada registro se convierte en kWh y soles con la tarifa vigente de la sede.',
        figura: 'Ejemplo: consumo por área de una sede',
        areas: [
          { nombre: 'Tecnología', kwh: '248.4', ancho: 90, destacada: true },
          { nombre: 'Almacén', kwh: '88.0', ancho: 32, destacada: false },
          { nombre: 'Ventas', kwh: '49.6', ancho: 18, destacada: false }
        ],
        pie: 'kWh del mes, sede San Borja',
        total: '248.4',
        totalDetalle: 'kWh · S/ 199.01'
      },
      alertas: {
        titulo: 'Alertas de consumo anormal',
        texto: 'Una revisión diaria compara cada equipo con su área y avisa si algo se dispara.',
        detalle: 'Cada noche · 23:00'
      },
      prediccion: {
        titulo: 'Predicción del próximo mes',
        texto: 'Estima el consumo a partir del historial de cada sede para planificar el gasto.',
        grafico: 'Línea del historial y la estimación del próximo mes',
        detalle: 'Hasta 90 días'
      },
      clima: {
        titulo: 'Clima de cada sede',
        texto: 'La temperatura del día, de un servicio meteorológico, para entender el uso del aire acondicionado.',
        dato: '24.8 °C',
        lugar: 'San Borja · 15:00',
        detalle: 'Cada hora'
      },
      huella: {
        titulo: 'Huella de carbono',
        texto: 'Convierte los kWh en kg de CO₂ para tus reportes de sostenibilidad.',
        detalle: 'kWh → kg CO₂',
        dato: '143.7',
        periodo: 'kg CO₂ en octubre'
      },
      reportes: {
        titulo: 'Reportes en PDF y CSV',
        texto: 'El resumen del periodo por sede, listo para compartir con gerencia.',
        archivos: ['reporte.csv', 'reporte.pdf']
      }
    },
    roles: {
      titulo: 'Cada persona ve lo que necesita',
      subtitulo: 'Tres roles, y cada uno solo accede a los datos de su empresa.',
      items: [
        {
          titulo: 'Administrador',
          texto: 'Gestiona las sedes, áreas y usuarios de su empresa, y decide quién supervisa cada sede.',
          alt: 'Ilustración de una administradora con el ícono de un edificio',
          etiquetaLista: 'Gestiona',
          chips: ['Sedes', 'Áreas', 'Usuarios']
        },
        {
          titulo: 'Supervisor energético',
          texto: 'Sigue el consumo y el costo de sus sedes, registra las tarifas y resuelve las alertas.',
          alt: 'Ilustración de un supervisor con una tableta que muestra un gráfico de consumo',
          etiquetaLista: 'Gestiona',
          chips: ['Dashboard', 'Tarifas', 'Alertas']
        },
        {
          titulo: 'Empleado de área',
          texto: 'Registra desde el celular las horas de uso de los equipos de su área y ve sus alertas.',
          alt: 'Ilustración de una empleada con su celular y el ícono de un reloj',
          etiquetaLista: 'Usa',
          chips: ['Horas de uso', 'Sus alertas']
        }
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
      descripcionCorta: 'Un producto de Lumen Save.',
      enlaces: 'Enlaces del pie de página',
      producto: 'Producto',
      nosotros: 'Nosotros',
      contacto: 'Contacto',
      legal: 'Legal',
      privacidad: 'Política de privacidad',
      derechos: '© 2026 Lumen Save. Todos los derechos reservados.',
      derechosCorto: '© 2026 Lumen Save'
    }
  },
  en: {
    nav: { etiqueta: 'Sections', como: 'How it works', funciones: 'Features', paraQuien: 'Who it’s for', contacto: 'Contact' },
    idiomaGrupo: 'Language',
    cambiarIdioma: 'Switch language to Spanish',
    otroIdioma: 'ES',
    iniciarSesion: 'Log in',
    irAlPanel: 'Go to my dashboard',
    abrirMenu: 'Open menu',
    cerrarMenu: 'Close menu',
    hero: {
      etiqueta: 'For companies with several sites',
      titulo: 'Know how much each device in your company uses and what it costs you',
      descripcion:
        'IntelliSave turns your devices’ hours of use into kWh and soles with each site’s rate, and lets you know when something uses more than usual.',
      solicitarDemo: 'Request a demo',
      verComo: 'See how it works'
    },
    como: {
      titulo: 'How it works',
      subtitulo: 'Three steps, no meters to install.',
      pasos: [
        {
          titulo: 'Set up your organization',
          texto: 'Companies, sites, areas and each area’s devices, with their power in watts.',
          alt: 'A company with two sites and each area’s devices with their power in watts'
        },
        {
          titulo: 'Log the hours of use',
          texto: 'Each area records how many hours each device ran. IntelliSave works out the kWh and the cost.',
          alt: 'A phone with the hours-of-use form and the result in kWh and soles'
        },
        {
          titulo: 'Review and act',
          texto: 'The dashboard shows where the energy goes, and alerts tell you which device to check first.',
          alt: 'The dashboard with the month’s consumption and an air conditioner alert'
        }
      ]
    },
    funciones: {
      titulo: 'What’s included',
      intro: 'Everything you need to know where your company’s energy goes, in one place.',
      principal: {
        titulo: 'Consumption by site, area and device',
        texto: 'Each record becomes kWh and soles with the site’s current rate.',
        figura: 'Example: consumption by area at one site',
        areas: [
          { nombre: 'Technology', kwh: '248.4', ancho: 90, destacada: true },
          { nombre: 'Warehouse', kwh: '88.0', ancho: 32, destacada: false },
          { nombre: 'Sales', kwh: '49.6', ancho: 18, destacada: false }
        ],
        pie: 'kWh this month, San Borja site',
        total: '248.4',
        totalDetalle: 'kWh · S/ 199.01'
      },
      alertas: {
        titulo: 'Abnormal consumption alerts',
        texto: 'A daily check compares each device with its area and warns you if something spikes.',
        detalle: 'Every night · 23:00'
      },
      prediccion: {
        titulo: 'Next month’s forecast',
        texto: 'Estimates consumption from each site’s history so you can plan spending.',
        grafico: 'History line and next month’s estimate',
        detalle: 'Up to 90 days'
      },
      clima: {
        titulo: 'Weather at each site',
        texto: 'The day’s temperature, from a weather service, to understand air conditioning use.',
        dato: '24.8 °C',
        lugar: 'San Borja · 15:00',
        detalle: 'Every hour'
      },
      huella: {
        titulo: 'Carbon footprint',
        texto: 'Turns kWh into kg of CO₂ for your sustainability reports.',
        detalle: 'kWh → kg CO₂',
        dato: '143.7',
        periodo: 'kg CO₂ in October'
      },
      reportes: {
        titulo: 'PDF and CSV reports',
        texto: 'The period summary by site, ready to share with management.',
        archivos: ['report.csv', 'report.pdf']
      }
    },
    roles: {
      titulo: 'Everyone sees what they need',
      subtitulo: 'Three roles, and each one only sees its own company’s data.',
      items: [
        {
          titulo: 'Administrator',
          texto: 'Manages the company’s sites, areas and users, and decides who supervises each site.',
          alt: 'Illustration of an administrator with a building icon',
          etiquetaLista: 'Manages',
          chips: ['Sites', 'Areas', 'Users']
        },
        {
          titulo: 'Energy supervisor',
          texto: 'Tracks consumption and cost at their sites, records rates and resolves alerts.',
          alt: 'Illustration of a supervisor with a tablet showing a consumption chart',
          etiquetaLista: 'Manages',
          chips: ['Dashboard', 'Rates', 'Alerts']
        },
        {
          titulo: 'Area employee',
          texto: 'Logs the hours of use of their area’s devices from their phone and sees their alerts.',
          alt: 'Illustration of an employee with her phone and a clock icon',
          etiquetaLista: 'Uses',
          chips: ['Hours of use', 'Their alerts']
        }
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
      descripcionCorta: 'A Lumen Save product.',
      enlaces: 'Footer links',
      producto: 'Product',
      nosotros: 'About us',
      contacto: 'Contact',
      legal: 'Legal',
      privacidad: 'Privacy policy',
      derechos: '© 2026 Lumen Save. All rights reserved.',
      derechosCorto: '© 2026 Lumen Save'
    }
  }
};
