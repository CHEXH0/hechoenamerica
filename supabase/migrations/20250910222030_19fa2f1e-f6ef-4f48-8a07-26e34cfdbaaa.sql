-- Create artists table
CREATE TABLE public.artists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  country TEXT NOT NULL,
  genre TEXT NOT NULL,
  bio TEXT NOT NULL,
  spotify_url TEXT,
  youtube_url TEXT,
  apple_music_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create platforms table
CREATE TABLE public.platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT NOT NULL,
  tagline TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view artists" ON public.artists FOR SELECT USING (true);
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Anyone can view platforms" ON public.platforms FOR SELECT USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platforms_updated_at
  BEFORE UPDATE ON public.platforms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert artists data
INSERT INTO public.artists (slug, name, image, country, genre, bio, spotify_url, youtube_url, apple_music_url) VALUES
('chexho', 'CHEXHO', '/laptop-uploads/AlbumCover.png', 'California, USA', 'Alternative R&B, Musica Medicina', 'CHEXHO is an innovative artist blending Alternative R&B with Musica Medicina, creating transformative musical experiences that heal and inspire.', 'https://open.spotify.com/artist/51oO373JL3YH8dvT6v94xg?si=EgGVOngeRTaejIWl3TYqkA', 'https://music.youtube.com/channel/UC2YuThfYNq2UTfAQlRQhAhw?si=qHHq90xz8ZqsqJ1Y', 'https://music.apple.com/us/artist/chexho/1777084383'),
('jiesson-diaz-santiago', 'Jiesson Diaz Santiago', '/laptop-uploads/Jiesson.png', 'Bogotá, Colombia', 'Musica Medicina', 'Based in Bogotá, Jiesson Diaz Santiago crafts healing soundscapes through Musica Medicina, connecting listeners to their inner wisdom.', 'https://open.spotify.com/artist/5MpXNiUTlKk7WmwEYhnVaC?si=BOfW5qmwRFWNMhnjhOa0Fw', 'https://music.youtube.com/channel/UCOzvqhVCaqNDbY7jRzqHEgQ?si=rHzk0wOj-GJ3XABc', 'https://music.apple.com/us/artist/jiesson-d%C3%ADaz-santiago/1788694452'),
('nick-zinchenko', 'Nick Zinchenko', '/laptop-uploads/Zinchenko.png', 'Luhansk, Ukraine', 'Hip Hop, Trap, R&B', 'Nick Zinchenko brings authentic Eastern European energy to Hip Hop, Trap, and R&B, creating powerful narratives through his music.', 'https://open.spotify.com/artist/5MNMLU5i9pBJCNh9kEP9F5?si=RTt4qWrySHS2GMpaON0RBQ', 'https://music.youtube.com/channel/UCJbVDaqHZUbFT3Mw8kzt2Nw?si=gvwZ_8zP50I9fiOa', 'https://music.apple.com/us/artist/nick-zinchenko/1674389844'),
('rossella', 'Rossella', '/laptop-uploads/Rossella.jpg', 'Playas De Tijuana, México', 'Musica Medicina', 'From the borderlands of Tijuana, Rossella weaves ancient wisdom into modern Musica Medicina, bridging cultures through healing sound.', 'https://open.spotify.com/artist/2tOG1hBhUrWO87AfSA4Ej6?si=W8l0jUgsQ9-TSxoPPWMWvA', 'https://music.youtube.com/channel/UCp2CGsqQbrlRYfSXAgePoww?si=ftQRH1oo63VIlfhA', 'https://music.apple.com/us/artist/rossella/263293042'),
('felicidad', 'Felicidad', '/laptop-uploads/BlackJ.png', 'Bogota, Colombia', 'Musica Medicina, R&B', 'Felicidad combines the soulful essence of R&B with the healing power of Musica Medicina, creating uplifting musical journeys.', 'https://open.spotify.com/artist/5hKIALJCfhcnvPE6EJR4Jc', 'https://music.youtube.com/channel/UC...', 'https://music.apple.com/us/artist/felicidad/189759832'),
('christian-jones', 'Christian Jones', '/laptop-uploads/RIVERSIDE.jpg', 'California, USA', 'Rap, Soul', 'Christian Jones delivers authentic Rap and Soul from California, telling stories that resonate with raw emotion and spiritual depth.', 'https://open.spotify.com/artist/5iypl9rruEx6nUMwgGfZCJ?si=MHgV5vGtTSKTdTq3UM6NMA', 'https://music.apple.com/us/artist/christian-jones/106152357', 'https://music.apple.com/us/artist/christian-jones/106152357');

-- Insert services data
INSERT INTO public.services (title, description, image, icon, sort_order) VALUES
('Recording', 'Professional recording services in our state-of-the-art studio', '/laptop-uploads/Star.png', 'Mic', 1),
('Mixing', 'Expert mixing to bring your tracks to life', '/laptop-uploads/Donut.png', 'Headphones', 2),
('Mastering', 'Final polish to make your music shine', '/laptop-uploads/Pill.png', 'Music', 3);

-- Insert platforms data
INSERT INTO public.platforms (name, logo, tagline, sort_order) VALUES
('ProTools', '/laptop-uploads/ProTools.png', 'Work with anyone, anywhere', 1),
('Cubase', '/laptop-uploads/Cubase.png', 'Keeps your creativty flowing', 2),
('FL Studio', '/laptop-uploads/FLoops.png', 'Create your best music', 3);