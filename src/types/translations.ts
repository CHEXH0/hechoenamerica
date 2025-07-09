export type Language = 'en' | 'es' | 'zh' | 'pt' | 'ru';

export interface Translations {
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
  artist: {
    backToArtists: string;
    about: string;
    notFound: string;
    returnToHome: string;
  };
}