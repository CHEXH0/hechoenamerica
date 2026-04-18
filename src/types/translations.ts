export type Language = 'en' | 'es' | 'zh' | 'pt' | 'ru';

export interface Translations {
  hero: {
    title: string;
    subtitle: string;
  };
  featuredProducers: {
    title: string;
    seeAll: string;
    yourMusicTitle: string;
    yourMusicSubtitle: string;
  };
  audioPlatforms: {
    title: string;
    treats: string;
    careers: string;
    instagram: string;
    youtube: string;
  };
  services: {
    title: string;
    workWithDaws: string;
    audios: {
      title: string;
      description: string;
    };
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
  cta: {
    readyTitle: string;
    getStarted: string;
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
  customerService: {
    triggerTitle: string;
    panelTitle: string;
    panelDescription: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    sendButton: string;
    missingTitle: string;
    missingDesc: string;
    sentTitle: string;
    sentDesc: string;
    errorTitle: string;
    errorDesc: string;
    urgentTitle: string;
    emailUsTitle: string;
    callUsTitle: string;
    availability: string;
  };
  cookies: {
    text: string;
    privacyLink: string;
    accept: string;
    decline: string;
    close: string;
  };
  footer: {
    studioName: string;
    tagline: string;
    privacyPolicy: string;
    termsOfService: string;
    rightsReserved: string;
  };
  cart: {
    title: string;
    empty: string;
    emptyDesc: string;
    total: string;
    checkout: string;
    processing: string;
    clearCart: string;
    emptyToastTitle: string;
    emptyToastDesc: string;
    redirectingTitle: string;
    redirectingDesc: string;
    failedTitle: string;
    failedDesc: string;
  };
  producer: {
    backToProducers: string;
    about: string;
    notFound: string;
    returnToHome: string;
  };
  translateHelper: {
    title: string;
    description: string;
    appLanguage: string;
  };
}
