import { Idioma } from '../../models/idioma';

export type ClavePagina = 'nosotros' | 'terminos' | 'privacidad';

export interface SeccionInfo {
  id: string;
  titulo: string;
  parrafos: string[];
  lista?: string[];
}

export interface ValorInfo {
  titulo: string;
  texto: string;
}

export interface MiembroEquipo {
  nombre: string;
  rol: string;
}

export interface PaginaInfo {
  tituloPestana: string;
  etiqueta: string;
  titulo: string;
  intro: string;
  actualizado?: string;
  secciones: SeccionInfo[];
  valores?: { titulo: string; items: ValorInfo[] };
  equipo?: { titulo: string; texto: string; miembros: MiembroEquipo[]; nota: string };
}

export interface TextosComunes {
  navEtiqueta: string;
  idiomaGrupo: string;
  cambiarIdioma: string;
  otroIdioma: string;
  volver: string;
  iniciarSesion: string;
  indice: string;
  nosotros: string;
  terminos: string;
  privacidad: string;
  dudas: string;
  dudasTexto: string;
  escribenos: string;
  derechos: string;
}

export interface TextosInfo {
  comunes: TextosComunes;
  paginas: Record<ClavePagina, PaginaInfo>;
}

export const TEXTOS_INFO: Record<Idioma, TextosInfo> = {
  es: {
    comunes: {
      navEtiqueta: 'Páginas de Lumen Save',
      idiomaGrupo: 'Idioma',
      cambiarIdioma: 'Cambiar idioma a inglés',
      otroIdioma: 'EN',
      volver: 'Volver al inicio',
      iniciarSesion: 'Iniciar sesión',
      indice: 'En esta página',
      nosotros: 'Nosotros',
      terminos: 'Términos y condiciones',
      privacidad: 'Política de privacidad',
      dudas: '¿Tienes alguna duda?',
      dudasTexto: 'Escríbenos y te respondemos en un plazo de dos días hábiles.',
      escribenos: 'Escríbenos',
      derechos: '© 2026 Lumen Save. Todos los derechos reservados.'
    },
    paginas: {
      nosotros: {
        tituloPestana: 'Nosotros · IntelliSave',
        etiqueta: 'Lumen Save',
        titulo: 'Ayudamos a las empresas a entender su consumo de energía',
        intro:
          'Lumen Save es una startup peruana que creó IntelliSave, una plataforma web para que las empresas con varias sedes sepan cuánto consume cada equipo, cuánto les cuesta y dónde pueden ahorrar.',
        secciones: [
          {
            id: 'problema',
            titulo: 'El problema que vimos',
            parrafos: [
              'Muchas empresas reciben un solo recibo de luz por sede y no saben qué áreas ni qué equipos explican ese monto. Sin ese detalle es difícil detectar un equipo que consume de más, planificar el gasto del próximo mes o reportar su huella de carbono.',
              'Instalar medidores en cada equipo es caro, así que buscamos una forma más simple de obtener esa información.'
            ]
          },
          {
            id: 'que-hacemos',
            titulo: 'Qué hacemos',
            parrafos: [
              'Con IntelliSave, cada área registra las horas de uso de sus equipos. La plataforma convierte esas horas en kWh y soles con la potencia del equipo y la tarifa vigente de la sede, y con eso arma el dashboard, las alertas y los reportes.'
            ],
            lista: [
              'Consumo y costo por empresa, sede, área y equipo.',
              'Alertas automáticas cuando un equipo consume más de lo normal.',
              'Predicción del consumo a partir del historial.',
              'Clima de cada sede y huella de carbono en kg de CO₂.',
              'Reportes en PDF y CSV para compartir con gerencia.'
            ]
          },
          {
            id: 'mision',
            titulo: 'Misión y visión',
            parrafos: [
              'Nuestra misión es que cualquier empresa pueda medir y reducir su consumo eléctrico sin invertir en equipos especiales.',
              'Nuestra visión es ser la herramienta de referencia en el Perú para la gestión energética de empresas con varias sedes.'
            ]
          }
        ],
        valores: {
          titulo: 'Lo que nos guía',
          items: [
            { titulo: 'Datos claros', texto: 'Mostramos cifras que se entienden a la primera, con la tarifa real de cada sede.' },
            { titulo: 'Privacidad', texto: 'Cada empresa solo ve su información, y cada persona solo lo que su rol necesita.' },
            { titulo: 'Ahorro real', texto: 'Las alertas y predicciones existen para tomar decisiones, no solo para mirar gráficos.' },
            { titulo: 'Sostenibilidad', texto: 'Medir el consumo es el primer paso para reducir la huella de carbono.' }
          ]
        },
        equipo: {
          titulo: 'Nuestro equipo',
          texto: 'IntelliSave fue diseñado y desarrollado por un equipo de cuatro personas:',
          miembros: [
            { nombre: 'Claudia Estabridis', rol: 'Líder del proyecto y Desarrollo' },
            { nombre: 'Sebastián Ramírez', rol: 'Desarrollo' },
            { nombre: 'Franciss Ariza', rol: 'Desarrollo' },
            { nombre: 'Sebastian Finetti', rol: 'Desarrollo' }
          ],
          nota: 'IntelliSave es un proyecto académico del curso Arquitectura de Aplicaciones Web de la Universidad Peruana de Ciencias Aplicadas (UPC), ciclo 2026-2. Lumen Save es una empresa ficticia creada para este proyecto.'
        }
      },
      terminos: {
        tituloPestana: 'Términos y condiciones · IntelliSave',
        etiqueta: 'Legal',
        titulo: 'Términos y condiciones',
        intro:
          'Estos términos regulan el uso de IntelliSave, la plataforma de gestión energética de Lumen Save. Al crear una cuenta, iniciar sesión o enviar una solicitud de demostración, aceptas estas condiciones.',
        actualizado: 'Última actualización: 25 de noviembre de 2026',
        secciones: [
          {
            id: 'servicio',
            titulo: '1. Qué es IntelliSave',
            parrafos: [
              'IntelliSave es un servicio web que permite a las empresas registrar sus sedes, áreas, equipos, tarifas y horas de uso, y obtener a partir de esos datos el consumo en kWh, su costo, alertas, predicciones, la huella de carbono y reportes.',
              'El servicio lo presta Lumen Save, con domicilio en Lima, Perú.'
            ]
          },
          {
            id: 'cuentas',
            titulo: '2. Cuentas y roles',
            parrafos: [
              'Las cuentas las crea el administrador de la plataforma o el administrador de cada empresa. Cada usuario tiene un rol (administrador, supervisor energético o empleado) que define qué puede ver y hacer.'
            ],
            lista: [
              'Eres responsable de mantener en secreto tu contraseña y de lo que se haga con tu cuenta.',
              'Debes avisar de inmediato a tu administrador o a Lumen Save si crees que alguien usó tu cuenta sin permiso.',
              'Los datos que registres deben ser verdaderos y estar actualizados.'
            ]
          },
          {
            id: 'uso',
            titulo: '3. Uso permitido',
            parrafos: ['Te comprometes a usar IntelliSave solo para gestionar el consumo energético de tu empresa. No está permitido:'],
            lista: [
              'Intentar acceder a datos de otras empresas o a funciones que tu rol no permite.',
              'Compartir tu cuenta con otras personas.',
              'Copiar, modificar o intentar obtener el código fuente de la plataforma.',
              'Usar programas automáticos que sobrecarguen el servicio o afecten a otros usuarios.',
              'Registrar información falsa, ofensiva o que infrinja derechos de terceros.'
            ]
          },
          {
            id: 'datos',
            titulo: '4. Información de tu empresa',
            parrafos: [
              'La información que tu empresa registra (sedes, equipos, consumos, tarifas y usuarios) le pertenece a tu empresa. Lumen Save solo la usa para prestar el servicio y no la vende ni la comparte con fines comerciales.',
              'El tratamiento de los datos personales se explica en nuestra Política de privacidad.'
            ]
          },
          {
            id: 'calculos',
            titulo: '5. Cálculos, alertas y predicciones',
            parrafos: [
              'Los kWh y costos se calculan con la potencia de cada equipo, las horas registradas y la tarifa que ingresa tu empresa. Por eso son estimaciones y pueden diferir del recibo de tu proveedor eléctrico, que sigue siendo el documento oficial.',
              'Las predicciones y alertas son herramientas de apoyo: su precisión depende de la calidad y cantidad del historial registrado, y las decisiones que tomes con ellas son responsabilidad de tu empresa.'
            ]
          },
          {
            id: 'terceros',
            titulo: '6. Servicios de terceros',
            parrafos: [
              'IntelliSave usa servicios externos, como Open-Meteo para el clima de cada sede. Lumen Save no controla esos servicios y no responde por interrupciones o errores en la información que entregan.'
            ]
          },
          {
            id: 'disponibilidad',
            titulo: '7. Disponibilidad y cambios del servicio',
            parrafos: [
              'Trabajamos para que IntelliSave esté disponible de forma continua, pero puede haber interrupciones por mantenimiento, actualizaciones o causas ajenas a nosotros. Podemos agregar, cambiar o retirar funciones para mejorar el servicio.'
            ]
          },
          {
            id: 'responsabilidad',
            titulo: '8. Limitación de responsabilidad',
            parrafos: [
              'En la medida que lo permita la ley, Lumen Save no es responsable por pérdidas indirectas, lucro cesante o daños causados por el uso incorrecto de la plataforma, por datos mal registrados o por el acceso no autorizado a una cuenta cuya contraseña no se protegió.'
            ]
          },
          {
            id: 'suspension',
            titulo: '9. Suspensión de cuentas',
            parrafos: [
              'Podemos suspender o desactivar una cuenta que incumpla estos términos. El administrador de tu empresa también puede desactivar a sus usuarios; en ese caso, su historial se conserva.'
            ]
          },
          {
            id: 'cambios',
            titulo: '10. Cambios en estos términos',
            parrafos: [
              'Podemos actualizar estos términos. Publicaremos la nueva versión en esta página con su fecha, y si el cambio es importante lo avisaremos dentro de la plataforma. Si sigues usando IntelliSave después del cambio, aceptas la nueva versión.'
            ]
          },
          {
            id: 'ley',
            titulo: '11. Ley aplicable',
            parrafos: [
              'Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia se resolverá ante los jueces y tribunales de Lima.'
            ]
          },
          {
            id: 'contacto',
            titulo: '12. Contacto',
            parrafos: ['Si tienes dudas sobre estos términos, escríbenos a contacto@lumensave.pe.']
          }
        ]
      },
      privacidad: {
        tituloPestana: 'Política de privacidad · IntelliSave',
        etiqueta: 'Legal',
        titulo: 'Política de privacidad',
        intro:
          'En esta política explicamos qué datos personales trata IntelliSave, para qué los usamos y cómo puedes ejercer tus derechos, de acuerdo con la Ley N.° 29733, Ley de Protección de Datos Personales, y su reglamento aprobado por el Decreto Supremo N.° 016-2024-JUS.',
        actualizado: 'Última actualización: 25 de noviembre de 2026',
        secciones: [
          {
            id: 'responsable',
            titulo: '1. Responsable del tratamiento',
            parrafos: [
              'El responsable de los datos personales es Lumen Save, con domicilio en Lima, Perú. Puedes contactarnos en contacto@lumensave.pe.',
              'Cuando una empresa cliente registra a sus trabajadores en IntelliSave, esa empresa decide qué datos registra y Lumen Save los trata por su encargo para prestar el servicio.'
            ]
          },
          {
            id: 'datos',
            titulo: '2. Qué datos tratamos',
            parrafos: ['Según cómo uses IntelliSave, tratamos estos datos:'],
            lista: [
              'Usuarios: nombres y apellidos, DNI, correo, teléfono, puesto, área, rol y contraseña (guardada cifrada, nunca en texto plano).',
              'Empresas: RUC, razón social, nombre comercial, dirección, teléfono, correo y nombre del representante.',
              'Sedes: dirección y coordenadas (latitud y longitud).',
              'Datos de operación: equipos, horas de uso, consumos, tarifas, alertas y predicciones, junto con el usuario que los registró.',
              'Solicitud de demostración: nombre, empresa, correo y número de sedes.'
            ]
          },
          {
            id: 'finalidad',
            titulo: '3. Para qué los usamos',
            parrafos: [],
            lista: [
              'Crear y administrar las cuentas, y verificar la identidad al iniciar sesión.',
              'Calcular el consumo, el costo y la huella de carbono, y generar alertas, predicciones y reportes.',
              'Mostrar a cada usuario solo la información de su empresa y de su rol.',
              'Responder solicitudes de demostración y consultas.',
              'Mantener la seguridad de la plataforma y mejorar el servicio.'
            ]
          },
          {
            id: 'base',
            titulo: '4. Base para tratar los datos',
            parrafos: [
              'Tratamos los datos para ejecutar el servicio contratado por la empresa cliente y, en el caso del formulario de demostración, con el consentimiento que das al enviarlo. No usamos los datos para fines distintos a los indicados en esta política.'
            ]
          },
          {
            id: 'compartir',
            titulo: '5. Con quién los compartimos',
            parrafos: ['No vendemos ni alquilamos datos personales. Solo los compartimos en estos casos:'],
            lista: [
              'Proveedores de alojamiento y base de datos que hacen funcionar la plataforma, bajo obligaciones de confidencialidad. Sus servidores pueden estar fuera del Perú; en ese caso, la transferencia se hace con las garantías que exige la ley.',
              'Servicios de clima, como Open-Meteo, que solo reciben las coordenadas de la sede y ningún dato personal.',
              'Autoridades, cuando una ley o una orden judicial lo exija.'
            ]
          },
          {
            id: 'conservacion',
            titulo: '6. Cuánto tiempo los conservamos',
            parrafos: [
              'Conservamos los datos mientras la empresa cliente mantenga su cuenta activa. Cuando un usuario se desactiva, sus datos se conservan para mantener el historial de su empresa. Si la empresa cancela el servicio, eliminamos o anonimizamos sus datos, salvo los que debamos conservar por obligación legal.'
            ]
          },
          {
            id: 'seguridad',
            titulo: '7. Cómo los protegemos',
            parrafos: [],
            lista: [
              'Las contraseñas se guardan cifradas con BCrypt.',
              'Cada sesión usa un token que vence, y la comunicación con el servidor viaja cifrada.',
              'El acceso está limitado por empresa y por rol: nadie ve datos de otra empresa.',
              'Si ocurre un incidente de seguridad, lo comunicaremos a la Autoridad Nacional de Protección de Datos Personales y a los afectados en los plazos que establece la ley.'
            ]
          },
          {
            id: 'derechos',
            titulo: '8. Tus derechos',
            parrafos: [
              'Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, cancelación y oposición (derechos ARCO) escribiendo a contacto@lumensave.pe con tu nombre, una copia de tu DNI y lo que solicitas. Si tu cuenta la creó tu empresa, también puedes pedírselo a su administrador.',
              'Responderemos en los plazos que establece la ley. Si consideras que no atendimos bien tu solicitud, puedes presentar un reclamo ante la Autoridad Nacional de Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos.'
            ]
          },
          {
            id: 'almacenamiento',
            titulo: '9. Almacenamiento en tu navegador',
            parrafos: [
              'IntelliSave guarda en tu navegador el token de tu sesión y el idioma que elegiste. Si marcas "Mantener sesión iniciada", el token se conserva al cerrar el navegador; si no, se borra. No usamos cookies de publicidad ni de seguimiento.'
            ]
          },
          {
            id: 'menores',
            titulo: '10. Menores de edad',
            parrafos: ['IntelliSave está dirigido a empresas y a sus trabajadores. No está pensado para menores de edad y no registramos sus datos a sabiendas.']
          },
          {
            id: 'cambios',
            titulo: '11. Cambios en esta política',
            parrafos: [
              'Podemos actualizar esta política. Publicaremos la nueva versión en esta página con su fecha, y si el cambio es importante lo avisaremos dentro de la plataforma.'
            ]
          }
        ]
      }
    }
  },
  en: {
    comunes: {
      navEtiqueta: 'Lumen Save pages',
      idiomaGrupo: 'Language',
      cambiarIdioma: 'Switch language to Spanish',
      otroIdioma: 'ES',
      volver: 'Back to home',
      iniciarSesion: 'Log in',
      indice: 'On this page',
      nosotros: 'About us',
      terminos: 'Terms and conditions',
      privacidad: 'Privacy policy',
      dudas: 'Any questions?',
      dudasTexto: 'Write to us and we’ll reply within two business days.',
      escribenos: 'Write to us',
      derechos: '© 2026 Lumen Save. All rights reserved.'
    },
    paginas: {
      nosotros: {
        tituloPestana: 'About us · IntelliSave',
        etiqueta: 'Lumen Save',
        titulo: 'We help companies understand their energy use',
        intro:
          'Lumen Save is a Peruvian startup that built IntelliSave, a web platform that lets companies with several sites know how much each device uses, what it costs and where they can save.',
        secciones: [
          {
            id: 'problema',
            titulo: 'The problem we saw',
            parrafos: [
              'Many companies get a single electricity bill per site and don’t know which areas or devices explain that amount. Without that detail it’s hard to spot a device that uses too much, plan next month’s spending or report their carbon footprint.',
              'Installing a meter on every device is expensive, so we looked for a simpler way to get that information.'
            ]
          },
          {
            id: 'que-hacemos',
            titulo: 'What we do',
            parrafos: [
              'With IntelliSave, each area logs its devices’ hours of use. The platform turns those hours into kWh and soles using each device’s power and the site’s current rate, and builds the dashboard, alerts and reports from there.'
            ],
            lista: [
              'Consumption and cost by company, site, area and device.',
              'Automatic alerts when a device uses more than usual.',
              'Consumption forecasts based on history.',
              'Weather at each site and the carbon footprint in kg of CO₂.',
              'PDF and CSV reports to share with management.'
            ]
          },
          {
            id: 'mision',
            titulo: 'Mission and vision',
            parrafos: [
              'Our mission is to let any company measure and reduce its electricity use without investing in special equipment.',
              'Our vision is to be the go-to tool in Peru for energy management in companies with several sites.'
            ]
          }
        ],
        valores: {
          titulo: 'What guides us',
          items: [
            { titulo: 'Clear data', texto: 'We show figures that make sense at first glance, with each site’s real rate.' },
            { titulo: 'Privacy', texto: 'Each company only sees its own data, and each person only what their role needs.' },
            { titulo: 'Real savings', texto: 'Alerts and forecasts are there to support decisions, not just to look at charts.' },
            { titulo: 'Sustainability', texto: 'Measuring consumption is the first step to reducing the carbon footprint.' }
          ]
        },
        equipo: {
          titulo: 'Our team',
          texto: 'IntelliSave was designed and built by a team of four:',
          miembros: [
            { nombre: 'Claudia Estabridis', rol: 'Project lead and Development' },
            { nombre: 'Sebastián Ramírez', rol: 'Development' },
            { nombre: 'Franciss Ariza', rol: 'Development' },
            { nombre: 'Sebastian Finetti', rol: 'Development' }
          ],
          nota: 'IntelliSave is an academic project for the Web Application Architecture course at Universidad Peruana de Ciencias Aplicadas (UPC), term 2026-2. Lumen Save is a fictional company created for this project.'
        }
      },
      terminos: {
        tituloPestana: 'Terms and conditions · IntelliSave',
        etiqueta: 'Legal',
        titulo: 'Terms and conditions',
        intro:
          'These terms govern the use of IntelliSave, Lumen Save’s energy management platform. By creating an account, logging in or sending a demo request, you accept these conditions.',
        actualizado: 'Last updated: November 25, 2026',
        secciones: [
          {
            id: 'servicio',
            titulo: '1. What IntelliSave is',
            parrafos: [
              'IntelliSave is a web service that lets companies record their sites, areas, devices, rates and hours of use, and get from that data their consumption in kWh, its cost, alerts, forecasts, the carbon footprint and reports.',
              'The service is provided by Lumen Save, based in Lima, Peru.'
            ]
          },
          {
            id: 'cuentas',
            titulo: '2. Accounts and roles',
            parrafos: [
              'Accounts are created by the platform administrator or by each company’s administrator. Each user has a role (administrator, energy supervisor or employee) that defines what they can see and do.'
            ],
            lista: [
              'You are responsible for keeping your password secret and for everything done with your account.',
              'You must tell your administrator or Lumen Save right away if you think someone used your account without permission.',
              'The data you record must be true and up to date.'
            ]
          },
          {
            id: 'uso',
            titulo: '3. Permitted use',
            parrafos: ['You agree to use IntelliSave only to manage your company’s energy consumption. You may not:'],
            lista: [
              'Try to access other companies’ data or features your role doesn’t allow.',
              'Share your account with other people.',
              'Copy, modify or try to obtain the platform’s source code.',
              'Use automated programs that overload the service or affect other users.',
              'Record false or offensive information, or information that infringes third-party rights.'
            ]
          },
          {
            id: 'datos',
            titulo: '4. Your company’s information',
            parrafos: [
              'The information your company records (sites, devices, consumption, rates and users) belongs to your company. Lumen Save only uses it to provide the service and does not sell it or share it for commercial purposes.',
              'How personal data is handled is explained in our Privacy policy.'
            ]
          },
          {
            id: 'calculos',
            titulo: '5. Calculations, alerts and forecasts',
            parrafos: [
              'kWh and costs are calculated from each device’s power, the recorded hours and the rate your company enters. They are therefore estimates and may differ from your electricity provider’s bill, which remains the official document.',
              'Forecasts and alerts are support tools: their accuracy depends on the quality and amount of recorded history, and the decisions you make with them are your company’s responsibility.'
            ]
          },
          {
            id: 'terceros',
            titulo: '6. Third-party services',
            parrafos: [
              'IntelliSave uses external services, such as Open-Meteo for the weather at each site. Lumen Save does not control those services and is not responsible for interruptions or errors in the information they provide.'
            ]
          },
          {
            id: 'disponibilidad',
            titulo: '7. Availability and changes to the service',
            parrafos: [
              'We work to keep IntelliSave available at all times, but there may be interruptions for maintenance, updates or causes beyond our control. We may add, change or remove features to improve the service.'
            ]
          },
          {
            id: 'responsabilidad',
            titulo: '8. Limitation of liability',
            parrafos: [
              'To the extent permitted by law, Lumen Save is not liable for indirect losses, lost profits or damage caused by misuse of the platform, incorrectly recorded data or unauthorized access to an account whose password was not protected.'
            ]
          },
          {
            id: 'suspension',
            titulo: '9. Account suspension',
            parrafos: [
              'We may suspend or deactivate an account that breaches these terms. Your company’s administrator can also deactivate its users; in that case, their history is kept.'
            ]
          },
          {
            id: 'cambios',
            titulo: '10. Changes to these terms',
            parrafos: [
              'We may update these terms. We will publish the new version on this page with its date, and if the change is significant we will announce it inside the platform. If you keep using IntelliSave after the change, you accept the new version.'
            ]
          },
          {
            id: 'ley',
            titulo: '11. Governing law',
            parrafos: ['These terms are governed by the laws of the Republic of Peru. Any dispute will be resolved before the judges and courts of Lima.']
          },
          {
            id: 'contacto',
            titulo: '12. Contact',
            parrafos: ['If you have questions about these terms, write to us at contacto@lumensave.pe.']
          }
        ]
      },
      privacidad: {
        tituloPestana: 'Privacy policy · IntelliSave',
        etiqueta: 'Legal',
        titulo: 'Privacy policy',
        intro:
          'This policy explains what personal data IntelliSave processes, what we use it for and how you can exercise your rights, in accordance with Peru’s Law No. 29733 on Personal Data Protection and its regulation approved by Supreme Decree No. 016-2024-JUS.',
        actualizado: 'Last updated: November 25, 2026',
        secciones: [
          {
            id: 'responsable',
            titulo: '1. Data controller',
            parrafos: [
              'The controller of the personal data is Lumen Save, based in Lima, Peru. You can contact us at contacto@lumensave.pe.',
              'When a client company registers its workers in IntelliSave, that company decides what data it records, and Lumen Save processes it on the company’s behalf to provide the service.'
            ]
          },
          {
            id: 'datos',
            titulo: '2. What data we process',
            parrafos: ['Depending on how you use IntelliSave, we process this data:'],
            lista: [
              'Users: first and last names, national ID (DNI), email, phone, position, area, role and password (stored encrypted, never in plain text).',
              'Companies: tax ID (RUC), legal name, trade name, address, phone, email and the representative’s name.',
              'Sites: address and coordinates (latitude and longitude).',
              'Operating data: devices, hours of use, consumption, rates, alerts and forecasts, together with the user who recorded them.',
              'Demo requests: name, company, email and number of sites.'
            ]
          },
          {
            id: 'finalidad',
            titulo: '3. What we use it for',
            parrafos: [],
            lista: [
              'Creating and managing accounts, and verifying identity at login.',
              'Calculating consumption, cost and carbon footprint, and generating alerts, forecasts and reports.',
              'Showing each user only the information of their company and role.',
              'Answering demo requests and questions.',
              'Keeping the platform secure and improving the service.'
            ]
          },
          {
            id: 'base',
            titulo: '4. Basis for processing',
            parrafos: [
              'We process data to provide the service contracted by the client company and, for the demo form, with the consent you give when you send it. We do not use the data for purposes other than those stated in this policy.'
            ]
          },
          {
            id: 'compartir',
            titulo: '5. Who we share it with',
            parrafos: ['We do not sell or rent personal data. We only share it in these cases:'],
            lista: [
              'Hosting and database providers that run the platform, under confidentiality obligations. Their servers may be outside Peru; in that case, the transfer is made with the safeguards required by law.',
              'Weather services, such as Open-Meteo, which only receive the site’s coordinates and no personal data.',
              'Authorities, when required by law or a court order.'
            ]
          },
          {
            id: 'conservacion',
            titulo: '6. How long we keep it',
            parrafos: [
              'We keep the data while the client company keeps its account active. When a user is deactivated, their data is kept to preserve the company’s history. If the company cancels the service, we delete or anonymize its data, except what we must keep by law.'
            ]
          },
          {
            id: 'seguridad',
            titulo: '7. How we protect it',
            parrafos: [],
            lista: [
              'Passwords are stored encrypted with BCrypt.',
              'Each session uses a token that expires, and communication with the server is encrypted.',
              'Access is limited by company and role: nobody sees another company’s data.',
              'If a security incident occurs, we will report it to the National Personal Data Protection Authority and to those affected within the time limits set by law.'
            ]
          },
          {
            id: 'derechos',
            titulo: '8. Your rights',
            parrafos: [
              'You can exercise your rights of access, rectification, cancellation and objection (ARCO rights) at any time by writing to contacto@lumensave.pe with your name, a copy of your ID and your request. If your account was created by your company, you can also ask its administrator.',
              'We will respond within the time limits set by law. If you believe we did not handle your request properly, you can file a complaint with the National Personal Data Protection Authority of Peru’s Ministry of Justice and Human Rights.'
            ]
          },
          {
            id: 'almacenamiento',
            titulo: '9. Storage in your browser',
            parrafos: [
              'IntelliSave stores your session token and your chosen language in your browser. If you check "Keep me signed in", the token stays after you close the browser; otherwise it is deleted. We do not use advertising or tracking cookies.'
            ]
          },
          {
            id: 'menores',
            titulo: '10. Minors',
            parrafos: ['IntelliSave is aimed at companies and their workers. It is not intended for minors and we do not knowingly record their data.']
          },
          {
            id: 'cambios',
            titulo: '11. Changes to this policy',
            parrafos: [
              'We may update this policy. We will publish the new version on this page with its date, and if the change is significant we will announce it inside the platform.'
            ]
          }
        ]
      }
    }
  }
};
