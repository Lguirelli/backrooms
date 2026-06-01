import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowUpRight,
  Building2,
  DoorOpen,
  Grid3X3,
  Map,
  RadioTower,
  ShieldAlert,
  SquareStack,
  Timer,
  Waves,
  Menu,
  X,
} from 'lucide-react';

const services = [
  {
    number: '01',
    title: 'Controle lumínico total',
    text: 'Estabilidade visual em qualquer horário, sem interferência climática, sem janelas e sem variações externas competindo pela atenção.',
    icon: RadioTower,
  },
  {
    number: '02',
    title: 'Expansão modular progressiva',
    text: 'A ocupação começa pequena e cresce sem ruptura perceptível, mantendo coesão material, repetição espacial e continuidade operacional.',
    icon: Grid3X3,
  },
  {
    number: '03',
    title: 'Privacidade por afastamento humano',
    text: 'Sem fluxo casual, sem vitrines de equipe e sem exposição involuntária da rotina de trabalho.',
    icon: ShieldAlert,
  },
  {
    number: '04',
    title: 'Visita de reconhecimento',
    text: 'Acesso acompanhado, percurso assimilável e confirmação de retorno para clientes que precisam entender antes de permanecer.',
    icon: DoorOpen,
  },
];

const principles = [
  {
    title: 'Menos exterior',
    text: 'A ausência de vista reduz interferências visuais urbanas e preserva a atenção onde ela realmente produz resultado.',
  },
  {
    title: 'Mais concentração',
    text: 'A repetição material reduz atrito visual. A profundidade protege. A constância organiza.',
  },
  {
    title: 'Permanência como estratégia',
    text: 'O espaço não foi pensado para impressionar na chegada. Ele melhora quando a operação encontra ritmo.',
  },
];

const planRows = [
  ['Threshold Suite', 'células compactas'],
  ['Continuum Cluster', 'times em expansão'],
  ['Permanent Occupancy', 'longa permanência'],
  ['Iluminação', 'estável'],
  ['Contexto visual externo', 'zero'],
  ['Metragem', 'progressiva'],
];

const occupancy = [
  ['Threshold Suite', 'Para células compactas, lideranças, pesquisa, escrita, estratégia e trabalho profundo.'],
  ['Continuum Cluster', 'Para times que operam por blocos, demandam adjacência entre setores e valorizam expansão sem espetáculo.'],
  ['Permanent Occupancy', 'Para permanência estendida, protocolos reservados e continuidade operacional acima da média.'],
];

const testimonials = [
  ['Fechamos um trimestre inteiro aqui. Só percebemos quando tivemos de sair.', 'Diretora de Operações'],
  ['Existe uma serenidade rara em ambientes que não tentam ser inspiradores o tempo todo.', 'Sócio, consultoria financeira'],
  ['Eu vim pela metragem. Fiquei pela constância.', 'Head de Estratégia'],
];

const faq = [
  [Map, 'Existe luz natural?', 'Trabalhamos com estabilidade lumínica e menor interferência externa.'],
  [Timer, 'A metragem é fixa?', 'Ela é definida pelo programa de uso e pelas necessidades de progressão da ocupação.'],
  [Waves, 'É possível visitar?', 'Sim. Recomendamos visita acompanhada de reconhecimento.'],
  [SquareStack, 'A planta é simples?', 'Ela é eficiente após o primeiro reconhecimento.'],
];

function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    ['#concept', 'O espaço'],
    ['#services', 'Diferenciais'],
    ['#plan', 'Níveis'],
    ['#access', 'Visita'],
  ];

  return (
    <header className="hero-header">
      <a className="brand" href="#top" aria-label="Oregon 811">
        <Building2 size={18} />
        <span>Oregon 811</span>
      </a>

      <nav className="desktop-nav" aria-label="Navegação principal">
        {links.map(([href, label]) => (
          <a key={href} href={href}>{label}</a>
        ))}
      </nav>

      <button className="mobile-menu-button" onClick={() => setOpen(!open)} aria-label="Abrir menu" aria-expanded={open}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <nav className="mobile-nav" aria-label="Navegação mobile">
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
        </nav>
      )}
    </header>
  );
}

function App() {
  const shellRef = useRef(null);
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const { scrollYProgress } = useScroll({ target: shellRef, offset: ['start start', 'end end'] });
  const fogY = useTransform(scrollYProgress, [0, 1], [0, -260]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, 180]);

  useEffect(() => {
    const onMove = (event) => {
      setCursor({
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <main ref={shellRef} id="top" className="site-shell">
      <div className="noise-layer" />
      <div className="scanline-layer" />

      <motion.div aria-hidden="true" className="fog-layer" style={{ y: fogY }}>
        <span className="fog fog-a" />
        <span className="fog fog-b" />
      </motion.div>

      <motion.div aria-hidden="true" className="grid-layer" style={{ y: gridY }} />

      <section className="top-strip">
        <div className="top-strip-inner">
          <div className="top-mark">
            <span><ArrowUpRight size={18} /></span>
            <p>Oregon 811 Corporate Continuum</p>
          </div>
          <p className="top-caption">internal campus / controlled occupancy</p>
        </div>
      </section>

      <section className="hero-section">
        <div className="hero-card" style={{ '--mx': `${cursor.x}%`, '--my': `${cursor.y}%` }}>
          <Header />

          <div className="hero-content">
            <div className="hero-copy">
              <motion.h1
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                OREGON<br />811
              </motion.h1>

              <div className="hero-grid-copy">
                <p className="hero-kicker">Campus interno para operações sem ruído externo</p>
                <p className="hero-description">
                  Metragem contínua, iluminação estável e disponibilidade imediata para equipes que exigem concentração prolongada, discrição e permanência.
                </p>
              </div>
            </div>

            <div className="hero-bottom">
              <div className="pill-row">
                <span>Controle lumínico total</span>
                <span>Baixa interferência humana</span>
                <span>Acesso mediante confirmação</span>
              </div>

              <div className="hero-actions">
                <a className="primary-button" href="#access">
                  Solicitar visita <ArrowUpRight size={16} />
                </a>
                <a className="secondary-button" href="#plan">Receber mapa</a>
              </div>
            </div>
          </div>

          <div className="corridor-floor" />
          <span className="hero-line line-a" />
          <span className="hero-line line-b" />
          <span className="hero-line line-c" />
        </div>
      </section>

      <section id="concept" className="section-wrap">
        <div className="glass-panel concept-panel">
          <div className="section-heading split-heading">
            <div>
              <span className="section-label">Sobre o espaço</span>
              <h2>Foco não é estado de espírito. É infraestrutura.</h2>
            </div>
            <p>
              Nem todo ambiente precisa disputar atenção para provar valor. O Oregon 811 foi concebido para operações que se beneficiam de continuidade, silêncio estrutural e uma relação mais controlada com o tempo.
            </p>
          </div>

          <div className="principles-grid">
            {principles.map((item, index) => (
              <article className="principle-card" key={item.title}>
                <span>0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="section-wrap no-top-padding">
        <div className="services-grid">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article className="service-card" key={service.title}>
                <div className="service-bg" />
                <div className="service-content">
                  <div className="service-number-row">
                    <span>{service.number}</span>
                    <i><Icon size={18} /></i>
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="plan" className="section-wrap no-top-padding">
        <div className="glass-panel plan-panel">
          <div className="plan-copy">
            <span className="section-label">Níveis disponíveis</span>
            <h2>A área acompanha a operação</h2>
            <p>
              A ocupação é definida pelo programa de uso e pelas necessidades de progressão. A planta parece simples no primeiro reconhecimento. Depois, ela se torna eficiente.
            </p>

            <div className="plan-table">
              {planRows.map(([label, value]) => (
                <div className="plan-row" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="floor-plan" aria-label="Mapa de ocupação ilustrativo">
            <div className="map-grid">
              <div className="map-cell threshold">Threshold</div>
              <div className="map-cell cluster">Cluster</div>
              <div className="map-cell loop">Loop</div>
              <div className="map-cell continuum">Continuum</div>
              <div className="map-cell occupancy">Occupancy</div>
              <div className="map-cell route">Reserved route</div>
              <div className="map-cell return">Return</div>
            </div>
            <span>Oregon 811 / map varies</span>
          </div>
        </div>
      </section>

      <section className="section-wrap no-top-padding">
        <div className="showcase-heading">
          <h2>Experiência de ocupação</h2>
          <p>Há espaços que impressionam na chegada e se esgotam em minutos. O Oregon 811 funciona ao contrário.</p>
        </div>

        <div className="occupancy-grid">
          {occupancy.map(([title, text], index) => (
            <article className="occupancy-card" key={title}>
              <div className="occupancy-bg" />
              <div className="occupancy-content">
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-wrap no-top-padding">
        <div className="glass-panel testimonials-panel">
          <div className="section-heading">
            <span className="section-label">Depoimentos</span>
            <h2>Constância percebida por quem permaneceu</h2>
          </div>

          <div className="testimonial-grid">
            {testimonials.map(([quote, role]) => (
              <figure className="testimonial-card" key={quote}>
                <blockquote>“{quote}”</blockquote>
                <figcaption>— {role}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="access" className="section-wrap access-wrap no-top-padding">
        <div className="access-grid">
          <div className="glass-panel access-copy">
            <span className="section-label">CTA final</span>
            <h2>O próximo passo não é imaginar. É atravessar.</h2>
            <p>
              Se a sua operação exige menos distração, menos ruído e mais permanência, solicite uma visita de reconhecimento e receba uma proposta de ocupação compatível com o seu nível de continuidade.
            </p>
            <div className="access-actions">
              <a className="primary-button" href="mailto:reconhecimento@oregon811.fake">Agendar reconhecimento presencial</a>
              <a className="secondary-button" href="#plan">Receber mapa de ocupação</a>
            </div>
          </div>

          <div className="faq-grid">
            {faq.map(([Icon, title, text]) => (
              <article className="faq-card" key={title}>
                <i><Icon size={24} /></i>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <footer className="footer">
          Oregon 811 Corporate Continuum. Visitas mediante agendamento. Disponibilidade sujeita à configuração operacional vigente. Percursos, módulos e acessos podem variar sem aviso prévio.
        </footer>
      </section>
    </main>
  );
}

export default App;
