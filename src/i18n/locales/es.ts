import { I18nMessages } from "../types";

export const es: I18nMessages = {
  common: {
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    close: "Cerrar",
    apply: "Aplicar",
    setKeys: "Configurar Claves",
  },
  chat: {
    newChat: "Nuevo Chat",
    loadHistory: "Cargar Historial de Chat",
    clearHistory: "Limpiar Historial",
    placeholder: "Escribe tu mensaje aquí...",
    sending: "Enviando...",
    errorSending: "Error al enviar mensaje",
    mode: {
      chat: "Chat",
      vaultQA: "Q&A de Bóveda (Básico)",
      copilotPlus: "Copilot Plus (beta)",
      projects: "Proyectos (alpha)",
    },
  },
  search: {
    searching: "Buscando...",
    noResults: "No se encontraron resultados",
    indexing: "Indexando archivos...",
    indexComplete: "Indexación completa",
    invalidVectorLength:
      "Longitud de vector inválida detectada. Por favor verifica si tu modelo de embedding está funcionando.",
  },
  errors: {
    dbNotInitialized: "Base de datos no inicializada",
    embeddingModelError: "Error del modelo de embedding",
    fileNotFound: "Archivo no encontrado",
    networkError: "Error de red",
  },
  settings: {
    title: "Configuración de Copilot",
    apiKey: "Clave API",
    apiKeys: "Claves API",
    model: "Modelo",
    temperature: "Temperatura",
    temperatureDesc: "Controla la aleatoriedad en las respuestas (0.0 a 1.0)",
    language: "Idioma",
    languageChanged: "Idioma cambiado exitosamente",
    general: "General",
    advanced: "Avanzado",
    defaultChatModel: "Modelo de Chat Predeterminado",
    defaultChatModelDesc: "Selecciona el modelo de Chat a usar",
    selectModel: "Seleccionar Modelo",
    embeddingModel: "Modelo de Embedding",
    embeddingModelDesc: "Función Principal: Impulsa la Búsqueda Semántica y Q&A",
    defaultMode: "Modo Predeterminado",
    defaultModeDesc: "Selecciona el modo de chat predeterminado",
    openPluginIn: "Abrir Plugin En",
    openPluginInDesc: "Elige dónde abrir el plugin",
    sidebarView: "Vista de Barra Lateral",
    editor: "Editor",
    defaultConversationFolder: "Nombre de Carpeta de Conversación Predeterminada",
    defaultConversationFolderDesc:
      'El nombre de carpeta predeterminado donde se guardarán las conversaciones de chat. Por defecto es "copilot-conversations"',
    customPromptsFolder: "Nombre de Carpeta de Prompts Personalizados",
    customPromptsFolderDesc:
      'El nombre de carpeta predeterminado donde se guardarán los prompts personalizados. Por defecto es "copilot-custom-prompts"',
    defaultConversationTag: "Etiqueta de Conversación Predeterminada",
    defaultConversationTagDesc:
      'La etiqueta predeterminada a usar al guardar una conversación. Por defecto es "ai-conversations"',
    conversationFilenameTemplate: "Plantilla de Nombre de Archivo de Conversación",
    conversationFilenameTemplateDesc:
      "Personaliza el formato de los nombres de notas de conversación guardadas",
    autosaveChat: "Guardado Automático de Chat",
    autosaveChatDesc:
      "Guardar automáticamente el chat al iniciar uno nuevo o cuando el plugin se recarga",
    suggestedPrompts: "Prompts Sugeridos",
    suggestedPromptsDesc: "Mostrar prompts sugeridos en la vista de chat",
    relevantNotes: "Notas Relevantes",
    relevantNotesDesc: "Mostrar notas relevantes en la vista de chat",
    apiKeyRequired: "Clave API requerida para funciones de chat y Q&A",
    apiKeyRequiredDesc:
      "Para habilitar la funcionalidad de chat y Q&A, por favor proporciona una clave API de tu proveedor seleccionado.",
    configureApiKeys: "Configurar claves API para diferentes proveedores de IA",
    openaiApiKey: "Clave API de OpenAI",
    openaiApiKeyDesc: "Ingresa tu clave API de OpenAI",
    modelSettings: "Configuración de Modelo",
    chatSettings: "Configuración de Chat",
    defaultSaveFolder: "Carpeta de Guardado Predeterminada",
    defaultSaveFolderDesc: "Carpeta para guardar conversaciones de chat",
    debugMode: "Modo de Depuración",
    debugModeDesc: "Habilitar registro de depuración",
    enableEncryption: "Habilitar Encriptación",
    enableEncryptionDesc: "Encriptar datos sensibles",
    embeddingModelTooltip:
      "Este modelo convierte texto en representaciones vectoriales, esencial para la búsqueda semántica y funcionalidad Q&A. Cambiar el modelo de embedding:",
    rebuildIndexRequired: "Requerirá reconstruir el índice vectorial de tu bóveda",
    affectSearchQuality: "Afectará la calidad de búsqueda semántica",
    impactQAPerformance: "Impactará el rendimiento de la función Q&A",
    selectDefaultMode: "Selecciona el modo de chat predeterminado",
    chatModeDesc:
      "Modo de chat regular para conversaciones generales y tareas. Gratis para usar con tu propia clave API.",
    vaultQAModeDesc:
      "Haz preguntas sobre el contenido de tu bóveda con búsqueda semántica. Gratis para usar con tu propia clave API.",
    copilotPlusModeDesc:
      "Cubre todas las funciones de los 2 modos gratuitos, más funciones pagadas avanzadas incluyendo menú contextual de chat, búsqueda avanzada, agentes de IA, y más.",
    customizeFilenameFormat:
      "Personaliza el formato de los nombres de notas de conversación guardadas.",
    filenameTemplateNote:
      "Nota: Todas las siguientes variables deben estar incluidas en la plantilla.",
    availableVariables: "Variables disponibles:",
    dateVariable: "Fecha en formato AAAAMMDD",
    timeVariable: "Hora en formato HHMMSS",
    topicVariable: "Tema de conversación de chat",
    filenameExample: "Ejemplo:",
    qaSettings: "Configuración de Q&A",
    autoIndexStrategy: "Estrategia de Auto-Indexación",
    autoIndexStrategyDesc: "Decide cuándo quieres que la bóveda sea indexada.",
    autoIndexStrategyTooltip: "Elige cuándo indexar tu bóveda:",
    autoIndexNever: "Indexación manual solo vía comando o actualización",
    autoIndexOnStartup: "Actualiza índice cuando el plugin carga o recarga",
    autoIndexOnModeSwitch: "Actualiza al entrar en modo Q&A (Recomendado)",
    autoIndexWarning:
      "Advertencia: Implicaciones de costo para bóvedas grandes con modelos pagados",
    maxSources: "Fuentes Máximas",
    maxSourcesDesc:
      "Copilot revisa tu bóveda para encontrar bloques relevantes y pasa los N bloques principales al LLM. Por defecto N es 3. Aumenta si quieres más fuentes incluidas en el paso de generación de respuestas.",
    requestsPerMinute: "Solicitudes por Minuto",
    requestsPerMinuteDesc:
      "Por defecto es 90. Disminuye si tienes limitación de tasa por tu proveedor de embedding.",
    embeddingBatchSize: "Tamaño de Lote de Embedding",
    embeddingBatchSizeDesc:
      "Por defecto es 16. Aumenta si tienes limitación de tasa por tu proveedor de embedding.",
    numPartitions: "Número de Particiones",
    numPartitionsDesc:
      "Número de particiones para el índice de Copilot. Por defecto es 1. Aumenta si tienes problemas indexando bóvedas grandes. ¡Advertencia: Los cambios requieren limpiar y reconstruir el índice!",
    exclusions: "Exclusiones",
    exclusionsDesc:
      "Excluir carpetas, etiquetas, títulos de notas o extensiones de archivo de ser indexados. Los archivos previamente indexados permanecerán hasta que se realice una re-indexación forzada.",
    inclusions: "Inclusiones",
    inclusionsDesc:
      "Indexar solo las rutas, etiquetas o títulos de notas especificados. Las exclusiones tienen precedencia sobre las inclusiones. Los archivos previamente indexados permanecerán hasta que se realice una re-indexación forzada.",
    manage: "Gestionar",
    enableObsidianSync: "Habilitar Obsidian Sync para índice de Copilot",
    enableObsidianSyncDesc:
      "Si está habilitado, el índice se almacenará en la carpeta .obsidian y se sincronizará con Obsidian Sync por defecto. Si está deshabilitado, se almacenará en la carpeta .copilot-index en la raíz de la bóveda.",
    disableIndexOnMobile: "Deshabilitar carga de índice en móvil",
    disableIndexOnMobileDesc:
      "Cuando está habilitado, el índice de Copilot no se cargará en dispositivos móviles para ahorrar recursos. Solo el modo chat estará disponible. Cualquier índice existente de sincronización de escritorio se preservará. Desmarca para habilitar modos Q&A en móvil.",
    strategy: "Estrategia",
  },
  advanced: {
    userSystemPrompt: "Prompt de Sistema de Usuario",
    userSystemPromptDesc:
      "Personaliza el prompt del sistema para todos los mensajes, ¡puede resultar en comportamiento inesperado!",
    userSystemPromptPlaceholder: "Ingresa tu prompt del sistema aquí...",
    customPromptTemplating: "Plantillas de Prompt Personalizadas",
    customPromptTemplatingDesc:
      "Habilitar plantillas para procesar variables como {activenote}, {foldername} o {#tag} en prompts. Deshabilitar para usar prompts en bruto sin ningún procesamiento.",
    customPromptsSortStrategy: "Estrategia de Ordenamiento de Prompts Personalizados",
    customPromptsSortStrategyDesc:
      "Elige cómo ordenar prompts personalizados (por uso reciente o alfabéticamente)",
    sortByRecency: "Reciente",
    sortByAlphabetical: "Alfabético",
    enableEncryption: "Habilitar Encriptación",
    enableEncryptionDesc: "Habilitar encriptación para las claves API.",
    debugMode: "Modo de Depuración",
    debugModeDesc: "El modo de depuración registrará algunos mensajes de depuración en la consola.",
  },
  commands: {
    title: "Comandos Personalizados",
    description:
      "Para activar un comando personalizado, resalta texto en el editor y selecciónalo desde la paleta de comandos, o haz clic derecho y elige desde el menú contextual si está configurado.",
    tip: "¡Toma control de tus comandos de edición en línea! Ahora puedes crear los tuyos propios o editar los integrados para adaptar la funcionalidad a tus necesidades.",
    table: {
      name: "Nombre",
      inMenu: "En Menú",
    },
    actions: {
      edit: "Editar",
      copy: "Copiar",
      delete: "Eliminar",
      addCommand: "Agregar Comando",
    },
    copyPrefix: " (copia)",
    defaults: {
      fixGrammar: {
        name: "Corregir gramática y ortografía",
        prompt:
          "Corrige la gramática y ortografía de {}. Preserva todo el formato, saltos de línea y caracteres especiales. No agregues ni quites contenido. Devuelve solo el texto corregido.",
      },
      translateToChinese: {
        name: "Traducir al chino",
        prompt:
          "Traduce {} al chino:\n1. Preserva el significado y tono\n2. Mantén el contexto cultural apropiado\n3. Conserva el formato y estructura\nDevuelve solo el texto traducido.",
      },
      summarize: {
        name: "Resumir",
        prompt:
          "Crea un resumen en puntos de {}. Cada punto debe capturar un punto clave. Devuelve solo el resumen en puntos.",
      },
      simplify: {
        name: "Simplificar",
        prompt:
          "Simplifica {} a un nivel de lectura de 6to grado (edades 11-12). Usa oraciones simples, palabras comunes y explicaciones claras. Mantén los conceptos clave originales. Devuelve solo el texto simplificado.",
      },
      emojify: {
        name: "Emojificar",
        prompt:
          "Agrega emojis relevantes para mejorar {}. Sigue estas reglas:\n1. Inserta emojis en pausas naturales del texto\n2. Nunca coloques dos emojis uno al lado del otro\n3. Mantén todo el texto original sin cambios\n4. Elige emojis que coincidan con el contexto y tono\nDevuelve solo el texto con emojis.",
      },
      makeShorter: {
        name: "Hacer más corto",
        prompt:
          "Reduce {} a la mitad de su longitud mientras preservas estos elementos:\n1. Ideas principales y puntos clave\n2. Detalles esenciales\n3. Tono y estilo original\nDevuelve solo el texto acortado.",
      },
      makeLonger: {
        name: "Hacer más largo",
        prompt:
          "Expande {} al doble de su longitud:\n1. Agregando detalles relevantes y ejemplos\n2. Elaborando puntos clave\n3. Manteniendo el tono y estilo original\nDevuelve solo el texto expandido.",
      },
      generateToc: {
        name: "Generar tabla de contenidos",
        prompt:
          "Genera una tabla de contenidos jerárquica para {}. Usa niveles de encabezado apropiados (H1, H2, H3, etc.). Incluye números de página si están presentes. Devuelve solo la tabla de contenidos.",
      },
      generateGlossary: {
        name: "Generar glosario",
        prompt:
          'Crea un glosario de términos, conceptos y frases importantes de {}. Formatea cada entrada como "Término: Definición". Ordena las entradas alfabéticamente. Devuelve solo el glosario.',
      },
      removeUrls: {
        name: "Eliminar URLs",
        prompt:
          "Elimina todas las URLs de {}. Preserva todo el otro contenido y formato. Las URLs pueden estar en varios formatos (http, https, www). Devuelve solo el texto con URLs eliminadas.",
      },
      rewriteAsTweet: {
        name: "Reescribir como tweet",
        prompt:
          "Reescribe {} como un solo tweet con estos requisitos:\n1. Máximo 280 caracteres\n2. Usa lenguaje conciso e impactante\n3. Mantén el mensaje central\nDevuelve solo el texto del tweet.",
      },
      rewriteAsThread: {
        name: "Reescribir como hilo de tweets",
        prompt:
          'Convierte {} en un hilo de Twitter siguiendo estas reglas:\n1. Cada tweet debe tener menos de 240 caracteres\n2. Comienza con "INICIO DEL HILO" en su propia línea\n3. Separa tweets con "\\n\\n---\\n\\n"\n4. Termina con "FIN DEL HILO" en su propia línea\n5. Haz el contenido atractivo y claro\nDevuelve solo el hilo formateado.',
      },
      explainLikeChild: {
        name: "Explicar como si tuviera 5 años",
        prompt:
          "Explica {} en términos simples que un niño de 5 años entendería:\n1. Usa vocabulario básico\n2. Incluye analogías simples\n3. Desglosa conceptos complejos\nDevuelve solo la explicación simplificada.",
      },
      rewriteAsPressRelease: {
        name: "Reescribir como comunicado de prensa",
        prompt:
          "Transforma {} en un comunicado de prensa profesional:\n1. Usa estilo formal y periodístico\n2. Incluye titular y línea de fecha\n3. Sigue estructura de pirámide invertida\nDevuelve solo el formato de comunicado de prensa.",
      },
    },
  },
};
