document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const hero = document.getElementById('heroCard');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('mousemove', (event) => {
    if (!hero) return;

    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    hero.style.setProperty('--mx', `${Math.max(0, Math.min(100, x))}%`);
    hero.style.setProperty('--my', `${Math.max(0, Math.min(100, y))}%`);
  });

  const onScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    root.style.setProperty('--grid-y', `${progress * 180}px`);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const possibilityFrame = document.getElementById('possibilityFrame');
  const possibilitySlides = possibilityFrame ? Array.from(possibilityFrame.querySelectorAll('.possibility-slide')) : [];
  const possibilityCounter = document.getElementById('possibilityCounter');
  const possibilityTitle = document.getElementById('possibilityTitle');
  const possibilityText = document.getElementById('possibilityText');

  if (possibilitySlides.length) {
    let activeIndex = 0;

    const updatePossibilitySlide = (index) => {
      possibilitySlides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      const activeSlide = possibilitySlides[index];

      if (possibilityCounter) {
        possibilityCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(possibilitySlides.length).padStart(2, '0')}`;
      }

      if (possibilityTitle) {
        possibilityTitle.textContent = activeSlide.dataset.title || '';
      }

      if (possibilityText) {
        possibilityText.textContent = activeSlide.dataset.desc || '';
      }
    };

    const nextSlide = () => {
      activeIndex = (activeIndex + 1) % possibilitySlides.length;
      updatePossibilitySlide(activeIndex);
    };

    updatePossibilitySlide(activeIndex);

    // Automático sempre. Não pausa no hover para evitar falha em desktop/mobile.
    window.setInterval(nextSlide, prefersReducedMotion ? 6200 : 3200);
  }

  const usageReports = [
    {
      name: 'Eleanor Hayes',
      role: 'Diretora de Operações | Northline Systems',
      body: [
        'Começamos usando a Unidade 811 como apoio para uma operação interna de três semanas.',
        'A ideia era separar uma equipe, organizar materiais e manter o fluxo longe da sede principal.',
        'Na prática, o espaço absorveu mais do que o previsto. Primeiro ocupamos um conjunto de salas. Depois abrimos um segundo setor. Em seguida, criamos uma área de controle em outro trecho.',
        'O mais interessante é que a operação cresceu sem parecer improvisada.',
        'A estrutura já tinha continuidade suficiente para isso. Em alguns momentos, era difícil estimar a distância entre as equipes, mas o fluxo funcionava.'
      ]
    },
    {
      name: 'Martin Keller',
      role: 'Gerente de Estratégia Imobiliária | Meridian Works',
      body: [
        'Utilizamos a Unidade 811 durante a transição entre dois escritórios.',
        'O plano inicial era manter apenas arquivo, documentação e parte da equipe administrativa. Com o passar dos dias, percebemos que o espaço permitia mais camadas de uso.',
        'Instalamos estações temporárias, uma área de revisão documental e uma sala de reuniões interna.',
        'O ambiente é silencioso, estável e pouco sujeito a interferências. Para uma operação que precisava funcionar sem chamar atenção, foi uma solução muito eficiente.',
        'A sensação de profundidade existe. Mas depois de alguns dias ela deixa de ser estranha e passa a fazer parte da rotina.'
      ]
    },
    {
      name: 'Claire Morgan',
      role: 'Arquiteta Corporativa | Vale Studio',
      body: [
        'Nossa equipe usou a Unidade 811 como laboratório de ocupação para testar fluxos internos.',
        'O espaço respondeu bem porque não força uma leitura única. Você pode criar setores lineares, separar equipes por blocos ou distribuir funções conforme o nível de acesso necessário.',
        'A repetição dos módulos ajuda na padronização, mas também gera uma percepção incomum: depois de algumas horas, os ambientes parecem familiares mesmo quando você ainda não passou por eles.',
        'Do ponto de vista de uso, isso exige sinalização clara.',
        'Do ponto de vista operacional, abre possibilidades interessantes.'
      ]
    },
    {
      name: 'Daniel Cross',
      role: 'Gerente de Facilities | Corefield Group',
      body: [
        'Mantivemos uma equipe de suporte interno na Unidade 811 por quase dois meses.',
        'O ganho principal foi controle.',
        'Sem ruído externo, sem fluxo de visitantes, sem variação visual e sem interferência de outras áreas da empresa. O espaço manteve a operação em um ritmo constante.',
        'A iluminação uniforme ajudou bastante, principalmente nos turnos mais longos. A ausência de janelas também reduziu distrações.',
        'Alguns colaboradores comentaram que perdiam um pouco a noção do horário. Por isso, reforçamos pausas e pontos de referência.',
        'Ainda assim, o desempenho da equipe foi estável durante todo o período.'
      ]
    },
    {
      name: 'Sofia Reed',
      role: 'Consultora de Expansão | Axis Planning',
      body: [
        'A Unidade 811 foi usada em uma fase de expansão operacional, quando o cliente precisava testar novos setores antes de assumir uma estrutura definitiva.',
        'O espaço funcionou muito bem para isso.',
        'Criamos uma sequência de áreas: entrada operacional, triagem, atendimento, revisão, armazenamento leve e coordenação.',
        'O fluxo parecia natural. Uma etapa levava à outra sem interrupções bruscas. Isso reduziu ruído, deslocamento desnecessário e conflitos entre equipes.',
        'O curioso é que, mesmo com a ocupação crescendo, o espaço nunca pareceu saturado. Sempre havia a sensação de que ainda existia mais uma área disponível à frente.'
      ]
    },
    {
      name: 'Adrian Cole',
      role: 'Parceiro de Investimentos | Greyhall Capital',
      body: [
        'Avaliamos a Unidade 811 inicialmente como ativo de apoio, mas o uso mostrou algo mais relevante.',
        'Ela funciona muito bem para operações que não dependem de exposição pública.',
        'Backoffice, arquivo, controle interno, documentação, inventário, equipes técnicas e operações sigilosas se beneficiam da privacidade do espaço.',
        'Não é um imóvel que vende presença urbana.',
        'É um imóvel que entrega profundidade interna.',
        'Durante o uso, essa profundidade muda a forma como a empresa organiza pessoas, materiais e processos.'
      ]
    },
    {
      name: 'Naomi Brooks',
      role: 'Líder de Implementação de Processos | Altum Services',
      body: [
        'Durante a implantação de um novo fluxo interno, usamos a Unidade 811 para separar equipes por etapa de processo.',
        'Isso facilitou muito o acompanhamento.',
        'Cada setor tinha seu próprio conjunto de salas, mas todos permaneciam conectados por uma circulação simples. A operação conseguia avançar sem cruzar caminhos desnecessários.',
        'A repetição visual do espaço exigiu uma camada extra de identificação, principalmente nos primeiros dias.',
        'Depois, a equipe se adaptou.',
        'Quando o uso ficou mais intenso, a Unidade 811 mostrou sua maior vantagem: ela permite expandir sem quebrar o fluxo existente.'
      ]
    },
    {
      name: 'Thomas Blake',
      role: 'Coordenador de Logística | Eastbridge Operations',
      body: [
        'Usamos parte da Unidade 811 para organizar um volume temporário de materiais técnicos.',
        'A estrutura ajudou porque havia espaço para separar categorias, criar rotas internas e manter áreas limpas entre recebimento, conferência e armazenamento.',
        'Em um galpão comum, provavelmente teríamos improvisado divisórias.',
        'Na Unidade 811, os próprios módulos já criavam essa separação.',
        'O único ponto que exigiu atenção foi a orientação interna. Depois que o material começou a ocupar várias salas, criamos marcações simples para evitar deslocamentos errados.',
        'Com isso resolvido, o espaço funcionou muito bem.'
      ]
    },
    {
      name: 'Isabel Grant',
      role: 'Consultora de Estratégia de Espaço de Trabalho | Lumen Offices',
      body: [
        'A Unidade 811 foi ocupada por uma equipe administrativa em regime temporário.',
        'O resultado foi diferente de um escritório convencional.',
        'Não havia estímulos externos, variação de paisagem ou movimentação de rua. Isso deixou o ambiente mais silencioso e previsível.',
        'Para algumas pessoas, essa previsibilidade foi positiva. Para outras, exigiu adaptação.',
        'O ponto forte é que o espaço não compete com o trabalho. Ele cria uma condição de concentração contínua.',
        'Quando bem sinalizado e bem setorizado, pode ser extremamente eficiente para operações internas.'
      ]
    },
    {
      name: 'Victor Shaw',
      role: 'Diretor de Operações Internas | Holloway Group',
      body: [
        'O uso da Unidade 811 nos fez repensar a ideia de espaço excedente.',
        'Normalmente, uma empresa procura mais metros quadrados quando já está apertada. Aqui, a lógica foi diferente. O espaço permitiu testar expansão antes que ela se tornasse urgente.',
        'Criamos áreas provisórias, reorganizamos processos e isolamos uma equipe crítica sem precisar interromper a sede principal.',
        'A Unidade 811 tem uma qualidade difícil de explicar em uma apresentação comercial: ela parece aceitar crescimento sem reagir contra ele.',
        'Você adiciona uma função, depois outra, depois outra.',
        'E o espaço continua.'
      ]
    }
  ];

  const usageCarousel = document.getElementById('usageCarousel');
  const usageTrack = document.getElementById('usageTrack');
  const usageCards = Array.from(document.querySelectorAll('.usage-card'));
  const usageModal = document.getElementById('usageModal');
  const usageModalTitle = document.getElementById('usageModalTitle');
  const usageModalRole = document.getElementById('usageModalRole');
  const usageModalBody = document.getElementById('usageModalBody');
  const closeUsageModalButtons = Array.from(document.querySelectorAll('[data-close-usage-modal]'));

  if (usageCarousel && usageCards.length) {
    let activeIndex = 1;
    let lastMouseStepAt = 0;
    const mouseStepDelay = prefersReducedMotion ? 900 : 520;

    const wrapIndex = (index) => (index + usageCards.length) % usageCards.length;

    const getOffset = (index) => {
      const total = usageCards.length;
      let offset = index - activeIndex;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;
      return offset;
    };

    const updateUsageCarousel = () => {
      usageCards.forEach((card, index) => {
        const offset = getOffset(index);
        const abs = Math.abs(offset);

        card.classList.remove(
          'is-center',
          'is-left',
          'is-right',
          'is-far-left',
          'is-far-right',
          'is-hidden'
        );

        if (offset === 0) card.classList.add('is-center');
        else if (offset === -1) card.classList.add('is-left');
        else if (offset === 1) card.classList.add('is-right');
        else if (offset === -2) card.classList.add('is-far-left');
        else if (offset === 2) card.classList.add('is-far-right');
        else card.classList.add('is-hidden');

        card.setAttribute('aria-current', offset === 0 ? 'true' : 'false');
        card.tabIndex = abs <= 2 ? 0 : -1;
      });
    };

    const goToUsageCard = (index) => {
      activeIndex = wrapIndex(index);
      updateUsageCarousel();
    };

    const openUsageReport = (card) => {
      const report = usageReports[Number(card.dataset.report)];
      if (!report || !usageModal || !usageModalTitle || !usageModalRole || !usageModalBody) return;

      usageModalTitle.textContent = report.name;
      usageModalRole.textContent = report.role;
      usageModalBody.innerHTML = report.body.map((paragraph) => `<p>${paragraph}</p>`).join('');
      usageModal.classList.add('is-open');
      usageModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('usage-modal-open');
    };

    const closeUsageReport = () => {
      if (!usageModal) return;
      usageModal.classList.remove('is-open');
      usageModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('usage-modal-open');
    };

    let lastUsageClickIndex = null;
    let lastUsageClickAt = 0;

    usageCards.forEach((card, index) => {
      card.addEventListener('click', (event) => {
        event.stopPropagation();

        const now = performance.now();
        const isSecondClick = lastUsageClickIndex === index && now - lastUsageClickAt < 420;

        if (!card.classList.contains('is-center')) {
          goToUsageCard(index);
          lastUsageClickIndex = index;
          lastUsageClickAt = now;
          return;
        }

        if (isSecondClick) {
          openUsageReport(card);
          lastUsageClickIndex = null;
          lastUsageClickAt = 0;
          return;
        }

        lastUsageClickIndex = index;
        lastUsageClickAt = now;
      });

      card.addEventListener('dblclick', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!card.classList.contains('is-center')) {
          goToUsageCard(index);
          window.setTimeout(() => openUsageReport(card), 160);
          return;
        }
        openUsageReport(card);
      });

      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (card.classList.contains('is-center')) openUsageReport(card);
          else goToUsageCard(index);
        }

        if (event.key === 'ArrowLeft') {
          goToUsageCard(activeIndex - 1);
        }

        if (event.key === 'ArrowRight') {
          goToUsageCard(activeIndex + 1);
        }
      });
    });

    usageCarousel.addEventListener('pointermove', (event) => {
      const rect = usageCarousel.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const now = performance.now();

      if (now - lastMouseStepAt < mouseStepDelay) return;

      if (x < 0.26) {
        goToUsageCard(activeIndex - 1);
        lastMouseStepAt = now;
      } else if (x > 0.74) {
        goToUsageCard(activeIndex + 1);
        lastMouseStepAt = now;
      }
    });

    usageCarousel.addEventListener('click', (event) => {
      if (event.target.closest('.usage-card')) return;
      const rect = usageCarousel.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;

      if (x < 0.42) goToUsageCard(activeIndex - 1);
      if (x > 0.58) goToUsageCard(activeIndex + 1);
    });

    closeUsageModalButtons.forEach((button) => {
      button.addEventListener('click', closeUsageReport);
    });

    usageModal?.addEventListener('click', (event) => {
      if (event.target.matches('[data-close-usage-modal]')) closeUsageReport();
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && usageModal?.classList.contains('is-open')) {
        closeUsageReport();
      }
    });

    updateUsageCarousel();
  }
});

document.documentElement.classList.add('is-ready');
