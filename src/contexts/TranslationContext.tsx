import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'es' | 'zh' | 'pt' | 'ru';

interface Translations {
  hero: {
    title: string;
    subtitle: string;
  };
  featuredArtists: {
    title: string;
  };
  audioPlatforms: {
    title: string;
    samplePack: string;
  };
  services: {
    title: string;
    recording: {
      title: string;
      description: string;
    };
    mixing: {
      title: string;
      description: string;
    };
    mastering: {
      title: string;
      description: string;
    };
  };
  contact: {
    title: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    countryPlaceholder: string;
    subjectPlaceholder: string;
    messagePlaceholder: string;
    sendingButton: string;
    sendButton: string;
    missingInfoTitle: string;
    missingInfoDesc: string;
    messageSentTitle: string;
    messageSentDesc: string;
    errorTitle: string;
    errorDesc: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    hero: {
      title: "HECHO EN AMÉRICA",
      subtitle: "LA MUSIC ES MEDICINE"
    },
    featuredArtists: {
      title: "Featured Artists"
    },
    audioPlatforms: {
      title: "Listen Now",
      samplePack: "Sample Pack"
    },
    services: {
      title: "Our Services",
      recording: {
        title: "Recording",
        description: "Professional recording sessions in our state-of-the-art studio"
      },
      mixing: {
        title: "Mixing",
        description: "Expert mixing to balance and enhance your tracks"
      },
      mastering: {
        title: "Mastering",
        description: "Professional mastering for the final polish and industry-ready sound"
      }
    },
    contact: {
      title: "Get in Touch",
      namePlaceholder: "Name",
      emailPlaceholder: "Email",
      countryPlaceholder: "Select Country",
      subjectPlaceholder: "Subject",
      messagePlaceholder: "Message",
      sendingButton: "Sending...",
      sendButton: "Send Message",
      missingInfoTitle: "Missing information",
      missingInfoDesc: "Please fill out all required fields",
      messageSentTitle: "Message sent",
      messageSentDesc: "Thank you for your message. We'll get back to you soon!",
      errorTitle: "Error",
      errorDesc: "There was a problem sending your message. Please try again."
    }
  },
  es: {
    hero: {
      title: "HECHO EN AMÉRICA",
      subtitle: "LA MÚSICA ES MEDICINA"
    },
    featuredArtists: {
      title: "Artistas Destacados"
    },
    audioPlatforms: {
      title: "Escucha Ahora",
      samplePack: "Paquete de Samples"
    },
    services: {
      title: "Nuestros Servicios",
      recording: {
        title: "Grabación",
        description: "Sesiones de grabación profesional en nuestro estudio de última generación"
      },
      mixing: {
        title: "Mezcla",
        description: "Mezcla experta para equilibrar y mejorar tus pistas"
      },
      mastering: {
        title: "Masterización",
        description: "Masterización profesional para el pulido final y sonido listo para la industria"
      }
    },
    contact: {
      title: "Ponte en Contacto",
      namePlaceholder: "Nombre",
      emailPlaceholder: "Correo Electrónico",
      countryPlaceholder: "Seleccionar País",
      subjectPlaceholder: "Asunto",
      messagePlaceholder: "Mensaje",
      sendingButton: "Enviando...",
      sendButton: "Enviar Mensaje",
      missingInfoTitle: "Información faltante",
      missingInfoDesc: "Por favor completa todos los campos requeridos",
      messageSentTitle: "Mensaje enviado",
      messageSentDesc: "Gracias por tu mensaje. Te responderemos pronto!",
      errorTitle: "Error",
      errorDesc: "Hubo un problema enviando tu mensaje. Por favor intenta de nuevo."
    }
  },
  zh: {
    hero: {
      title: "美国制造",
      subtitle: "音乐是良药"
    },
    featuredArtists: {
      title: "特色艺术家"
    },
    audioPlatforms: {
      title: "立即聆听",
      samplePack: "样本包"
    },
    services: {
      title: "我们的服务",
      recording: {
        title: "录音",
        description: "在我们最先进的录音室进行专业录音"
      },
      mixing: {
        title: "混音",
        description: "专业混音，平衡和增强您的音轨"
      },
      mastering: {
        title: "母带处理",
        description: "专业母带处理，为最终抛光和行业标准的声音"
      }
    },
    contact: {
      title: "联系我们",
      namePlaceholder: "姓名",
      emailPlaceholder: "邮箱",
      countryPlaceholder: "选择国家",
      subjectPlaceholder: "主题",
      messagePlaceholder: "消息",
      sendingButton: "发送中...",
      sendButton: "发送消息",
      missingInfoTitle: "信息缺失",
      missingInfoDesc: "请填写所有必填字段",
      messageSentTitle: "消息已发送",
      messageSentDesc: "感谢您的消息。我们会尽快回复您！",
      errorTitle: "错误",
      errorDesc: "发送消息时出现问题。请重试。"
    }
  },
  pt: {
    hero: {
      title: "FEITO NA AMÉRICA",
      subtitle: "A MÚSICA É MEDICINA"
    },
    featuredArtists: {
      title: "Artistas em Destaque"
    },
    audioPlatforms: {
      title: "Ouça Agora",
      samplePack: "Pacote de Samples"
    },
    services: {
      title: "Nossos Serviços",
      recording: {
        title: "Gravação",
        description: "Sessões de gravação profissional em nosso estúdio de última geração"
      },
      mixing: {
        title: "Mixagem",
        description: "Mixagem especializada para equilibrar e aprimorar suas faixas"
      },
      mastering: {
        title: "Masterização",
        description: "Masterização profissional para o polimento final e som pronto para a indústria"
      }
    },
    contact: {
      title: "Entre em Contato",
      namePlaceholder: "Nome",
      emailPlaceholder: "E-mail",
      countryPlaceholder: "Selecionar País",
      subjectPlaceholder: "Assunto",
      messagePlaceholder: "Mensagem",
      sendingButton: "Enviando...",
      sendButton: "Enviar Mensagem",
      missingInfoTitle: "Informações em falta",
      missingInfoDesc: "Por favor, preencha todos os campos obrigatórios",
      messageSentTitle: "Mensagem enviada",
      messageSentDesc: "Obrigado pela sua mensagem. Entraremos em contato em breve!",
      errorTitle: "Erro",
      errorDesc: "Houve um problema ao enviar sua mensagem. Tente novamente."
    }
  },
  ru: {
    hero: {
      title: "СДЕЛАНО В АМЕРИКЕ",
      subtitle: "МУЗЫКА - ЭТО ЛЕКАРСТВО"
    },
    featuredArtists: {
      title: "Рекомендуемые Исполнители"
    },
    audioPlatforms: {
      title: "Слушать Сейчас",
      samplePack: "Пакет Сэмплов"
    },
    services: {
      title: "Наши Услуги",
      recording: {
        title: "Запись",
        description: "Профессиональные сессии записи в нашей современной студии"
      },
      mixing: {
        title: "Сведение",
        description: "Экспертное сведение для баланса и улучшения ваших треков"
      },
      mastering: {
        title: "Мастеринг",
        description: "Профессиональный мастеринг для финальной полировки и готового к индустрии звука"
      }
    },
    contact: {
      title: "Связаться с Нами",
      namePlaceholder: "Имя",
      emailPlaceholder: "Электронная Почта",
      countryPlaceholder: "Выберите Страну",
      subjectPlaceholder: "Тема",
      messagePlaceholder: "Сообщение",
      sendingButton: "Отправка...",
      sendButton: "Отправить Сообщение",
      missingInfoTitle: "Недостающая информация",
      missingInfoDesc: "Пожалуйста, заполните все обязательные поля",
      messageSentTitle: "Сообщение отправлено",
      messageSentDesc: "Спасибо за ваше сообщение. Мы скоро с вами свяжемся!",
      errorTitle: "Ошибка",
      errorDesc: "Возникла проблема при отправке вашего сообщения. Попробуйте снова."
    }
  }
};

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const value = {
    language,
    setLanguage,
    t: translations[language]
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};