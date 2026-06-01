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
  'DRC': 'RD Congo', 'Jamaica': 'Jamaïque',
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
  if (match.stage === 'ROUND_OF_32') return 'Huitième de finale';
  if (match.stage === 'ROUND_OF_16') return 'Quart de finale';
  if (match.stage === 'QUARTER_FINALS') return 'Demi-finale';
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

async function calculateAndUpdatePoints(matchId, score1Real, score2Real) {
  // Récupérer tous les pronostics pour ce match
  const res = await supabaseRequest(`/pronos?match_id=eq.${matchId}`, 'GET');
  const pronos = await res.json();
  if (!pronos || !pronos.length) return;

  const getResult = (s1, s2) => s1 > s2 ? 1 : s1 < s2 ? -1 : 0;
  const realResult = getResult(score1Real, score2Real);

  for (const p of pronos) {
    let pts = 0;
    if (p.score1 === score1Real && p.score2 === score2Real) {
      pts = 5; // Score exact
    } else if (getResult(p.score1, p.score2) === realResult) {
      pts = 3; // Bon vainqueur
    }
    await supabaseRequest(`/pronos?id=eq.${p.id}`, 'PATCH', { points: pts });
  }
}

export default async function handler(req, res) {
  try {
    // 1. Récupérer les matchs depuis football-data.org
    const apiRes = await fetch(FOOTBALL_API_URL, {
      headers: { 'X-Auth-Token': FOOTBALL_API_KEY }
    });

    if (!apiRes.ok) {
      return res.status(500).json({ error: 'Erreur API football-data.org', status: apiRes.status });
    }

    const data = await apiRes.json();
    const matches = data.matches || [];

    let updated = 0;
    let pointsRecalculated = 0;

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

      const score1Real = m.score?.fullTime?.home ?? null;
      const score2Real = m.score?.fullTime?.away ?? null;

      const updateData = {
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
      };

      // Upsert dans Supabase
      await supabaseRequest('/matches', 'POST', updateData);
      updated++;

      // Recalculer les points si match terminé
      if (status === 'done' && score1Real !== null) {
        await calculateAndUpdatePoints(m.id, score1Real, score2Real);
        pointsRecalculated++;
      }
    }

    return res.status(200).json({
      success: true,
      matchesUpdated: updated,
      matchesWithPoints: pointsRecalculated,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
