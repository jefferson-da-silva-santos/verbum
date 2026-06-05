/**
 * VERBUM — src/constants/propheticConnections.ts
 *
 * Catálogo curado de profecias do Antigo Testamento e seus
 * cumprimentos no Novo Testamento. Fonte: hermenêutica bíblica
 * histórica, teologia reformada e exegese evangélica brasileira.
 *
 * connectionType:
 *   'messianic'    — profecia messiânica direta
 *   'typological'  — tipo/sombra cumprido em Cristo
 *   'fulfillment'  — cumprimento explícito citado pelo NT
 *   'thematic'     — eco temático entre os testamentos
 */

export type PropheticConnectionType =
  | 'messianic'
  | 'typological'
  | 'fulfillment'
  | 'thematic';

export interface PropheticConnection {
  id:              string;
  theme:           string;
  category:        string;

  ot: {
    bookSlug:  string;
    bookName:  string;
    reference: string;   // "Isaías 7:14"
    abbrev:    string;
    chapter:   number;
    verseStart: number;
    verseEnd?:  number;
    preview:   string;   // trecho do texto
  };

  nt: {
    bookSlug:  string;
    bookName:  string;
    reference: string;
    abbrev:    string;
    chapter:   number;
    verseStart: number;
    verseEnd?:  number;
    preview:   string;
  };

  connectionType: PropheticConnectionType;
  note:           string;  // explicação teológica curta
}

export const PROPHETIC_CONNECTIONS: PropheticConnection[] = [
  // ── NASCIMENTO E INFÂNCIA ──────────────────────────────────────
  {
    id: 'pc-001',
    theme: 'Nascimento virginal',
    category: 'Nascimento e Infância',
    ot: { bookSlug:'is', bookName:'Isaías', reference:'Isaías 7:14', abbrev:'Is', chapter:7, verseStart:14,
          preview:'A virgem conceberá e dará à luz um filho, e chamará o seu nome Emanuel.' },
    nt: { bookSlug:'mt', bookName:'Mateus', reference:'Mateus 1:23', abbrev:'Mt', chapter:1, verseStart:23,
          preview:'Eis que a virgem conceberá e dará à luz um filho, e o seu nome será Emanuel.' },
    connectionType: 'fulfillment',
    note: 'Mateus cita explicitamente Isaías 7:14 como cumprido no nascimento de Jesus por Maria.',
  },
  {
    id: 'pc-002',
    theme: 'Nascimento em Belém',
    category: 'Nascimento e Infância',
    ot: { bookSlug:'mq', bookName:'Miqueias', reference:'Miqueias 5:2', abbrev:'Mq', chapter:5, verseStart:2,
          preview:'Tu, Belém Efrata, pequena entre os milhares de Judá, de ti me sairá o que há de reinar em Israel.' },
    nt: { bookSlug:'mt', bookName:'Mateus', reference:'Mateus 2:6', abbrev:'Mt', chapter:2, verseStart:6,
          preview:'E tu, Belém, terra de Judá, de modo algum és a menor entre os príncipes de Judá.' },
    connectionType: 'fulfillment',
    note: 'Os magos e sacerdotes identificaram Belém como local do nascimento do Messias com base em Miqueias.',
  },
  {
    id: 'pc-003',
    theme: 'Fuga para o Egito',
    category: 'Nascimento e Infância',
    ot: { bookSlug:'os', bookName:'Oséias', reference:'Oséias 11:1', abbrev:'Os', chapter:11, verseStart:1,
          preview:'Quando Israel era menino, eu o amei; do Egito chamei o meu filho.' },
    nt: { bookSlug:'mt', bookName:'Mateus', reference:'Mateus 2:15', abbrev:'Mt', chapter:2, verseStart:15,
          preview:'E ali ficou até à morte de Herodes; para que se cumprisse o que foi dito pelo Senhor.' },
    connectionType: 'fulfillment',
    note: 'Mateus aplica tipologicamente a saída do Egito de Israel à fuga e retorno de Jesus: Jesus recapitula a história de Israel.',
  },
  {
    id: 'pc-004',
    theme: 'Massacre dos inocentes',
    category: 'Nascimento e Infância',
    ot: { bookSlug:'jr', bookName:'Jeremias', reference:'Jeremias 31:15', abbrev:'Jr', chapter:31, verseStart:15,
          preview:'Uma voz se ouviu em Ramá, lamentação e amargo pranto: Raquel chorando os seus filhos.' },
    nt: { bookSlug:'mt', bookName:'Mateus', reference:'Mateus 2:17-18', abbrev:'Mt', chapter:2, verseStart:17, verseEnd:18,
          preview:'Então se cumpriu o que foi dito pelo profeta Jeremias, dizendo: Em Ramá ouviu-se uma voz.' },
    connectionType: 'fulfillment',
    note: 'Jeremias lamenta o exílio. Mateus aplica o texto ao choro das mães após o massacre de Herodes.',
  },
  // ── MINISTÉRIO ──────────────────────────────────────────────────
  {
    id: 'pc-005',
    theme: 'Ministério na Galileia',
    category: 'Ministério',
    ot: { bookSlug:'is', bookName:'Isaías', reference:'Isaías 9:1-2', abbrev:'Is', chapter:9, verseStart:1, verseEnd:2,
          preview:'O povo que andava em trevas viu uma grande luz; os que habitavam na região da sombra da morte.' },
    nt: { bookSlug:'mt', bookName:'Mateus', reference:'Mateus 4:15-16', abbrev:'Mt', chapter:4, verseStart:15, verseEnd:16,
          preview:'Terra de Zebulom e terra de Naftali, o povo que estava em trevas viu uma grande luz.' },
    connectionType: 'fulfillment',
    note: 'O início do ministério de Jesus na Galileia cumpre a profecia de Isaías sobre a região desprezada.',
  },
  {
    id: 'pc-006',
    theme: 'Preparação do caminho',
    category: 'Ministério',
    ot: { bookSlug:'ml', bookName:'Malaquias', reference:'Malaquias 3:1', abbrev:'Ml', chapter:3, verseStart:1,
          preview:'Eis que envio o meu mensageiro, que preparará o caminho diante de mim.' },
    nt: { bookSlug:'mt', bookName:'Mateus', reference:'Mateus 11:10', abbrev:'Mt', chapter:11, verseStart:10,
          preview:'Eis que eu envio diante da tua face o meu anjo, o qual preparará o teu caminho diante de ti.' },
    connectionType: 'fulfillment',
    note: 'Jesus identifica João Batista como o mensageiro profetizado por Malaquias — Elias que haveria de vir.',
  },
  {
    id: 'pc-007',
    theme: 'Entrada triunfal',
    category: 'Ministério',
    ot: { bookSlug:'zc', bookName:'Zacarias', reference:'Zacarias 9:9', abbrev:'Zc', chapter:9, verseStart:9,
          preview:'Exulta muito, filha de Sião; dá grandes gritos, filha de Jerusalém; eis que o teu Rei vem a ti.' },
    nt: { bookSlug:'mt', bookName:'Mateus', reference:'Mateus 21:5', abbrev:'Mt', chapter:21, verseStart:5,
          preview:'Dizei à filha de Sião: Eis que o teu Rei te vem, humilde, e montado num jumento.' },
    connectionType: 'fulfillment',
    note: 'A entrada de Jesus em Jerusalém montado num jumento cumpre precisamente Zacarias 9:9.',
  },
  {
    id: 'pc-008',
    theme: 'Trinta moedas de prata',
    category: 'Traição e Julgamento',
    ot: { bookSlug:'zc', bookName:'Zacarias', reference:'Zacarias 11:12-13', abbrev:'Zc', chapter:11, verseStart:12, verseEnd:13,
          preview:'Pesaram-me o meu salário: trinta moedas de prata... e lancei-as à casa do Senhor.' },
    nt: { bookSlug:'mt', bookName:'Mateus', reference:'Mateus 27:9-10', abbrev:'Mt', chapter:27, verseStart:9, verseEnd:10,
          preview:'Então se cumpriu o que foi dito pelo profeta Jeremias, dizendo: tomaram as trinta moedas de prata.' },
    connectionType: 'fulfillment',
    note: 'O preço da traição de Judas e o uso do dinheiro para comprar o campo do oleiro cumprem Zacarias 11.',
  },
  // ── SOFRIMENTO E MORTE ──────────────────────────────────────────
  {
    id: 'pc-009',
    theme: 'Clamor do abandonado',
    category: 'Paixão',
    ot: { bookSlug:'sl', bookName:'Salmos', reference:'Salmos 22:1', abbrev:'Sl', chapter:22, verseStart:1,
          preview:'Deus meu, Deus meu, por que me abandonaste?' },
    nt: { bookSlug:'mt', bookName:'Mateus', reference:'Mateus 27:46', abbrev:'Mt', chapter:27, verseStart:46,
          preview:'Eli, Eli, lamá sabactâni? Que quer dizer: Deus meu, Deus meu, por que me abandonaste?' },
    connectionType: 'fulfillment',
    note: 'O Salmo 22 descreve o sofrimento do justo abandonado. Jesus cita este salmo na cruz em cumprimento direto.',
  },
  {
    id: 'pc-010',
    theme: 'Sorteio das vestes',
    category: 'Paixão',
    ot: { bookSlug:'sl', bookName:'Salmos', reference:'Salmos 22:18', abbrev:'Sl', chapter:22, verseStart:18,
          preview:'Repartem entre si as minhas vestes e sobre a minha túnica lançam sortes.' },
    nt: { bookSlug:'jo', bookName:'João', reference:'João 19:24', abbrev:'Jo', chapter:19, verseStart:24,
          preview:'Fizeram isso para que se cumprisse a Escritura: Repartem entre si as minhas vestes.' },
    connectionType: 'fulfillment',
    note: 'João cita explicitamente o Salmo 22:18 ao descrever os soldados sorteando as vestes de Jesus.',
  },
  {
    id: 'pc-011',
    theme: 'Fel e vinagre',
    category: 'Paixão',
    ot: { bookSlug:'sl', bookName:'Salmos', reference:'Salmos 69:21', abbrev:'Sl', chapter:69, verseStart:21,
          preview:'Deram-me também fel por mantimento; e na minha sede me deram a beber vinagre.' },
    nt: { bookSlug:'jo', bookName:'João', reference:'João 19:29', abbrev:'Jo', chapter:19, verseStart:29,
          preview:'Havia ali um vaso cheio de vinagre; e eles, enchendo uma esponja de vinagre... puseram-na à sua boca.' },
    connectionType: 'fulfillment',
    note: 'O detalhe do vinagre oferecido a Jesus na cruz cumpre o Salmo 69, salmo do justo sofredor.',
  },
  {
    id: 'pc-012',
    theme: 'Ossos não quebrados',
    category: 'Paixão',
    ot: { bookSlug:'sl', bookName:'Salmos', reference:'Salmos 34:20', abbrev:'Sl', chapter:34, verseStart:20,
          preview:'Ele guarda todos os seus ossos; nem um deles será quebrado.' },
    nt: { bookSlug:'jo', bookName:'João', reference:'João 19:36', abbrev:'Jo', chapter:19, verseStart:36,
          preview:'Porque estas coisas sucederam para que se cumprisse a Escritura: Nenhum osso seu será quebrado.' },
    connectionType: 'fulfillment',
    note: 'A decisão dos soldados de não quebrar as pernas de Jesus (já morto) cumpre o Salmo 34:20 e Êxodo 12:46.',
  },
  {
    id: 'pc-013',
    theme: 'Lado traspassado',
    category: 'Paixão',
    ot: { bookSlug:'zc', bookName:'Zacarias', reference:'Zacarias 12:10', abbrev:'Zc', chapter:12, verseStart:10,
          preview:'Olharão para mim, a quem traspassaram, e o prantearão.' },
    nt: { bookSlug:'jo', bookName:'João', reference:'João 19:37', abbrev:'Jo', chapter:19, verseStart:37,
          preview:'E também outra Escritura diz: Verão a quem traspassaram.' },
    connectionType: 'fulfillment',
    note: 'João cita Zacarias 12:10 ao descrever o golpe da lança no lado de Jesus na cruz.',
  },
  {
    id: 'pc-014',
    theme: 'O servo sofredor',
    category: 'Paixão',
    ot: { bookSlug:'is', bookName:'Isaías', reference:'Isaías 53:5-6', abbrev:'Is', chapter:53, verseStart:5, verseEnd:6,
          preview:'Mas ele foi traspassado pelas nossas transgressões... O castigo que nos traz a paz estava sobre ele.' },
    nt: { bookSlug:'1pe', bookName:'1 Pedro', reference:'1 Pedro 2:24-25', abbrev:'1Pe', chapter:2, verseStart:24, verseEnd:25,
          preview:'Ele mesmo levou em seu corpo os nossos pecados sobre o madeiro... pelas suas chagas fostes sarados.' },
    connectionType: 'fulfillment',
    note: 'Isaías 53 é o capítulo mais citado no NT. Pedro o aplica diretamente à obra expiatória de Cristo.',
  },
  {
    id: 'pc-015',
    theme: 'Sepultado com os ricos',
    category: 'Paixão',
    ot: { bookSlug:'is', bookName:'Isaías', reference:'Isaías 53:9', abbrev:'Is', chapter:53, verseStart:9,
          preview:'E com os ricos na sua morte... porque nunca praticou violência, nem havia engano na sua boca.' },
    nt: { bookSlug:'mt', bookName:'Mateus', reference:'Mateus 27:57-60', abbrev:'Mt', chapter:27, verseStart:57, verseEnd:60,
          preview:'Veio um homem rico de Arimateia... tomou o corpo de Jesus e envolveu-o em linho limpo.' },
    connectionType: 'fulfillment',
    note: 'O sepultamento de Jesus no túmulo de José de Arimateia, homem rico, cumpre a profecia de Isaías.',
  },
  {
    id: 'pc-016',
    theme: 'Traído por amigo íntimo',
    category: 'Traição e Julgamento',
    ot: { bookSlug:'sl', bookName:'Salmos', reference:'Salmos 41:9', abbrev:'Sl', chapter:41, verseStart:9,
          preview:'Sim, o meu próprio familiar, em quem eu confiava, que comia o meu pão, levantou o calcanhar contra mim.' },
    nt: { bookSlug:'jo', bookName:'João', reference:'João 13:18', abbrev:'Jo', chapter:13, verseStart:18,
          preview:'Mas para que a Escritura se cumpra: O que come o pão comigo levantou contra mim o seu calcanhar.' },
    connectionType: 'fulfillment',
    note: 'Jesus cita o Salmo 41:9 na Última Ceia, identificando Judas como o cumprimento desta profecia.',
  },
  // ── RESSURREIÇÃO E EXALTAÇÃO ─────────────────────────────────────
  {
    id: 'pc-017',
    theme: 'Ressurreição — não verá corrupção',
    category: 'Ressurreição',
    ot: { bookSlug:'sl', bookName:'Salmos', reference:'Salmos 16:10', abbrev:'Sl', chapter:16, verseStart:10,
          preview:'Porque não abandonarás a minha alma no Seol; nem permitirás que o teu Santo veja corrupção.' },
    nt: { bookSlug:'at', bookName:'Atos', reference:'Atos 2:31', abbrev:'At', chapter:2, verseStart:31,
          preview:'Ele, prevendo isso, falou acerca da ressurreição de Cristo: que a sua alma não foi deixada no Hades.' },
    connectionType: 'messianic',
    note: 'Pedro no Pentecostes argumenta que Davi não falava de si mesmo (pois morreu) mas do Messias ressurreto.',
  },
  {
    id: 'pc-018',
    theme: 'Assentado à direita',
    category: 'Ressurreição',
    ot: { bookSlug:'sl', bookName:'Salmos', reference:'Salmos 110:1', abbrev:'Sl', chapter:110, verseStart:1,
          preview:'O Senhor disse ao meu Senhor: Assenta-te à minha direita, até que eu ponha os teus inimigos por escabelo.' },
    nt: { bookSlug:'mt', bookName:'Mateus', reference:'Mateus 22:44', abbrev:'Mt', chapter:22, verseStart:44,
          preview:'O Senhor disse ao meu Senhor: Assenta-te à minha direita, até que eu ponha os teus inimigos debaixo dos teus pés.' },
    connectionType: 'messianic',
    note: 'O Salmo 110 é o mais citado no NT. Jesus o usa para provar sua divindade; Pedro o cita na ascensão.',
  },
  // ── TIPOS E SOMBRAS ──────────────────────────────────────────────
  {
    id: 'pc-019',
    theme: 'Cordeiro pascal',
    category: 'Tipos e Sombras',
    ot: { bookSlug:'ex', bookName:'Êxodo', reference:'Êxodo 12:46', abbrev:'Ex', chapter:12, verseStart:46,
          preview:'Não deixareis nada dele para o dia seguinte... e não quebrareis osso algum.' },
    nt: { bookSlug:'jo', bookName:'João', reference:'João 19:36', abbrev:'Jo', chapter:19, verseStart:36,
          preview:'Porque estas coisas sucederam para que se cumprisse a Escritura: Nenhum osso seu será quebrado.' },
    connectionType: 'typological',
    note: 'O cordeiro da Páscoa era tipo de Cristo. Paulo o declara: "Cristo, nossa páscoa, foi imolado por nós." (1Co 5:7)',
  },
  {
    id: 'pc-020',
    theme: 'Serpente de bronze',
    category: 'Tipos e Sombras',
    ot: { bookSlug:'nm', bookName:'Números', reference:'Números 21:8-9', abbrev:'Nm', chapter:21, verseStart:8, verseEnd:9,
          preview:'O Senhor disse a Moisés: Faze uma serpente ardente... todo o que for picado, olhará para ela e viverá.' },
    nt: { bookSlug:'jo', bookName:'João', reference:'João 3:14-15', abbrev:'Jo', chapter:3, verseStart:14, verseEnd:15,
          preview:'Como Moisés levantou a serpente no deserto, assim importa que o Filho do homem seja levantado.' },
    connectionType: 'typological',
    note: 'Jesus usa a serpente de bronze como tipo de sua crucificação — o símbolo do pecado levantado para cura de Israel.',
  },
  {
    id: 'pc-021',
    theme: 'Maná do céu',
    category: 'Tipos e Sombras',
    ot: { bookSlug:'ex', bookName:'Êxodo', reference:'Êxodo 16:15', abbrev:'Ex', chapter:16, verseStart:15,
          preview:'E o povo de Israel o chamou maná... seu sabor era como bolos de mel.' },
    nt: { bookSlug:'jo', bookName:'João', reference:'João 6:32-33', abbrev:'Jo', chapter:6, verseStart:32, verseEnd:33,
          preview:'Moisés não vos deu o pão do céu; mas meu Pai vos dá o verdadeiro pão do céu.' },
    connectionType: 'typological',
    note: 'Jesus se declara o "pão da vida" que o maná apenas prefigurava — o sustento espiritual verdadeiro.',
  },
  {
    id: 'pc-022',
    theme: 'Sacrifício de Isaque',
    category: 'Tipos e Sombras',
    ot: { bookSlug:'gn', bookName:'Gênesis', reference:'Gênesis 22:2', abbrev:'Gn', chapter:22, verseStart:2,
          preview:'Toma agora o teu filho, o teu único filho Isaque, a quem amas, e vai à terra de Moriá.' },
    nt: { bookSlug:'hb', bookName:'Hebreus', reference:'Hebreus 11:19', abbrev:'Hb', chapter:11, verseStart:19,
          preview:'Considerando que Deus é poderoso para ressuscitar até os mortos; de onde também em figura o recobrou.' },
    connectionType: 'typological',
    note: 'Abraão oferecendo Isaque é tipo do Pai oferecendo o Filho único. Hebreus e João 3:16 paralelos.',
  },
  {
    id: 'pc-023',
    theme: 'O sumo sacerdote eterno',
    category: 'Sacerdócio',
    ot: { bookSlug:'sl', bookName:'Salmos', reference:'Salmos 110:4', abbrev:'Sl', chapter:110, verseStart:4,
          preview:'O Senhor jurou e não se arrependera: Tu és sacerdote para sempre, segundo a ordem de Melquisedeque.' },
    nt: { bookSlug:'hb', bookName:'Hebreus', reference:'Hebreus 7:17', abbrev:'Hb', chapter:7, verseStart:17,
          preview:'Porque está atestado: Tu és sacerdote para sempre, segundo a ordem de Melquisedeque.' },
    connectionType: 'fulfillment',
    note: 'Hebreus desenvolve amplamente que Jesus é o Sumo Sacerdote eterno na ordem de Melquisedeque.',
  },
  {
    id: 'pc-024',
    theme: 'Nova aliança',
    category: 'Aliança',
    ot: { bookSlug:'jr', bookName:'Jeremias', reference:'Jeremias 31:31-33', abbrev:'Jr', chapter:31, verseStart:31, verseEnd:33,
          preview:'Porei a minha lei no seu interior e a escreverei no seu coração; serei o seu Deus e eles serão o meu povo.' },
    nt: { bookSlug:'hb', bookName:'Hebreus', reference:'Hebreus 8:8-10', abbrev:'Hb', chapter:8, verseStart:8, verseEnd:10,
          preview:'Eis que dias virão, diz o Senhor, quando firmarei nova aliança com a casa de Israel.' },
    connectionType: 'fulfillment',
    note: 'A nova aliança profetizada por Jeremias é explicitamente cumprida na aliança do sangue de Cristo na Ceia.',
  },
  {
    id: 'pc-025',
    theme: 'Derramamento do Espírito',
    category: 'Pentecostes',
    ot: { bookSlug:'jl', bookName:'Joel', reference:'Joel 2:28-29', abbrev:'Jl', chapter:2, verseStart:28, verseEnd:29,
          preview:'E acontecerá depois que derramarei o meu Espírito sobre toda a carne... vossos filhos e vossas filhas profetizarão.' },
    nt: { bookSlug:'at', bookName:'Atos', reference:'Atos 2:16-17', abbrev:'At', chapter:2, verseStart:16, verseEnd:17,
          preview:'Mas isto é o que foi dito pelo profeta Joel: E nos últimos dias acontecerá que derramarei do meu Espírito.' },
    connectionType: 'fulfillment',
    note: 'Pedro identifica o derramamento do Espírito no Pentecostes como cumprimento da profecia de Joel.',
  },
  {
    id: 'pc-026',
    theme: 'Bênção a todas as nações',
    category: 'Missão',
    ot: { bookSlug:'gn', bookName:'Gênesis', reference:'Gênesis 12:3', abbrev:'Gn', chapter:12, verseStart:3,
          preview:'E em ti serão benditas todas as famílias da terra.' },
    nt: { bookSlug:'gl', bookName:'Gálatas', reference:'Gálatas 3:8', abbrev:'Gl', chapter:3, verseStart:8,
          preview:'E a Escritura, prevendo que Deus havia de justificar os gentios pela fé, anunciou antecipadamente a Abraão: Em ti serão benditas todas as nações.' },
    connectionType: 'fulfillment',
    note: 'Paulo identifica a promessa abraâmica como o evangelho preganunciado — justificação pela fé para todas as nações.',
  },
  {
    id: 'pc-027',
    theme: 'Pedra angular rejeitada',
    category: 'Rejeição e Glória',
    ot: { bookSlug:'sl', bookName:'Salmos', reference:'Salmos 118:22', abbrev:'Sl', chapter:118, verseStart:22,
          preview:'A pedra que os edificadores rejeitaram tornou-se a pedra angular.' },
    nt: { bookSlug:'mt', bookName:'Mateus', reference:'Mateus 21:42', abbrev:'Mt', chapter:21, verseStart:42,
          preview:'Nunca lestes nas Escrituras: A pedra que os edificadores rejeitaram tornou-se a principal pedra do ângulo?' },
    connectionType: 'messianic',
    note: 'Jesus cita o Salmo 118 para descrever sua rejeição pelos líderes religiosos e sua exaltação.',
  },
  {
    id: 'pc-028',
    theme: 'O profeta como Moisés',
    category: 'Identidade do Messias',
    ot: { bookSlug:'dt', bookName:'Deuteronômio', reference:'Deuteronômio 18:15', abbrev:'Dt', chapter:18, verseStart:15,
          preview:'O Senhor teu Deus te suscitará um profeta do meio de ti, de teus irmãos, semelhante a mim.' },
    nt: { bookSlug:'at', bookName:'Atos', reference:'Atos 3:22', abbrev:'At', chapter:3, verseStart:22,
          preview:'Moisés disse: O Senhor vosso Deus vos levantará um profeta dos vossos irmãos, semelhante a mim.' },
    connectionType: 'messianic',
    note: 'Pedro e Estêvão identificam Jesus como o cumprimento da profecia de Moisés sobre o profeta escatológico.',
  },
  {
    id: 'pc-029',
    theme: 'Emmanuel — Deus conosco',
    category: 'Identidade do Messias',
    ot: { bookSlug:'is', bookName:'Isaías', reference:'Isaías 9:6', abbrev:'Is', chapter:9, verseStart:6,
          preview:'Porque um menino nos nasceu, um filho se nos deu... e o seu nome se chamará: Maravilhoso Conselheiro, Deus Forte.' },
    nt: { bookSlug:'jo', bookName:'João', reference:'João 1:1', abbrev:'Jo', chapter:1, verseStart:1,
          preview:'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.' },
    connectionType: 'thematic',
    note: 'O título "Deus Forte" (El Gibbor) em Isaías prefigura a plena revelação da divindade de Cristo em João 1.',
  },
  {
    id: 'pc-030',
    theme: 'Glória do templo — preenchida',
    category: 'Tipos e Sombras',
    ot: { bookSlug:'ag', bookName:'Ageu', reference:'Ageu 2:9', abbrev:'Ag', chapter:2, verseStart:9,
          preview:'A glória desta última casa será maior do que a da primeira, diz o Senhor dos Exércitos.' },
    nt: { bookSlug:'jo', bookName:'João', reference:'João 2:19-21', abbrev:'Jo', chapter:2, verseStart:19, verseEnd:21,
          preview:'Jesus respondeu e disse-lhes: Destruí este templo e em três dias o levantarei. Mas ele falava do templo do seu corpo.' },
    connectionType: 'typological',
    note: 'Jesus é o verdadeiro templo — presença de Deus encarnada que substitui e supera o templo físico.',
  },
];

export const PROPHETIC_CATEGORIES = [
  'Todos',
  'Nascimento e Infância',
  'Ministério',
  'Traição e Julgamento',
  'Paixão',
  'Ressurreição',
  'Tipos e Sombras',
  'Sacerdócio',
  'Aliança',
  'Pentecostes',
  'Missão',
  'Rejeição e Glória',
  'Identidade do Messias',
] as const;

export type PropheticCategory = typeof PROPHETIC_CATEGORIES[number];

export const CONNECTION_TYPE_LABELS: Record<PropheticConnectionType, string> = {
  messianic:    'Profecia Messiânica',
  typological:  'Tipo / Sombra',
  fulfillment:  'Cumprimento Explícito',
  thematic:     'Eco Temático',
};

export const CONNECTION_TYPE_COLORS: Record<PropheticConnectionType, string> = {
  fulfillment:  '#4A7C59',  // verde
  messianic:    '#8B6340',  // marrom
  typological:  '#4A5C8B',  // azul
  thematic:     '#7A4A8B',  // roxo
};