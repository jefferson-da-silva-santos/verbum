/**
 * VERBUM — app/(app)/modals/create-plan.tsx
 * Wizard de 3 passos para criação de plano de leitura.
 */

import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme }      from '../../../src/context/ThemeContext';
import { useActivePlan } from '../../../src/hooks/useActivePlan';
import { PRESET_PLANS }  from '../../../src/constants/presetPlans';
import { BIBLE_BOOKS }   from '../../../src/constants/bible';
import { Button }        from '../../../src/components/ui/Button';
import { PlanCalculator } from '../../../src/engine/PlanCalculator';
import { todayIso }      from '../../../src/engine/dateHelpers';

export default function CreatePlanModal() {
  const { tokens }     = useTheme();
  const { createPlan } = useActivePlan();
  const { presetId }   = useLocalSearchParams<{ presetId?: string }>();

  const [step,    setStep]    = useState<1 | 2 | 3>(1);
  const [preset,  setPreset]  = useState(presetId ?? '');
  const [mode,    setMode]    = useState<'chapters' | 'time' | 'deadline'>('chapters');
  const [cpd,     setCpd]     = useState(3);
  const [loading, setLoading] = useState(false);

  const selectedPlan = PRESET_PLANS.find(p => p.id === preset);
  const bookSlugs    = selectedPlan?.bookSlugs ?? BIBLE_BOOKS.map(b => b.slug);

  const preview = PlanCalculator.preview({
    mode, bookSlugs, startDate: todayIso(), skipWeekdays: [],
    chaptersPerDay: mode === 'chapters' ? cpd : undefined,
    minutesPerDay:  mode === 'time'     ? cpd * 3.7 : undefined,
  });

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createPlan(
        { mode, bookSlugs, startDate: todayIso(), skipWeekdays: [], chaptersPerDay: cpd },
        selectedPlan?.name ?? 'Meu Plano',
      );
      router.back();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(s => (s - 1) as 1|2|3) : router.back()}>
          <MaterialCommunityIcons name={step > 1 ? 'arrow-left' : 'close'} size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>Criar Plano · Passo {step}/3</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* PASSO 1 */}
        {step === 1 && (
          <>
            <Text style={{ fontSize: 20, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary }}>O que você quer ler?</Text>
            {PRESET_PLANS.map(p => (
              <TouchableOpacity key={p.id} onPress={() => setPreset(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: preset === p.id ? tokens.actionPrimary : tokens.bgCard, borderRadius: 12, borderWidth: 1, borderColor: preset === p.id ? 'transparent' : tokens.borderLight }}>
                <MaterialCommunityIcons name={p.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={26} color={preset === p.id ? tokens.actionPrimaryText : tokens.actionPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: preset === p.id ? tokens.actionPrimaryText : tokens.textPrimary }}>{p.name}</Text>
                  <Text style={{ fontSize: 12, color: preset === p.id ? tokens.actionPrimaryText : tokens.textTertiary, opacity: 0.8 }}>{p.totalChapters} capítulos</Text>
                </View>
                {preset === p.id && <MaterialCommunityIcons name="check-circle" size={20} color={tokens.actionPrimaryText} />}
              </TouchableOpacity>
            ))}
            <Button label="Continuar" onPress={() => setStep(2)} disabled={!preset} fullWidth />
          </>
        )}

        {/* PASSO 2 */}
        {step === 2 && (
          <>
            <Text style={{ fontSize: 20, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary }}>Qual seu ritmo?</Text>
            {(['chapters', 'time', 'deadline'] as const).map(m => (
              <TouchableOpacity key={m} onPress={() => setMode(m)} style={{ padding: 16, borderRadius: 12, borderWidth: 1, backgroundColor: mode === m ? tokens.actionPrimary : tokens.bgCard, borderColor: mode === m ? 'transparent' : tokens.borderLight, gap: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: mode === m ? tokens.actionPrimaryText : tokens.textPrimary }}>
                  {m === 'chapters' ? 'Capítulos por dia' : m === 'time' ? 'Minutos por dia' : 'Por prazo'}
                </Text>
                <Text style={{ fontSize: 12, color: mode === m ? tokens.actionPrimaryText : tokens.textTertiary, opacity: 0.8 }}>
                  {m === 'chapters' ? 'Ex: 3 caps/dia → calcula a data' : m === 'time' ? 'Ex: 20 min/dia → calcula caps e data' : 'Defina quando quer terminar'}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: tokens.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: tokens.borderLight }}>
              <TouchableOpacity onPress={() => setCpd(c => Math.max(1, c - 1))}>
                <MaterialCommunityIcons name="minus-circle-outline" size={28} color={tokens.iconPrimary} />
              </TouchableOpacity>
              <Text style={{ flex: 1, textAlign: 'center', fontSize: 28, fontWeight: '700', color: tokens.textPrimary }}>{cpd}</Text>
              <TouchableOpacity onPress={() => setCpd(c => Math.min(20, c + 1))}>
                <MaterialCommunityIcons name="plus-circle-outline" size={28} color={tokens.iconPrimary} />
              </TouchableOpacity>
            </View>
            <Button label="Continuar" onPress={() => setStep(3)} fullWidth />
          </>
        )}

        {/* PASSO 3 */}
        {step === 3 && (
          <>
            <Text style={{ fontSize: 20, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary }}>Confirmar plano</Text>
            <View style={{ backgroundColor: tokens.bgCard, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: tokens.borderLight, gap: 12 }}>
              {[
                { label: 'Escopo',             value: selectedPlan?.name ?? '—' },
                { label: 'Capítulos/dia',      value: String(preview?.chaptersPerDay ?? cpd) },
                { label: 'Tempo estimado/dia', value: `~${Math.round((preview?.minutesPerDay ?? cpd * 3.7))} min` },
                { label: 'Total de capítulos', value: String(preview?.totalChapters ?? '—') },
                { label: 'Conclusão estimada', value: preview?.estimatedEndDate ?? '—' },
              ].map(r => (
                <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: tokens.textSecondary }}>{r.label}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: tokens.textPrimary }}>{r.value}</Text>
                </View>
              ))}
            </View>
            <Button label="Criar Plano" onPress={handleCreate} loading={loading} fullWidth />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}