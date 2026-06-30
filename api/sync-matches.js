// api/sync-matches.js
// Fonction Vercel qui tourne toutes les heures
// Elle récupère les vrais matchs et scores depuis football-data.org
// et met à jour Supabase automatiquement

const FOOTBALL_API_KEY = 'ed98aad678ef4108ac3ef1a8fd038b4b';
const FOOTBALL_API_URL = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026';

const SUPABASE_URL = 'https://pvyyubghngyqjpxecjmb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // clé service dans les variables Vercel

// Correspondance drapeaux
const FLAGS = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷',
  'Canada': '🇨🇦', 'Switzerland': '🇨🇭', 'Qatar': '🇶🇦',
  'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'USA': '🇺🇸', 'Australia': '🇦🇺', 'Paraguay': '🇵🇾',
  'Germany': '🇩🇪', 'Curaçao': '🇨🇼', 'Netherlands': '🇳🇱',
  'Japan': '🇯🇵', "Côte d'Ivoire": '🇨🇮', 'Ecuador': '🇪🇨', 'Tunisia': '🇹🇳',
  'Spain': '🇪🇸', 'Cape Verde': '🇨🇻', 'Belgium': '🇧🇪', 'Egypt': '🇪🇬',
  'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾', 'Iran': '🇮🇷', 'New Zealand': '🇳🇿',
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Norway': '🇳🇴',
  'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Ghana': '🇬🇭', 'Panama': '🇵🇦',
  'Denmark': '🇩🇰', 'Italy': '🇮🇹', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Turkey': '🇹🇷', 'Romania': '🇷🇴', 'Slovakia': '🇸🇰',
  'Ukraine': '🇺🇦', 'Sweden': '🇸🇪', 'Poland': '🇵🇱',
  'DRC': '🇨🇩', 'Jamaica': '🇯🇲',
};

// Traduction noms équipes EN -> FR
const TEAM_FR = {
  'Mexico': 'Mexique', 'South Africa': 'Afrique du Sud', 'South Korea': 'Corée du Sud',
  'Canada': 'Canada', 'Switzerland': 'Suisse', 'Qatar': 'Qatar',
  'Brazil': 'Brésil', 'Morocco': 'Maroc', 'Haiti': 'Haïti', 'Scotland': 'Écosse',
  'USA': 'États-Unis', 'Australia': 'Australie', 'Paraguay': 'Paraguay',
  'Germany': 'Allemagne', 'Netherlands': 'Pays-Bas', 'Japan': 'Japon',
  "Côte d'Ivoire": "Côte d'Ivoire", 'Ecuador': 'Équateur', 'Tunisia': 'Tunisie',
  'Spain': 'Espagne', 'Cape Verde': 'Cap-Vert', 'Belgium': 'Belgique', 'Egypt': 'Égypte',
  'Saudi Arabia': 'Arabie Saoudite', 'Uruguay': 'Uruguay', 'Iran': 'Iran',
  'New Zealand': 'Nouvelle-Zélande', 'France': 'France', 'Senegal': 'Sénégal',
  'Norway': 'Norvège', 'Argentina': 'Argentine', 'Algeria': 'Algérie',
  'Austria': 'Autriche', 'Jordan': 'Jordanie', 'Portugal': 'Portugal',
  'Uzbekistan': 'Ouzbékistan', 'Colombia': 'Colombie', 'England': 'Angleterre',
  'Croatia': 'Croatie', 'Ghana': 'Ghana', 'Panama': 'Panama',
  'Denmark': 'Danemark', 'Italy': 'Italie', 'Wales': 'Pays de Galles',
  'Turkey': 'Turquie', 'Romania': 'Roumanie', 'Slovakia': 'Slovaquie',
  'Ukraine': 'Ukraine', 'Sweden': 'Suède', 'Poland': 'Pologne',
  'DRC': 'RD Congo', 'DR Congo': 'RD Congo', 'Congo DR': 'RD Congo',
  'Jamaica': 'Jamaïque', 'Hungary': 'Hongrie', 'Serbia': 'Serbie',
  'Nigeria': 'Nigéria', 'Venezuela': 'Venezuela', 'Chile': 'Chili',
  'Honduras': 'Honduras', 'Costa Rica': 'Costa Rica',
  'Curacao': 'Curaçao', 'Curaçao': 'Curaçao',
  'Iraq': 'Irak', 'Greece': 'Grèce', 'Cameroon': 'Cameroun',
  'Ivory Coast': "Côte d'Ivoire", 'United States': 'États-Unis',
  'Korea Republic': 'Corée du Sud', 'Republic of Korea': 'Corée du Sud',
  'IR Iran': 'Iran', 'Cape Verde Islands': 'Cap-Vert',
  'Bosnia and Herzegovina': 'Bosnie-Herzégovine', 'Bosnia-Herzegovina': 'Bosnie-Herzégovine',
  'North Macedonia': 'Macédoine du Nord',
  'Czech Republic': 'Tchéquie', 'Czechia': 'Tchéquie',
  'Kyrgyzstan': 'Kirghizstan', 'Tajikistan': 'Tadjikistan',
  'Turkmenistan': 'Turkménistan', 'Kazakhstan': 'Kazakhstan',
  'El Salvador': 'El Salvador', 'Cuba': 'Cuba', 'Guatemala': 'Guatemala',
  'Suriname': 'Suriname', 'Trinidad and Tobago': 'Trinité-et-Tobago',
  'Bahrain': 'Bahreïn', 'Oman': 'Oman', 'Kuwait': 'Koweït',
  'Palestine': 'Palestine', 'Thailand': 'Thaïlande', 'Vietnam': 'Vietnam',
  'Indonesia': 'Indonésie', 'China PR': 'Chine', 'China': 'Chine',
  'India': 'Inde', 'Philippines': 'Philippines',
  'Tanzania': 'Tanzanie', 'Zambia': 'Zambie', 'Zimbabwe': 'Zimbabwe',
  'Uganda': 'Ouganda', 'Kenya': 'Kenya', 'Ethiopia': 'Éthiopie',
  'Libya': 'Libye', 'Mali': 'Mali', 'Guinea': 'Guinée',
  'Mozambique': 'Mozambique', 'Gabon': 'Gabon',
};

function getFlag(name) {
  return FLAGS[name] || '🏳️';
}

function frName(name) {
  return TEAM_FR[name] || name;
}

function getStatus(match) {
  if (['FINISHED', 'AWARDED'].includes(match.status)) return 'done';
  if (['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(match.status)) return 'live';
  return 'upcoming';
}

function getGroupName(match) {
  if (match.stage === 'GROUP_STAGE') return 'Groupe ' + match.group?.replace('GROUP_', '');
  if (match.stage === 'ROUND_OF_32' || match.stage === 'LAST_32') return '16es de finale';
  if (match.stage === 'ROUND_OF_16' || match.stage === 'LAST_16') return '8es de finale';
  if (match.stage === 'QUARTER_FINALS') return 'Quart de finale';
  if (match.stage === 'SEMI_FINALS') return 'Demi-finale';
  if (match.stage === 'THIRD_PLACE') return 'Match 3ème place';
  if (match.stage === 'FINAL') return 'Finale';
  return match.stage;
}

async function supabaseRequest(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': method === 'POST' ? 'resolution=merge-duplicates' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

function matchOutcome(s1, s2, winnerField) {
  if (s1 > s2) return 'team1';
  if (s1 < s2) return 'team2';
  return winnerField || 'draw';
}

async function calculateAndUpdatePoints(matchId, score1Real, score2Real, winnerField) {
  const res = await supabaseRequest(`/pronos?match_id=eq.${matchId}`, 'GET');
  const pronos = await res.json();
  if (!pronos || !pronos.length) return;

  const realOutcome = matchOutcome(score1Real, score2Real, winnerField);

  await Promise.all(pronos.map(p => {
    let pts = 0;
    if (p.score1 === score1Real && p.score2 === score2Real) {
      pts = 5; // Score exact
    } else if (matchOutcome(p.score1, p.score2, p.winner) === realOutcome) {
      pts = 3; // Bon vainqueur
    }
    return supabaseRequest(`/pronos?id=eq.${p.id}`, 'PATCH', { points: pts });
  }));
}

export default async function handler(req, res) {
  try {
    // 0. Récupérer l'état actuel des matchs en base (pour ne traiter que ce qui a changé)
    const existingRes = await supabaseRequest(
      '/matches?select=id,score1_real,score2_real,winner,status',
      'GET'
    );
    const existingMatches = await existingRes.json();
    const existingById = new Map((existingMatches || []).map(m => [m.id, m]));

    // 1. Récupérer les matchs depuis football-data.org
    const apiRes = await fetch(FOOTBALL_API_URL, {
      headers: { 'X-Auth-Token': FOOTBALL_API_KEY }
    });

    if (!apiRes.ok) {
      return res.status(500).json({ error: 'Erreur API football-data.org', status: apiRes.status });
    }

    const data = await apiRes.json();
    const matches = data.matches || [];

    const updatePayloads = [];
    const matchesToRecalc = [];

    for (const m of matches) {
      const team1 = frName(m.homeTeam?.name || 'À déterminer');
      const team2 = frName(m.awayTeam?.name || 'À déterminer');
      const flag1 = getFlag(m.homeTeam?.name || '');
      const flag2 = getFlag(m.awayTeam?.name || '');
      const status = getStatus(m);
      const groupName = getGroupName(m);

      // Date en français
      const d = new Date(m.utcDate);
      const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });
      const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });

      const isPenaltyShootout = m.score?.duration === 'PENALTY_SHOOTOUT';
      // Pour les TAB, fullTime inclut à tort le score des pénaltys : on prend le score réel (temps réglementaire + prolongation)
      const score1Real = isPenaltyShootout
        ? (m.score?.regularTime?.home ?? 0) + (m.score?.extraTime?.home ?? 0)
        : m.score?.fullTime?.home ?? null;
      const score2Real = isPenaltyShootout
        ? (m.score?.regularTime?.away ?? 0) + (m.score?.extraTime?.away ?? 0)
        : m.score?.fullTime?.away ?? null;
      // 'winner' ne sert qu'à indiquer le vainqueur aux tirs au but ('team1'/'team2'), null sinon
      const winnerField = isPenaltyShootout
        ? (m.score?.winner === 'HOME_TEAM' ? 'team1' : m.score?.winner === 'AWAY_TEAM' ? 'team2' : null)
        : null;
      const pen1 = isPenaltyShootout ? (m.score?.penalties?.home ?? null) : null;
      const pen2 = isPenaltyShootout ? (m.score?.penalties?.away ?? null) : null;

      updatePayloads.push({
        id: m.id,
        group_name: groupName,
        match_date: dateStr,
        match_time: timeStr,
        team1,
        flag1,
        team2,
        flag2,
        status,
        score1_real: score1Real,
        score2_real: score2Real,
        winner: winnerField,
        pen1,
        pen2,
      });

      // Ne recalculer les points que si le match vient de se terminer ou si le résultat a changé
      if (status === 'done' && score1Real !== null) {
        const prev = existingById.get(m.id);
        const changed = !prev
          || prev.status !== 'done'
          || prev.score1_real !== score1Real
          || prev.score2_real !== score2Real
          || prev.winner !== winnerField;
        if (changed) matchesToRecalc.push({ id: m.id, score1Real, score2Real, winnerField });
      }
    }

    // 2. Upsert de tous les matchs en un seul appel
    if (updatePayloads.length) {
      await supabaseRequest('/matches?on_conflict=id', 'POST', updatePayloads);
    }

    // 3. Recalcul des points uniquement pour les matchs modifiés, en parallèle
    await Promise.all(matchesToRecalc.map(mm =>
      calculateAndUpdatePoints(mm.id, mm.score1Real, mm.score2Real, mm.winnerField)
    ));

    return res.status(200).json({
      success: true,
      matchesUpdated: updatePayloads.length,
      matchesWithPoints: matchesToRecalc.length,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
