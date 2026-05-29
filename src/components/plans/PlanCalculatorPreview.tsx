/**
 * VERBUM — Plans: PlanCalculatorPreview
 *
 * Card de pré-visualização do cálculo do plano em tempo real.
 * Exibido no Passo 3 do CreatePlanModal enquanto o usuário digita.
 */

import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { PlanCalculationResult, PlanWarning } from '../../engine/PlanCalculator';
import { formatMinutes } from '../../utils/formatters';
import { formatShortDate } from '../../utils/dateUtils';

interface PlanCalculatorPreviewProps {
  result: PlanCalculationResult | null;
  isLoading?: boolean;
}

const WARNING_MESSAGES: Record<PlanWarning, string> = {
  time_below_minimum: 'Tempo muito curto — menos de 1 capítulo por sessão.',
  adjusted_to_one_chapter: 'Tempo ajustado para o mínimo de 1 cap/dia.',
  aggressive_pace: 'Ritmo acelerado — exige disciplina diária.',
  very_aggressive_pace: 'Ritmo muito intenso — considere ampliar o prazo.',
  deadline_very_soon: 'Prazo em menos de 7 dias.',
};

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  const { tokens } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
      <Text style={{ fontSize: 14, color: tokens.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: accent ? tokens.actionPrimary : tokens.textPrimary }}>
        {value}
      </Text>
    </View>
  );
}

export function PlanCalculatorPreview({ result, isLoading }: PlanCalculatorPreviewProps) {
  const { tokens } = useTheme();

  if (isLoading) {
    return (
      <View style={{ backgroundColor: tokens.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: tokens.borderLight, alignItems: 'center', paddingVertical: 24 }}>
        <Text style={{ fontSize: 14, color: tokens.textTertiary }}>Calculando…</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={{ backgroundColor: tokens.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: tokens.borderLight, alignItems: 'center', paddingVertical: 24 }}>
        <Text style={{ fontSize: 14, color: tokens.textTertiary }}>Preencha os campos acima para ver a previsão.</Text>
      </View>
    );
  }

  const { chaptersPerDay, minutesPerDay, totalChapters, estimatedEndDate, totalActiveDays, warnings, isAggressive, isVeryAggressive } = result;

  const borderColor = isVeryAggressive
    ? tokens.warning
    : isAggressive
      ? tokens.warningBg
      : tokens.borderLight;

  return (
    <View style={{ backgroundColor: tokens.bgCard, borderRadius: 14, padding: 20, borderWidth: 1.5, borderColor, gap: 4 }}>
      {/* Cabeçalho */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <MaterialCommunityIcons name="calendar-check-outline" size={18} color={tokens.actionPrimary} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.textPrimary }}>Previsão do Plano</Text>
      </View>

      {/* Métricas */}
      <Row label="Capítulos por dia" value={`${chaptersPerDay} cap${chaptersPerDay !== 1 ? 's' : ''}`} accent />
      <Row label="Tempo estimado/dia" value={`~${formatMinutes(minutesPerDay)}`} />
      <Row label="Total de capítulos" value={`${totalChapters}`} />
      <Row label="Dias de leitura" value={`${totalActiveDays} dias`} />
      <Row label="Conclusão estimada" value={formatShortDate(estimatedEndDate)} accent />

      {/* Divisor */}
      <View style={{ height: 1, backgroundColor: tokens.borderLight, marginVertical: 8 }} />

      {/* Warnings */}
      {warnings.length > 0 && (
        <View style={{ gap: 6 }}>
          {warnings.map(w => (
            <View key={w} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <MaterialCommunityIcons
                name={w.includes('aggressive') ? 'alert' : 'information-outline'}
                size={14}
                color={w.includes('very') ? tokens.warning : tokens.info}
                style={{ marginTop: 1 }}
              />
              <Text style={{ flex: 1, fontSize: 12, color: w.includes('very') ? tokens.warningText : tokens.infoText, lineHeight: 18 }}>
                {WARNING_MESSAGES[w]}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

